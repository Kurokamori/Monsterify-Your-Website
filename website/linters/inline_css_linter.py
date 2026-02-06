#!/usr/bin/env python3
"""
Find inline CSS in JavaScript/JSX files that should be moved to CSS files.

Detects:
- style={{...}} - React inline style objects
- style={variable} - React style with variable reference
- <style>...</style> - Style tags in JSX
- css`...` - CSS template literals (styled-components, emotion)
- styled.div`...` - styled-components definitions
- sx={{...}} - MUI sx prop
- cssText assignments
- createElement with style prop

Usage:
  python inline_css_linter.py [--src-dir SRC_DIR] [--verbose] [--summary]

Examples:
  python inline_css_linter.py
  python inline_css_linter.py --src-dir src/components
  python inline_css_linter.py --verbose
  python inline_css_linter.py --summary  # Just show file counts
"""

import argparse
import re
import sys
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Optional


@dataclass
class InlineStyleUsage:
    """Represents an inline style usage in JS/JSX."""
    style_type: str  # 'style-object', 'style-variable', 'style-tag', 'css-literal', 'styled-component', 'sx-prop', etc.
    filepath: Path
    line_number: int
    line_content: str
    match_text: str  # The actual matched text
    severity: str = 'warning'  # 'warning', 'info', 'error'


@dataclass
class FileAnalysis:
    """Analysis results for a single file."""
    filepath: Path
    usages: List[InlineStyleUsage] = field(default_factory=list)
    has_style_import: bool = False
    has_css_import: bool = False


# Files/directories to skip
DEFAULT_SKIP_PATTERNS = [
    '**/node_modules/**',
    '**/*.test.js',
    '**/*.test.jsx',
    '**/*.spec.js',
    '**/*.spec.jsx',
    '**/test/**',
    '**/tests/**',
    '**/__tests__/**',
    '**/setupTests.js',
    '**/reportWebVitals.js',
]


def find_js_jsx_files(directory: Path) -> List[Path]:
    """Find all JS/JSX files in directory recursively."""
    files = []
    for pattern in ['*.js', '*.jsx', '*.tsx', '*.ts']:
        files.extend(directory.rglob(pattern))
    return files


def should_skip_file(filepath: Path, skip_patterns: List[str], base_path: Path) -> bool:
    """Check if a file should be skipped based on patterns."""
    from fnmatch import fnmatch

    try:
        rel_path = filepath.relative_to(base_path)
    except ValueError:
        rel_path = filepath

    rel_path_str = str(rel_path).replace('\\', '/')

    for pattern in skip_patterns:
        if fnmatch(rel_path_str, pattern):
            return True

    return False


