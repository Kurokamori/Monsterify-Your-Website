#!/usr/bin/env node

/**
 * Custom CSS/TSX Linter for Dusk & Dawn Website
 *
 * Runs alongside ESLint and TypeScript checks as part of `npm run lint`.
 *
 * Checks performed:
 *   1. Duplicate CSS selectors across files           [WARNING]
 *   2. Undefined CSS variables (not in index/themes)  [ERROR]
 *   3. Raw hex/rgba colors outside index.css/themes   [WARNING]
 *   4. CSS classes used in TSX but not defined in CSS  [ERROR]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Paths & Config
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

/** Files where CSS variable definitions and raw color values are allowed. */
const VAR_DEFINITION_FILES = new Set(
  [
    path.join(SRC, "styles", "index.css"),
    path.join(SRC, "styles", "themes.css"),
  ].map((f) => path.resolve(f))
);

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

const color = process.stdout.isTTY !== false;
const RED = color ? "\x1b[31m" : "";
const YELLOW = color ? "\x1b[33m" : "";
const GREEN = color ? "\x1b[32m" : "";
const CYAN = color ? "\x1b[36m" : "";
const DIM = color ? "\x1b[2m" : "";
const BOLD = color ? "\x1b[1m" : "";
const RESET = color ? "\x1b[0m" : "";

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Recursively find files under `dir` matching any of `extensions`. */
function findFiles(dir, extensions) {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(full, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

/** Return 1-based line number for a character index. */
function lineAt(content, index) {
  let n = 1;
  for (let i = 0; i < index && i < content.length; i++) {
    if (content[i] === "\n") n++;
  }
  return n;
}

/** Path relative to project root, forward-slash normalised. */
function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

// ---------------------------------------------------------------------------
// CSS comment stripping (preserves newlines for line-number accuracy)
// ---------------------------------------------------------------------------

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
}

// ---------------------------------------------------------------------------
// CSS Analysis
// ---------------------------------------------------------------------------

/**
 * Analyse a single CSS file. Returns:
 *   selectors    – [{selector, line, file}]
 *   classNames   – Set of class names found in selectors
 *   varDefs      – Set of --variable-name strings defined here
 *   varUsages    – [{name, line, file}]
 *   rawColors    – [{value, line, file}]
 */
function analyseCSS(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const css = stripComments(raw);

  const selectors = [];
  const classNames = new Set();
  const varDefs = new Set();
  const varUsages = [];
  const rawColors = [];

  // ---- Selector extraction (state-machine) --------------------------------

  let depth = 0;
  let buf = "";
  let bufStartLine = 1;
  let curLine = 1;
  const atStack = []; // {type, depth}

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];

    if (ch === "\n") {
      curLine++;
      if (!buf.trim()) bufStartLine = curLine;
      buf += ch;
      continue;
    }

    if (ch === "{") {
      const sel = buf.trim();
      depth++;

      // Classify at-rules
      if (/^@keyframes\b/i.test(sel) || /^@-webkit-keyframes\b/i.test(sel)) {
        atStack.push({ type: "keyframes", depth });
      } else if (/^@font-face\b/i.test(sel)) {
        atStack.push({ type: "font-face", depth });
      } else if (
        /^@media\b/i.test(sel) ||
        /^@supports\b/i.test(sel) ||
        /^@layer\b/i.test(sel) ||
        /^@container\b/i.test(sel)
      ) {
        atStack.push({ type: "pass", depth });
      } else if (
        !atStack.some((a) => a.type === "keyframes" || a.type === "font-face") &&
        sel &&
        !sel.startsWith("@")
      ) {
        // Genuine style rule
        const parts = sel
          .split(",")
          .map((s) => s.replace(/\s+/g, " ").trim())
          .filter(Boolean);

        for (const part of parts) {
          selectors.push({ selector: part, line: bufStartLine, file: filePath });

          // Extract .class-name tokens
          let m;
          const rx = /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g;
          while ((m = rx.exec(part)) !== null) classNames.add(m[1]);
        }
      }

      buf = "";
      bufStartLine = curLine;
      continue;
    }

    if (ch === "}") {
      depth--;
      if (atStack.length && atStack[atStack.length - 1].depth === depth + 1) {
        atStack.pop();
      }
      buf = "";
      bufStartLine = curLine;
      continue;
    }

    // Top-level semicolons (e.g. @import)
    if (ch === ";" && depth === 0) {
      buf = "";
      bufStartLine = curLine;
      continue;
    }

    buf += ch;
  }

  // ---- Variable definitions -----------------------------------------------

  let m;
  const defRx = /(--[a-zA-Z][a-zA-Z0-9_-]*)\s*:/g;
  while ((m = defRx.exec(css)) !== null) varDefs.add(m[1]);

  // ---- Variable usages ----------------------------------------------------

  const useRx = /var\(\s*(--[a-zA-Z][a-zA-Z0-9_-]*)/g;
  while ((m = useRx.exec(css)) !== null) {
    varUsages.push({ name: m[1], line: lineAt(css, m.index), file: filePath });
  }

  // ---- Raw colour values (only for files outside index/themes) ------------

  if (!VAR_DEFINITION_FILES.has(path.resolve(filePath))) {
    const lines = css.split("\n");
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];

      // Skip variable-definition lines and @import
      if (/^\s*--[a-zA-Z]/.test(line)) continue;
      if (/^\s*@import/.test(line)) continue;
      if (!line.trim()) continue;

      // Hex colours
      const hexRx = /#([0-9a-fA-F]{3,8})\b/g;
      while ((m = hexRx.exec(line)) !== null) {
        // Skip inside url()
        if (/url\([^)]*$/.test(line.substring(0, m.index))) continue;
        rawColors.push({ value: m[0], line: li + 1, file: filePath });
      }

      // rgba / rgb / hsla / hsl functions
      const fnRx = /\b(rgba?|hsla?)\s*\(/g;
      while ((m = fnRx.exec(line)) !== null) {
        // Grab full function call up to matching paren
        let pd = 0;
        let end = m.index + m[0].length - 1;
        for (; end < line.length; end++) {
          if (line[end] === "(") pd++;
          if (line[end] === ")") {
            pd--;
            if (pd === 0) {
              end++;
              break;
            }
          }
        }
        rawColors.push({
          value: line.substring(m.index, end),
          line: li + 1,
          file: filePath,
        });
      }
    }
  }

  return { selectors, classNames, varDefs, varUsages, rawColors };
}

