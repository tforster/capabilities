import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const HARNESS_CONFIG = {
  maxChangedFiles: 20,
  maxAddedLines: 3000,
  modernCodeExtensions: [".js", ".mjs", ".cjs"],
  cloudFormationExtensions: [".yml", ".yaml", ".json"],
  dependencyFiles: ["package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock"],
  generatedSegments: ["/build/", "/dist/", "/coverage/", "/.next/"],
  vendorSegments: ["/vendor/", "/node_modules/", "/wordpress_plugins/", "/wordpress_themes/"],
  legacyRoots: ["/legacy/", "/php/", "/xhtml/"],
  maxNetRemovedCommentLines: 20,
  xhtmlMigrationAllowlist: [],
  cloudFrontIacAllowlist: [],
  legacyPhpAllowlist: [],
};

const COMMON_JS_PATTERNS = [
  {
    label: "CommonJS require()",
    pattern: /\brequire\s*\(/,
    hint: "replace with an ESM import statement",
  },
  {
    label: "module.exports",
    pattern: /\bmodule\.exports\b/,
    hint: "replace with ESM export or export default",
  },
  {
    label: "exports.* assignment",
    pattern: /\bexports\.[A-Za-z0-9_$]+\b/,
    hint: "replace with a named ESM export declaration",
  },
];

const JQUERY_PATTERNS = [
  {
    label: "jQuery global",
    pattern: /\bjQuery\b/,
    hint: "replace with native DOM APIs, fetch, or querySelectorAll",
  },
  {
    label: "window.jQuery",
    pattern: /\bwindow\.jQuery\b/,
    hint: "replace with native DOM APIs, fetch, or querySelectorAll",
  },
  {
    label: "jQuery-style $() call",
    pattern: /(^|[^A-Za-z0-9_$])\$\s*\(/m,
    hint: "replace with native DOM APIs, fetch, or querySelectorAll",
  },
];

const XHTML_STRUCTURAL_TAGS = /<\s*(nav|section|article|main|header|footer|aside)\b/i;

const XHTML_MARKERS = [
  /application\/xhtml\+xml/i,
  /<!DOCTYPE\s+html\s+PUBLIC\s+"-\/\/W3C\/\/DTD\s+XHTML/i,
  /xmlns\s*=\s*"http:\/\/www\.w3\.org\/1999\/xhtml"/i,
];

const PHP_ALLOW_PATTERNS = [
  /^\s*(include|include_once|require|require_once)\b/,
  /^\s*header\s*\(/,
  /^\s*http_response_code\s*\(/,
  /^\s*(echo|print)\b/,
  /^\s*return\b/,
  /^\s*exit\b/,
  /^\s*\$[A-Za-z_][A-Za-z0-9_]*\s*=\s*\$_(GET|POST|REQUEST|SERVER|COOKIE)\b/,
  /Location\s*:/,
  /template|view|render/i,
];

const PHP_SUSPICIOUS_PATTERNS = [
  { label: "new declaration", pattern: /^\s*(function|class|trait|interface)\b/, score: 3 },
  {
    label: "control flow",
    pattern: /^\s*(if|elseif|else\s+if|switch|case|for(each)?|while|do|try|catch)\b/,
    score: 1,
  },
  {
    label: "database or remote call",
    pattern:
      /\b(PDO|mysqli?|mysql_query|pg_query|db_query|wp_remote_(get|post)|curl_|file_get_contents)\b/i,
    score: 3,
  },
  { label: "service construction", pattern: /\bnew\s+[A-Z][A-Za-z0-9_]*\b/, score: 2 },
  {
    label: "query or mutation literal",
    pattern: /\b(SELECT|INSERT|UPDATE|DELETE)\b/i,
    score: 2,
  },
];

const CLOUDFORMATION_BOUNDARY_PATTERNS = [
  /^\s*Origins\s*:/,
  /^\s*CacheBehaviors\s*:/,
  /^\s*OrderedCacheBehaviors\s*:/,
  /^\s*LambdaFunctionAssociations\s*:/,
  /^\s*FunctionAssociations\s*:/,
  /^\s*OriginPath\s*:/,
  /^\s*TargetOriginId\s*:/,
  /^\s*PathPattern\s*:/,
];

const COMMENT_LINE_PATTERN = /^\s*(\/\/|\/\*|\*(?!\/)|#(?!\s*!)|<!--)/;

const INTEROP_TRIGGER_PATTERNS = [/\bjson_decode\s*\(/, /\bJSON\.parse\s*\(/];

const INTEROP_KEY_PATTERN = /\[['"]([^'"]+)['"]\]/g;

/**
 * Runs a shell command and returns its UTF-8 output.
 *
 * @param {string} command Shell command to execute.
 * @param {boolean} [allowFailure=false] Return an empty string on command failure.
 * @returns {string} Command output.
 */
function runCommand(command, allowFailure = false) {
  try {
    return execSync(command, { encoding: "utf8" });
  } catch (error) {
    if (allowFailure) {
      return "";
    }

    throw error;
  }
}

/**
 * Normalizes a repository-relative path for cross-platform comparisons.
 *
 * @param {string} filePath Repository-relative file path.
 * @returns {string} Normalized path using forward slashes.
 */
function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/");
}

/**
 * Tests whether a file path contains any configured path segment.
 *
 * @param {string} filePath Repository-relative file path.
 * @param {string[]} segments Path segments to match.
 * @returns {boolean} True when a segment matches.
 */
function hasSegment(filePath, segments) {
  return segments.some((segment) => normalizePath(filePath).includes(segment));
}

/**
 * Reads a file if it exists in the working tree.
 *
 * @param {string} filePath Repository-relative file path.
 * @returns {string|null} File contents or null when the file is absent.
 */
function readWorkingTreeFile(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  return readFileSync(filePath, "utf8");
}

/**
 * Reads a file from HEAD for change comparison.
 *
 * @param {string} filePath Repository-relative file path.
 * @returns {string|null} File contents from HEAD or null if the file is new.
 */
function readHeadFile(filePath) {
  const escapedPath = filePath.replaceAll('"', '\\"');
  const output = runCommand(`git show HEAD:"${escapedPath}"`, true);
  return output === "" ? null : output;
}

/**
 * Creates a diff record for a changed file.
 *
 * @param {string} filePath Repository-relative file path.
 * @returns {object} Diff record.
 */
function createRecord(filePath) {
  return {
    filePath,
    normalizedPath: normalizePath(filePath),
    extension: getExtension(filePath),
    addedLines: [],
    removedLines: [],
    currentContent: readWorkingTreeFile(filePath),
  };
}

/**
 * Gets a lower-case file extension.
 *
 * @param {string} filePath Repository-relative file path.
 * @returns {string} Lower-case file extension.
 */
function getExtension(filePath) {
  const name = filePath.split("/").pop() ?? filePath;
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index).toLowerCase();
}

/**
 * Builds diff records from the working tree relative to HEAD.
 *
 * @returns {Map<string, object>} Diff records keyed by repository-relative path.
 */
function getDiffRecords() {
  const records = new Map();
  const changedFiles = runCommand("git diff HEAD --name-only --no-color --no-ext-diff", true)
    .split("\n")
    .map((filePath) => filePath.trim())
    .filter(Boolean);

  for (const filePath of changedFiles) {
    records.set(filePath, createRecord(filePath));
  }

  const statusOutput = runCommand("git status --porcelain", true)
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean);

  for (const line of statusOutput) {
    if (!line.startsWith("?? ")) {
      continue;
    }

    const filePath = line.slice(3);
    const record = createRecord(filePath);
    record.addedLines = splitLines(record.currentContent ?? "");
    records.set(filePath, record);
  }

  const diffText = runCommand("git diff HEAD --unified=0 --no-color --no-ext-diff", true);
  let currentRecord = null;

  for (const line of diffText.split("\n")) {
    if (line.startsWith("diff --git ")) {
      const parts = line.split(" ");
      const nextPath = parts[3]?.slice(2);
      currentRecord = nextPath ? (records.get(nextPath) ?? null) : null;
      continue;
    }

    if (
      !currentRecord ||
      line.startsWith("+++") ||
      line.startsWith("---") ||
      line.startsWith("@@")
    ) {
      continue;
    }

    if (line.startsWith("+")) {
      currentRecord.addedLines.push(line.slice(1));
    } else if (line.startsWith("-")) {
      currentRecord.removedLines.push(line.slice(1));
    }
  }

  return records;
}

/**
 * Splits text into lines while preserving empty lines.
 *
 * @param {string} text Text to split.
 * @returns {string[]} Split lines.
 */
function splitLines(text) {
  return text.replace(/\r/g, "").split("\n");
}

/**
 * Removes string literals from a JavaScript line before heuristic scanning.
 *
 * @param {string} line JavaScript source line.
 * @returns {string} Line without string literals.
 */
function stripJavaScriptStrings(line) {
  return line.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, "");
}

/**
 * Determines whether a JavaScript line is part of the harness rule metadata.
 *
 * @param {string} line JavaScript source line.
 * @returns {boolean} True when the line should be skipped for pattern scanning.
 */
function isRuleDefinitionLine(line) {
  return /\b(label|pattern)\s*:/.test(line);
}

/**
 * Determines whether a path should be treated as vendored or third-party.
 *
 * @param {object} record Diff record.
 * @returns {boolean} True when the file is third-party.
 */
function isVendorPath(record) {
  return hasSegment(record.normalizedPath, HARNESS_CONFIG.vendorSegments);
}

/**
 * Determines whether a path should be treated as generated output.
 *
 * @param {object} record Diff record.
 * @returns {boolean} True when the file is generated output.
 */
function isGeneratedPath(record) {
  return hasSegment(record.normalizedPath, HARNESS_CONFIG.generatedSegments);
}

/**
 * Determines whether a file is a dependency manifest or lockfile.
 *
 * @param {object} record Diff record.
 * @returns {boolean} True when the file is a dependency control file.
 */
function isDependencyFile(record) {
  return HARNESS_CONFIG.dependencyFiles.some((name) => record.normalizedPath.endsWith(name));
}

/**
 * Determines whether a file should be treated as modern JavaScript.
 *
 * @param {object} record Diff record.
 * @returns {boolean} True when the file is modern JavaScript.
 */
function isModernJavaScript(record) {
  if (!HARNESS_CONFIG.modernCodeExtensions.includes(record.extension)) {
    return false;
  }

  return (
    !isVendorPath(record) &&
    !isGeneratedPath(record) &&
    !hasSegment(record.normalizedPath, HARNESS_CONFIG.legacyRoots)
  );
}

/**
 * Determines whether a file should be treated as first-party legacy PHP.
 *
 * @param {object} record Diff record.
 * @returns {boolean} True when the file is eligible for PHP boundary checks.
 */
function isLegacyPhp(record) {
  if (![".php", ".phtml"].includes(record.extension)) {
    return false;
  }

  if (isVendorPath(record) || isGeneratedPath(record)) {
    return false;
  }

  return true;
}

/**
 * Determines whether a file should be treated as CloudFormation or IaC.
 *
 * @param {object} record Diff record.
 * @returns {boolean} True when CloudFormation checks should run.
 */
function isCloudFormation(record) {
  if (!HARNESS_CONFIG.cloudFormationExtensions.includes(record.extension)) {
    return false;
  }

  if (record.normalizedPath.includes("/cloudformation/")) {
    return true;
  }

  return /AWS::[A-Za-z0-9:]+/.test(record.currentContent ?? "");
}

/**
 * Determines whether a file is an XHTML document.
 *
 * @param {object} record Diff record.
 * @returns {boolean} True when XHTML-specific checks should run.
 */
function isXhtmlDocument(record) {
  if (record.extension === ".xhtml") {
    return true;
  }

  const content = [record.currentContent ?? "", ...record.addedLines].join("\n");
  return XHTML_MARKERS.some((marker) => marker.test(content));
}

/**
 * Creates a failure object for grouped reporting.
 *
 * @param {string} category Failure category.
 * @param {string} filePath Repository-relative file path.
 * @param {string} message Failure message.
 * @returns {object} Failure object.
 */
function createFailure(category, filePath, message) {
  return { category, filePath, message };
}

/**
 * Applies surgical-diff checks across all changed files.
 *
 * @param {Map<string, object>} records Diff records.
 * @returns {object[]} Surgical-diff failures.
 */
function checkSurgicalDiscipline(records) {
  const failures = [];
  const changed = [...records.values()];
  const totalAddedLines = changed.reduce((sum, record) => sum + record.addedLines.length, 0);

  if (changed.length > HARNESS_CONFIG.maxChangedFiles) {
    failures.push(
      createFailure(
        "Surgical",
        "git diff",
        `changed ${changed.length} files, exceeding the surgical limit of ${HARNESS_CONFIG.maxChangedFiles}; consolidate changes into a more focused diff or split into multiple commits`,
      ),
    );
  }

  if (totalAddedLines > HARNESS_CONFIG.maxAddedLines) {
    failures.push(
      createFailure(
        "Surgical",
        "git diff",
        `added ${totalAddedLines} lines, exceeding the surgical limit of ${HARNESS_CONFIG.maxAddedLines}; break the change into smaller, more focused increments`,
      ),
    );
  }

  for (const record of changed) {
    if (isVendorPath(record)) {
      failures.push(
        createFailure(
          "Surgical",
          record.filePath,
          "vendor or third-party code was modified; revert these changes and implement your logic in the appropriate workspace",
        ),
      );
    }

    if (isGeneratedPath(record)) {
      failures.push(
        createFailure(
          "Surgical",
          record.filePath,
          "generated output was modified directly; re-run the relevant build script instead of editing generated output",
        ),
      );
    }

    const netRemovedComments =
      record.removedLines.filter((line) => COMMENT_LINE_PATTERN.test(line)).length -
      record.addedLines.filter((line) => COMMENT_LINE_PATTERN.test(line)).length;

    if (netRemovedComments >= HARNESS_CONFIG.maxNetRemovedCommentLines) {
      failures.push(
        createFailure(
          "Surgical",
          record.filePath,
          `${netRemovedComments} comment lines were net-removed; comments document intent and must not be silently deleted — restore them or add an equivalent replacement`,
        ),
      );
    }
  }

  return failures;
}

/**
 * Applies dependency-lockdown checks to changed manifests.
 *
 * @param {Map<string, object>} records Diff records.
 * @returns {object[]} Dependency failures.
 */
function checkDependencyLockdown(records) {
  const failures = [];

  for (const record of records.values()) {
    if (!isDependencyFile(record)) {
      continue;
    }

    if (!record.normalizedPath.endsWith("package.json")) {
      failures.push(
        createFailure(
          "Dependency",
          record.filePath,
          "dependency lockfiles changed in a locked-down harness; do not commit lockfiles manually — run the package manager to regenerate them when required",
        ),
      );
      continue;
    }

    const currentContent = record.currentContent;
    const previousContent = readHeadFile(record.filePath);

    if (!currentContent || !previousContent) {
      failures.push(
        createFailure(
          "Dependency",
          record.filePath,
          "package.json was added or recreated; verify the file follows the established workspace manifest structure",
        ),
      );
      continue;
    }

    const currentManifest = JSON.parse(currentContent);
    const previousManifest = JSON.parse(previousContent);
    const sections = [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ];

    for (const section of sections) {
      if (
        JSON.stringify(currentManifest[section] ?? {}) !==
        JSON.stringify(previousManifest[section] ?? {})
      ) {
        failures.push(
          createFailure(
            "Dependency",
            record.filePath,
            `${section} changed in package.json; do not add or remove dependencies without an explicit request — restore the original and request the change explicitly`,
          ),
        );
      }
    }
  }

  return failures;
}

/**
 * Applies modern JavaScript checks to changed files.
 *
 * @param {Map<string, object>} records Diff records.
 * @returns {object[]} Modern JavaScript failures.
 */
function checkModernJavaScript(records) {
  const failures = [];

  for (const record of records.values()) {
    if (!isModernJavaScript(record)) {
      continue;
    }

    for (const line of record.addedLines) {
      if (isRuleDefinitionLine(line)) {
        continue;
      }

      const sanitizedLine = stripJavaScriptStrings(line);

      for (const rule of COMMON_JS_PATTERNS) {
        if (rule.pattern.test(sanitizedLine)) {
          failures.push(
            createFailure(
              "Modern ESM",
              record.filePath,
              `${rule.label} is forbidden; ${rule.hint}`,
            ),
          );
        }
      }

      for (const rule of JQUERY_PATTERNS) {
        if (rule.pattern.test(sanitizedLine)) {
          failures.push(
            createFailure(
              "Modern ESM",
              record.filePath,
              `${rule.label} contaminates modern code; ${rule.hint}`,
            ),
          );
        }
      }
    }
  }

  return failures;
}

/**
 * Applies legacy PHP seam checks to changed files.
 *
 * @param {Map<string, object>} records Diff records.
 * @returns {object[]} Legacy-boundary failures.
 */
function checkLegacyPhp(records) {
  const failures = [];

  for (const record of records.values()) {
    if (!isLegacyPhp(record)) {
      continue;
    }

    let score = 0;
    const findings = [];

    for (const line of record.addedLines) {
      if (PHP_ALLOW_PATTERNS.some((pattern) => pattern.test(line))) {
        continue;
      }

      for (const rule of PHP_SUSPICIOUS_PATTERNS) {
        if (!rule.pattern.test(line)) {
          continue;
        }

        score += rule.score;
        findings.push(rule.label);
      }
    }

    if (score >= 3 && findings.length > 0) {
      const uniqueFindings = [...new Set(findings)].join(", ");
      failures.push(
        createFailure(
          "Legacy Boundary",
          record.filePath,
          `legacy PHP gained probable business logic (${uniqueFindings}); move new logic to a Node.js workspace and expose it via a defined API contract — the PHP seam should only route or render`,
        ),
      );
    }
  }

  return failures;
}

/**
 * Applies XHTML structural-tag checks to changed documents.
 *
 * @param {Map<string, object>} records Diff records.
 * @returns {object[]} XHTML failures.
 */
function checkXhtml(records) {
  const failures = [];

  for (const record of records.values()) {
    if (!isXhtmlDocument(record)) {
      continue;
    }

    if (HARNESS_CONFIG.xhtmlMigrationAllowlist.includes(record.normalizedPath)) {
      continue;
    }

    for (const line of record.addedLines) {
      if (!XHTML_STRUCTURAL_TAGS.test(line)) {
        continue;
      }

      failures.push(
        createFailure(
          "Legacy Boundary",
          record.filePath,
          "XHTML document introduced an HTML5 structural tag; add the file path to xhtmlMigrationAllowlist in HARNESS_CONFIG if this migration is intentional, or revert the tag to XHTML-compatible markup",
        ),
      );
      break;
    }
  }

  return failures;
}

/**
 * Applies CloudFormation low-fat and ownership-boundary checks.
 *
 * @param {Map<string, object>} records Diff records.
 * @returns {object[]} CloudFormation failures.
 */
function checkCloudFormation(records) {
  const failures = [];

  for (const record of records.values()) {
    if (!isCloudFormation(record)) {
      continue;
    }

    const hasCloudFrontDistribution = /AWS::CloudFront::Distribution/.test(
      record.currentContent ?? "",
    );

    for (const line of record.addedLines) {
      if (/\bResource\s*:\s*["']?\*["']?/.test(line) || /^\s*-\s*["']?\*["']?\s*$/.test(line)) {
        failures.push(
          createFailure(
            "CloudFormation",
            record.filePath,
            'broad IAM resource scope "*" is forbidden; scope the resource to a specific ARN or use !Ref / !GetAtt for dynamic references',
          ),
        );
      }

      if (/arn:aws[a-z-]*:[^\s"']+/i.test(line)) {
        failures.push(
          createFailure(
            "CloudFormation",
            record.filePath,
            "hard-coded ARN detected; replace with !Ref, !GetAtt, or Fn::ImportValue to maintain Cloud Native standards",
          ),
        );
      }

      if (/(^|[^0-9])\d{12}([^0-9]|$)/.test(line)) {
        failures.push(
          createFailure(
            "CloudFormation",
            record.filePath,
            "hard-coded 12-digit account identifier detected; replace with !Sub '${AWS::AccountId}' or an SSM parameter to avoid environment coupling",
          ),
        );
      }

      if (
        hasCloudFrontDistribution &&
        !HARNESS_CONFIG.cloudFrontIacAllowlist.includes(record.normalizedPath) &&
        CLOUDFORMATION_BOUNDARY_PATTERNS.some((pattern) => pattern.test(line))
      ) {
        failures.push(
          createFailure(
            "CloudFormation",
            record.filePath,
            "CloudFront runtime wiring changed in CloudFormation; origins, cache behaviours, and Lambda@Edge associations are owned by deploy.sh — move these changes to the deployment script or add to cloudFrontIacAllowlist if CloudFormation ownership is intentional",
          ),
        );
      }
    }
  }

  return failures;
}

/**
 * Extracts bracketed string key accesses (e.g. ['key'], ["key"]) from an array of lines.
 *
 * @param {string[]} lines Source lines to scan.
 * @returns {Set<string>} Set of extracted key names.
 */
function extractBracketedKeys(lines) {
  const keys = new Set();

  for (const line of lines) {
    for (const match of line.matchAll(INTEROP_KEY_PATTERN)) {
      keys.add(match[1]);
    }
  }

  return keys;
}

/**
 * Detects changes to cross-system data-contract keys in json_decode / JSON.parse boundary files.
 *
 * @param {Map<string, object>} records Diff records.
 * @returns {object[]} Interop contract failures.
 */
function checkInteropContracts(records) {
  const failures = [];

  for (const record of records.values()) {
    if (isVendorPath(record) || isGeneratedPath(record)) {
      continue;
    }

    const content = record.currentContent ?? record.removedLines.join("\n");

    if (!INTEROP_TRIGGER_PATTERNS.some((pattern) => pattern.test(content))) {
      continue;
    }

    const removedKeys = extractBracketedKeys(
      record.removedLines.filter((line) => !COMMENT_LINE_PATTERN.test(line)),
    );
    const addedKeys = extractBracketedKeys(
      record.addedLines.filter((line) => !COMMENT_LINE_PATTERN.test(line)),
    );

    const deletedKeys = [...removedKeys].filter((key) => !addedKeys.has(key));
    const newKeys = [...addedKeys].filter((key) => !removedKeys.has(key));

    if (deletedKeys.length > 0) {
      failures.push(
        createFailure(
          "Interop Contract",
          record.filePath,
          `contract keys removed: ${deletedKeys.map((k) => `"${k}"`).join(", ")}; verify all consumers of this data contract are updated`,
        ),
      );
    }

    if (newKeys.length > 0) {
      failures.push(
        createFailure(
          "Interop Contract",
          record.filePath,
          `new contract keys added: ${newKeys.map((k) => `"${k}"`).join(", ")}; verify all producers of this data contract are updated`,
        ),
      );
    }
  }

  return failures;
}

/**
 * Groups failures by category for readable output.
 *
 * @param {object[]} failures Harness failures.
 * @returns {Map<string, object[]>} Failures grouped by category.
 */
function groupFailures(failures) {
  const grouped = new Map();

  for (const failure of failures) {
    const items = grouped.get(failure.category) ?? [];
    items.push(failure);
    grouped.set(failure.category, items);
  }

  return grouped;
}

/**
 * Prints grouped failure details.
 *
 * @param {object[]} failures Harness failures.
 * @returns {void}
 */
function printFailures(failures) {
  const grouped = groupFailures(failures);
  console.error("FAILURE");

  for (const [category, items] of grouped.entries()) {
    console.error(`[${category}]`);

    for (const item of items) {
      console.error(` - ${item.filePath}: ${item.message}`);
    }
  }
}

/**
 * Runs the Level 6 verification harness.
 *
 * @returns {void}
 */
function runHarness() {
  console.log("🚀 Level 6 Harness: Initiating Verification...");

  try {
    const records = getDiffRecords();
    const failures = [
      ...checkSurgicalDiscipline(records),
      ...checkDependencyLockdown(records),
      ...checkModernJavaScript(records),
      ...checkLegacyPhp(records),
      ...checkXhtml(records),
      ...checkCloudFormation(records),
      ...checkInteropContracts(records),
    ];

    if (failures.length > 0) {
      printFailures(failures);
      process.exit(1);
    }

    console.log("SUCCESS");
    process.exit(0);
  } catch (error) {
    console.error("FAILURE");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

runHarness();