def analyze_file(filepath: Path) -> FileAnalysis:
    """
    Analyze a JS/JSX file for inline CSS patterns.
    """
    analysis = FileAnalysis(filepath=filepath)

    try:
        content = filepath.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return analysis

    lines = content.split('\n')

    # Track multi-line patterns
    in_style_object = False
    style_object_start_line = 0
    brace_depth = 0
    in_style_tag = False
    style_tag_start_line = 0

    # Check for style/CSS imports (informational)
    for line in lines:
        if re.search(r"import\s+.*\.css['\"]", line):
            analysis.has_css_import = True
        if re.search(r"import\s+.*styles?.*from", line, re.IGNORECASE):
            analysis.has_style_import = True

    for line_num, line in enumerate(lines, 1):
        original_line = line

        # Skip comments
        line_stripped = line.strip()
        if line_stripped.startswith('//'):
            continue
        if line_stripped.startswith('/*') or line_stripped.startswith('*'):
            continue

        # 1. Detect style={{...}} - React inline style objects (most common)
        # Match style={{ at the start
        style_obj_match = re.search(r'\bstyle\s*=\s*\{\s*\{', line)
        if style_obj_match:
            analysis.usages.append(InlineStyleUsage(
                style_type='style-object',
                filepath=filepath,
                line_number=line_num,
                line_content=original_line.strip(),
                match_text=style_obj_match.group(0),
                severity='warning'
            ))

        # 2. Detect style={variable} or style={condition ? a : b}
        # But NOT style={{}} which we caught above
        style_var_match = re.search(r'\bstyle\s*=\s*\{([^{][^}]*)\}', line)
        if style_var_match and not style_obj_match:
            # Check if it's not just an empty or simple reference
            inner = style_var_match.group(1).strip()
            # Skip if it's importing from a styles object like styles.container
            if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*$', inner):
                # Skip className references
                if 'className' not in inner and 'class' not in inner.lower():
                    analysis.usages.append(InlineStyleUsage(
                        style_type='style-variable',
                        filepath=filepath,
                        line_number=line_num,
                        line_content=original_line.strip(),
                        match_text=style_var_match.group(0),
                        severity='info'  # Lower severity - might be intentional
                    ))

        # 3. Detect <style> tags in JSX
        if re.search(r'<style\b', line, re.IGNORECASE):
            analysis.usages.append(InlineStyleUsage(
                style_type='style-tag',
                filepath=filepath,
                line_number=line_num,
                line_content=original_line.strip(),
                match_text='<style>',
                severity='warning'
            ))

        # 4. Detect css`` template literals (emotion, styled-components)
        css_literal_match = re.search(r'\bcss\s*`', line)
        if css_literal_match:
            analysis.usages.append(InlineStyleUsage(
                style_type='css-template-literal',
                filepath=filepath,
                line_number=line_num,
                line_content=original_line.strip(),
                match_text=css_literal_match.group(0),
                severity='info'  # These are often intentional
            ))

        # 5. Detect styled.element`` or styled(Component)``
        styled_match = re.search(r'\bstyled\s*[.(]', line)
        if styled_match:
            analysis.usages.append(InlineStyleUsage(
                style_type='styled-component',
                filepath=filepath,
                line_number=line_num,
                line_content=original_line.strip(),
                match_text=styled_match.group(0),
                severity='info'  # CSS-in-JS pattern
            ))

        # 6. Detect sx={{...}} - MUI sx prop
        sx_match = re.search(r'\bsx\s*=\s*\{\s*\{', line)
        if sx_match:
            analysis.usages.append(InlineStyleUsage(
                style_type='sx-prop',
                filepath=filepath,
                line_number=line_num,
                line_content=original_line.strip(),
                match_text=sx_match.group(0),
                severity='warning'
            ))

        # 7. Detect .style. property access (DOM manipulation)
        dom_style_match = re.search(r'\.\s*style\s*\.\s*\w+\s*=', line)
        if dom_style_match:
            analysis.usages.append(InlineStyleUsage(
                style_type='dom-style-property',
                filepath=filepath,
                line_number=line_num,
                line_content=original_line.strip(),
                match_text=dom_style_match.group(0),
                severity='warning'
            ))

        # 8. Detect .style = "..." or .cssText =
        csstext_match = re.search(r'\.\s*(style|cssText)\s*=\s*["\']', line)
        if csstext_match:
            analysis.usages.append(InlineStyleUsage(
                style_type='cssText-assignment',
                filepath=filepath,
                line_number=line_num,
                line_content=original_line.strip(),
                match_text=csstext_match.group(0),
                severity='warning'
            ))

        # 9. Detect createElement with style in props
        create_element_style = re.search(r'createElement\s*\([^,]+,\s*\{[^}]*style\s*:', line)
        if create_element_style:
            analysis.usages.append(InlineStyleUsage(
                style_type='createElement-style',
                filepath=filepath,
                line_number=line_num,
                line_content=original_line.strip(),
                match_text='createElement with style',
                severity='warning'
            ))

        # 10. Detect inline style objects defined as variables (const styles = {...})
        # Only flag if they contain CSS-like properties
        style_var_def = re.search(r'\b(const|let|var)\s+\w*(style|Style|css|Css)\w*\s*=\s*\{', line, re.IGNORECASE)
        if style_var_def:
            # Check if the object contains CSS-like properties
            css_props = ['color', 'background', 'margin', 'padding', 'border', 'font',
                        'display', 'flex', 'grid', 'width', 'height', 'position',
                        'top', 'left', 'right', 'bottom', 'transform', 'opacity']
            # Look at the rest of the line and next few lines for CSS properties
            check_content = line
            for i in range(1, min(10, len(lines) - line_num)):
                check_content += lines[line_num + i - 1]

            has_css_prop = any(re.search(rf'\b{prop}\s*:', check_content) for prop in css_props)
            if has_css_prop:
                analysis.usages.append(InlineStyleUsage(
                    style_type='style-variable-definition',
                    filepath=filepath,
                    line_number=line_num,
                    line_content=original_line.strip(),
                    match_text=style_var_def.group(0),
                    severity='info'
                ))

        # 11. Detect @emotion/react css prop
        emotion_css_prop = re.search(r'\bcss\s*=\s*\{', line)
        if emotion_css_prop and not css_literal_match:
            analysis.usages.append(InlineStyleUsage(
                style_type='emotion-css-prop',
                filepath=filepath,
                line_number=line_num,
                line_content=original_line.strip(),
                match_text=emotion_css_prop.group(0),
                severity='warning'
            ))

    return analysis


