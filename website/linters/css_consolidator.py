#!/usr/bin/env python3
"""
CSS Class Consolidator - Consolidate semantically identical CSS classes.

This tool:
1. Finds CSS classes with identical properties (semantically identical)
2. Chooses a canonical name for each group (avoiding 'admin-' prefixes)
3. Updates all CSS files to use the chosen name
4. Updates all JS/JSX files to replace className references
5. Handles modifiers like :hover, ::before, .sm, etc.
6. Properly handles class combinations like "person small"

Usage:
  python css_consolidator.py [--css-dir DIR] [--js-dir DIR] [--dry-run] [--verbose] [--min-properties N]

Examples:
  python css_consolidator.py --dry-run           # Preview changes without modifying files
  python css_consolidator.py --verbose           # Show detailed output
  python css_consolidator.py --min-properties 3  # Only consolidate classes with 3+ properties
"""

import argparse
import re
import sys
import json
import shutil
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime


@dataclass
class CSSClass:
    """Represents a CSS class definition."""
    selector: str
    class_name: str  # The base class name (without modifiers)
    filepath: Path
    line_number: int
    context: str  # 'top-level' or media query string
    properties: dict[str, str] = field(default_factory=dict)
    raw_block: str = ""
    full_selector: str = ""  # The complete original selector
    modifiers: list[str] = field(default_factory=list)  # :hover, ::before, .sm, etc.

    @property
    def property_signature(self) -> str:
        """Create a normalized signature of all properties for comparison."""
        if not self.properties:
            return ""
        sorted_props = sorted(self.properties.items())
        return "|".join(f"{k}:{v}" for k, v in sorted_props)

    @property
    def property_count(self) -> int:
        return len(self.properties)


@dataclass
class ConsolidationGroup:
    """A group of classes to be consolidated."""
    canonical_name: str
    classes: list[CSSClass]
    all_modifiers: dict[str, CSSClass]  # modifier -> representative class

    @property
    def old_names(self) -> set[str]:
        """Get all class names that will be replaced."""
        return {c.class_name for c in self.classes if c.class_name != self.canonical_name}


def normalize_value(value: str) -> str:
    """Normalize a CSS property value for comparison."""
    value = ' '.join(value.split())
    value = value.lower()
    value = re.sub(r'\s*,\s*', ', ', value)
    value = re.sub(r'\s*/\s*', '/', value)
    value = value.rstrip(';').strip()
    return value


def parse_properties(block_content: str) -> dict[str, str]:
    """Parse CSS properties from a block."""
    properties = {}
    block = re.sub(r'/\*.*?\*/', '', block_content, flags=re.DOTALL)

    declarations = []
    current = []
    paren_depth = 0

    for char in block:
        if char == '(':
            paren_depth += 1
            current.append(char)
        elif char == ')':
            paren_depth -= 1
            current.append(char)
        elif char == ';' and paren_depth == 0:
            declarations.append(''.join(current))
            current = []
        else:
            current.append(char)

    if current:
        declarations.append(''.join(current))

    for decl in declarations:
        decl = decl.strip()
        if not decl or ':' not in decl:
            continue

        colon_idx = decl.index(':')
        prop_name = decl[:colon_idx].strip().lower()
        prop_value = decl[colon_idx + 1:].strip()

        if not prop_name or not prop_value:
            continue

        if prop_name.startswith('--'):
            continue

        properties[prop_name] = normalize_value(prop_value)

    return properties


def remove_comments(text: str) -> str:
    """Remove CSS comments while preserving line positions."""
    result = []
    i = 0
    while i < len(text):
        if text[i:i+2] == '/*':
            end = text.find('*/', i + 2)
            if end == -1:
                result.append(' ' * (len(text) - i))
                break
            comment = text[i:end + 2]
            result.append('\n' * comment.count('\n') + ' ' * (len(comment) - comment.count('\n')))
            i = end + 2
        else:
            result.append(text[i])
            i += 1
    return ''.join(result)


def get_line_number(text: str, pos: int) -> int:
    """Get line number for a position in text."""
    return text[:pos].count('\n') + 1


def extract_class_name_and_modifiers(selector: str) -> tuple[Optional[str], list[str]]:
    """
    Extract the primary class name and any modifiers from a selector.

    Examples:
        .person -> ('person', [])
        .person:hover -> ('person', [':hover'])
        .person::before -> ('person', ['::before'])
        .person.small -> ('person', ['.small'])
        .person img -> ('person', [' img'])
        .person:hover::after -> ('person', [':hover', '::after'])
    """
    # Match the first class in the selector
    match = re.match(r'\.([a-zA-Z_][a-zA-Z0-9_-]*)', selector)
    if not match:
        return None, []

    class_name = match.group(1)
    rest = selector[match.end():]

    modifiers = []
    if rest:
        # Parse the rest as modifiers
        # Split on pseudo-class/element boundaries or chained classes
        modifier_pattern = re.compile(r'(::?[a-zA-Z_-]+(?:\([^)]*\))?|\.[a-zA-Z_][a-zA-Z0-9_-]*|\s+[a-zA-Z_][a-zA-Z0-9_-]*(?:\.[a-zA-Z_][a-zA-Z0-9_-]*)*|\s*>\s*[a-zA-Z_][a-zA-Z0-9_-]*|\s*\+\s*[a-zA-Z_][a-zA-Z0-9_-]*|\s*~\s*[a-zA-Z_][a-zA-Z0-9_-]*|\[[^\]]*\])')

        pos = 0
        while pos < len(rest):
            m = modifier_pattern.match(rest, pos)
            if m:
                modifiers.append(m.group(1))
                pos = m.end()
            else:
                # Skip unrecognized characters
                pos += 1

        # If we couldn't parse it properly, just use the whole rest as one modifier
        if not modifiers and rest.strip():
            modifiers = [rest]

    return class_name, modifiers


