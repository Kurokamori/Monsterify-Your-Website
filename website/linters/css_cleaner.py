#!/usr/bin/env python3
"""
CSS Cleaner - Remove unused CSS class definitions safely.

This script uses the unused_css_linter to identify unused classes,
then removes their definitions from CSS files while preserving
file structure and handling edge cases like:
- Media queries (removes rules inside, cleans up empty queries)
- Multi-selector rules (e.g., .a, .b { } - only removes unused selectors)
- Nested selectors (e.g., .parent .child)
- Preserves comments and formatting

Usage:
  python css_cleaner.py [--dry-run] [--verbose] [--backup]

Examples:
  python css_cleaner.py --dry-run          # Preview changes without modifying
  python css_cleaner.py --backup           # Create .bak files before modifying
  python css_cleaner.py --verbose          # Show detailed output
"""

import argparse
import re
import sys
import shutil
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass
from typing import Optional

# Import the linter
from unused_css_linter import analyze_unused_classes, find_all_css_files


@dataclass
class CSSRule:
    """Represents a CSS rule with its selector and content."""
    selector: str
    content: str
    start_pos: int
    end_pos: int
    media_query: Optional[str] = None


@dataclass
class MediaQuery:
    """Represents a media query block."""
    query: str
    start_pos: int
    end_pos: int
    content: str


def extract_classes_from_selector(selector: str) -> set[str]:
    """Extract all class names from a CSS selector."""
    # Match .class-name patterns
    return set(re.findall(r'\.([a-zA-Z_][a-zA-Z0-9_-]*)', selector))


def selector_uses_class(selector: str, class_name: str) -> bool:
    """Check if a selector uses a specific class."""
    # Match the class as a whole word with . prefix
    pattern = rf'\.{re.escape(class_name)}(?![a-zA-Z0-9_-])'
    return bool(re.search(pattern, selector))


def remove_class_from_selector(selector: str, class_name: str) -> str:
    """
    Remove a class from a comma-separated selector list.
    Returns empty string if the entire selector should be removed.
    """
    # Split by comma, preserving whitespace
    parts = re.split(r'\s*,\s*', selector.strip())

    # Filter out parts that use the class
    remaining = [p for p in parts if not selector_uses_class(p, class_name)]

    if not remaining:
        return ""

    return ", ".join(remaining)


def parse_css_rules(content: str) -> list[tuple[int, int, str, str]]:
    """
    Parse CSS content and extract rules with their positions.
    Returns list of (start, end, selector, body) tuples.

    This is a state-machine parser that handles:
    - Nested braces (media queries, keyframes)
    - Comments
    - String literals
    """
    rules = []
    i = 0
    n = len(content)

    while i < n:
        # Skip whitespace
        while i < n and content[i] in ' \t\n\r':
            i += 1

        if i >= n:
            break

        # Skip comments
        if content[i:i+2] == '/*':
            j = content.find('*/', i + 2)
            if j == -1:
                break
            i = j + 2
            continue

        # Check for @-rules (media, keyframes, etc.)
        if content[i] == '@':
            # Find the opening brace or semicolon
            j = i + 1
            while j < n and content[j] not in '{;':
                j += 1

            if j >= n:
                break

            if content[j] == ';':
                # @import, @charset, etc. - skip
                i = j + 1
                continue

            # It's a block @-rule (media, keyframes, etc.)
            at_rule_start = i
            at_rule_header = content[i:j].strip()

            # Find matching closing brace
            brace_count = 1
            j += 1
            while j < n and brace_count > 0:
                if content[j] == '{':
                    brace_count += 1
                elif content[j] == '}':
                    brace_count -= 1
                elif content[j:j+2] == '/*':
                    # Skip comment
                    end = content.find('*/', j + 2)
                    if end == -1:
                        j = n
                        break
                    j = end + 1
                elif content[j] in '"\'':
                    # Skip string
                    quote = content[j]
                    j += 1
                    while j < n and content[j] != quote:
                        if content[j] == '\\':
                            j += 1
                        j += 1
                j += 1

            at_rule_end = j
            at_rule_content = content[at_rule_start:at_rule_end]

            # For media queries, parse the inner rules
            if at_rule_header.startswith('@media'):
                # Extract inner content (between first { and last })
                inner_start = content.find('{', at_rule_start) + 1
                inner_end = at_rule_end - 1
                inner_content = content[inner_start:inner_end]

                # Parse inner rules recursively
                inner_rules = parse_css_rules(inner_content)
                for start, end, selector, body in inner_rules:
                    # Adjust positions to be relative to the full content
                    rules.append((
                        inner_start + start,
                        inner_start + end,
                        selector,
                        body,
                        at_rule_header,  # Include media query info
                        at_rule_start,
                        at_rule_end
                    ))

            i = at_rule_end
            continue

        # Regular rule: find selector and body
        selector_start = i

        # Find the opening brace
        j = i
        while j < n and content[j] != '{':
            if content[j:j+2] == '/*':
                # Skip comment in selector
                end = content.find('*/', j + 2)
                if end == -1:
                    j = n
                    break
                j = end + 2
            else:
                j += 1

        if j >= n:
            break

        selector = content[i:j].strip()

        # Find the closing brace
        brace_start = j
        brace_count = 1
        j += 1
        while j < n and brace_count > 0:
            if content[j] == '{':
                brace_count += 1
            elif content[j] == '}':
                brace_count -= 1
            elif content[j:j+2] == '/*':
                end = content.find('*/', j + 2)
                if end == -1:
                    j = n
                    break
                j = end + 1
            elif content[j] in '"\'':
                quote = content[j]
                j += 1
                while j < n and content[j] != quote:
                    if content[j] == '\\':
                        j += 1
                    j += 1
            j += 1

        rule_end = j
        body = content[brace_start:rule_end]

        if selector:  # Only add non-empty selectors
            rules.append((selector_start, rule_end, selector, body))

        i = rule_end

    return rules


