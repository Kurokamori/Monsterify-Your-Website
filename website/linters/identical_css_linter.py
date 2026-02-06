#!/usr/bin/env python3
"""
Find semantically identical CSS classes - different class names that have
the exact same properties and values.

This helps identify duplicate code that could be consolidated into a single
shared class (e.g., multiple grid classes that all do the same thing).

Usage:
  python identical_css_linter.py [--css-dir CSS_DIR] [--verbose] [--min-properties N]

Examples:
  python identical_css_linter.py
  python identical_css_linter.py --css-dir src/styles
  python identical_css_linter.py --verbose
  python identical_css_linter.py --min-properties 3  # Only report classes with 3+ properties
"""

import argparse
import re
import sys
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass, field


@dataclass
class CSSClass:
    """Represents a CSS class definition."""
    selector: str
    class_name: str
    filepath: Path
    line_number: int
    context: str  # 'top-level' or media query string
    properties: dict[str, str] = field(default_factory=dict)
    raw_block: str = ""

    @property
    def property_signature(self) -> str:
        """
        Create a normalized signature of all properties for comparison.
        Properties are sorted alphabetically and values are normalized.
        """
        if not self.properties:
            return ""
        # Sort properties and create a canonical representation
        sorted_props = sorted(self.properties.items())
        return "|".join(f"{k}:{v}" for k, v in sorted_props)

    @property
    def property_count(self) -> int:
        return len(self.properties)


def normalize_value(value: str) -> str:
    """Normalize a CSS property value for comparison."""
    # Remove extra whitespace
    value = ' '.join(value.split())
    # Lowercase (for things like color names)
    value = value.lower()
    # Normalize common patterns
    value = re.sub(r'\s*,\s*', ', ', value)  # Consistent comma spacing
    value = re.sub(r'\s*/\s*', '/', value)   # Consistent slash spacing
    # Remove trailing semicolons
    value = value.rstrip(';').strip()
    return value


def parse_properties(block_content: str) -> dict[str, str]:
    """
    Parse CSS properties from a block.
    Returns a dict of property_name -> normalized_value.
    """
    properties = {}

    # Remove comments
    block = re.sub(r'/\*.*?\*/', '', block_content, flags=re.DOTALL)

    # Split by semicolons and parse each declaration
    # Handle multi-line values and nested parentheses
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

        # Split on first colon only (values can contain colons)
        colon_idx = decl.index(':')
        prop_name = decl[:colon_idx].strip().lower()
        prop_value = decl[colon_idx + 1:].strip()

        # Skip empty or invalid properties
        if not prop_name or not prop_value:
            continue

        # Skip CSS variables definitions (they're unique by design)
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
            # Preserve newlines for line counting
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


def extract_class_name(selector: str) -> str | None:
    """Extract the primary class name from a selector."""
    # Match class selectors
    match = re.search(r'\.([a-zA-Z_][a-zA-Z0-9_-]*)', selector)
    return match.group(1) if match else None


def extract_css_classes(css_content: str, filepath: Path) -> list[CSSClass]:
    """
    Extract all CSS class definitions from content.
    """
    classes = []
    clean_css = remove_comments(css_content)

    def parse_rules(content: str, context: str, base_line: int) -> list[CSSClass]:
        """Parse rules from CSS content within a given context."""
        found = []
        i = 0
        n = len(content)
        current_line = base_line

        while i < n:
            # Skip whitespace and track lines
            while i < n and content[i].isspace():
                if content[i] == '\n':
                    current_line += 1
                i += 1

            if i >= n:
                break

            # Find the next block
            brace_pos = content.find('{', i)
            if brace_pos == -1:
                break

            # Count newlines to brace
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

            # Check if this is an at-rule
            if selector.startswith('@'):
                # Handle media queries and similar
                if any(selector.startswith(at) for at in ('@media', '@supports', '@layer', '@container')):
                    # Parse nested rules with this as context
                    nested_context = ' '.join(selector.split())  # Normalize whitespace
                    # Get line number at start of block
                    block_start_line = rule_start_line + selector.count('\n') + 1
                    nested = parse_rules(block_content, nested_context, block_start_line)
                    found.extend(nested)
                # Skip @keyframes, @font-face, etc.
            else:
                # Regular rule - check if it contains a class
                class_name = extract_class_name(selector)
                if class_name:
                    properties = parse_properties(block_content)
                    if properties:  # Only include if there are actual properties
                        found.append(CSSClass(
                            selector=selector.strip(),
                            class_name=class_name,
                            filepath=filepath,
                            line_number=rule_start_line,
                            context=context,
                            properties=properties,
                            raw_block=block_content.strip()
                        ))

            i = j

        return found

    return parse_rules(clean_css, 'top-level', 1)


def find_all_css_files(directory: Path) -> list[Path]:
    """Find all CSS files in directory recursively."""
    return list(directory.rglob('*.css'))


def find_identical_classes(
    classes: list[CSSClass],
    min_properties: int = 1,
    same_context_only: bool = False
) -> dict[str, list[CSSClass]]:
    """
    Find groups of classes with identical properties.

    Returns dict mapping property_signature -> list of classes with that signature.
    Only includes groups with 2+ classes (actual duplicates).
    """
    # Group by property signature
    by_signature = defaultdict(list)

    for css_class in classes:
        if css_class.property_count < min_properties:
            continue

        if same_context_only:
            key = (css_class.property_signature, css_class.context)
        else:
            key = css_class.property_signature

        by_signature[key].append(css_class)

    # Filter to only include groups with multiple classes
    # AND where the classes have different names (not same class in different files)
    identical = {}
    for sig, group in by_signature.items():
        if len(group) < 2:
            continue

        # Check if there are actually different class names in this group
        unique_selectors = set(c.selector for c in group)
        if len(unique_selectors) < 2:
            # All same selector, skip (this is a different kind of duplicate)
            continue

        # Use just the signature string as key for the result
        sig_key = sig if isinstance(sig, str) else sig[0]
        identical[sig_key] = group

    return identical


