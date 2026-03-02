#!/usr/bin/env python3
"""
parse_areas.py

Reads backend/src/utils/contents/area-configurations.ts and emits
a clean Markdown reference document sorted by:

    Landmass (H1) > Region (H2) > Area (H3)

Each level includes only the essential fields:
  - Landmass: name, description
  - Region:   name, dominantTypes, description
  - Area:     name (derived from slug), description (welcomeMessages.base)

Usage:
    python parse_areas.py [input_file] [output_file]

Defaults:
    input  = backend/src/utils/contents/area-configurations.ts
    output = area-reference.md
"""

import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DEFAULT_INPUT  = Path("backend/src/utils/contents/area-configurations.ts")
DEFAULT_OUTPUT = Path("area-reference.md")

SECTION_MARKERS = {
    "landmass": ("// === LANDMASS_DATA_START ===", "// === LANDMASS_DATA_END ==="),
    "region":   ("// === REGION_DATA_START ===",   "// === REGION_DATA_END ==="),
    "area":     ("// === AREA_DATA_START ===",      "// === AREA_DATA_END ==="),
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def find_matching_brace(text: str, start: int) -> int:
    """Return the index of the closing '}' that matches the '{' at `start`."""
    depth = 0
    i = start
    in_string = False
    escape_next = False
    while i < len(text):
        ch = text[i]
        if escape_next:
            escape_next = False
        elif ch == '\\' and in_string:
            escape_next = True
        elif ch == '"' and not escape_next:
            in_string = not in_string
        elif not in_string:
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    return i
        i += 1
    return -1


def extract_section(content: str, start_marker: str, end_marker: str) -> str:
    start = content.find(start_marker)
    end   = content.find(end_marker)
    if start == -1 or end == -1:
        return ""
    return content[start : end + len(end_marker)]


def parse_entities(section: str) -> dict:
    """
    Parse the top-level entries of a TypeScript object literal like:
        export const foo = {
          'some-key': { ... },
          'other-key': { ... },
        };
    Returns { 'some-key': '{...}', 'other-key': '{...}' }.
    """
    entities: dict[str, str] = {}
    # Match  'slug-id':  {
    key_re = re.compile(r"'([^']+)':\s*\{")
    pos = 0
    while pos < len(section):
        m = key_re.search(section, pos)
        if not m:
            break
        key = m.group(1)
        brace_start = m.end() - 1        # position of the opening '{'
        brace_end   = find_matching_brace(section, brace_start)
        if brace_end == -1:
            break
        entities[key] = section[brace_start : brace_end + 1]
        pos = brace_end + 1
    return entities


def get_str(text: str, field: str) -> str:
    """Extract the value of  "field": "some value"  (single-line strings only)."""
    pattern = re.compile(
        r'"' + re.escape(field) + r'":\s*"((?:[^"\\]|\\.)*)"'
    )
    m = pattern.search(text)
    return m.group(1).replace('\\"', '"') if m else ""


def get_str_array(text: str, field: str) -> list:
    """Extract  "field": ["a", "b", ...]  and return the list of strings."""
    pattern = re.compile(
        r'"' + re.escape(field) + r'":\s*\[([\s\S]*?)\]'
    )
    m = pattern.search(text)
    if not m:
        return []
    return re.findall(r'"([^"]*)"', m.group(1))


def get_welcome_base(area_text: str) -> str:
    """Extract  welcomeMessages.base  from an area entity block."""
    wm_re = re.compile(r'"welcomeMessages":\s*\{')
    m = wm_re.search(area_text)
    if not m:
        return ""
    brace_start = m.end() - 1
    brace_end   = find_matching_brace(area_text, brace_start)
    wm_block    = area_text[brace_start : brace_end + 1]
    return get_str(wm_block, "base")


def slug_to_name(slug: str) -> str:
    """'adamant-peak'  →  'Adamant Peak'"""
    return " ".join(word.capitalize() for word in slug.split("-"))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    input_path  = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_INPUT
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUTPUT

    if not input_path.exists():
        sys.exit(f"ERROR: Input file not found: {input_path}")

    print(f"Reading {input_path} …")
    content = input_path.read_text(encoding="utf-8")

    # ---- Extract sections ------------------------------------------------
    sections = {
        k: extract_section(content, *v)
        for k, v in SECTION_MARKERS.items()
    }
    for k, s in sections.items():
        if not s:
            sys.exit(f"ERROR: Could not find section markers for '{k}'.")

    # ---- Parse entities ---------------------------------------------------
    landmasses = parse_entities(sections["landmass"])
    regions    = parse_entities(sections["region"])
    areas      = parse_entities(sections["area"])

    print(f"  Landmasses : {len(landmasses)}")
    print(f"  Regions    : {len(regions)}")
    print(f"  Areas      : {len(areas)}")

    # ---- Build hierarchy maps --------------------------------------------
    # landmass_id -> [region_ids]  (preserving declaration order)
    lm_region_ids: dict[str, list] = {}
    for lm_id, lm_text in landmasses.items():
        lm_region_ids[lm_id] = get_str_array(lm_text, "regions")

    # region_id -> [area_ids]
    region_area_ids: dict[str, list] = {}
    for r_id, r_text in regions.items():
        region_area_ids[r_id] = get_str_array(r_text, "areas")

    # ---- Build Markdown --------------------------------------------------
    lines: list[str] = []

    lines.append("# Area Reference Guide")
    lines.append("")
    lines.append("> Auto-generated from `area-configurations.ts`.")
    lines.append("> Hierarchy: **Landmass → Region → Area**")
    lines.append("")
    lines.append("---")
    lines.append("")

    for lm_id, lm_text in landmasses.items():
        lm_name = get_str(lm_text, "name") or slug_to_name(lm_id)
        lm_desc = get_str(lm_text, "description")

        lines.append(f"# {lm_name}")
        lines.append("")
        if lm_desc:
            lines.append(lm_desc)
            lines.append("")

        for r_id in lm_region_ids.get(lm_id, []):
            r_text = regions.get(r_id)
            if r_text is None:
                # Region listed but no definition found — skip gracefully
                lines.append(f"## {slug_to_name(r_id)}")
                lines.append("")
                lines.append("_No region data available._")
                lines.append("")
                continue

            r_name  = get_str(r_text, "name") or slug_to_name(r_id)
            r_desc  = get_str(r_text, "description")
            r_types = get_str_array(r_text, "dominantTypes")
            types_str = ", ".join(r_types) if r_types else "—"

            lines.append(f"## {r_name}")
            lines.append("")
            lines.append(f"**Dominant Types:** {types_str}")
            lines.append("")
            if r_desc:
                lines.append(r_desc)
                lines.append("")

            for a_id in region_area_ids.get(r_id, []):
                a_text = areas.get(a_id)
                a_name = slug_to_name(a_id)

                lines.append(f"### {a_name}")
                lines.append("")
                if a_text:
                    a_desc = get_welcome_base(a_text)
                    if a_desc:
                        lines.append(a_desc)
                        lines.append("")
                else:
                    lines.append("_No area data available._")
                    lines.append("")

        lines.append("---")
        lines.append("")

    # ---- Write output ----------------------------------------------------
    output_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Written to {output_path}  ({output_path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
