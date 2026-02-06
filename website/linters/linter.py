#!/usr/bin/env python3
"""
Consolidate duplicate CSS class definitions across files.

- Only merges top-level, *simple* class selectors like ".my-class".
  (Skips combined selectors like ".a, .b", pseudo-classes, combinators, ids, etc.)
- Preserves @media/@supports/etc. blocks by not touching any rules inside at-rules.
- Writes the merged rule into the first file (by sorted path) where the class appears.
- Removes later duplicates from their files.
- If the same property appears multiple times across files, the **last occurrence wins**.
- Creates .bak backups by default.

Usage:
  python consolidate_css.py /path/to/css \
      [--recursive] [--dry-run] [--no-backup]

Notes:
- File processing order is lexicographically sorted for predictability.
- Property order is the order first seen; values update so the last seen wins.
"""

import argparse
import os
from pathlib import Path
from collections import OrderedDict, defaultdict
import re
import shutil

# ---------- Helpers for scanning outside strings/comments ----------

def _skip_comment_forward(s: str, i: int) -> int:
    end = s.find("*/", i + 2)
    return len(s) if end == -1 else end + 2

def _skip_string_forward(s: str, i: int) -> int:
    quote = s[i]
    i += 1
    while i < len(s):
        c = s[i]
        if c == "\\":
            i += 2
            continue
        if c == quote:
            return i + 1
        i += 1
    return i

def _skip_ws_and_comments_forward(s: str, i: int) -> int:
    n = len(s)
    while i < n:
        if s[i].isspace():
            i += 1
        elif s.startswith("/*", i):
            i = _skip_comment_forward(s, i)
        else:
            break
    return i

def _strip_comments(text: str) -> str:
    return re.sub(r"/\*.*?\*/", "", text, flags=re.S)

def _find_next_open_brace(s: str, start: int) -> int:
    """Find next '{' not in string/comment."""
    i = start
    n = len(s)
    while i < n:
        c = s[i]
        if c == "/" and i + 1 < n and s[i+1] == "*":
            i = _skip_comment_forward(s, i)
            continue
        if c in ("'", '"'):
            i = _skip_string_forward(s, i)
            continue
        if c == "{":
            return i
        i += 1
    return -1

def _find_matching_close_brace(s: str, open_idx: int) -> int:
    """Assumes s[open_idx] == '{'. Finds matching '}' accounting for nested braces, ignoring strings/comments."""
    depth = 0
    i = open_idx
    n = len(s)
    while i < n:
        c = s[i]
        if c == "/" and i + 1 < n and s[i+1] == "*":
            i = _skip_comment_forward(s, i)
            continue
        if c in ("'", '"'):
            i = _skip_string_forward(s, i)
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1

def _starts_with_at_rule(prelude: str) -> bool:
    pre = _strip_comments(prelude).strip()
    return pre.startswith("@")

_SIMPLE_CLASS_RE = re.compile(r"^\.[A-Za-z_][A-Za-z0-9_-]*$")

def _extract_simple_selector(prelude: str) -> str | None:
    """Return '.class' if prelude is exactly one simple class selector; else None."""
    clean = _strip_comments(prelude).strip()
    # Must not contain commas or spaces/combinators/pseudo/classes beyond the simple class
    if "," in clean or any(ch in clean for ch in " :>#~+[*#"):
        return None
    return clean if _SIMPLE_CLASS_RE.match(clean) else None

_PROP_RE = re.compile(r"([A-Za-z-]+)\s*:\s*([^;{}]+)")

def _parse_properties(block: str) -> list[tuple[str, str]]:
    """Very simple declaration parser (no var fallbacks with semicolons)."""
    no_comments = _strip_comments(block)
    props = _PROP_RE.findall(no_comments)
    # Normalize whitespace around values
    return [(name.strip(), " ".join(val.strip().split())) for name, val in props]

def _line_start_index(s: str, idx: int) -> int:
    j = idx - 1
    while j >= 0 and s[j] not in ("\n", "\r"):
        j -= 1
    return j + 1

def _indent_of(s: str, idx: int) -> str:
    ls = _line_start_index(s, idx)
    k = ls
    while k < len(s) and s[k] in (" ", "\t"):
        k += 1
    return s[ls:k]

# ---------- Core data structs ----------

class RuleOccur:
    __slots__ = ("file", "selector", "start", "open_idx", "end", "props", "indent")
    def __init__(self, file: Path, selector: str, start: int, open_idx: int, end: int, props: list[tuple[str,str]], indent: str):
        self.file = file
        self.selector = selector
        self.start = start           # start of removal/replacement (usually start-of-line before selector)
        self.open_idx = open_idx     # index of '{'
        self.end = end               # index of closing '}' (inclusive end will be end+1)
        self.props = props
        self.indent = indent

# ---------- Scanning & collecting ----------

def scan_top_level_simple_class_rules(file: Path) -> list[RuleOccur]:
    text = file.read_text(encoding="utf-8", errors="ignore")
    out: list[RuleOccur] = []

    i = 0
    n = len(text)
    while i < n:
        # Find next '{' at any level; treat the text from i..open as a prelude candidate
        prelude_start = _skip_ws_and_comments_forward(text, i)
        open_idx = _find_next_open_brace(text, prelude_start)
        if open_idx == -1:
            break

        prelude = text[prelude_start:open_idx]
        # Find matching close brace for this block
        close_idx = _find_matching_close_brace(text, open_idx)
        if close_idx == -1:
            # malformed; stop
            break

        # Decide whether this block is an at-rule or a qualified rule
        if _starts_with_at_rule(prelude):
            # Skip the entire at-rule block (and everything within)
            i = close_idx + 1
            continue

        # This is a top-level qualified rule: check if it's exactly one simple class selector
        sel = _extract_simple_selector(prelude)
        if sel:
            block_content = text[open_idx + 1:close_idx]
            props = _parse_properties(block_content)
            start_for_replace = _line_start_index(text, prelude_start)
            indent = _indent_of(text, prelude_start)
            out.append(RuleOccur(file, sel, start_for_replace, open_idx, close_idx, props, indent))

        # Move past this block
        i = close_idx + 1

    return out

