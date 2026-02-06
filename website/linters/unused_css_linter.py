#!/usr/bin/env python3
"""
Find CSS classes that are defined but never used in JS/JSX files.

Usage:
  python unused_css_linter.py [--css-dir CSS_DIR] [--js-dir JS_DIR] [--verbose] [--ignore-pattern PATTERN]

Examples:
  python unused_css_linter.py
  python unused_css_linter.py --css-dir src/styles --js-dir src
  python unused_css_linter.py --verbose
  python unused_css_linter.py --ignore-pattern "legacy-*"
"""

import argparse
import re
import sys
from pathlib import Path
from collections import defaultdict
from fnmatch import fnmatch


# ---------- CSS Parsing ----------

def extract_css_classes(css_content: str) -> set[str]:
    """
    Extract all class names from CSS content.
    Handles selectors like .class, .class:hover, .parent .child, etc.
    """
    classes = set()

    # Remove comments
    css_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)

    # Remove @import statements (to avoid extracting .css as a class)
    css_content = re.sub(r'@import\s+[^;]+;', '', css_content)

    # Find all class selectors
    # Matches .class-name pattern, handling various cases
    class_pattern = re.compile(r'\.([a-zA-Z_][a-zA-Z0-9_-]*)')

    # Find all matches
    for match in class_pattern.finditer(css_content):
        class_name = match.group(1)
        classes.add(class_name)

    return classes


def get_css_class_locations(css_content: str, filepath: Path) -> dict[str, list[tuple[Path, int]]]:
    """
    Extract all class names with their file and line locations.
    Returns dict of class_name -> [(filepath, line_number), ...]
    """
    locations = defaultdict(list)

    # Remove block comments but track line numbers
    lines = css_content.split('\n')
    in_comment = False
    cleaned_lines = []

    for line in lines:
        cleaned_line = line
        if in_comment:
            end_idx = line.find('*/')
            if end_idx != -1:
                cleaned_line = line[end_idx + 2:]
                in_comment = False
            else:
                cleaned_line = ''

        # Handle single-line and start of multi-line comments
        while '/*' in cleaned_line:
            start_idx = cleaned_line.find('/*')
            end_idx = cleaned_line.find('*/', start_idx)
            if end_idx != -1:
                cleaned_line = cleaned_line[:start_idx] + cleaned_line[end_idx + 2:]
            else:
                cleaned_line = cleaned_line[:start_idx]
                in_comment = True
                break

        # Skip @import statements (to avoid extracting .css as a class)
        if re.match(r'\s*@import\s+', cleaned_line):
            cleaned_lines.append('')
            continue

        cleaned_lines.append(cleaned_line)

    # Find classes with line numbers
    class_pattern = re.compile(r'\.([a-zA-Z_][a-zA-Z0-9_-]*)')

    for line_num, line in enumerate(cleaned_lines, 1):
        for match in class_pattern.finditer(line):
            class_name = match.group(1)
            locations[class_name].append((filepath, line_num))

    return locations


# ---------- JS/JSX Parsing ----------