def extract_css_classes(css_content: str, filepath: Path) -> list[CSSClass]:
    """Extract all CSS class definitions from content."""
    classes = []
    clean_css = remove_comments(css_content)

    def parse_rules(content: str, context: str, base_line: int) -> list[CSSClass]:
        found = []
        i = 0
        n = len(content)
        current_line = base_line

        while i < n:
            while i < n and content[i].isspace():
                if content[i] == '\n':
                    current_line += 1
                i += 1

            if i >= n:
                break

            brace_pos = content.find('{', i)
            if brace_pos == -1:
                break

            for c in content[i:brace_pos]:
                if c == '\n':
                    current_line += 1

            selector = content[i:brace_pos].strip()
            rule_start_line = current_line

            if not selector:
                i = brace_pos + 1
                continue

            # Find matching closing brace
            depth = 1
            j = brace_pos + 1
            while j < n and depth > 0:
                if content[j] == '{':
                    depth += 1
                elif content[j] == '}':
                    depth -= 1
                if content[j] == '\n':
                    current_line += 1
                j += 1

            block_content = content[brace_pos + 1:j - 1] if j > brace_pos + 1 else ''

            if selector.startswith('@'):
                if any(selector.startswith(at) for at in ('@media', '@supports', '@layer', '@container')):
                    nested_context = ' '.join(selector.split())
                    block_start_line = rule_start_line + selector.count('\n') + 1
                    nested = parse_rules(block_content, nested_context, block_start_line)
                    found.extend(nested)
            else:
                # Handle multiple selectors separated by commas
                selectors = [s.strip() for s in selector.split(',')]

                for single_selector in selectors:
                    class_name, modifiers = extract_class_name_and_modifiers(single_selector)
                    if class_name:
                        properties = parse_properties(block_content)
                        if properties:
                            found.append(CSSClass(
                                selector=single_selector.strip(),
                                class_name=class_name,
                                filepath=filepath,
                                line_number=rule_start_line,
                                context=context,
                                properties=properties,
                                raw_block=block_content.strip(),
                                full_selector=single_selector.strip(),
                                modifiers=modifiers
                            ))

            i = j

        return found

    return parse_rules(clean_css, 'top-level', 1)


def find_all_files(directory: Path, extensions: list[str]) -> list[Path]:
    """Find all files with given extensions in directory recursively."""
    files = []
    for ext in extensions:
        files.extend(directory.rglob(f'*{ext}'))
    return files


def choose_canonical_name(class_names: list[str]) -> str:
    """
    Choose the best canonical name from a list of class names.

    Priority:
    1. Avoid 'admin-' prefixed names (these are scoped and shouldn't be generic)
    2. Prefer shorter, more generic names
    3. Prefer names without numbers
    4. Alphabetically as tiebreaker
    """
    candidates = []

    for name in class_names:
        # Skip admin- prefixed names
        if name.startswith('admin-'):
            continue
        candidates.append(name)

    # If all names are admin-, we have to pick one (shouldn't consolidate in this case ideally)
    if not candidates:
        candidates = list(class_names)

    def score(name: str) -> tuple:
        """Lower score is better."""
        has_numbers = any(c.isdigit() for c in name)
        # Prefer names that look more generic
        is_utility_like = any(name.startswith(p) for p in ['flex-', 'grid-', 'text-', 'bg-', 'p-', 'm-'])
        return (
            has_numbers,  # Prefer no numbers
            -is_utility_like,  # Prefer utility-like names
            len(name),  # Prefer shorter
            name  # Alphabetical tiebreaker
        )

    return min(candidates, key=score)


def find_identical_classes(
    classes: list[CSSClass],
    min_properties: int = 2,
) -> dict[str, list[CSSClass]]:
    """Find groups of classes with identical properties."""
    # Group by (property signature, context, modifiers as tuple)
    by_signature = defaultdict(list)

    for css_class in classes:
        if css_class.property_count < min_properties:
            continue

        # Only group classes with the same modifiers and context
        modifier_key = tuple(sorted(css_class.modifiers))
        key = (css_class.property_signature, css_class.context, modifier_key)
        by_signature[key].append(css_class)

    # Filter to only include groups with multiple different class names
    identical = {}
    for key, group in by_signature.items():
        if len(group) < 2:
            continue

        unique_names = set(c.class_name for c in group)
        if len(unique_names) < 2:
            continue

        # Use a hashable string key
        sig_key = f"{key[0]}|{key[1]}|{key[2]}"
        identical[sig_key] = group

    return identical


