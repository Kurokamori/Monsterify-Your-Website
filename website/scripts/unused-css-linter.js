#!/usr/bin/env node

/**
 * Unused CSS Class Linter for Dusk & Dawn Website
 *
 * Finds CSS classes defined in styles/ that are never referenced in any .ts/.tsx file.
 * Handles:
 *   - BEM selectors (.button.error → checks both "button" and "error")
 *   - Compound/nested selectors (.card--selected, .tab-container__tab--active)
 *   - Dynamic/generated classes (type-{value}, attribute-{value})
 *   - Conditionally applied classes ('active', 'selected', etc.)
 *   - Template literal class patterns (`badge--${variant}`)
 *
 * Excludes:
 *   - utilities.css (kept regardless of usage)
 *   - index.css, themes.css, global.css (variable/import files, not class-based)
 *
 * All unused CSS classes are reported as [WARNING].
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
const STYLES_DIR = path.join(SRC, "styles");

/** Files to skip entirely (utility classes kept regardless, variable/import files). */
const EXCLUDED_FILES = new Set(
  [
    path.join(STYLES_DIR, "common", "utilities.css"),
    path.join(STYLES_DIR, "index.css"),
    path.join(STYLES_DIR, "themes.css"),
    path.join(STYLES_DIR, "global.css"),
  ].map((f) => path.resolve(f))
);

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

const color = process.stdout.isTTY !== false;
const YELLOW = color ? "\x1b[33m" : "";
const GREEN = color ? "\x1b[32m" : "";
const CYAN = color ? "\x1b[36m" : "";
const DIM = color ? "\x1b[2m" : "";
const BOLD = color ? "\x1b[1m" : "";
const RESET = color ? "\x1b[0m" : "";

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

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

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

function stripCSSComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
}

// ---------------------------------------------------------------------------
// CSS Analysis – extract all class names defined in CSS files
// ---------------------------------------------------------------------------

/**
 * Parse a CSS file and return a Map of className → [{file, line, selector}].
 * Each class that appears in any selector is recorded.
 */
function extractCSSClasses(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const css = stripCSSComments(raw);

  /** @type {Map<string, {file: string, line: number, selector: string}>} */
  const classes = new Map();

  let depth = 0;
  let buf = "";
  let bufStartLine = 1;
  let curLine = 1;
  const atStack = [];

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
        // Genuine style rule - extract class names from selector
        const parts = sel
          .split(",")
          .map((s) => s.replace(/\s+/g, " ").trim())
          .filter(Boolean);

        for (const part of parts) {
          const rx = /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g;
          let m;
          while ((m = rx.exec(part)) !== null) {
            const cls = m[1];
            if (!classes.has(cls)) {
              classes.set(cls, { file: filePath, line: bufStartLine, selector: part });
            }
          }
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

    if (ch === ";" && depth === 0) {
      buf = "";
      bufStartLine = curLine;
      continue;
    }

    buf += ch;
  }

  return classes;
}

// ---------------------------------------------------------------------------
// TS/TSX Analysis – extract all class name references
// ---------------------------------------------------------------------------

/**
 * Extract all CSS class names referenced in a TS/TSX file.
 * Returns a Set of class name strings.
 */