def extract_js_class_references(js_content: str) -> tuple[set[str], set[str]]:
    """
    Extract all class name references from JS/JSX content.
    Handles various patterns:
    - className="class1 class2"
    - className={'class1'}
    - className={`class1 ${condition ? 'class2' : 'class3'}`}
    - classList.add('class1')
    - styles.className (CSS modules)
    - clsx/classnames usage
    - classNamePrefix="prefix" (generates prefix__* classes)
    - Dynamic class patterns like `prefix-${var}` (generates prefix-* wildcard)

    Returns:
        - classes: set of exact class names referenced
        - dynamic_prefixes: set of prefixes from dynamic patterns (for wildcard matching)
    """
    classes = set()
    dynamic_prefixes = set()

    # Remove comments - but be careful not to match /* inside strings
    # First, protect string contents by replacing /* and */ inside strings
    # This handles cases like accept="image/*" or content="/* comment */"

    def protect_strings(content: str) -> tuple[str, dict]:
        """Replace string contents with placeholders to protect them from comment removal.

        Note: We only protect single and double quoted strings, NOT template literals.
        Template literals need to be analyzed for dynamic class patterns like `prefix-${var}`.
        """
        placeholders = {}
        counter = [0]

        def replace_string(match):
            placeholder = f"__STRING_PLACEHOLDER_{counter[0]}__"
            placeholders[placeholder] = match.group(0)
            counter[0] += 1
            return placeholder

        # Match double-quoted strings (handling escaped quotes)
        content = re.sub(r'"(?:[^"\\]|\\.)*"', replace_string, content)
        # Match single-quoted strings (handling escaped quotes)
        content = re.sub(r"'(?:[^'\\]|\\.)*'", replace_string, content)
        # NOTE: We intentionally do NOT protect template literals here because
        # we need to analyze them for dynamic class patterns like `prefix-${var}`

        return content, placeholders

    def restore_strings(content: str, placeholders: dict) -> str:
        """Restore string contents from placeholders."""
        for placeholder, original in placeholders.items():
            content = content.replace(placeholder, original)
        return content

    # Protect strings first
    protected_content, string_placeholders = protect_strings(js_content)

    # Now safely remove comments
    protected_content = re.sub(r'//.*$', '', protected_content, flags=re.MULTILINE)
    protected_content = re.sub(r'/\*.*?\*/', '', protected_content, flags=re.DOTALL)

    # Restore strings
    js_content = restore_strings(protected_content, string_placeholders)

    # Pattern 1: className="class1 class2" or class="class1 class2"
    string_class_pattern = re.compile(r'(?:className|class)\s*=\s*["\']([^"\']+)["\']')
    for match in string_class_pattern.finditer(js_content):
        class_string = match.group(1)
        for cls in class_string.split():
            classes.add(cls)

    # Pattern 2: className={'class'} or className={"class"}
    brace_string_pattern = re.compile(r'className\s*=\s*\{\s*["\']([^"\']+)["\']\s*\}')
    for match in brace_string_pattern.finditer(js_content):
        class_string = match.group(1)
        for cls in class_string.split():
            classes.add(cls)

    # Pattern 3: Template literals with class names AND dynamic prefix detection
    template_pattern = re.compile(r'`([^`]*)`')
    for match in template_pattern.finditer(js_content):
        template = match.group(1)

        # Extract static string parts (non-interpolated)
        string_parts = re.findall(r'[a-zA-Z_][a-zA-Z0-9_-]*', template)
        for part in string_parts:
            if '-' in part or part.islower():  # Likely a CSS class
                classes.add(part)

        # Detect dynamic class patterns like `prefix-${var}` or `base prefix-${var}`
        # Pattern: word followed by hyphen/underscore, then ${...}
        dynamic_patterns = re.findall(r'([a-zA-Z_][a-zA-Z0-9_-]*[-_])\$\{', template)
        for prefix in dynamic_patterns:
            dynamic_prefixes.add(prefix)

        # Also detect patterns like `${var}-suffix` (less common but possible)
        # and `prefix--${var}` (BEM modifiers)
        bem_patterns = re.findall(r'([a-zA-Z_][a-zA-Z0-9_-]*--)\$\{', template)
        for prefix in bem_patterns:
            dynamic_prefixes.add(prefix)

    # Pattern 4: classList.add('class'), classList.remove('class'), etc.
    classlist_pattern = re.compile(r'classList\.(?:add|remove|toggle|contains)\s*\(\s*["\']([^"\']+)["\']')
    for match in classlist_pattern.finditer(js_content):
        classes.add(match.group(1))

    # Pattern 5: styles.className or styles['class-name'] (CSS modules)
    styles_dot_pattern = re.compile(r'styles\.([a-zA-Z_][a-zA-Z0-9_]*)')
    for match in styles_dot_pattern.finditer(js_content):
        classes.add(match.group(1))
        # Also add kebab-case version
        kebab = re.sub(r'([a-z])([A-Z])', r'\1-\2', match.group(1)).lower()
        classes.add(kebab)

    styles_bracket_pattern = re.compile(r'styles\[["\']([^"\']+)["\']\]')
    for match in styles_bracket_pattern.finditer(js_content):
        classes.add(match.group(1))

    # Pattern 6: String literals that look like CSS classes (for clsx, classnames, etc.)
    # Look for arrays and objects with class-like strings
    quoted_string_pattern = re.compile(r'["\']([a-zA-Z_][a-zA-Z0-9_-]*)["\']')
    for match in quoted_string_pattern.finditer(js_content):
        candidate = match.group(1)
        # Filter to likely CSS classes (contains hyphen or is lowercase with common prefixes)
        if '-' in candidate or candidate.startswith(('is-', 'has-', 'btn', 'card', 'modal', 'form', 'nav', 'menu', 'list', 'item', 'container', 'wrapper', 'section', 'header', 'footer', 'sidebar', 'content', 'page', 'view', 'row', 'col', 'grid', 'flex')):
            classes.add(candidate)

    # Pattern 7: classNamePrefix="prefix" (react-select, etc.)
    # This generates classes like prefix__control, prefix__option, etc.
    classname_prefix_pattern = re.compile(r'classNamePrefix\s*=\s*["\']([^"\']+)["\']')
    for match in classname_prefix_pattern.finditer(js_content):
        prefix = match.group(1)
        # Add the prefix with __ for BEM-style class generation
        dynamic_prefixes.add(f"{prefix}__")
        # Also add just the prefix with hyphen for other patterns
        dynamic_prefixes.add(f"{prefix}-")

    # Pattern 8: Known UI libraries that auto-apply class names
    # react-tabs: generates react-tabs__tab, react-tabs__tab-list, etc.
    if re.search(r"from\s+['\"]react-tabs['\"]", js_content):
        dynamic_prefixes.add("react-tabs__")

    # react-datepicker: generates react-datepicker__ classes
    if re.search(r"from\s+['\"]react-datepicker['\"]", js_content):
        dynamic_prefixes.add("react-datepicker__")
        dynamic_prefixes.add("react-datepicker-")

    # react-modal: generates ReactModal__ classes
    if re.search(r"from\s+['\"]react-modal['\"]", js_content):
        dynamic_prefixes.add("ReactModal__")

    return classes, dynamic_prefixes