def clean_css_content(content: str, unused_classes: set[str], verbose: bool = False) -> tuple[str, int]:
    """
    Remove unused class definitions from CSS content.
    Returns (new_content, removal_count).
    """
    rules = parse_css_rules(content)

    # Sort by position (descending) so we can remove from end to start
    # This preserves position accuracy as we modify

    # Collect all removals/modifications
    modifications = []  # (start, end, replacement)
    removal_count = 0

    # Track media query modifications
    media_query_rules = defaultdict(list)  # (mq_start, mq_end) -> [rules]

    for rule_info in rules:
        if len(rule_info) == 7:
            # Rule inside media query
            start, end, selector, body, media_query, mq_start, mq_end = rule_info
            media_query_rules[(mq_start, mq_end, media_query)].append((start, end, selector, body))
        else:
            # Top-level rule
            start, end, selector, body = rule_info

            # Check if selector uses any unused class
            selector_classes = extract_classes_from_selector(selector)
            unused_in_selector = selector_classes & unused_classes

            if unused_in_selector:
                # Check if we should remove the entire rule or just modify selector
                new_selector = selector
                for cls in unused_in_selector:
                    new_selector = remove_class_from_selector(new_selector, cls)

                if not new_selector:
                    # Remove entire rule
                    modifications.append((start, end, ''))
                    removal_count += 1
                    if verbose:
                        print(f"  Removing rule: {selector[:60]}...")
                else:
                    # Modify selector - preserve spacing before brace
                    new_rule = new_selector + " " + body.lstrip()
                    modifications.append((start, end, new_rule))
                    removal_count += 1
                    if verbose:
                        print(f"  Modifying selector: {selector[:40]} -> {new_selector[:40]}")

    # Handle media query rules
    for (mq_start, mq_end, media_query), mq_rules in media_query_rules.items():
        rules_to_remove = []
        rules_to_modify = []

        for start, end, selector, body in mq_rules:
            selector_classes = extract_classes_from_selector(selector)
            unused_in_selector = selector_classes & unused_classes

            if unused_in_selector:
                new_selector = selector
                for cls in unused_in_selector:
                    new_selector = remove_class_from_selector(new_selector, cls)

                if not new_selector:
                    rules_to_remove.append((start, end))
                    removal_count += 1
                    if verbose:
                        print(f"  Removing from @media: {selector[:50]}...")
                else:
                    rules_to_modify.append((start, end, new_selector + body))
                    removal_count += 1

        # Add modifications for rules inside media query
        for start, end in rules_to_remove:
            modifications.append((start, end, ''))
        for start, end, new_content in rules_to_modify:
            modifications.append((start, end, new_content))

    # Sort modifications by start position (descending)
    modifications.sort(key=lambda x: x[0], reverse=True)

    # Apply modifications
    result = content
    for start, end, replacement in modifications:
        result = result[:start] + replacement + result[end:]

    # Clean up empty media queries
    result = clean_empty_media_queries(result)

    # Clean up excessive whitespace
    # - Multiple blank lines -> max 1 blank line
    result = re.sub(r'\n{3,}', '\n\n', result)
    # - Whitespace before closing brace
    result = re.sub(r'\n\s*\n(\s*\})', r'\n\1', result)
    # - Empty lines at start of blocks
    result = re.sub(r'(\{\s*)\n\s*\n', r'\1\n', result)

    return result, removal_count