function extractTSXClassReferences(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const classes = new Set();

  // ---- Pattern 1: className="static classes" --------------------------------
  const p1 = /className="([^"]+)"/g;
  let m;
  while ((m = p1.exec(content)) !== null) {
    for (const cls of m[1].split(/\s+/).filter(Boolean)) {
      if (cls.includes("$") || cls.includes("{")) continue;
      classes.add(cls);
    }
  }

  // ---- Pattern 2: className={`template ${dyn} static`} ---------------------
  const p2 = /className=\{/g;
  while ((m = p2.exec(content)) !== null) {
    const start = m.index + m[0].length;
    let d = 1;
    let i = start;

    while (i < content.length && d > 0) {
      const c = content[i];
      if (c === "{") { d++; i++; continue; }
      if (c === "}") { d--; if (d === 0) break; i++; continue; }

      if (c === '"' || c === "'") {
        const q = c;
        i++;
        while (i < content.length && content[i] !== q) {
          if (content[i] === "\\") i++;
          i++;
        }
        i++;
        continue;
      }

      if (c === "`") {
        i++;
        while (i < content.length && content[i] !== "`") {
          if (content[i] === "\\") { i += 2; continue; }
          if (content[i] === "$" && i + 1 < content.length && content[i + 1] === "{") {
            i += 2;
            let td = 1;
            while (i < content.length && td > 0) {
              if (content[i] === "{") td++;
              if (content[i] === "}") td--;
              if (td > 0) i++;
            }
            i++;
            continue;
          }
          i++;
        }
        i++;
        continue;
      }

      i++;
    }

    if (d !== 0) continue;

    const expr = content.substring(start, i);

    // If it's just a variable reference, skip
    if (/^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(expr.trim())) continue;

    // Extract static parts from template literals
    const tmplRx = /`([^`]*)`/gs;
    let tm;
    while ((tm = tmplRx.exec(expr)) !== null) {
      const staticParts = tm[1].replace(/\$\{[^}]*\}/g, "  ").split(/\s+/).filter(Boolean);
      for (const cls of staticParts) {
        if (/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(cls)) {
          classes.add(cls);
        }
      }
    }

    // Extract plain string literals (outside templates)
    const exprNoTemplates = expr.replace(/`[^`]*`/gs, " ");
    const strRx = /(['"])([a-zA-Z][a-zA-Z0-9_ -]*?)\1/g;
    let sm;
    while ((sm = strRx.exec(exprNoTemplates)) !== null) {
      const before = exprNoTemplates.substring(0, sm.index).trimEnd();
      if (/[=!]=?=?\s*$/.test(before)) continue;
      const after = exprNoTemplates.substring(sm.index + sm[0].length).trimStart();
      if (/^[=!]==?/.test(after)) continue;

      for (const cls of sm[2].split(/\s+/).filter(Boolean)) {
        classes.add(cls);
      }
    }
  }

  // ---- Pattern 3: Class-building arrays ------------------------------------
  const p3 = /(?:const|let)\s+\w*[Cc]lass\w*\s*=\s*\[([\s\S]*?)\](?:\s*\.filter)?/g;
  while ((m = p3.exec(content)) !== null) {
    const arr = m[1];

    // String literals
    const sr = /(['"])([a-zA-Z][a-zA-Z0-9_-]*(?:\s+[a-zA-Z][a-zA-Z0-9_-]*)*)\1/g;
    let sm;
    while ((sm = sr.exec(arr)) !== null) {
      const before = arr.substring(0, sm.index).trimEnd();
      if (/[=!]=?=?\s*$/.test(before)) continue;
      const after = arr.substring(sm.index + sm[0].length).trimStart();
      if (/^[=!]==?/.test(after)) continue;

      for (const cls of sm[2].split(/\s+/).filter(Boolean)) {
        classes.add(cls);
      }
    }

    // Template literal static parts
    const tr = /`([^`]+)`/g;
    let tm;
    while ((tm = tr.exec(arr)) !== null) {
      const parts = tm[1].replace(/\$\{[^}]*\}/g, "  ").split(/\s+/).filter(Boolean);
      for (const cls of parts) {
        if (/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(cls)) {
          classes.add(cls);
        }
      }
    }
  }

  // ---- Pattern 4: String/object keys that map to class names ---------------
  // e.g. const sizeClasses = { small: 'max-w-sm', medium: 'max-w-md' }
  const objRx = /:\s*(['"])([a-zA-Z][a-zA-Z0-9_ -]*?)\1/g;
  while ((m = objRx.exec(content)) !== null) {
    // Only pick up values that look like CSS class names (with dashes or underscores)
    for (const cls of m[2].split(/\s+/).filter(Boolean)) {
      if (/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(cls) && (cls.includes("-") || cls.includes("_"))) {
        classes.add(cls);
      }
    }
  }

  // ---- Pattern 5: bare string conditionals (ternary) -----------------------
  // e.g. isActive ? 'active' : '' or  condition && 'selected'
  const ternaryRx = /[?&|]\s*['"]([a-zA-Z][a-zA-Z0-9_-]*)['"](?:\s*:|\s*[,)\]])/g;
  while ((m = ternaryRx.exec(content)) !== null) {
    classes.add(m[1]);
  }

  // ---- Pattern 6: Raw string class references in general code ---------------
  // Picks up patterns like 'card--selected' or 'tab-container__tab--active'
  // Handles BEM double-dash: stat-color--legendary, boss-manager__status--error
  const dashClassRx = /['"]([a-zA-Z][a-zA-Z0-9]*(?:[-_]+[a-zA-Z0-9]+)+)['"]/g;
  while ((m = dashClassRx.exec(content)) !== null) {
    const val = m[1];
    if (val.includes("__") || val.includes("--") || val.includes("-")) {
      classes.add(val);
    }
  }

  // ---- Pattern 7: Strings with leading/trailing spaces containing class names
  // e.g. return ' stat-legendary', ternary ' appraisal-editor__type-toggle--active'
  // Catches both return values and inline ternary/conditional results
  const spaceClassRx = /['"]\s+([a-zA-Z][a-zA-Z0-9_-]*(?:\s+[a-zA-Z][a-zA-Z0-9_-]*)*)\s*['"]/g;
  while ((m = spaceClassRx.exec(content)) !== null) {
    for (const cls of m[1].split(/\s+/).filter(Boolean)) {
      if (/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(cls)) {
        classes.add(cls);
      }
    }
  }

  return classes;
}

// ---------------------------------------------------------------------------
// Dynamic pattern detection – identify CSS classes generated from templates
// ---------------------------------------------------------------------------

/**
 * Detect dynamic class prefixes used in TSX template literals.
 * e.g. `type-${value.toLowerCase()}` → prefix "type-"
 * e.g. `badge--${variant}` → prefix "badge--"
 * e.g. `card--${size}` → prefix "card--"
 * e.g. `attribute-${attr}` → prefix "attribute-"
 * e.g. `alm__badge--${val}` → prefix "alm__badge--"
 *
 * Returns a Set of prefix strings.
 */
function extractDynamicPrefixes(tsFiles) {
  const prefixes = new Set();

  for (const filePath of tsFiles) {
    const content = fs.readFileSync(filePath, "utf-8");

    // Match dynamic prefixes ANYWHERE inside template literals:
    // e.g. `some-block some-block--${var}` captures "some-block--"
    // e.g. `badge type-${value}` captures "type-"
    // e.g. `category-${cat.toLowerCase()}` captures "category-"
    const rx = /([a-zA-Z][a-zA-Z0-9_-]*(?:--|-))\$\{[^}]+\}/g;
    let m;
    while ((m = rx.exec(content)) !== null) {
      prefixes.add(m[1]);
    }

    // Also match className patterns with concatenation:
    // 'prefix-' + variable  or  "prefix-" + variable
    const concatRx = /(['"])([a-zA-Z][a-zA-Z0-9_-]*(?:--|-))\1\s*\+/g;
    while ((m = concatRx.exec(content)) !== null) {
      prefixes.add(m[2]);
    }
  }

  return prefixes;
}

/**
 * Also detect dynamic suffixes used in TSX.
 * e.g. `${prefix}--active` → suffix "--active"
 * Returns a Set of suffix strings (the class part after the dynamic portion).
 */
function extractDynamicSuffixes(tsFiles) {
  const suffixes = new Set();

  for (const filePath of tsFiles) {
    const content = fs.readFileSync(filePath, "utf-8");

    // Match: `${expr}suffix` where suffix contains a class-name-like token
    const rx = /\$\{[^}]+\}([a-zA-Z0-9_-]+)`/g;
    let m;
    while ((m = rx.exec(content)) !== null) {
      suffixes.add(m[1]);
    }
  }

  return suffixes;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log(`\n${BOLD}Dusk & Dawn Unused CSS Linter${RESET}`);
  console.log("=".repeat(50));
  console.log(`${DIM}Scanning files...${RESET}`);

  const cssFiles = findFiles(STYLES_DIR, [".css"]);
  const tsFiles = findFiles(SRC, [".ts", ".tsx"]);

  // Filter out excluded CSS files
  const lintableCSSFiles = cssFiles.filter((f) => !EXCLUDED_FILES.has(path.resolve(f)));

  console.log(
    `${DIM}Found ${cssFiles.length} CSS files (${lintableCSSFiles.length} lintable), ${tsFiles.length} TS/TSX files${RESET}`
  );

  // ---- Step 1: Extract all CSS class definitions ---------------------------

  /** @type {Map<string, {file: string, line: number, selector: string}>} */
  const allDefinedClasses = new Map();

  for (const file of lintableCSSFiles) {
    const fileClasses = extractCSSClasses(file);
    for (const [cls, info] of fileClasses) {
      // Keep first occurrence
      if (!allDefinedClasses.has(cls)) {
        allDefinedClasses.set(cls, info);
      }
    }
  }

  // ---- Step 2: Extract all class name references from TS/TSX ---------------

  const allReferencedClasses = new Set();

  for (const file of tsFiles) {
    const refs = extractTSXClassReferences(file);
    for (const cls of refs) {
      allReferencedClasses.add(cls);
    }
  }

  // ---- Step 3: Detect dynamic prefix/suffix patterns -----------------------

  const dynamicPrefixes = extractDynamicPrefixes(tsFiles);
  const dynamicSuffixes = extractDynamicSuffixes(tsFiles);

  // ---- Step 4: Check each defined CSS class for usage ----------------------

  const unusedClasses = [];

  for (const [cls, info] of allDefinedClasses) {
    // Direct reference
    if (allReferencedClasses.has(cls)) continue;

    // Check if this class matches a dynamic prefix pattern
    // e.g. "type-fire" matches prefix "type-", "badge--success" matches "badge--"
    let matchedDynamic = false;
    for (const prefix of dynamicPrefixes) {
      if (cls.startsWith(prefix)) {
        matchedDynamic = true;
        break;
      }
    }
    if (matchedDynamic) continue;

    // Check if this class matches a dynamic suffix pattern
    for (const suffix of dynamicSuffixes) {
      if (cls.endsWith(suffix)) {
        matchedDynamic = true;
        break;
      }
    }
    if (matchedDynamic) continue;

    // Check if any referenced class is a substring match for BEM parent
    // e.g. if "card" is referenced and we have "card" defined — that's covered
    // But for compound selectors, "button.error": "button" and "error" are separate classes
    // Each must be independently referenced.

    // Check if this is a pseudo-class or pseudo-element artifact - skip
    if (cls.startsWith("-")) continue;

    unusedClasses.push({ name: cls, ...info });
  }

  // Sort by file then line
  unusedClasses.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

  // ---- Step 5: Report results ----------------------------------------------

  if (unusedClasses.length === 0) {
    console.log(`\n${GREEN}${BOLD}No unused CSS classes found!${RESET}\n`);
    return;
  }

  console.log(
    `\n${YELLOW}${BOLD}UNUSED CSS CLASSES${RESET} ${DIM}(defined in CSS but not referenced in any TS/TSX)${RESET} ${YELLOW}[WARNING]${RESET}` +
      `\n  Consider removing these classes or confirming they are used dynamically.` +
      `\n  Classes from utilities.css are excluded from this check.\n`
  );

  // Group by file
  const byFile = new Map();
  for (const entry of unusedClasses) {
    const k = rel(entry.file);
    if (!byFile.has(k)) byFile.set(k, []);
    byFile.get(k).push(entry);
  }

  for (const [file, items] of byFile) {
    console.log(`  ${CYAN}${file}${RESET}`);
    for (const item of items) {
      console.log(
        `    ${DIM}-${RESET} ${YELLOW}.${item.name}${RESET} ${DIM}(line ${item.line}, selector: ${item.selector})${RESET}`
      );
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(
    `${BOLD}Summary:${RESET} ${YELLOW}${unusedClasses.length} unused class${unusedClasses.length === 1 ? "" : "es"}${RESET} across ${byFile.size} file${byFile.size === 1 ? "" : "s"}\n`
  );
}

main();