def create_consolidation_groups(identical: dict[str, list[CSSClass]]) -> list[ConsolidationGroup]:
    """
    Create consolidation groups from identical classes.

    This merges groups that share the same base class names so that
    .person and .person:hover end up in the same consolidation if they
    share names with .picture and .picture:hover respectively.

    Also ensures we don't consolidate unrelated classes that happen to
    share some class names with different semantic meanings.
    """
    # First, build a graph of which class names are connected (should be consolidated together)
    # Two class names are connected if they appear together in an identical group
    name_groups = defaultdict(set)  # class_name -> set of signature keys it appears in

    for sig_key, classes in identical.items():
        for cls in classes:
            name_groups[cls.class_name].add(sig_key)

    # Now, find connected components of class names
    # Classes that always appear together across all their identical groups should be consolidated

    # Build adjacency: two names are adjacent if they appear in the same identical group
    adjacency = defaultdict(set)
    for sig_key, classes in identical.items():
        names = [c.class_name for c in classes]
        for name in names:
            for other_name in names:
                if name != other_name:
                    adjacency[name].add(other_name)

    # Find connected components using union-find
    parent = {}

    def find(x):
        if x not in parent:
            parent[x] = x
        if parent[x] != x:
            parent[x] = find(parent[x])
        return parent[x]

    def union(x, y):
        px, py = find(x), find(y)
        if px != py:
            parent[px] = py

    for name, neighbors in adjacency.items():
        for neighbor in neighbors:
            union(name, neighbor)

    # Group names by their root
    components = defaultdict(set)
    for name in adjacency.keys():
        components[find(name)].add(name)

    # Now create consolidation groups for each component
    consolidation_groups = []

    for component_root, names in components.items():
        # Find all signature groups that involve any of these names
        involved_sig_keys = set()
        for name in names:
            involved_sig_keys.update(name_groups.get(name, set()))

        # Collect all classes from these signature groups
        all_classes = []
        all_modifiers = {}

        for sig_key in involved_sig_keys:
            for cls in identical.get(sig_key, []):
                if cls.class_name in names:
                    all_classes.append(cls)
                    modifier_tuple = tuple(cls.modifiers)
                    if modifier_tuple not in all_modifiers:
                        all_modifiers[modifier_tuple] = cls

        # Choose canonical name for this group
        canonical = choose_canonical_name(list(names))

        if all_classes:
            consolidation_groups.append(ConsolidationGroup(
                canonical_name=canonical,
                classes=all_classes,
                all_modifiers=all_modifiers
            ))

    return consolidation_groups


def replace_class_in_string(content: str, old_class: str, new_class: str) -> str:
    """
    Replace a class name in a string, handling class combinations.

    Handles cases like:
    - "person" -> "picture"
    - "person small" -> "picture small"
    - "button person" -> "button picture"
    - "person-detail" should NOT be changed (it's a different class)
    """
    if old_class == new_class:
        return content

    # Pattern to match the class as a whole word in className strings
    # Must be at word boundary (start/end of string, or surrounded by space/quotes)
    pattern = r'(?<=["\'\s])' + re.escape(old_class) + r'(?=["\'\s])|^' + re.escape(old_class) + r'(?=["\'\s])|(?<=["\'\s])' + re.escape(old_class) + r'$'

    # Actually, let's be more careful - use word boundaries but avoid partial matches
    # The class name should be surrounded by whitespace, quotes, or string boundaries
    pattern = r'(?:(?<=["\'`\s])|(?<=^))' + re.escape(old_class) + r'(?=["\'`\s]|$)'

    return re.sub(pattern, new_class, content)


def update_js_jsx_file(filepath: Path, replacements: dict[str, str], dry_run: bool = False) -> tuple[bool, list[str]]:
    """
    Update class names in a JS/JSX file.

    Handles:
    - className="class1 class2"
    - className='class1 class2'
    - className={`class1 ${condition ? 'class2' : 'class3'}`}
    - className={clsx('class1', condition && 'class2')}
    - className={classNames('class1', { class2: condition })}
    - class="class1 class2" (HTML)

    Returns (was_modified, list of changes made)
    """
    try:
        content = filepath.read_text(encoding='utf-8')
    except Exception as e:
        return False, [f"Error reading file: {e}"]

    original_content = content
    changes = []
    changes_made = set()

    for old_class, new_class in replacements.items():
        if old_class == new_class:
            continue

        # Track if this specific replacement was made
        replacement_made = False

        # Pattern 1: className="classes" or className='classes'
        def replace_quoted_classname(m):
            nonlocal replacement_made
            prefix = m.group(1)
            classes = m.group(2)
            suffix = m.group(3)
            new_classes = replace_class_in_class_string(classes, old_class, new_class)
            if new_classes != classes:
                replacement_made = True
            return prefix + new_classes + suffix

        content = re.sub(
            r'(className\s*=\s*["\'])([^"\']*?)(["\'])',
            replace_quoted_classname,
            content
        )

        # Pattern 2: className={`template literal`}
        def replace_template_literal(m):
            nonlocal replacement_made
            prefix = m.group(1)
            template = m.group(2)
            suffix = m.group(3)
            new_template = replace_class_in_template_literal(template, old_class, new_class)
            if new_template != template:
                replacement_made = True
            return prefix + new_template + suffix

        content = re.sub(
            r'(className\s*=\s*\{`)(.*?)(`\})',
            replace_template_literal,
            content,
            flags=re.DOTALL
        )

        # Pattern 3: className={expression} - handles clsx, classNames, etc.
        def replace_classname_expression(m):
            nonlocal replacement_made
            prefix = m.group(1)
            expr = m.group(2)
            suffix = m.group(3)
            new_expr = replace_class_in_expression(expr, old_class, new_class)
            if new_expr != expr:
                replacement_made = True
            return prefix + new_expr + suffix

        # This is tricky - we need to match balanced braces
        content = replace_classname_expressions(content, old_class, new_class, changes_made)

        # Pattern 4: class="classes" (HTML)
        def replace_html_class(m):
            nonlocal replacement_made
            prefix = m.group(1)
            classes = m.group(2)
            suffix = m.group(3)
            new_classes = replace_class_in_class_string(classes, old_class, new_class)
            if new_classes != classes:
                replacement_made = True
            return prefix + new_classes + suffix

        content = re.sub(
            r'(class\s*=\s*["\'])([^"\']*?)(["\'])',
            replace_html_class,
            content
        )

        # Pattern 5: Standalone string literals that might be class names
        # e.g., const style = 'person-card'; or addClasses('person', 'active')

        # Only for specific function calls that commonly take class names
        class_functions = ['addClass', 'removeClass', 'toggleClass', 'hasClass', 'classList.add', 'classList.remove', 'classList.toggle']
        for func in class_functions:
            pattern = rf"({re.escape(func)}\s*\(\s*)(['\"])({re.escape(old_class)})(['\"])"
            replacement = rf"\g<1>\g<2>{new_class}\g<4>"
            new_content = re.sub(pattern, replacement, content)
            if new_content != content:
                changes_made.add((old_class, new_class))
                content = new_content

        if replacement_made:
            changes_made.add((old_class, new_class))

    for old, new in changes_made:
        changes.append(f"  {old} -> {new}")

    was_modified = content != original_content

    if was_modified and not dry_run:
        filepath.write_text(content, encoding='utf-8')

    return was_modified, changes


