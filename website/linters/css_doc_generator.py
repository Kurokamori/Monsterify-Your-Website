#!/usr/bin/env python3
"""
CSS Documentation Generator

Scans all CSS files in the styles folder and generates a simple
guide of available styles organized by folder, file, section, and class name.
"""

import os
import re
from pathlib import Path
from collections import defaultdict


STYLES_DIR = Path(__file__).parent.parent / "src" / "styles"
OUTPUT_FILE = Path(__file__).parent / "CSS_STYLE_GUIDE.md"


def extract_classes_and_sections(css_content):
    """Extract class names and section headers from CSS content."""
    sections = []
    current_section = {"header": None, "subheader": None, "classes": []}

    # Patterns for headers and subheaders
    main_header_pattern = re.compile(r'/\*\s*=+\s*(.+?)\s*=+\s*\*/')
    sub_header_pattern = re.compile(r'/\*\s*-+\s*(.+?)\s*-+\s*\*/')

    # Pattern for class selectors (captures .class-name)
    class_pattern = re.compile(r'\.([a-zA-Z_-][a-zA-Z0-9_-]*)')

    lines = css_content.split('\n')

    for line in lines:
        # Check for main header
        main_match = main_header_pattern.search(line)
        if main_match:
            # Save previous section if it has classes
            if current_section["classes"]:
                sections.append(current_section.copy())
            current_section = {
                "header": main_match.group(1).strip(),
                "subheader": None,
                "classes": []
            }
            continue

        # Check for subheader
        sub_match = sub_header_pattern.search(line)
        if sub_match:
            # Save previous section if it has classes
            if current_section["classes"]:
                sections.append(current_section.copy())
            current_section = {
                "header": current_section["header"],
                "subheader": sub_match.group(1).strip(),
                "classes": []
            }
            continue

        # Extract class names from selector lines (not inside property blocks)
        if '{' in line or line.strip().startswith('.'):
            classes = class_pattern.findall(line)
            for cls in classes:
                # Skip pseudo-classes and common noise
                if cls not in current_section["classes"] and not cls.startswith('--'):
                    current_section["classes"].append(cls)

    # Don't forget last section
    if current_section["classes"]:
        sections.append(current_section)

    return sections


def scan_css_files():
    """Scan all CSS files and organize by folder structure."""
    result = defaultdict(lambda: defaultdict(list))

    for css_file in sorted(STYLES_DIR.rglob("*.css")):
        relative_path = css_file.relative_to(STYLES_DIR)
        parts = relative_path.parts

        # Determine folder and filename
        if len(parts) > 1:
            folder = parts[0]
            filename = parts[-1]
        else:
            folder = "(root)"
            filename = parts[0]

        # Read and parse file
        try:
            content = css_file.read_text(encoding='utf-8')
            sections = extract_classes_and_sections(content)
            if sections:
                result[folder][filename] = sections
        except Exception as e:
            print(f"Error reading {css_file}: {e}")

    return result


def generate_markdown(data):
    """Generate markdown documentation from parsed CSS data."""
    lines = []
    lines.append("# CSS Style Guide")
    lines.append("")
    lines.append("Auto-generated documentation of available CSS classes.")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Table of contents
    lines.append("## Table of Contents")
    lines.append("")
    for folder in sorted(data.keys()):
        anchor = folder.replace("(", "").replace(")", "").replace(" ", "-").lower()
        lines.append(f"- [{folder}](#{anchor})")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Content by folder
    for folder in sorted(data.keys()):
        lines.append(f"## {folder}")
        lines.append("")

        for filename in sorted(data[folder].keys()):
            file_display = filename.replace(".css", "")
            lines.append(f"### {file_display}")
            lines.append("")

            sections = data[folder][filename]

            for section in sections:
                header = section.get("header")
                subheader = section.get("subheader")
                classes = section.get("classes", [])

                if not classes:
                    continue

                # Build section label
                if header and subheader:
                    label = f"{header} > {subheader}"
                elif header:
                    label = header
                elif subheader:
                    label = subheader
                else:
                    label = "General"

                lines.append(f"**{label}**")
                # List classes inline for brevity
                class_list = " ".join([f"`.{c}`" for c in sorted(set(classes))])
                lines.append(class_list)
                lines.append("")

            lines.append("---")
            lines.append("")

    return "\n".join(lines)


def main():
    print(f"Scanning CSS files in: {STYLES_DIR}")

    if not STYLES_DIR.exists():
        print(f"Error: Styles directory not found: {STYLES_DIR}")
        return 1

    data = scan_css_files()

    if not data:
        print("No CSS files found or no classes extracted.")
        return 1

    markdown = generate_markdown(data)

    OUTPUT_FILE.write_text(markdown, encoding='utf-8')
    print(f"Documentation generated: {OUTPUT_FILE}")

    # Summary stats
    total_files = sum(len(files) for files in data.values())
    total_classes = sum(
        len(cls)
        for folder in data.values()
        for sections in folder.values()
        for section in sections
        for cls in [section.get("classes", [])]
    )

    print(f"  Folders: {len(data)}")
    print(f"  Files: {total_files}")
    print(f"  Classes documented: {total_classes}")

    return 0


if __name__ == "__main__":
    exit(main())