# ---------- Main Logic ----------

def find_all_css_files(directory: Path) -> list[Path]:
    """Find all CSS files in directory recursively."""
    return list(directory.rglob('*.css'))


def find_all_js_files(directory: Path) -> list[Path]:
    """Find all JS/JSX/TS/TSX files in directory recursively."""
    extensions = ['*.js', '*.jsx', '*.ts', '*.tsx']
    files = []
    for ext in extensions:
        files.extend(directory.rglob(ext))
    return files


def analyze_unused_classes(
    css_dir: Path,
    js_dir: Path,
    ignore_patterns: list[str] = None,
    verbose: bool = False
) -> tuple[dict[str, list[tuple[Path, int]]], set[str], set[str]]:
    """
    Analyze CSS and JS files to find unused CSS classes.

    Returns:
        - unused_classes: dict of class_name -> [(filepath, line), ...]
        - all_css_classes: set of all defined CSS classes
        - all_js_references: set of all referenced classes in JS
    """
    ignore_patterns = ignore_patterns or []

    # Collect all CSS classes with locations
    css_files = find_all_css_files(css_dir)
    all_css_locations = defaultdict(list)

    if verbose:
        print(f"Found {len(css_files)} CSS files")

    for css_file in css_files:
        try:
            content = css_file.read_text(encoding='utf-8', errors='ignore')
            locations = get_css_class_locations(content, css_file)
            for class_name, locs in locations.items():
                all_css_locations[class_name].extend(locs)
        except Exception as e:
            if verbose:
                print(f"Error reading {css_file}: {e}")

    # Collect all JS class references
    js_files = find_all_js_files(js_dir)
    all_js_references = set()
    all_dynamic_prefixes = set()

    if verbose:
        print(f"Found {len(js_files)} JS/JSX files")

    for js_file in js_files:
        try:
            content = js_file.read_text(encoding='utf-8', errors='ignore')
            references, dynamic_prefixes = extract_js_class_references(content)
            all_js_references.update(references)
            all_dynamic_prefixes.update(dynamic_prefixes)
        except Exception as e:
            if verbose:
                print(f"Error reading {js_file}: {e}")

    if verbose and all_dynamic_prefixes:
        print(f"Found {len(all_dynamic_prefixes)} dynamic class prefixes: {sorted(all_dynamic_prefixes)}")

    # Find unused classes
    all_css_classes = set(all_css_locations.keys())
    unused_classes = {}

    for class_name in all_css_classes:
        # Check ignore patterns
        if any(fnmatch(class_name, pattern) for pattern in ignore_patterns):
            continue

        # Check if directly referenced
        if class_name in all_js_references:
            continue

        # Check if matches any dynamic prefix
        # e.g., if prefix is "rank-", then "rank-1", "rank-2" should match
        if any(class_name.startswith(prefix) for prefix in all_dynamic_prefixes):
            continue

        unused_classes[class_name] = all_css_locations[class_name]

    return unused_classes, all_css_classes, all_js_references