def replace_class_in_class_string(class_string: str, old_class: str, new_class: str) -> str:
    """
    Replace a class name in a space-separated class string.

    "person small active" with old="person" -> "picture small active"
    "person-detail" with old="person" -> "person-detail" (no change - different class)
    """
    if old_class == new_class:
        return class_string

    parts = class_string.split()
    new_parts = []

    for part in parts:
        if part == old_class:
            new_parts.append(new_class)
        else:
            new_parts.append(part)

    return ' '.join(new_parts)


def replace_class_in_template_literal(template: str, old_class: str, new_class: str) -> str:
    """
    Replace class names in a template literal.

    Handles:
    - `class1 class2` -> direct replacement
    - `${condition ? 'class1' : 'class2'}` -> replace within quoted strings
    """
    if old_class == new_class:
        return template

    result = []
    i = 0
    n = len(template)

    while i < n:
        # Check for ${...} expression
        if template[i:i+2] == '${':
            # Find matching }
            depth = 1
            j = i + 2
            while j < n and depth > 0:
                if template[j] == '{':
                    depth += 1
                elif template[j] == '}':
                    depth -= 1
                j += 1

            expr = template[i+2:j-1]
            new_expr = replace_class_in_expression(expr, old_class, new_class)
            result.append('${' + new_expr + '}')
            i = j
        else:
            # Regular text - check for class name at word boundary
            # Collect until next ${ or end
            text_end = template.find('${', i)
            if text_end == -1:
                text_end = n

            text = template[i:text_end]
            # Replace class in text portion (space-separated)
            new_text = replace_class_in_class_string(text, old_class, new_class)
            result.append(new_text)
            i = text_end

    return ''.join(result)


def replace_class_in_expression(expr: str, old_class: str, new_class: str) -> str:
    """
    Replace class names within JavaScript expressions.

    Handles:
    - 'class1' or "class1" -> direct string replacement
    - condition && 'class1' -> replace the string
    - { class1: condition } -> replace the key
    - clsx('class1', ...) -> replace the string
    """
    if old_class == new_class:
        return expr

    # Replace in single-quoted strings
    expr = re.sub(
        rf"'([^']*)'",
        lambda m: "'" + replace_class_in_class_string(m.group(1), old_class, new_class) + "'",
        expr
    )

    # Replace in double-quoted strings
    expr = re.sub(
        rf'"([^"]*)"',
        lambda m: '"' + replace_class_in_class_string(m.group(1), old_class, new_class) + '"',
        expr
    )

    # Replace in backtick strings (nested template literals)
    expr = re.sub(
        rf'`([^`]*)`',
        lambda m: '`' + replace_class_in_template_literal(m.group(1), old_class, new_class) + '`',
        expr
    )

    # Replace object keys: { className: condition }
    # Match pattern like { person: condition } or { 'person': condition }
    expr = re.sub(
        rf'\{{\s*{re.escape(old_class)}\s*:',
        f'{{ {new_class}:',
        expr
    )

    return expr


def replace_classname_expressions(content: str, old_class: str, new_class: str, changes_made: set) -> str:
    """
    Replace class names in className={...} expressions with proper brace matching.
    """
    if old_class == new_class:
        return content

    result = []
    i = 0
    n = len(content)

    # Pattern to find className={
    pattern = re.compile(r'className\s*=\s*\{')

    while i < n:
        match = pattern.search(content, i)
        if not match:
            result.append(content[i:])
            break

        # Add content before the match
        result.append(content[i:match.end()])

        # Find matching closing brace
        depth = 1
        j = match.end()

        while j < n and depth > 0:
            char = content[j]

            # Skip strings
            if char in '"\'`':
                quote = char
                j += 1
                while j < n:
                    if content[j] == '\\':
                        j += 2
                        continue
                    if content[j] == quote:
                        j += 1
                        break
                    if quote == '`' and content[j:j+2] == '${':
                        # Handle template literal expressions
                        inner_depth = 1
                        j += 2
                        while j < n and inner_depth > 0:
                            if content[j] == '{':
                                inner_depth += 1
                            elif content[j] == '}':
                                inner_depth -= 1
                            j += 1
                        continue
                    j += 1
                continue

            if char == '{':
                depth += 1
            elif char == '}':
                depth -= 1

            j += 1

        # Extract the expression (without the final })
        expr = content[match.end():j-1]
        new_expr = replace_class_in_expression(expr, old_class, new_class)

        if new_expr != expr:
            changes_made.add((old_class, new_class))

        result.append(new_expr)
        result.append('}')

        i = j

    return ''.join(result)