def consolidate(folder: Path, recursive: bool = False):
    css_files = sorted(
        folder.rglob("*.css") if recursive else folder.glob("*.css"),
        key=lambda p: str(p).lower()
    )

    occurrences_by_selector: dict[str, list[RuleOccur]] = defaultdict(list)
    all_texts: dict[Path, str] = {}

    for f in css_files:
        try:
            all_texts[f] = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        rules = scan_top_level_simple_class_rules(f)
        for r in rules:
            occurrences_by_selector[r.selector].append(r)

    # Build merged properties and plan replacements
    # final_props[selector] = OrderedDict(name -> value), with last occurrence winning
    final_props: dict[str, OrderedDict[str, str]] = {}
    first_file_for: dict[str, Path] = {}

    for sel, occs in occurrences_by_selector.items():
        if not occs:
            continue
        # First file is by the scanning order (which is sorted by path)
        first_file_for[sel] = occs[0].file
        prop_map: OrderedDict[str, str] = OrderedDict()
        seen = set()
        for oc in occs:
            for name, val in oc.props:
                if name not in prop_map:
                    prop_map[name] = val
                else:
                    # Update value (last one wins) while keeping original insertion order
                    prop_map[name] = val
        final_props[sel] = prop_map

    return occurrences_by_selector, final_props, first_file_for, all_texts

# ---------- Applying changes ----------

def build_block(selector: str, props: OrderedDict[str, str], indent: str) -> str:
    lines = [f"{indent}{selector} {{\n"]
    inner = indent + "  "
    for name, val in props.items():
        lines.append(f"{inner}{name}: {val};\n")
    lines.append(f"{indent}}}\n")
    return "".join(lines)

def apply_changes(occurrences_by_selector, final_props, first_file_for, all_texts, dry_run=False, backup=True):
    # Gather per-file replacements: list of (start, end_exclusive, new_text)
    repls_by_file: dict[Path, list[tuple[int, int, str]]] = defaultdict(list)

    for sel, occs in occurrences_by_selector.items():
        merged = final_props.get(sel)
        if not merged:
            continue
        first_file = first_file_for[sel]

        # Replace first occurrence block with merged block; delete others
        for idx, oc in enumerate(occs):
            start = oc.start
            end = oc.end + 1  # make end exclusive
            if idx == 0:
                new_block = build_block(sel, merged, oc.indent)
                repls_by_file[oc.file].append((start, end, new_block))
            else:
                # Remove duplicate rule (replace with nothing)
                repls_by_file[oc.file].append((start, end, ""))

    # Apply replacements in reverse order per file to keep indices stable
    summary = []

    for file, repls in repls_by_file.items():
        text = all_texts[file]
        repls_sorted = sorted(repls, key=lambda t: t[0], reverse=True)
        changed = text
        for (start, end, new_text) in repls_sorted:
            changed = changed[:start] + new_text + changed[end:]
        if dry_run:
            summary.append(f"[DRY RUN] Would update {file} ({len(repls)} changes)")
        else:
            if backup:
                try:
                    shutil.copyfile(file, f"{file}.bak")
                except Exception:
                    pass
            file.write_text(changed, encoding="utf-8")
            summary.append(f"Updated {file} ({len(repls)} changes)")

    return summary

# ---------- CLI ----------

def main():
    ap = argparse.ArgumentParser(description="Consolidate duplicate simple CSS class definitions across files.")
    ap.add_argument("folder", type=str, nargs='?', default='src/styles', help="Folder containing .css files (default: src/styles)")
    ap.add_argument("--recursive", action="store_true", help="Recurse into subfolders")
    ap.add_argument("--dry-run", action="store_true", help="Show what would change, don't write files")
    ap.add_argument("--no-backup", action="store_true", help="Do not create .bak backups")
    args = ap.parse_args()

    # Resolve paths - website dir is parent of linters folder
    script_dir = Path(__file__).parent
    website_dir = script_dir.parent

    folder = Path(args.folder)
    # If relative path, resolve from website directory
    if not folder.is_absolute():
        folder = website_dir / folder

    if not folder.exists() or not folder.is_dir():
        print(f"Folder not found: {folder}")
        return

    occ_by_sel, final_props, first_file_for, all_texts = consolidate(folder, recursive=args.recursive)

    if not occ_by_sel:
        print("No top-level simple class rules found. Nothing to do.")
        return

    # Report what will be merged
    total_classes = 0
    to_merge = 0
    for sel, occs in occ_by_sel.items():
        total_classes += 1
        if len(occs) > 1:
            to_merge += 1

    print(f"Found {total_classes} simple class selectors across files.")
    print(f"{to_merge} selector(s) have duplicates to consolidate.\n")

    summary = apply_changes(
        occ_by_sel,
        final_props,
        first_file_for,
        all_texts,
        dry_run=args.dry_run,
        backup=not args.no_backup,
    )

    if summary:
        print("\n".join(summary))
    else:
        print("Nothing changed.")

if __name__ == "__main__":
    main()