def format_report(
    unused_classes: dict[str, list[tuple[Path, int]]],
    all_css_classes: set[str],
    all_js_references: set[str],
    base_path: Path,
    group_by_file: bool = True
) -> str:
    """Format the analysis results into a readable report."""
    lines = []
    lines.append("=" * 60)
    lines.append("UNUSED CSS CLASSES REPORT")
    lines.append("=" * 60)
    lines.append("")
    lines.append(f"Total CSS classes defined: {len(all_css_classes)}")
    lines.append(f"Total class references in JS: {len(all_js_references)}")
    lines.append(f"Unused classes: {len(unused_classes)}")
    lines.append("")

    if not unused_classes:
        lines.append("No unused CSS classes found!")
        return "\n".join(lines)

    if group_by_file:
        # Group by file
        by_file = defaultdict(list)
        for class_name, locations in unused_classes.items():
            for filepath, line_num in locations:
                by_file[filepath].append((class_name, line_num))

        lines.append("-" * 60)
        lines.append("UNUSED CLASSES BY FILE")
        lines.append("-" * 60)

        for filepath in sorted(by_file.keys()):
            try:
                rel_path = filepath.relative_to(base_path)
            except ValueError:
                rel_path = filepath

            classes_in_file = sorted(by_file[filepath], key=lambda x: x[1])
            lines.append(f"\n{rel_path} ({len(classes_in_file)} unused classes):")
            for class_name, line_num in classes_in_file:
                lines.append(f"  Line {line_num}: .{class_name}")
    else:
        lines.append("-" * 60)
        lines.append("UNUSED CLASSES (alphabetical)")
        lines.append("-" * 60)

        for class_name in sorted(unused_classes.keys()):
            locations = unused_classes[class_name]
            loc_str = ", ".join(
                f"{fp.name}:{ln}" for fp, ln in locations[:3]
            )
            if len(locations) > 3:
                loc_str += f" (+{len(locations) - 3} more)"
            lines.append(f"  .{class_name} - {loc_str}")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Find CSS classes that are defined but never used in JS/JSX files."
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
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Show verbose output'
    )
    parser.add_argument(
        '--ignore-pattern',
        type=str,
        action='append',
        default=[],
        help='Glob pattern for class names to ignore (can be used multiple times)'
    )
    parser.add_argument(
        '--no-default-ignores',
        action='store_true',
        help='Disable default ignore patterns (is-active, is-loading, etc.)'
    )
    parser.add_argument(
        '--list-only',
        action='store_true',
        help='Only list class names without file locations'
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
    js_dir = website_dir / args.js_dir

    if not css_dir.exists():
        print(f"Error: CSS directory not found: {css_dir}", file=sys.stderr)
        sys.exit(1)

    if not js_dir.exists():
        print(f"Error: JS directory not found: {js_dir}", file=sys.stderr)
        sys.exit(1)

    # Default ignore patterns for common utility/framework classes
    # These are often toggled dynamically via JS and hard to detect statically
    default_ignores = [
        # State classes commonly toggled via JS
        'is-active', 'is-disabled', 'is-hidden', 'is-visible', 'is-open', 'is-closed',
        'is-loading', 'is-loaded', 'is-error', 'is-success', 'is-selected', 'is-focused',
        # BEM-style state modifiers
        '--active', '--disabled', '--hidden', '--visible', '--open', '--closed',
        '--loading', '--selected', '--focused', '--error', '--success',
    ]

    if args.no_default_ignores:
        all_ignores = args.ignore_pattern
    else:
        all_ignores = default_ignores + args.ignore_pattern

    if args.verbose:
        print(f"Scanning CSS in: {css_dir}")
        print(f"Scanning JS in: {js_dir}")
        print(f"Ignore patterns: {all_ignores}")
        print()

    # Run analysis
    unused_classes, all_css, all_js = analyze_unused_classes(
        css_dir, js_dir, all_ignores, args.verbose
    )

    # Format report
    report = format_report(
        unused_classes, all_css, all_js, website_dir,
        group_by_file=not args.list_only
    )

    # Output
    if args.output:
        Path(args.output).write_text(report, encoding='utf-8')
        print(f"Report written to: {args.output}")
    else:
        print(report)

    # Exit with error code if unused classes found
    if unused_classes:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