def parse_css_structure(content: str) -> list[dict]:
    """
    Parse CSS into a structured format that preserves everything.

    Returns a list of items, each being either:
    - {'type': 'comment', 'content': '...'}
    - {'type': 'whitespace', 'content': '...'}
    - {'type': 'at-rule', 'selector': '@media...', 'content': '...', 'children': [...]}
    - {'type': 'rule', 'selector': '.class', 'content': '...', 'original': '...'}
    """
    items = []
    i = 0
    n = len(content)

    while i < n:
        # Skip and capture whitespace
        ws_start = i
        while i < n and content[i] in ' \t\n\r':
            i += 1
        if i > ws_start:
            items.append({'type': 'whitespace', 'content': content[ws_start:i]})

        if i >= n:
            break

        # Check for comments
        if content[i:i+2] == '/*':
            end = content.find('*/', i + 2)
            if end == -1:
                end = n - 2
            items.append({'type': 'comment', 'content': content[i:end+2]})
            i = end + 2
            continue

        # Find the next block or rule
        brace_pos = content.find('{', i)

        if brace_pos == -1:
            # No more blocks - capture remaining content
            if i < n:
                items.append({'type': 'other', 'content': content[i:]})
            break

        selector = content[i:brace_pos].strip()

        # Find matching closing brace
        depth = 1
        j = brace_pos + 1
        while j < n and depth > 0:
            if content[j:j+2] == '/*':
                # Skip comment
                end = content.find('*/', j + 2)
                if end == -1:
                    j = n
                else:
                    j = end + 2
                continue
            if content[j] == '{':
                depth += 1
            elif content[j] == '}':
                depth -= 1
            j += 1

        block_content = content[brace_pos + 1:j - 1] if j > brace_pos + 1 else ''
        original_text = content[i:j]

        if selector.startswith('@'):
            # At-rule (media query, keyframes, etc.)
            if any(selector.startswith(at) for at in ('@media', '@supports', '@layer', '@container')):
                # Parse nested rules
                children = parse_css_structure(block_content)
                items.append({
                    'type': 'at-rule',
                    'selector': selector,
                    'content': block_content,
                    'children': children,
                    'original': original_text
                })
            else:
                # Other at-rules (@keyframes, @font-face, etc.) - keep as-is
                items.append({
                    'type': 'at-rule-other',
                    'selector': selector,
                    'content': block_content,
                    'original': original_text
                })
        else:
            # Regular rule
            items.append({
                'type': 'rule',
                'selector': selector,
                'content': block_content,
                'original': original_text
            })

        i = j

    return items


def rebuild_css(items: list[dict], indent: str = '') -> str:
    """Rebuild CSS from parsed structure."""
    result = []

    for item in items:
        if item['type'] == 'whitespace':
            result.append(item['content'])
        elif item['type'] == 'comment':
            result.append(item['content'])
        elif item['type'] == 'other':
            result.append(item['content'])
        elif item['type'] == 'at-rule-other':
            result.append(f"{item['selector']} {{\n{item['content']}\n}}")
        elif item['type'] == 'at-rule':
            children_css = rebuild_css(item['children'], indent + '  ')
            result.append(f"{item['selector']} {{\n{children_css}\n}}")
        elif item['type'] == 'rule':
            # Preserve original formatting of rule
            result.append(f"{item['selector']} {{\n{item['content']}\n}}")
        elif item.get('removed'):
            # Skip removed items
            continue

    return ''.join(result)


def update_css_file(filepath: Path, groups: list[ConsolidationGroup], dry_run: bool = False) -> tuple[bool, list[str]]:
    """
    Update a CSS file to consolidate classes.

    Strategy:
    1. Parse the CSS structure
    2. Replace class names in selectors
    3. Remove duplicate rules (keeping the first occurrence)
    4. Rebuild preserving formatting
    """
    try:
        content = filepath.read_text(encoding='utf-8')
    except Exception as e:
        return False, [f"Error reading file: {e}"]

    original_content = content
    changes = []

    # Build a map of old_class -> canonical_name
    class_map = {}
    for group in groups:
        for old_name in group.old_names:
            class_map[old_name] = group.canonical_name

    if not class_map:
        return False, []

    def replace_class_in_selector(selector: str) -> str:
        """Replace class names in a CSS selector."""
        original = selector
        for old_class, new_class in class_map.items():
            # Match .oldclass but not .oldclass-something or -oldclass
            pattern = r'(?<![a-zA-Z0-9_-])\.(' + re.escape(old_class) + r')(?![a-zA-Z0-9_-])'
            selector = re.sub(pattern, '.' + new_class, selector)
        return selector

    def process_items(items: list[dict], context: str = 'top-level') -> list[dict]:
        """Process CSS items, replacing classes and marking duplicates."""
        seen_selectors = {}
        processed = []

        for item in items:
            if item['type'] in ('whitespace', 'comment', 'other', 'at-rule-other'):
                processed.append(item)
            elif item['type'] == 'at-rule':
                # Process children recursively with the at-rule as context
                new_context = item['selector']
                item['children'] = process_items(item['children'], new_context)
                processed.append(item)
            elif item['type'] == 'rule':
                original_selector = item['selector']
                new_selector = replace_class_in_selector(original_selector)

                if new_selector != original_selector:
                    changes.append(f"  {original_selector} -> {new_selector}")

                item['selector'] = new_selector

                # Check for duplicates
                # Normalize selector for comparison
                normalized = ' '.join(new_selector.split())
                key = (normalized, context)

                if key in seen_selectors:
                    # This is a duplicate - check if we should merge or remove
                    # For now, we'll remove the duplicate
                    item['removed'] = True
                    changes.append(f"  Removed duplicate: {new_selector}")
                else:
                    seen_selectors[key] = True

                processed.append(item)

        return processed

    # Parse, process, and rebuild
    items = parse_css_structure(content)
    items = process_items(items)

    # Rebuild CSS - but we want to preserve original formatting as much as possible
    # Instead of completely rebuilding, let's do targeted replacements

    new_content = content

    # First pass: replace class names in selectors
    for old_class, new_class in class_map.items():
        # Match .oldclass in selectors (before {)
        # This regex is tricky - we want to match .oldclass before a { but after the previous }
        pattern = r'(?<![a-zA-Z0-9_-])\.(' + re.escape(old_class) + r')(?![a-zA-Z0-9_-])'

        new_content = re.sub(pattern, '.' + new_class, new_content)

    # Second pass: remove exact duplicate rules
    new_content = remove_duplicate_rules_preserving_format(new_content)

    was_modified = new_content != original_content

    if was_modified and not dry_run:
        filepath.write_text(new_content, encoding='utf-8')

    return was_modified, changes


