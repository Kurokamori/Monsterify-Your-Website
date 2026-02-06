#!/usr/bin/env python3
"""
Merge Duplicate CSS Selectors

This tool:
1. Finds CSS selectors that are defined multiple times (same selector, same context)
2. Merges their properties into a single definition
3. Keeps the merged definition in the first file (alphabetically in styles/ hierarchy)
4. Removes the duplicate definitions from other files

Usage:
  python merge_duplicate_selectors.py [--dry-run] [--verbose]
"""

import argparse
import re
import sys
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass, field


@dataclass
class CSSRule:
    """Represents a CSS rule block."""
    selector: str
    filepath: Path
    line_number: int
    context: str  # 'top-level' or '@media ...'
    properties: dict[str, str] = field(default_factory=dict)
    raw_block: str = ""
    start_pos: int = 0
    end_pos: int = 0


def normalize_value(value: str) -> str:
    """Normalize a CSS property value."""
    value = ' '.join(value.split())
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

        properties[prop_name] = normalize_value(prop_value)

    return properties


def normalize_selector(selector: str) -> str:
    """Normalize a selector for comparison."""
    parts = [p.strip() for p in selector.split(',')]
    parts.sort()
    return ', '.join(' '.join(p.split()) for p in parts)


def normalize_context(context: str) -> str:
    """Normalize media query context for comparison."""
    return ' '.join(context.split())


def extract_css_rules(css_content: str, filepath: Path) -> list[CSSRule]:
    """Extract all CSS rules from content."""
    rules = []

    # Remove comments for parsing but keep original for positions
    clean_css = re.sub(r'/\*.*?\*/', lambda m: ' ' * len(m.group()), css_content, flags=re.DOTALL)

    def get_line_number(pos: int) -> int:
        return css_content[:pos].count('\n') + 1

    def parse_rules(content: str, context: str, base_pos: int, base_line: int) -> list[CSSRule]:
        found = []
        i = 0
        n = len(content)

        while i < n:
            # Skip whitespace
            while i < n and content[i].isspace():
                i += 1
            if i >= n:
                break

            # Find next block
            brace_pos = content.find('{', i)
            if brace_pos == -1:
                break

            selector = content[i:brace_pos].strip()
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
                j += 1

            block_content = content[brace_pos + 1:j - 1] if j > brace_pos + 1 else ''
            start_pos = base_pos + i
            end_pos = base_pos + j

            if selector.startswith('@'):
                if any(selector.startswith(at) for at in ('@media', '@supports', '@container')):
                    nested_context = normalize_context(selector)
                    nested = parse_rules(block_content, nested_context,
                                        base_pos + brace_pos + 1,
                                        get_line_number(base_pos + brace_pos + 1))
                    found.extend(nested)
            else:
                # Handle comma-separated selectors
                selectors = [s.strip() for s in selector.split(',')]

                for single_selector in selectors:
                    if single_selector.startswith('.'):
                        properties = parse_properties(block_content)
                        if properties:
                            found.append(CSSRule(
                                selector=normalize_selector(single_selector),
                                filepath=filepath,
                                line_number=get_line_number(start_pos),
                                context=context,
                                properties=properties,
                                raw_block=block_content.strip(),
                                start_pos=start_pos,
                                end_pos=end_pos
                            ))

            i = j

        return found

    return parse_rules(clean_css, 'top-level', 0, 1)


def find_duplicates(rules: list[CSSRule]) -> dict[tuple[str, str], list[CSSRule]]:
    """Find duplicate selectors (same selector + context)."""
    groups = defaultdict(list)

    for rule in rules:
        key = (rule.selector, rule.context)
        groups[key].append(rule)

    # Only return groups with duplicates
    return {k: v for k, v in groups.items() if len(v) > 1}


def merge_properties(rules: list[CSSRule]) -> dict[str, str]:
    """Merge properties from all rules, later definitions override earlier ones."""
    merged = {}
    for rule in rules:
        merged.update(rule.properties)
    return merged


