#!/usr/bin/env python3
"""
Find hex color literals in CSS files that should be using CSS variables instead.

Skips theme and index files where hex literals are expected to be defined.

Usage:
  python hex_color_linter.py [--css-dir CSS_DIR] [--verbose] [--include-all]

Examples:
  python hex_color_linter.py
  python hex_color_linter.py --css-dir src/styles
  python hex_color_linter.py --include-all  # Don't skip any files
  python hex_color_linter.py --skip-pattern "**/legacy/*"
"""

import argparse
import re
import sys
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass
from fnmatch import fnmatch


@dataclass
class HexColorUsage:
    """Represents a hex color usage in CSS."""
    color: str
    filepath: Path
    line_number: int
    line_content: str
    property_name: str  # e.g., 'color', 'background', 'border'


# Files to skip by default (where hex literals are expected)
DEFAULT_SKIP_PATTERNS = [
    '**/index.css',
    '**/themes.css',
    '**/theme.css',
    '**/themes/*.css',
    '**/theme/*.css',
    '**/_variables.css',
    '**/variables.css',
    '**/colors.css',
]


def normalize_hex_color(color: str) -> str:
    """Normalize hex color to lowercase 6-digit format for comparison."""
    color = color.lower()
    if len(color) == 4:  # #rgb -> #rrggbb
        return f"#{color[1]*2}{color[2]*2}{color[3]*2}"
    return color


def extract_hex_colors(css_content: str, filepath: Path) -> list[HexColorUsage]:
    """
    Extract all hex color usages from CSS content.
    """
    usages = []
    lines = css_content.split('\n')

    # Pattern to match hex colors: #rgb, #rgba, #rrggbb, #rrggbbaa
    hex_pattern = re.compile(r'#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b')

    # Pattern to extract property name
    property_pattern = re.compile(r'([a-zA-Z-]+)\s*:\s*[^;]*#[0-9a-fA-F]+')

    # Track if we're in a comment
    in_block_comment = False

    for line_num, line in enumerate(lines, 1):
        # Handle block comments
        if in_block_comment:
            if '*/' in line:
                in_block_comment = False
                line = line[line.index('*/') + 2:]
            else:
                continue

        # Remove block comments that start and end on same line
        line_no_comments = re.sub(r'/\*.*?\*/', '', line)

        # Check if block comment starts
        if '/*' in line_no_comments:
            in_block_comment = True
            line_no_comments = line_no_comments[:line_no_comments.index('/*')]

        # Skip single-line comments
        if '//' in line_no_comments:
            line_no_comments = line_no_comments[:line_no_comments.index('//')]

        # Find hex colors in this line
        for match in hex_pattern.finditer(line_no_comments):
            color = f"#{match.group(1)}"

            # Try to find the property name
            property_name = "unknown"
            prop_match = property_pattern.search(line_no_comments[:match.end()])
            if prop_match:
                property_name = prop_match.group(1)

            usages.append(HexColorUsage(
                color=color,
                filepath=filepath,
                line_number=line_num,
                line_content=line.strip(),
                property_name=property_name
            ))

    return usages


def should_skip_file(filepath: Path, skip_patterns: list[str], base_path: Path) -> bool:
    """Check if a file should be skipped based on patterns."""
    try:
        rel_path = filepath.relative_to(base_path)
    except ValueError:
        rel_path = filepath

    rel_path_str = str(rel_path).replace('\\', '/')
    filename = filepath.name

    for pattern in skip_patterns:
        # Check full path pattern
        if fnmatch(rel_path_str, pattern):
            return True

        # For simple filename patterns like "index.css" or "_variables.css",
        # also match against just the filename
        # Skip this for directory patterns like "**/themes/*.css"
        fname_pattern = pattern.split('/')[-1] if '/' in pattern else pattern

        # Only do filename matching if the pattern is a specific filename (not *.css)
        if fname_pattern != '*.css' and not fname_pattern.startswith('*'):
            if fnmatch(filename, fname_pattern):
                return True

    return False


def find_all_css_files(directory: Path) -> list[Path]:
    """Find all CSS files in directory recursively."""
    return list(directory.rglob('*.css'))


def analyze_hex_colors(
    css_dir: Path,
    skip_patterns: list[str],
    verbose: bool = False
) -> tuple[list[HexColorUsage], dict[str, list[HexColorUsage]]]:
    """
    Analyze CSS files to find hex color usages.

    Returns:
        - all_usages: list of all hex color usages
        - by_color: dict grouping usages by normalized color
    """
    css_files = find_all_css_files(css_dir)

    if verbose:
        print(f"Found {len(css_files)} CSS files")

    all_usages = []
    skipped_files = []

    for css_file in css_files:
        if should_skip_file(css_file, skip_patterns, css_dir):
            skipped_files.append(css_file)
            continue

        try:
            content = css_file.read_text(encoding='utf-8', errors='ignore')
            usages = extract_hex_colors(content, css_file)
            all_usages.extend(usages)
        except Exception as e:
            if verbose:
                print(f"Error reading {css_file}: {e}")

    if verbose:
        print(f"Skipped {len(skipped_files)} theme/index files")
        print(f"Found {len(all_usages)} hex color usages")
        print()

    # Group by normalized color
    by_color = defaultdict(list)
    for usage in all_usages:
        normalized = normalize_hex_color(usage.color)
        by_color[normalized].append(usage)

    return all_usages, by_color