// ---------------------------------------------------------------------------
// TSX Analysis – extract CSS class names from className attributes
// ---------------------------------------------------------------------------

/** Return true for third-party / icon-font classes we should skip. */
function isIgnoredClass(name) {
  if (/^fa[bsrl]?$/.test(name)) return true; // fas, far, fab, fal, fa
  if (name.startsWith("fa-")) return true; // fa-check, fa-solid, …
  return false;
}

function analyseTSX(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const classes = []; // {name, line, file, dynamic}

  // -- Pattern 1: className="static classes" --------------------------------

  let m;
  const p1 = /className="([^"]+)"/g;
  while ((m = p1.exec(content)) !== null) {
    const ln = lineAt(content, m.index);
    for (const cls of m[1].split(/\s+/).filter(Boolean)) {
      if (cls.includes("$") || cls.includes("{")) continue;
      classes.push({ name: cls, line: ln, file: filePath, dynamic: false });
    }
  }

  // -- Pattern 2: className={`template ${dyn} static`} ---------------------
  //    We use bracket-aware matching for the outer { }.

  const p2 = /className=\{/g;
  while ((m = p2.exec(content)) !== null) {
    const start = m.index + m[0].length;
    let d = 1;
    let i = start;

    // Walk forward, respecting strings and template literals
    outer: while (i < content.length && d > 0) {
      const c = content[i];
      if (c === "{") { d++; i++; continue; }
      if (c === "}") { d--; if (d === 0) break; i++; continue; }

      // Skip string literals
      if (c === '"' || c === "'") {
        const q = c;
        i++;
        while (i < content.length && content[i] !== q) {
          if (content[i] === "\\") i++;
          i++;
        }
        i++; // skip closing quote
        continue;
      }

      // Template literal – skip ${…} sub-expressions inside
      if (c === "`") {
        i++;
        while (i < content.length && content[i] !== "`") {
          if (content[i] === "\\") { i++; i++; continue; }
          if (content[i] === "$" && i + 1 < content.length && content[i + 1] === "{") {
            i += 2;
            let td = 1;
            while (i < content.length && td > 0) {
              if (content[i] === "{") td++;
              if (content[i] === "}") td--;
              if (td > 0) i++;
            }
            i++; // closing } of template expression
            continue;
          }
          i++;
        }
        i++; // closing `
        continue;
      }

      i++;
    }

    if (d !== 0) continue; // unmatched braces – skip

    const expr = content.substring(start, i);
    const ln = lineAt(content, m.index);

    // If it's just a variable reference, skip
    if (/^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(expr.trim())) continue;

    // Extract static parts of template literals within the expression
    const tmplRx = /`([^`]*)`/gs;
    let tm;
    while ((tm = tmplRx.exec(expr)) !== null) {
      const staticParts = tm[1].replace(/\$\{[^}]*\}/g, "  ").split(/\s+/).filter(Boolean);
      for (const cls of staticParts) {
        if (/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(cls)) {
          classes.push({ name: cls, line: ln, file: filePath, dynamic: true });
        }
      }
    }

    // Extract plain string literals, but ONLY from outside template literals.
    // Skip strings that are comparison operands (e.g. mode === 'create'),
    // which are values in ternary conditions, not CSS class names.
    const exprNoTemplates = expr.replace(/`[^`]*`/gs, " ");
    const strRx = /(['"])([a-zA-Z][a-zA-Z0-9_ -]*?)\1/g;
    let sm;
    while ((sm = strRx.exec(exprNoTemplates)) !== null) {
      // Check if this string is preceded by a comparison operator (===, !==, ==, !=)
      const before = exprNoTemplates.substring(0, sm.index).trimEnd();
      if (/[=!]=?=?\s*$/.test(before)) continue;
      // Check if this string is followed by a comparison operator
      const after = exprNoTemplates.substring(sm.index + sm[0].length).trimStart();
      if (/^[=!]==?/.test(after)) continue;

      for (const cls of sm[2].split(/\s+/).filter(Boolean)) {
        classes.push({ name: cls, line: ln, file: filePath, dynamic: false });
      }
    }
  }

  // -- Pattern 3: class-building array (['cls', cond && 'cls'].join) --------

  const p3 = /(?:const|let)\s+class(?:es|Name|List)\s*=\s*\[([\s\S]*?)\](?:\s*\.filter)?/g;
  while ((m = p3.exec(content)) !== null) {
    const arr = m[1];
    const ln = lineAt(content, m.index);

    // String literals (skip comparison operands like === 'value')
    const sr = /(['"])([a-zA-Z][a-zA-Z0-9_-]*(?:\s+[a-zA-Z][a-zA-Z0-9_-]*)*)\1(?!\s*:)/g;
    let sm;
    while ((sm = sr.exec(arr)) !== null) {
      const before = arr.substring(0, sm.index).trimEnd();
      if (/[=!]=?=?\s*$/.test(before)) continue;
      const after = arr.substring(sm.index + sm[0].length).trimStart();
      if (/^[=!]==?/.test(after)) continue;

      for (const cls of sm[2].split(/\s+/).filter(Boolean)) {
        classes.push({ name: cls, line: ln, file: filePath, dynamic: false });
      }
    }

    // Template literal static parts
    const tr = /`([^`]+)`/g;
    let tm;
    while ((tm = tr.exec(arr)) !== null) {
      const parts = tm[1].replace(/\$\{[^}]*\}/g, "  ").split(/\s+/).filter(Boolean);
      for (const cls of parts) {
        if (/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(cls)) {
          classes.push({ name: cls, line: ln, file: filePath, dynamic: true });
        }
      }
    }
  }

  return classes;
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

/** 1. Same normalised selector in more than one file → WARNING */
function checkDuplicateSelectors(allSelectors) {
  // Map: selector → Map<file, firstLine>
  const map = new Map();

  for (const { selector, file, line } of allSelectors) {
    // Only track selectors that contain at least one class (.class-name)
    if (!/\.[a-zA-Z]/.test(selector)) continue;

    if (!map.has(selector)) map.set(selector, new Map());
    const fm = map.get(selector);
    if (!fm.has(file)) fm.set(file, line);
  }

  const dupes = [];
  for (const [selector, fm] of map) {
    if (fm.size > 1) {
      const locs = [...fm.entries()].map(([f, l]) => ({ file: f, line: l }));
      dupes.push({ selector, locations: locs });
    }
  }
  dupes.sort((a, b) => a.selector.localeCompare(b.selector));
  return dupes;
}

/** 2. var(--name) where --name is not in the allowed definition set → ERROR */
function checkUndefinedVars(usages, allowedDefs) {
  const issues = [];
  const seen = new Set();
  for (const u of usages) {
    if (allowedDefs.has(u.name)) continue;
    const key = `${u.name}|${u.file}|${u.line}`;
    if (seen.has(key)) continue;
    seen.add(key);
    issues.push(u);
  }
  return issues;
}

/** 3. rawColors is already filtered during extraction – just return it. */

/** 4. Classes used in TSX not present in any CSS selector → ERROR */
function checkUndefinedClasses(tsxClasses, definedClasses) {
  const issues = [];
  const seen = new Set();
  for (const u of tsxClasses) {
    if (u.dynamic) continue;
    if (isIgnoredClass(u.name)) continue;
    if (definedClasses.has(u.name)) continue;
    const key = `${u.name}|${u.file}`;
    if (seen.has(key)) continue;
    seen.add(key);
    issues.push(u);
  }
  issues.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  return issues;
}

// ---------------------------------------------------------------------------
// Reporter
// ---------------------------------------------------------------------------

function report(dupes, undefVars, rawColors, undefClasses) {
  let errors = 0;
  let warnings = 0;

  console.log(`\n${BOLD}Dusk & Dawn CSS Linter${RESET}`);
  console.log("=".repeat(50));

  // 1. Duplicate selectors (WARNING) ----------------------------------------
  if (dupes.length) {
    console.log(
      `\n${YELLOW}${BOLD}DUPLICATE CSS SELECTORS${RESET} ${DIM}(same selector in multiple files)${RESET} ${YELLOW}[WARNING]${RESET}` +
      `\n all classes are global and should only be defined once, consolidate or rename to a unique name and update the references accordingly`
    );
    
    for (const { selector, locations } of dupes) {
      console.log(`  ${CYAN}${selector}${RESET}`);
      for (const loc of locations) {
        console.log(`    ${DIM}-${RESET} ${rel(loc.file)}:${loc.line}`);
      }
    }
    warnings += dupes.length;
  }

  // 2. Undefined CSS variables (ERROR) --------------------------------------
  if (undefVars.length) {
    console.log(`\n${RED}${BOLD}UNDEFINED CSS VARIABLES${RESET} ${DIM}(not defined in index.css or themes.css)${RESET} ${RED}[ERROR]${RESET}`
      + `\n all CSS variables should be defined in index.css and themes.css, add the definition or replace the variable with an appropriate value`
    );
    // Group by variable name
    const byName = new Map();
    for (const v of undefVars) {
      if (!byName.has(v.name)) byName.set(v.name, []);
      byName.get(v.name).push(v);
    }
    for (const [name, usages] of byName) {
      console.log(`  ${RED}${name}${RESET}`);
      for (const u of usages) {
        console.log(`    ${DIM}-${RESET} ${rel(u.file)}:${u.line}`);
      }
    }
    errors += undefVars.length;
  }

  // 3. Raw colours (WARNING) ------------------------------------------------
  if (rawColors.length) {
    console.log(
      `\n${YELLOW}${BOLD}RAW COLOR VALUES${RESET} ${DIM}(use CSS variables instead)${RESET} ${YELLOW}[WARNING]${RESET}` +
       `\n all colors should be defined as CSS variables, replace the color with an appropriate value do not define new variables.s`
    );
    const byFile = new Map();
    for (const c of rawColors) {
      const k = rel(c.file);
      if (!byFile.has(k)) byFile.set(k, []);
      byFile.get(k).push(c);
    }
    for (const [file, items] of byFile) {
      console.log(`  ${CYAN}${file}${RESET}`);
      for (const c of items) {
        console.log(`    ${DIM}-${RESET} ${YELLOW}${c.value}${RESET} ${DIM}(line ${c.line})${RESET}`);
      }
    }
    warnings += rawColors.length;
  }

  // 4. Undefined CSS classes (ERROR) ----------------------------------------
  if (undefClasses.length) {
    console.log(
      `\n${RED}${BOLD}UNDEFINED CSS CLASSES${RESET} ${DIM}(used in TSX but not defined in any CSS)${RESET} ${RED}[ERROR]${RESET}`
        + `\n all CSS classes used in TSX should be defined in CSS, add the definition or remove the class from the TSX file` +
        `\n dynamic classes cannot be reliably checked, so ensure they are working -- there are likely styles available to use so before adding a new style check if it's not already a handled behaviour.`
    );
    const byFile = new Map();
    for (const c of undefClasses) {
      const k = rel(c.file);
      if (!byFile.has(k)) byFile.set(k, []);
      byFile.get(k).push(c);
    }
    for (const [file, items] of byFile) {
      console.log(`  ${CYAN}${file}${RESET}`);
      for (const c of items) {
        console.log(`    ${DIM}-${RESET} ${RED}.${c.name}${RESET} ${DIM}(line ${c.line})${RESET}`);
      }
    }
    errors += undefClasses.length;
  }

  // Summary -----------------------------------------------------------------
  console.log(`\n${"=".repeat(50)}`);
  if (errors === 0 && warnings === 0) {
    console.log(`${GREEN}${BOLD}All checks passed!${RESET}\n`);
  } else {
    const parts = [];
    if (errors > 0) parts.push(`${RED}${errors} error${errors === 1 ? "" : "s"}${RESET}`);
    if (warnings > 0) parts.push(`${YELLOW}${warnings} warning${warnings === 1 ? "" : "s"}${RESET}`);
    console.log(`${BOLD}Summary:${RESET} ${parts.join(", ")}\n`);
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log(`${DIM}Scanning files...${RESET}`);

  const cssFiles = findFiles(path.join(SRC, "styles"), [".css"]);
  const tsxFiles = findFiles(SRC, [".tsx"]);

  console.log(`${DIM}Found ${cssFiles.length} CSS files and ${tsxFiles.length} TSX files${RESET}`);

  // ---- Analyse all CSS files ----------------------------------------------

  const allSelectors = [];
  const allDefinedClasses = new Set();
  const allowedVarDefs = new Set();
  const allVarUsages = [];
  const allRawColors = [];

  for (const file of cssFiles) {
    const a = analyseCSS(file);

    allSelectors.push(...a.selectors);
    for (const cls of a.classNames) allDefinedClasses.add(cls);
    allVarUsages.push(...a.varUsages);
    allRawColors.push(...a.rawColors);

    // Collect variable definitions from allowed files
    if (VAR_DEFINITION_FILES.has(path.resolve(file))) {
      for (const v of a.varDefs) allowedVarDefs.add(v);
    }
  }

  // ---- Analyse all TSX files ----------------------------------------------

  const allTSXClasses = [];
  for (const file of tsxFiles) {
    allTSXClasses.push(...analyseTSX(file));
  }

  // ---- Run checks ---------------------------------------------------------

  const dupes = checkDuplicateSelectors(allSelectors);
  const undefVars = checkUndefinedVars(allVarUsages, allowedVarDefs);
  const undefClasses = checkUndefinedClasses(allTSXClasses, allDefinedClasses);

  // ---- Report & exit ------------------------------------------------------

  const errorCount = report(dupes, undefVars, allRawColors, undefClasses);
  process.exit(errorCount > 0 ? 1 : 0);
}

main();