def get_file_priority(filepath: Path) -> tuple:
    """
    Determine priority for which file should keep the definition.
    Lower = higher priority (keeps the definition).

    Priority order:
    1. common/ folder (shared styles)
    2. global.css, themes.css, index.css
    3. Other style files alphabetically
    """
    name = filepath.name.lower()
    parts = filepath.parts

    # Check for common folder
    if 'common' in parts:
        return (0, name)

    # Check for global/theme files
    if name in ('global.css', 'themes.css', 'index.css'):
        return (1, name)

    # Everything else by name
    return (2, name)


def format_properties(properties: dict[str, str], indent: str = '  ') -> str:
    """Format properties as CSS block content."""
    lines = []
    for prop, val in sorted(properties.items()):
        lines.append(f"{indent}{prop}: {val};")
    return '\n'.join(lines)


def process_css_file(filepath: Path, removals: list[tuple[int, int]],
                     additions: dict[tuple[str, str], dict[str, str]],
                     dry_run: bool = False) -> tuple[bool, list[str]]:
    """
    Process a CSS file:
    - Remove specified rule blocks (by position)
    - Add merged properties to canonical locations
    """
    changes = []

    try:
        content = filepath.read_text(encoding='utf-8')
    except Exception as e:
        return False, [f"Error reading {filepath}: {e}"]

    original_content = content

    # Sort removals by position (reverse order so positions stay valid)
    removals = sorted(removals, key=lambda x: x[0], reverse=True)

    # For removals, we need to find and remove the entire rule block
    # We'll rebuild the file by tracking what to keep

    # Mark positions to remove
    remove_ranges = set()
    for start, end in removals:
        # Expand to include any preceding whitespace/newlines
        while start > 0 and content[start - 1] in ' \t\n':
            start -= 1
        remove_ranges.add((start, end))
        changes.append(f"  Removed duplicate at position {start}-{end}")

    if remove_ranges:
        # Build new content excluding removed ranges
        new_parts = []
        pos = 0
        for start, end in sorted(remove_ranges):
            if start > pos:
                new_parts.append(content[pos:start])
            pos = end
        if pos < len(content):
            new_parts.append(content[pos:])

        content = ''.join(new_parts)

        # Clean up excessive blank lines
        content = re.sub(r'\n{3,}', '\n\n', content)

    was_modified = content != original_content

    if was_modified and not dry_run:
        filepath.write_text(content, encoding='utf-8')

    return was_modified, changes


def update_canonical_rule(filepath: Path, selector: str, context: str,
                          merged_props: dict[str, str], dry_run: bool = False) -> tuple[bool, list[str]]:
    """Update the canonical rule with merged properties."""
    changes = []

    try:
        content = filepath.read_text(encoding='utf-8')
    except Exception as e:
        return False, [f"Error reading {filepath}: {e}"]

    original_content = content

    # Find the rule and update its properties
    rules = extract_css_rules(content, filepath)

    for rule in rules:
        if rule.selector == selector and rule.context == context:
            # Found the rule, update its properties
            old_block = content[rule.start_pos:rule.end_pos]

            # Find the actual block content boundaries
            brace_start = old_block.find('{')
            brace_end = old_block.rfind('}')

            if brace_start != -1 and brace_end != -1:
                selector_part = old_block[:brace_start + 1]

                # Create new block with merged properties
                new_props = format_properties(merged_props)
                new_block = f"{selector_part}\n{new_props}\n}}"

                content = content[:rule.start_pos] + new_block + content[rule.end_pos:]
                changes.append(f"  Updated {selector} with merged properties")
                break

    was_modified = content != original_content

    if was_modified and not dry_run:
        filepath.write_text(content, encoding='utf-8')

    return was_modified, changes