def remove_duplicate_rules_preserving_format(css_content: str) -> str:
    """
    Remove duplicate CSS rules while preserving formatting.

    A more careful implementation that:
    1. Identifies complete rule blocks
    2. Tracks seen selectors per context (top-level, media query, etc.)
    3. Removes duplicate blocks while preserving surrounding whitespace
    """
    result = []
    seen_at_context = {'top-level': set()}
    current_context = 'top-level'
    context_stack = ['top-level']

    i = 0
    n = len(css_content)

    while i < n:
        # Capture leading whitespace/comments
        start = i
        while i < n:
            if css_content[i:i+2] == '/*':
                # Skip comment
                end = css_content.find('*/', i + 2)
                if end == -1:
                    i = n
                else:
                    i = end + 2
            elif css_content[i] in ' \t\n\r':
                i += 1
            else:
                break

        leading = css_content[start:i]

        if i >= n:
            result.append(leading)
            break

        # Check for closing brace (end of context)
        if css_content[i] == '}':
            result.append(leading)
            result.append('}')
            i += 1
            if len(context_stack) > 1:
                context_stack.pop()
                current_context = context_stack[-1]
            continue

        # Find the next block
        brace_pos = css_content.find('{', i)

        if brace_pos == -1:
            # No more blocks
            result.append(leading + css_content[i:])
            break

        selector = css_content[i:brace_pos]
        selector_stripped = selector.strip()

        # Find matching closing brace
        depth = 1
        j = brace_pos + 1
        while j < n and depth > 0:
            if css_content[j:j+2] == '/*':
                end = css_content.find('*/', j + 2)
                if end == -1:
                    j = n
                else:
                    j = end + 2
                continue
            if css_content[j] == '{':
                depth += 1
            elif css_content[j] == '}':
                depth -= 1
            j += 1

        block = css_content[i:j]

        # Check if this is an at-rule that creates a new context
        if selector_stripped.startswith('@media') or selector_stripped.startswith('@supports') or \
           selector_stripped.startswith('@container') or selector_stripped.startswith('@layer'):
            # New context
            new_context = selector_stripped
            context_stack.append(new_context)
            current_context = new_context
            if new_context not in seen_at_context:
                seen_at_context[new_context] = set()

            # Output the opening
            result.append(leading)
            result.append(selector + '{')
            i = brace_pos + 1
            continue

        # Check if this is an at-rule we don't process (keyframes, font-face, etc.)
        if selector_stripped.startswith('@'):
            result.append(leading + block)
            i = j
            continue

        # Regular rule - check for duplicates
        normalized_selector = ' '.join(selector_stripped.split())

        if normalized_selector in seen_at_context[current_context]:
            # Duplicate - skip it
            i = j
            # Keep minimal whitespace to not break formatting
            result.append('\n')
            continue
        else:
            seen_at_context[current_context].add(normalized_selector)
            result.append(leading + block)
            i = j

    return ''.join(result)


def update_html_file(filepath: Path, replacements: dict[str, str], dry_run: bool = False) -> tuple[bool, list[str]]:
    """Update class names in HTML files."""
    try:
        content = filepath.read_text(encoding='utf-8')
    except Exception as e:
        return False, [f"Error reading file: {e}"]

    original_content = content
    changes = []

    for old_class, new_class in replacements.items():
        if old_class == new_class:
            continue

        # Pattern for class="..."
        pattern = r'(class\s*=\s*["\'])([^"\']*?)(["\'])'

        def replacer(m, old=old_class, new=new_class):
            return m.group(1) + replace_class_in_class_string(m.group(2), old, new) + m.group(3)

        new_content = re.sub(pattern, replacer, content)
        if new_content != content:
            changes.append(f"  {old_class} -> {new_class}")
            content = new_content

    was_modified = content != original_content

    if was_modified and not dry_run:
        filepath.write_text(content, encoding='utf-8')

    return was_modified, changes