def format_report(
    analyses: List[FileAnalysis],
    base_path: Path,
    verbose: bool = False,
    summary_only: bool = False
) -> str:
    """Format the analysis results into a readable report."""
    lines = []
    lines.append("=" * 70)
    lines.append("INLINE CSS LINTER REPORT")
    lines.append("=" * 70)
    lines.append("")

    # Filter to files with usages
    files_with_issues = [a for a in analyses if a.usages]

    # Count totals
    total_usages = sum(len(a.usages) for a in files_with_issues)

    # Count by type
    by_type: Dict[str, int] = defaultdict(int)
    by_severity: Dict[str, int] = defaultdict(int)
    for analysis in files_with_issues:
        for usage in analysis.usages:
            by_type[usage.style_type] += 1
            by_severity[usage.severity] += 1

    lines.append(f"Files scanned: {len(analyses)}")
    lines.append(f"Files with inline CSS: {len(files_with_issues)}")
    lines.append(f"Total inline CSS occurrences: {total_usages}")
    lines.append("")

    if by_severity:
        lines.append("By severity:")
        for sev in ['error', 'warning', 'info']:
            if sev in by_severity:
                lines.append(f"  {sev}: {by_severity[sev]}")
        lines.append("")

    if by_type:
        lines.append("By type:")
        for style_type in sorted(by_type.keys()):
            count = by_type[style_type]
            lines.append(f"  {style_type}: {count}")
        lines.append("")

    if not files_with_issues:
        lines.append("No inline CSS found!")
        return "\n".join(lines)

    if summary_only:
        lines.append("-" * 70)
        lines.append("FILES WITH INLINE CSS:")
        lines.append("-" * 70)
        for analysis in sorted(files_with_issues, key=lambda a: -len(a.usages)):
            try:
                rel_path = analysis.filepath.relative_to(base_path)
            except ValueError:
                rel_path = analysis.filepath

            type_counts = defaultdict(int)
            for u in analysis.usages:
                type_counts[u.style_type] += 1
            type_summary = ", ".join(f"{t}: {c}" for t, c in sorted(type_counts.items()))
            lines.append(f"  {rel_path}: {len(analysis.usages)} occurrences ({type_summary})")
        return "\n".join(lines)

    # Detailed report grouped by file
    lines.append("-" * 70)
    lines.append("DETAILED FINDINGS BY FILE")
    lines.append("-" * 70)

    # Sort files by number of issues (most first)
    for analysis in sorted(files_with_issues, key=lambda a: -len(a.usages)):
        try:
            rel_path = analysis.filepath.relative_to(base_path)
        except ValueError:
            rel_path = analysis.filepath

        lines.append(f"\n{rel_path} ({len(analysis.usages)} occurrences):")

        # Sort usages by line number
        for usage in sorted(analysis.usages, key=lambda u: u.line_number):
            severity_marker = {
                'error': '[ERR]',
                'warning': '[WARN]',
                'info': '[INFO]'
            }.get(usage.severity, '[???]')

            type_display = f"({usage.style_type})"

            if verbose:
                # Truncate line content
                content = usage.line_content
                if len(content) > 60:
                    content = content[:60] + "..."
                lines.append(f"  Line {usage.line_number:4d}: {severity_marker} {type_display}")
                lines.append(f"           {content}")
            else:
                lines.append(f"  Line {usage.line_number:4d}: {severity_marker} {type_display:<30} {usage.match_text[:40]}")

    # Add recommendations
    lines.append("")
    lines.append("-" * 70)
    lines.append("RECOMMENDATIONS")
    lines.append("-" * 70)
    lines.append("")

    if by_type.get('style-object', 0) > 0:
        lines.append("* style={{...}} - Move inline styles to CSS classes")
        lines.append("  Example: style={{color: 'red'}} -> className='error-text'")
        lines.append("")

    if by_type.get('style-tag', 0) > 0:
        lines.append("* <style> tags - Move to external CSS files or CSS modules")
        lines.append("")

    if by_type.get('dom-style-property', 0) > 0:
        lines.append("* .style.property assignments - Consider using CSS classes with classList.add/remove")
        lines.append("")

    if by_type.get('sx-prop', 0) > 0:
        lines.append("* sx={{...}} - Consider using styled() or makeStyles() for reusable styles")
        lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Find inline CSS in JavaScript/JSX files."
    )
    parser.add_argument(
        '--src-dir',
        type=str,
        default='src',
        help='Directory containing source files (default: src)'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Show verbose output with full line content'
    )
    parser.add_argument(
        '--summary',
        action='store_true',
        help='Show only file summary, not individual occurrences'
    )
    parser.add_argument(
        '--skip-pattern',
        type=str,
        action='append',
        default=[],
        help='Additional glob pattern for files to skip (can be used multiple times)'
    )
    parser.add_argument(
        '--output', '-o',
        type=str,
        help='Output file (default: stdout)'
    )
    parser.add_argument(
        '--severity',
        choices=['all', 'warning', 'error'],
        default='all',
        help='Filter by minimum severity level'
    )

    args = parser.parse_args()

    # Resolve paths - website dir is parent of linters folder
    script_dir = Path(__file__).parent
    website_dir = script_dir.parent
    src_dir = website_dir / args.src_dir

    if not src_dir.exists():
        print(f"Error: Source directory not found: {src_dir}", file=sys.stderr)
        sys.exit(1)

    # Build skip patterns
    skip_patterns = DEFAULT_SKIP_PATTERNS.copy()
    skip_patterns.extend(args.skip_pattern)

    if args.verbose:
        print(f"Scanning JS/JSX in: {src_dir}")
        print(f"Skip patterns: {skip_patterns}")
        print()

    # Find and analyze files
    js_files = find_js_jsx_files(src_dir)

    if args.verbose:
        print(f"Found {len(js_files)} JS/JSX files")

    analyses = []
    for js_file in js_files:
        if should_skip_file(js_file, skip_patterns, src_dir):
            continue

        analysis = analyze_file(js_file)

        # Filter by severity if requested
        if args.severity != 'all':
            min_severities = {'error': ['error'], 'warning': ['error', 'warning']}
            allowed = min_severities.get(args.severity, ['error', 'warning', 'info'])
            analysis.usages = [u for u in analysis.usages if u.severity in allowed]

        analyses.append(analysis)

    if args.verbose:
        print(f"Analyzed {len(analyses)} files")
        print()

    # Format report
    report = format_report(
        analyses,
        website_dir,
        verbose=args.verbose,
        summary_only=args.summary
    )

    # Output
    if args.output:
        Path(args.output).write_text(report, encoding='utf-8')
        print(f"Report written to: {args.output}")
    else:
        try:
            print(report)
        except UnicodeEncodeError:
            print(report.encode('ascii', 'replace').decode('ascii'))

    # Exit with error code if issues found
    files_with_issues = [a for a in analyses if a.usages]
    if files_with_issues:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
