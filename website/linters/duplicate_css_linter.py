#!/usr/bin/env python3
"""
Find duplicate CSS class definitions across files.

Tolerates responsive styles - a class defined at top-level AND inside @media
queries is not considered a duplicate. Only flags true duplicates within
the same context (both top-level, or both in the same media query).

Usage:
  python duplicate_css_linter.py [--css-dir CSS_DIR] [--verbose] [--same-file-only]

Examples:
  python duplicate_css_linter.py
  python duplicate_css_linter.py --css-dir src/styles
  python duplicate_css_linter.py --verbose
  python duplicate_css_linter.py --same-file-only  # Only find duplicates within same file
"""

import argparse
import re
import sys
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass


@dataclass
class ClassDefinition:
    """Represents a CSS class definition."""
    class_name: str
    filepath: Path
    line_number: int
    context: str  # 'top-level' or the media query string like '@media (max-width: 768px)'
    selector: str  # Full selector like '.btn', '.btn:hover', '.card .btn'
    properties: str  # The CSS properties block (for comparison)


def normalize_media_query(media_query: str) -> str:
    """Normalize a media query for comparison (remove extra whitespace)."""
    return ' '.join(media_query.split())


def extract_class_definitions(css_content: str, filepath: Path) -> list[ClassDefinition]:
    """
    Extract all class definitions from CSS content with context awareness.
    Tracks whether each class is at top-level or inside a media query.
    """
    definitions = []
    lines = css_content.split('\n')

    # Track line numbers
    def get_line_number(pos: int) -> int:
        return css_content[:pos].count('\n') + 1

    # Remove comments but preserve positions for line counting
    def remove_comments(text: str) -> str:
        result = []
        i = 0
        while i < len(text):
            if text[i:i+2] == '/*':
                end = text.find('*/', i + 2)
                if end == -1:
                    # Unclosed comment, replace rest with spaces
                    result.append(' ' * (len(text) - i))
                    break
                # Replace comment with spaces to preserve positions
                result.append(' ' * (end + 2 - i))
                i = end + 2
            else:
                result.append(text[i])
                i += 1
        return ''.join(result)

    clean_css = remove_comments(css_content)

    # Parse the CSS structure
    i = 0
    n = len(clean_css)
    context_stack = ['top-level']  # Stack to track nested contexts

    while i < n:
        # Skip whitespace
        while i < n and clean_css[i].isspace():
            i += 1
        if i >= n:
            break

        # Find the next block (look for '{')
        brace_pos = clean_css.find('{', i)
        if brace_pos == -1:
            break

        # Get the selector/at-rule before the brace
        selector = clean_css[i:brace_pos].strip()

        if not selector:
            i = brace_pos + 1
            continue

        # Find matching closing brace
        depth = 1
        j = brace_pos + 1
        while j < n and depth > 0:
            if clean_css[j] == '{':
                depth += 1
            elif clean_css[j] == '}':
                depth -= 1
            j += 1

        block_content = clean_css[brace_pos + 1:j - 1] if j > brace_pos + 1 else ''
        block_start_line = get_line_number(i)

        # Check if this is an at-rule
        if selector.startswith('@'):
            # Check if it's a media query or similar that contains rules
            if selector.startswith(('@media', '@supports', '@layer', '@container')):
                # Parse nested rules within this at-rule
                media_context = normalize_media_query(selector)
                nested_defs = parse_rules_in_context(block_content, filepath, media_context,
                                                      get_line_number(brace_pos + 1))
                definitions.extend(nested_defs)
            # Skip other at-rules like @keyframes, @font-face, etc.
        else:
            # This is a regular rule - extract class definitions
            class_defs = extract_classes_from_selector(
                selector, block_content, filepath,
                context_stack[-1], block_start_line
            )
            definitions.extend(class_defs)

        i = j

    return definitions


def parse_rules_in_context(content: str, filepath: Path, context: str,
                           base_line: int) -> list[ClassDefinition]:
    """Parse CSS rules within a specific context (like inside a media query)."""
    definitions = []

    i = 0
    n = len(content)
    current_line = base_line

    while i < n:
        # Track line numbers
        while i < n and content[i].isspace():
            if content[i] == '\n':
                current_line += 1
            i += 1
        if i >= n:
            break

        start_line = current_line

        # Find the next block
        brace_pos = content.find('{', i)
        if brace_pos == -1:
            break

        # Count newlines to brace
        current_line += content[i:brace_pos].count('\n')

        selector = content[i:brace_pos].strip()

        if not selector:
            i = brace_pos + 1
            continue

        # Find matching closing brace (handle nested braces for nested at-rules)
        depth = 1
        j = brace_pos + 1
        while j < n and depth > 0:
            if content[j] == '{':
                depth += 1
            elif content[j] == '}':
                depth -= 1
            j += 1

        block_content = content[brace_pos + 1:j - 1] if j > brace_pos + 1 else ''

        # Skip nested at-rules within media queries
        if not selector.startswith('@'):
            class_defs = extract_classes_from_selector(
                selector, block_content, filepath, context, start_line
            )
            definitions.extend(class_defs)

        current_line += content[brace_pos:j].count('\n')
        i = j

    return definitions


def extract_classes_from_selector(selector: str, properties: str, filepath: Path,
                                   context: str, line_number: int) -> list[ClassDefinition]:
    """
    Extract class definitions from a CSS selector.

    Returns ONE definition per rule block (not per class name).
    The class_name field contains the primary class (first one found).
    """
    # Find all class names in the selector
    class_pattern = re.compile(r'\.([a-zA-Z_][a-zA-Z0-9_-]*)')
    matches = class_pattern.findall(selector)

    if not matches:
        return []

    # Use the normalized selector as the identifier, first class as display name
    return [ClassDefinition(
        class_name=matches[0],  # Primary class for display
        filepath=filepath,
        line_number=line_number,
        context=context,
        selector=selector.strip(),
        properties=properties.strip()
    )]