def format_report(
    identical: dict[str, list[CSSClass]],
    base_path: Path,
    show_properties: bool = False
) -> str:
    """Format the analysis results into a readable report."""
    lines = []
    lines.append("=" * 70)
    lines.append("SEMANTICALLY IDENTICAL CSS CLASSES REPORT")
    lines.append("=" * 70)
    lines.append("")
    lines.append("Classes with different names but identical properties/values.")
    lines.append("Consider consolidating these into shared utility classes.")
    lines.append("")

    if not identical:
        lines.append("No semantically identical classes found!")
        return "\n".join(lines)

    # Count stats
    total_groups = len(identical)
    total_classes = sum(len(group) for group in identical.values())
    potential_savings = total_classes - total_groups  # Could be reduced to 1 per group

    lines.append(f"Found {total_groups} groups of identical classes")
    lines.append(f"Total redundant class definitions: {total_classes}")
    lines.append(f"Potential consolidation savings: {potential_savings} class definitions")
    lines.append("")

    # Sort groups by number of occurrences (most duplicates first), then by property count
    sorted_groups = sorted(
        identical.items(),
        key=lambda x: (-len(x[1]), -len(x[1][0].properties))
    )

    for signature, group in sorted_groups:
        prop_count = group[0].property_count
        lines.append("-" * 70)
        lines.append(f"IDENTICAL GROUP ({len(group)} classes, {prop_count} properties each)")
        lines.append("-" * 70)

        # Show the properties once
        if show_properties:
            lines.append("\nProperties:")
            for prop, value in sorted(group[0].properties.items()):
                lines.append(f"  {prop}: {value};")
            lines.append("")

        lines.append("Classes with these properties:")

        # Group by context for cleaner display
        by_context = defaultdict(list)
        for css_class in group:
            by_context[css_class.context].append(css_class)

        for context in sorted(by_context.keys()):
            if context != 'top-level':
                lines.append(f"\n  In {context}:")
            else:
                lines.append(f"\n  Top-level:")

            for css_class in sorted(by_context[context], key=lambda c: (str(c.filepath), c.line_number)):
                try:
                    rel_path = css_class.filepath.relative_to(base_path)
                except ValueError:
                    rel_path = css_class.filepath

                lines.append(f"    {css_class.selector}")
                lines.append(f"      {rel_path}:{css_class.line_number}")

        lines.append("")

    # Add suggestions
    lines.append("=" * 70)
    lines.append("SUGGESTIONS")
    lines.append("=" * 70)
    lines.append("")
    lines.append("For each group above, consider:")
    lines.append("1. Creating a single shared utility class with these properties")
    lines.append("2. Applying that utility class to elements instead of unique classes")
    lines.append("3. Or using @extend in SCSS/SASS if available")
    lines.append("")
    lines.append("Example consolidation:")
    lines.append("  Before: .grid-items, .product-grid, .card-grid all with identical flex props")
    lines.append("  After:  Create .flex-grid utility, apply it alongside semantic classes")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Find CSS classes with different names but identical properties."
    )
    parser.add_argument(
        '--css-dir',
        type=str,
        default='src',
        help='Directory containing CSS files (default: src)'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Show verbose output including all properties'
    )
    parser.add_argument(
        '--min-properties',
        type=int,
        default=2,
        help='Minimum number of properties for a class to be considered (default: 2)'
    )
    parser.add_argument(
        '--same-context-only',
        action='store_true',
        help='Only compare classes within the same context (top-level or same media query)'
    )
    parser.add_argument(
        '--output', '-o',
        type=str,
        help='Output file (default: stdout)'
    )

    args = parser.parse_args()

    # Resolve paths - website dir is parent of linters folder
    script_dir = Path(__file__).parent
    website_dir = script_dir.parent
    css_dir = website_dir / args.css_dir

    if not css_dir.exists():
        print(f"Error: CSS directory not found: {css_dir}", file=sys.stderr)
        sys.exit(1)

    if args.verbose:
        print(f"Scanning CSS in: {css_dir}")
        print(f"Minimum properties: {args.min_properties}")
        print()

    # Find all CSS files
    css_files = find_all_css_files(css_dir)

    if args.verbose:
        print(f"Found {len(css_files)} CSS files")

    # Extract all class definitions
    all_classes = []
    for css_file in css_files:
        try:
            content = css_file.read_text(encoding='utf-8', errors='ignore')
            classes = extract_css_classes(content, css_file)
            all_classes.extend(classes)
        except Exception as e:
            if args.verbose:
                print(f"Error reading {css_file}: {e}")

    if args.verbose:
        print(f"Found {len(all_classes)} total class definitions")
        print()

    # Find identical classes
    identical = find_identical_classes(
        all_classes,
        min_properties=args.min_properties,
        same_context_only=args.same_context_only
    )

    # Format report
    report = format_report(identical, website_dir, show_properties=args.verbose)

    # Output
    if args.output:
        Path(args.output).write_text(report, encoding='utf-8')
        print(f"Report written to: {args.output}")
    else:
        # Handle Windows console encoding issues
        try:
            print(report)
        except UnicodeEncodeError:
            print(report.encode('ascii', 'replace').decode('ascii'))

    # Exit with error code if identical classes found
    if identical:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