def main():
    parser = argparse.ArgumentParser(description="Merge duplicate CSS selectors")
    parser.add_argument('--css-dir', type=str, default='src/styles',
                        help='Directory containing CSS files')
    parser.add_argument('--dry-run', action='store_true',
                        help='Preview changes without modifying files')
    parser.add_argument('--verbose', '-v', action='store_true',
                        help='Show verbose output')

    args = parser.parse_args()

    script_dir = Path(__file__).parent
    website_dir = script_dir.parent
    css_dir = website_dir / args.css_dir

    if not css_dir.exists():
        print(f"Error: CSS directory not found: {css_dir}", file=sys.stderr)
        sys.exit(1)

    print(f"Merge Duplicate Selectors")
    print(f"CSS Directory: {css_dir}")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print()

    # Find all CSS files
    css_files = list(css_dir.rglob('*.css'))
    print(f"Found {len(css_files)} CSS files")

    # Extract all rules
    all_rules = []
    for css_file in css_files:
        try:
            content = css_file.read_text(encoding='utf-8', errors='ignore')
            rules = extract_css_rules(content, css_file)
            all_rules.extend(rules)
        except Exception as e:
            print(f"Error reading {css_file}: {e}")

    print(f"Found {len(all_rules)} CSS rules")

    # Find duplicates
    duplicates = find_duplicates(all_rules)

    if not duplicates:
        print("\nNo duplicate selectors found!")
        sys.exit(0)

    print(f"\nFound {len(duplicates)} selectors with duplicates")

    # Process each duplicate group
    # Track changes per file
    file_removals = defaultdict(list)  # filepath -> [(start, end), ...]
    file_updates = {}  # filepath -> {(selector, context): merged_props}

    total_merged = 0

    for (selector, context), rules in sorted(duplicates.items()):
        # Sort rules by file priority
        rules_sorted = sorted(rules, key=lambda r: get_file_priority(r.filepath))

        # First rule is canonical, rest are duplicates to remove
        canonical = rules_sorted[0]
        duplicates_to_remove = rules_sorted[1:]

        # Merge all properties
        merged_props = merge_properties(rules_sorted)

        if args.verbose:
            print(f"\n{selector} in {context}:")
            print(f"  Canonical: {canonical.filepath.relative_to(website_dir)}")
            for dup in duplicates_to_remove:
                print(f"  Remove: {dup.filepath.relative_to(website_dir)}:{dup.line_number}")

        # Mark duplicates for removal
        for dup in duplicates_to_remove:
            file_removals[dup.filepath].append((dup.start_pos, dup.end_pos))

        # Check if canonical needs updating
        if canonical.properties != merged_props:
            file_updates[canonical.filepath] = file_updates.get(canonical.filepath, {})
            file_updates[canonical.filepath][(selector, context)] = merged_props

        total_merged += len(duplicates_to_remove)

    print(f"\nWill merge {total_merged} duplicate definitions")

    # Apply changes
    files_modified = 0

    for filepath, removals in file_removals.items():
        modified, changes = process_css_file(filepath, removals, {}, dry_run=args.dry_run)
        if modified:
            files_modified += 1
            if args.verbose:
                try:
                    rel_path = filepath.relative_to(website_dir)
                except ValueError:
                    rel_path = filepath
                print(f"\nModified: {rel_path}")
                for change in changes:
                    print(change)

    for filepath, updates in file_updates.items():
        for (selector, context), merged_props in updates.items():
            modified, changes = update_canonical_rule(filepath, selector, context,
                                                       merged_props, dry_run=args.dry_run)
            if modified and args.verbose:
                for change in changes:
                    print(change)

    print(f"\n{'[DRY RUN] ' if args.dry_run else ''}Files modified: {files_modified}")
    print(f"Duplicate rules removed: {total_merged}")

    if args.dry_run:
        print("\nRun without --dry-run to apply changes")


if __name__ == "__main__":
    main()