def create_backup(directory: Path, backup_dir: Path) -> None:
    """Create a backup of the directory."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = backup_dir / f"backup_{timestamp}"

    # Only backup src directory contents
    if directory.exists():
        shutil.copytree(directory, backup_path, dirs_exist_ok=True)
        print(f"Backup created at: {backup_path}")


def consolidate_css_classes(
    css_dir: Path,
    js_dir: Path,
    min_properties: int = 2,
    dry_run: bool = False,
    verbose: bool = False,
    backup: bool = True,
    generate_report: bool = True
) -> dict:
    """
    Main consolidation function.

    Returns a summary dict with statistics.
    """
    results = {
        'groups_found': 0,
        'classes_consolidated': 0,
        'css_files_modified': 0,
        'js_files_modified': 0,
        'html_files_modified': 0,
        'total_replacements': 0,
        'errors': [],
        'consolidation_details': [],
        'detailed_report': ''
    }

    # Track all changes for detailed report
    css_changes = []
    js_changes = []
    html_changes = []

    # Find all CSS files
    css_files = find_all_files(css_dir, ['.css'])

    if verbose:
        print(f"Found {len(css_files)} CSS files")

    # Extract all class definitions
    all_classes = []
    for css_file in css_files:
        try:
            content = css_file.read_text(encoding='utf-8', errors='ignore')
            classes = extract_css_classes(content, css_file)
            all_classes.extend(classes)
        except Exception as e:
            results['errors'].append(f"Error reading {css_file}: {e}")

    if verbose:
        print(f"Found {len(all_classes)} class definitions")

    # Find identical classes
    identical = find_identical_classes(all_classes, min_properties=min_properties)

    if verbose:
        print(f"Found {len(identical)} groups of identical classes")

    if not identical:
        print("No semantically identical classes found to consolidate.")
        return results

    # Create consolidation groups
    groups = create_consolidation_groups(identical)
    results['groups_found'] = len(groups)

    # Build global replacement map and collect details
    replacements = {}
    for group in groups:
        for old_name in group.old_names:
            replacements[old_name] = group.canonical_name
            results['classes_consolidated'] += 1

        # Collect details for summary
        if group.classes:
            sample = group.classes[0]
            results['consolidation_details'].append({
                'canonical': group.canonical_name,
                'replaced': sorted(group.old_names),
                'property_count': sample.property_count,
                'properties': sorted(sample.properties.items())
            })

    if verbose:
        print(f"\nConsolidation plan:")
        for group in groups:
            print(f"  Canonical: {group.canonical_name}")
            print(f"    Replacing: {', '.join(group.old_names)}")

    # Create backup before modifications
    if backup and not dry_run:
        backup_dir = css_dir.parent / 'backups'
        backup_dir.mkdir(exist_ok=True)
        create_backup(css_dir, backup_dir)

    # Update CSS files
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Updating CSS files...")
    for css_file in css_files:
        modified, changes = update_css_file(css_file, groups, dry_run=dry_run)
        if modified:
            results['css_files_modified'] += 1
            results['total_replacements'] += len(changes)
            css_changes.append((css_file, changes))
            if verbose:
                try:
                    rel_path = css_file.relative_to(css_dir.parent)
                except ValueError:
                    rel_path = css_file
                print(f"  Modified: {rel_path}")
                for change in changes:
                    print(f"    {change}")

    # Update JS/JSX files
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Updating JS/JSX files...")
    js_files = find_all_files(js_dir, ['.js', '.jsx', '.tsx', '.ts'])

    for js_file in js_files:
        modified, changes = update_js_jsx_file(js_file, replacements, dry_run=dry_run)
        if modified:
            results['js_files_modified'] += 1
            results['total_replacements'] += len(changes)
            js_changes.append((js_file, changes))
            if verbose:
                try:
                    rel_path = js_file.relative_to(js_dir.parent)
                except ValueError:
                    rel_path = js_file
                print(f"  Modified: {rel_path}")
                for change in changes:
                    print(f"    {change}")

    # Update HTML files
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Updating HTML files...")
    html_files = find_all_files(js_dir.parent, ['.html'])

    for html_file in html_files:
        modified, changes = update_html_file(html_file, replacements, dry_run=dry_run)
        if modified:
            results['html_files_modified'] += 1
            results['total_replacements'] += len(changes)
            html_changes.append((html_file, changes))
            if verbose:
                try:
                    rel_path = html_file.relative_to(js_dir.parent)
                except ValueError:
                    rel_path = html_file
                print(f"  Modified: {rel_path}")

    # Generate detailed report
    if generate_report:
        results['detailed_report'] = generate_detailed_report(
            groups, css_changes, js_changes, html_changes, css_dir.parent
        )

    return results


def format_summary(results: dict) -> str:
    """Format the results as a summary report."""
    lines = []
    lines.append("=" * 60)
    lines.append("CSS CONSOLIDATION SUMMARY")
    lines.append("=" * 60)
    lines.append("")
    lines.append(f"Groups of identical classes found: {results['groups_found']}")
    lines.append(f"Class names consolidated: {results['classes_consolidated']}")
    lines.append(f"CSS files modified: {results['css_files_modified']}")
    lines.append(f"JS/JSX files modified: {results['js_files_modified']}")
    lines.append(f"HTML files modified: {results['html_files_modified']}")
    lines.append(f"Total replacements made: {results['total_replacements']}")

    if results.get('consolidation_details'):
        lines.append("")
        lines.append("-" * 60)
        lines.append("CONSOLIDATION DETAILS")
        lines.append("-" * 60)
        for detail in results['consolidation_details']:
            lines.append(f"\nCanonical name: {detail['canonical']}")
            lines.append(f"  Replaced: {', '.join(detail['replaced'])}")
            lines.append(f"  Properties ({detail['property_count']}):")
            for prop, val in detail['properties'][:5]:  # Show first 5
                lines.append(f"    {prop}: {val}")
            if len(detail['properties']) > 5:
                lines.append(f"    ... and {len(detail['properties']) - 5} more")

    if results['errors']:
        lines.append("")
        lines.append("Errors encountered:")
        for error in results['errors']:
            lines.append(f"  - {error}")

    lines.append("")
    return "\n".join(lines)


def generate_detailed_report(
    groups: list[ConsolidationGroup],
    css_changes: list[tuple[Path, list[str]]],
    js_changes: list[tuple[Path, list[str]]],
    html_changes: list[tuple[Path, list[str]]],
    base_path: Path
) -> str:
    """Generate a detailed report of all consolidations and changes."""
    lines = []
    lines.append("=" * 80)
    lines.append("DETAILED CSS CONSOLIDATION REPORT")
    lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("=" * 80)

    # Consolidation groups
    lines.append("\n" + "=" * 80)
    lines.append("CONSOLIDATION GROUPS")
    lines.append("=" * 80)

    for i, group in enumerate(groups, 1):
        lines.append(f"\n--- Group {i}: {group.canonical_name} ---")
        lines.append(f"Canonical name: {group.canonical_name}")
        lines.append(f"Names being replaced: {', '.join(sorted(group.old_names))}")

        if group.classes:
            sample_class = group.classes[0]
            lines.append(f"Properties ({sample_class.property_count}):")
            for prop, val in sorted(sample_class.properties.items())[:10]:
                lines.append(f"  {prop}: {val}")
            if len(sample_class.properties) > 10:
                lines.append(f"  ... and {len(sample_class.properties) - 10} more")

        lines.append(f"\nOccurrences ({len(group.classes)}):")
        by_file = defaultdict(list)
        for cls in group.classes:
            by_file[cls.filepath].append(cls)

        for filepath, classes in sorted(by_file.items()):
            try:
                rel_path = filepath.relative_to(base_path)
            except ValueError:
                rel_path = filepath
            for cls in classes:
                lines.append(f"  {rel_path}:{cls.line_number} - {cls.selector}")

    # CSS file changes
    if css_changes:
        lines.append("\n" + "=" * 80)
        lines.append("CSS FILE CHANGES")
        lines.append("=" * 80)

        for filepath, changes in css_changes:
            if changes:
                try:
                    rel_path = filepath.relative_to(base_path)
                except ValueError:
                    rel_path = filepath
                lines.append(f"\n{rel_path}:")
                for change in changes:
                    lines.append(f"  {change}")

    # JS/JSX file changes
    if js_changes:
        lines.append("\n" + "=" * 80)
        lines.append("JS/JSX FILE CHANGES")
        lines.append("=" * 80)

        for filepath, changes in js_changes:
            if changes:
                try:
                    rel_path = filepath.relative_to(base_path)
                except ValueError:
                    rel_path = filepath
                lines.append(f"\n{rel_path}:")
                for change in changes:
                    lines.append(f"  {change}")

    # HTML file changes
    if html_changes:
        lines.append("\n" + "=" * 80)
        lines.append("HTML FILE CHANGES")
        lines.append("=" * 80)

        for filepath, changes in html_changes:
            if changes:
                try:
                    rel_path = filepath.relative_to(base_path)
                except ValueError:
                    rel_path = filepath
                lines.append(f"\n{rel_path}:")
                for change in changes:
                    lines.append(f"  {change}")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Consolidate semantically identical CSS classes across the codebase."
    )
    parser.add_argument(
        '--css-dir',
        type=str,
        default='src/styles',
        help='Directory containing CSS files (default: src/styles)'
    )
    parser.add_argument(
        '--js-dir',
        type=str,
        default='src',
        help='Directory containing JS/JSX files (default: src)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview changes without modifying any files'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Show verbose output including all changes'
    )
    parser.add_argument(
        '--min-properties',
        type=int,
        default=2,
        help='Minimum number of properties for a class to be considered (default: 2)'
    )
    parser.add_argument(
        '--no-backup',
        action='store_true',
        help='Skip creating backup before modifications'
    )
    parser.add_argument(
        '--output', '-o',
        type=str,
        help='Output file for the summary report (default: stdout)'
    )
    parser.add_argument(
        '--detailed-report',
        type=str,
        help='Output file for detailed report with all changes'
    )
    parser.add_argument(
        '--analyze-only',
        action='store_true',
        help='Only analyze and report - same as --dry-run but emphasizes analysis'
    )

    args = parser.parse_args()

    # --analyze-only implies --dry-run
    if args.analyze_only:
        args.dry_run = True

    # Resolve paths
    script_dir = Path(__file__).parent
    website_dir = script_dir.parent
    css_dir = website_dir / args.css_dir
    js_dir = website_dir / args.js_dir

    if not css_dir.exists():
        print(f"Error: CSS directory not found: {css_dir}", file=sys.stderr)
        sys.exit(1)

    if not js_dir.exists():
        print(f"Error: JS directory not found: {js_dir}", file=sys.stderr)
        sys.exit(1)

    print(f"CSS Consolidator")
    print(f"CSS Directory: {css_dir}")
    print(f"JS Directory: {js_dir}")
    print(f"Mode: {'DRY RUN / ANALYSIS' if args.dry_run else 'LIVE'}")
    print(f"Min properties: {args.min_properties}")
    print()

    # Run consolidation
    results = consolidate_css_classes(
        css_dir=css_dir,
        js_dir=js_dir,
        min_properties=args.min_properties,
        dry_run=args.dry_run,
        verbose=args.verbose,
        backup=not args.no_backup,
        generate_report=bool(args.detailed_report) or args.verbose
    )

    # Format and output summary
    summary = format_summary(results)

    if args.output:
        Path(args.output).write_text(summary, encoding='utf-8')
        print(f"\nSummary written to: {args.output}")
    else:
        print(summary)

    # Write detailed report if requested
    if args.detailed_report and results.get('detailed_report'):
        Path(args.detailed_report).write_text(results['detailed_report'], encoding='utf-8')
        print(f"Detailed report written to: {args.detailed_report}")

    # Provide guidance
    if args.dry_run and results['groups_found'] > 0:
        print("\nTo apply these changes, run without --dry-run flag")
        print("A backup will be created automatically before modifications")

    # Exit with appropriate code
    if results['errors']:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