def find_all_css_files(directory: Path) -> list[Path]:
    """Find all CSS files in directory recursively."""
    return list(directory.rglob('*.css'))


def normalize_selector(selector: str) -> str:
    """Normalize a selector for comparison (consistent whitespace, sorted if comma-separated)."""
    # Split by comma for grouped selectors
    parts = [p.strip() for p in selector.split(',')]
    # Sort parts for consistent comparison
    parts.sort()
    return ', '.join(parts)


def find_duplicates(
    definitions: list[ClassDefinition],
    same_file_only: bool = False,
    ignore_contexts: bool = False,
    match_selector: bool = True
) -> dict[tuple[str, str], list[ClassDefinition]]:
    """
    Find duplicate class definitions.

    If match_selector is True (default), groups by (normalized_selector, context)
    to find true duplicates where the exact same selector is defined multiple times.

    If match_selector is False, groups by (class_name, context) to find any
    class name that appears in multiple rule blocks.

    Returns only groups with more than one definition.
    """
    groups = defaultdict(list)

    for defn in definitions:
        if match_selector:
            # Group by exact selector - true duplicates
            selector_key = normalize_selector(defn.selector)
            if ignore_contexts:
                key = (selector_key, 'all')
            else:
                key = (selector_key, defn.context)
        else:
            # Group by class name only
            if ignore_contexts:
                key = (defn.class_name, 'all')
            else:
                key = (defn.class_name, defn.context)

        groups[key].append(defn)

    # Filter to only duplicates
    duplicates = {}
    for key, defs in groups.items():
        if same_file_only:
            # Group by file and find duplicates within same file
            by_file = defaultdict(list)
            for d in defs:
                by_file[d.filepath].append(d)

            for filepath, file_defs in by_file.items():
                if len(file_defs) > 1:
                    file_key = (key[0], key[1], str(filepath))
                    duplicates[file_key] = file_defs
        else:
            if len(defs) > 1:
                duplicates[key] = defs

    return duplicates


def format_report(
    duplicates: dict,
    base_path: Path,
    show_properties: bool = False
) -> str:
    """Format the duplicate analysis results into a readable report."""
    lines = []
    lines.append("=" * 70)
    lines.append("DUPLICATE CSS CLASSES REPORT")
    lines.append("=" * 70)
    lines.append("")

    if not duplicates:
        lines.append("No duplicate CSS class definitions found!")
        return "\n".join(lines)

    # Count unique class names with duplicates
    unique_classes = set(key[0] for key in duplicates.keys())
    total_duplicate_instances = sum(len(defs) for defs in duplicates.values())

    lines.append(f"Found {len(unique_classes)} classes with duplicate definitions")
    lines.append(f"Total duplicate instances: {total_duplicate_instances}")
    lines.append("")

    # Group by context for cleaner output
    by_context = defaultdict(list)
    for key, defs in duplicates.items():
        context = key[1] if len(key) >= 2 else 'unknown'
        by_context[context].append((key[0], defs))

    for context in sorted(by_context.keys()):
        lines.append("-" * 70)
        if context == 'top-level':
            lines.append("TOP-LEVEL DUPLICATES (not in any @media query)")
        elif context == 'all':
            lines.append("ALL DUPLICATES (ignoring context)")
        else:
            lines.append(f"DUPLICATES IN: {context}")
        lines.append("-" * 70)

        for class_name, defs in sorted(by_context[context], key=lambda x: x[0]):
            lines.append(f"\n  .{class_name} ({len(defs)} definitions):")

            for defn in sorted(defs, key=lambda d: (str(d.filepath), d.line_number)):
                try:
                    rel_path = defn.filepath.relative_to(base_path)
                except ValueError:
                    rel_path = defn.filepath

                lines.append(f"    - {rel_path}:{defn.line_number}")
                lines.append(f"      Selector: {defn.selector}")

                if show_properties and defn.properties:
                    # Show first few properties
                    props = defn.properties.replace('\n', ' ').strip()
                    if len(props) > 60:
                        props = props[:60] + "..."
                    lines.append(f"      Properties: {props}")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Find duplicate CSS class definitions across files."
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
        help='Show verbose output including CSS properties'
    )
    parser.add_argument(
        '--same-file-only',
        action='store_true',
        help='Only find duplicates within the same file'
    )
    parser.add_argument(
        '--ignore-responsive',
        action='store_true',
        help='Ignore media query context - flag ALL duplicates regardless of context'
    )
    parser.add_argument(
        '--by-class-name',
        action='store_true',
        help='Match by class name instead of exact selector (finds .btn in both ".btn" and ".card .btn")'
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
        print()

    # Find all CSS files
    css_files = find_all_css_files(css_dir)

    if args.verbose:
        print(f"Found {len(css_files)} CSS files")

    # Extract all class definitions
    all_definitions = []
    for css_file in css_files:
        try:
            content = css_file.read_text(encoding='utf-8', errors='ignore')
            definitions = extract_class_definitions(content, css_file)
            all_definitions.extend(definitions)
        except Exception as e:
            if args.verbose:
                print(f"Error reading {css_file}: {e}")

    if args.verbose:
        print(f"Found {len(all_definitions)} total class definitions")
        print()

    # Find duplicates
    duplicates = find_duplicates(
        all_definitions,
        same_file_only=args.same_file_only,
        ignore_contexts=args.ignore_responsive,
        match_selector=not args.by_class_name
    )

    # Format report
    report = format_report(duplicates, website_dir, show_properties=args.verbose)

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

    # Exit with error code if duplicates found
    if duplicates:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