def format_report(
    all_usages: list[HexColorUsage],
    by_color: dict[str, list[HexColorUsage]],
    base_path: Path,
    group_by_file: bool = True,
    group_by_color: bool = False,
    show_line_content: bool = False
) -> str:
    """Format the analysis results into a readable report."""
    lines = []
    lines.append("=" * 70)
    lines.append("HEX COLOR LITERALS REPORT")
    lines.append("=" * 70)
    lines.append("")
    lines.append(f"Total hex color usages found: {len(all_usages)}")
    lines.append(f"Unique colors: {len(by_color)}")
    lines.append("")

    if not all_usages:
        lines.append("No hex color literals found outside of theme/index files!")
        return "\n".join(lines)

    if group_by_color:
        lines.append("-" * 70)
        lines.append("GROUPED BY COLOR")
        lines.append("-" * 70)

        # Sort colors by usage count (most used first)
        sorted_colors = sorted(by_color.items(), key=lambda x: -len(x[1]))

        for color, usages in sorted_colors:
            lines.append(f"\n  {color} ({len(usages)} usages):")

            # Group by file for cleaner display
            by_file = defaultdict(list)
            for usage in usages:
                by_file[usage.filepath].append(usage)

            for filepath in sorted(by_file.keys()):
                try:
                    rel_path = filepath.relative_to(base_path)
                except ValueError:
                    rel_path = filepath

                file_usages = by_file[filepath]
                line_nums = sorted(set(u.line_number for u in file_usages))

                if len(line_nums) <= 5:
                    lines.append(f"    - {rel_path}: lines {', '.join(map(str, line_nums))}")
                else:
                    lines.append(f"    - {rel_path}: {len(line_nums)} occurrences")

    if group_by_file:
        lines.append("")
        lines.append("-" * 70)
        lines.append("GROUPED BY FILE")
        lines.append("-" * 70)

        # Group by file
        by_file = defaultdict(list)
        for usage in all_usages:
            by_file[usage.filepath].append(usage)

        for filepath in sorted(by_file.keys()):
            try:
                rel_path = filepath.relative_to(base_path)
            except ValueError:
                rel_path = filepath

            file_usages = sorted(by_file[filepath], key=lambda u: u.line_number)
            lines.append(f"\n{rel_path} ({len(file_usages)} hex colors):")

            for usage in file_usages:
                color_display = f"{usage.color:<9}"
                if show_line_content:
                    # Truncate line content
                    content = usage.line_content
                    if len(content) > 50:
                        content = content[:50] + "..."
                    lines.append(f"  Line {usage.line_number:4d}: {color_display} | {content}")
                else:
                    lines.append(f"  Line {usage.line_number:4d}: {color_display} ({usage.property_name})")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Find hex color literals in CSS files that should use CSS variables."
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
        help='Show verbose output with line content'
    )
    parser.add_argument(
        '--include-all',
        action='store_true',
        help='Include all files (do not skip theme/index files)'
    )
    parser.add_argument(
        '--skip-pattern',
        type=str,
        action='append',
        default=[],
        help='Additional glob pattern for files to skip (can be used multiple times)'
    )
    parser.add_argument(
        '--by-color',
        action='store_true',
        help='Group results by color instead of by file'
    )
    parser.add_argument(
        '--output', '-o',
        type=str,
        help='Output file (default: stdout)'
    )

    args = parser.parse_args()

    # Resolve paths
    script_dir = Path(__file__).parent
    css_dir = script_dir / args.css_dir

    if not css_dir.exists():
        print(f"Error: CSS directory not found: {css_dir}", file=sys.stderr)
        sys.exit(1)

    # Build skip patterns
    if args.include_all:
        skip_patterns = []
    else:
        skip_patterns = DEFAULT_SKIP_PATTERNS.copy()

    skip_patterns.extend(args.skip_pattern)

    if args.verbose:
        print(f"Scanning CSS in: {css_dir}")
        print(f"Skip patterns: {skip_patterns}")
        print()

    # Run analysis
    all_usages, by_color = analyze_hex_colors(css_dir, skip_patterns, args.verbose)

    # Format report
    report = format_report(
        all_usages,
        by_color,
        script_dir,
        group_by_file=not args.by_color,
        group_by_color=args.by_color or args.verbose,
        show_line_content=args.verbose
    )

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

    # Exit with error code if hex colors found
    if all_usages:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