def clean_empty_media_queries(content: str) -> str:
    """Remove media queries that have become empty after rule removal."""
    # Pattern to match media queries with only whitespace/comments inside
    # This handles nested comments and multiple whitespace

    def is_media_query_empty(match):
        """Check if media query content is effectively empty."""
        inner = match.group(1)
        # Remove comments
        inner = re.sub(r'/\*.*?\*/', '', inner, flags=re.DOTALL)
        # Check if only whitespace remains
        return inner.strip() == ''

    # Pattern to match @media blocks and capture their inner content
    pattern = r'@media[^{]+\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}'

    while True:
        new_content = content
        for match in re.finditer(pattern, content):
            inner = match.group(1)
            # Remove comments from inner content
            inner_clean = re.sub(r'/\*.*?\*/', '', inner, flags=re.DOTALL)
            # If only whitespace remains, remove the entire media query
            if inner_clean.strip() == '':
                new_content = content[:match.start()] + content[match.end():]
                break

        if new_content == content:
            break
        content = new_content

    return content


def clean_css_file(filepath: Path, unused_classes: set[str],
                   dry_run: bool = False, backup: bool = False,
                   verbose: bool = False) -> int:
    """
    Clean a single CSS file.
    Returns the number of rules removed.
    """
    try:
        content = filepath.read_text(encoding='utf-8')
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return 0

    new_content, removal_count = clean_css_content(content, unused_classes, verbose)

    if removal_count == 0:
        return 0

    if dry_run:
        print(f"Would modify {filepath}: {removal_count} rules to remove")
        return removal_count

    # Create backup if requested
    if backup:
        backup_path = filepath.with_suffix(filepath.suffix + '.bak')
        shutil.copy2(filepath, backup_path)
        if verbose:
            print(f"Created backup: {backup_path}")

    # Write the cleaned content
    try:
        filepath.write_text(new_content, encoding='utf-8')
        print(f"Modified {filepath}: removed {removal_count} rules")
    except Exception as e:
        print(f"Error writing {filepath}: {e}")
        return 0

    return removal_count


def main():
    parser = argparse.ArgumentParser(
        description="Remove unused CSS class definitions safely."
    )
    parser.add_argument(
        '--dry-run', '-n',
        action='store_true',
        help='Preview changes without modifying files'
    )
    parser.add_argument(
        '--backup', '-b',
        action='store_true',
        help='Create .bak backup files before modifying'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Show detailed output'
    )
    parser.add_argument(
        '--css-dir',
        type=str,
        default='src',
        help='Directory containing CSS files (default: src)'
    )
    parser.add_argument(
        '--js-dir',
        type=str,
        default='src',
        help='Directory containing JS/JSX files (default: src)'
    )

    args = parser.parse_args()

    # Resolve paths
    script_dir = Path(__file__).parent
    website_dir = script_dir.parent
    css_dir = website_dir / args.css_dir
    js_dir = website_dir / args.js_dir

    if not css_dir.exists():
        print(f"Error: CSS directory not found: {css_dir}", file=sys.stderr)
        sys.exit(1)

    print("=" * 60)
    print("CSS CLEANER")
    print("=" * 60)

    if args.dry_run:
        print("DRY RUN MODE - No files will be modified")
    print()

    # Get unused classes from the linter
    print("Analyzing unused classes...")

    # Default ignore patterns (same as linter)
    default_ignores = [
        'is-active', 'is-disabled', 'is-hidden', 'is-visible', 'is-open', 'is-closed',
        'is-loading', 'is-loaded', 'is-error', 'is-success', 'is-selected', 'is-focused',
        '--active', '--disabled', '--hidden', '--visible', '--open', '--closed',
        '--loading', '--selected', '--focused', '--error', '--success',
    ]

    unused_classes_dict, all_css, all_js = analyze_unused_classes(
        css_dir, js_dir, default_ignores, verbose=args.verbose
    )

    unused_classes = set(unused_classes_dict.keys())

    print(f"Found {len(unused_classes)} unused classes")
    print()

    if not unused_classes:
        print("No unused classes to remove!")
        sys.exit(0)

    # Process each CSS file
    css_files = find_all_css_files(css_dir)
    total_removed = 0
    files_modified = 0

    print(f"Processing {len(css_files)} CSS files...")
    print("-" * 60)

    for css_file in sorted(css_files):
        if args.verbose:
            rel_path = css_file.relative_to(website_dir)
            print(f"\nProcessing: {rel_path}")

        removed = clean_css_file(
            css_file, unused_classes,
            dry_run=args.dry_run,
            backup=args.backup,
            verbose=args.verbose
        )

        if removed > 0:
            total_removed += removed
            files_modified += 1

    print("-" * 60)
    print(f"\nSummary:")
    print(f"  Files {'to modify' if args.dry_run else 'modified'}: {files_modified}")
    print(f"  Rules {'to remove' if args.dry_run else 'removed'}: {total_removed}")

    if args.dry_run:
        print("\nRun without --dry-run to apply changes")

    sys.exit(0)


if __name__ == "__main__":
    main()
