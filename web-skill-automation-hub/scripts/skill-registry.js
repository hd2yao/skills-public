"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ALLOWED_TYPES = new Set([
  "orchestrator",
  "auth",
  "challenge",
  "operation",
  "extract",
  "submit",
  "template",
  "recovery",
  "flow",
]);

function parseYamlSubset(source) {
  const lines = source
    .split(/\r?\n/)
    .map((raw) => {
      const withoutComment = raw.replace(/\s+#.*$/, "");
      return {
        raw: withoutComment,
        indent: withoutComment.match(/^ */)[0].length,
        text: withoutComment.trim(),
      };
    })
    .filter((line) => line.text.length > 0);

  const [value, nextIndex] = parseBlock(lines, 0, 0);
  if (nextIndex < lines.length) {
    throw new Error(`Unexpected YAML content near: ${lines[nextIndex].text}`);
  }
  return value;
}

function parseBlock(lines, startIndex, indent) {
  if (startIndex >= lines.length) {
    return [{}, startIndex];
  }

  if (lines[startIndex].indent < indent) {
    return [{}, startIndex];
  }

  if (lines[startIndex].text.startsWith("- ")) {
    return parseList(lines, startIndex, indent);
  }

  return parseMap(lines, startIndex, indent);
}

function parseMap(lines, startIndex, indent) {
  const result = {};
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) {
      break;
    }
    if (line.indent > indent) {
      throw new Error(`Unexpected indentation near: ${line.text}`);
    }
    if (line.text.startsWith("- ")) {
      break;
    }

    const match = line.text.match(/^([^:]+):(.*)$/);
    if (!match) {
      throw new Error(`Expected key/value line near: ${line.text}`);
    }

    const key = match[1].trim();
    const rest = match[2].trim();
    if (rest.length > 0) {
      if (rest === "|" || rest === ">") {
        const [blockScalar, nextIndex] = parseBlockScalar(lines, index + 1, indent, rest);
        result[key] = blockScalar;
        index = nextIndex;
        continue;
      }
      result[key] = parseScalar(rest);
      index += 1;
      continue;
    }

    const next = lines[index + 1];
    if (!next || next.indent <= indent) {
      result[key] = {};
      index += 1;
      continue;
    }

    const [child, nextIndex] = parseBlock(lines, index + 1, next.indent);
    result[key] = child;
    index = nextIndex;
  }

  return [result, index];
}

function parseBlockScalar(lines, startIndex, parentIndent, style) {
  const blockLines = [];
  let index = startIndex;
  let minIndent = null;

  while (index < lines.length) {
    const line = lines[index];
    if (line.indent <= parentIndent) {
      break;
    }
    minIndent = minIndent === null ? line.indent : Math.min(minIndent, line.indent);
    blockLines.push(line);
    index += 1;
  }

  const normalized = blockLines.map((line) =>
    line.raw.slice(minIndent === null ? 0 : minIndent),
  );
  if (style === ">") {
    return [normalized.join(" ").trim(), index];
  }
  return [normalized.join("\n").trimEnd(), index];
}

function parseList(lines, startIndex, indent) {
  const result = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) {
      break;
    }
    if (line.indent > indent) {
      throw new Error(`Unexpected indentation near: ${line.text}`);
    }
    if (!line.text.startsWith("- ")) {
      break;
    }

    const rest = line.text.slice(2).trim();
    if (rest.length === 0) {
      const next = lines[index + 1];
      if (!next || next.indent <= indent) {
        result.push(null);
        index += 1;
      } else {
        const [child, nextIndex] = parseBlock(lines, index + 1, next.indent);
        result.push(child);
        index = nextIndex;
      }
      continue;
    }

    const inlineMap = rest.match(/^([^:]+):(.*)$/);
    if (inlineMap) {
      const item = {};
      const key = inlineMap[1].trim();
      const value = inlineMap[2].trim();
      item[key] = value.length > 0 ? parseScalar(value) : {};
      index += 1;

      const next = lines[index];
      if (next && next.indent > indent) {
        const [child, nextIndex] = parseBlock(lines, index, next.indent);
        if (child && typeof child === "object" && !Array.isArray(child)) {
          Object.assign(item, child);
        }
        index = nextIndex;
      }

      result.push(item);
      continue;
    }

    result.push(parseScalar(rest));
    index += 1;
  }

  return [result, index];
}

function parseScalar(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  if (value.startsWith("[") && value.endsWith("]")) {
    const body = value.slice(1, -1).trim();
    if (!body) return [];
    return body.split(",").map((item) => parseScalar(item.trim()));
  }
  return value;
}

function findSkillYamlFiles(rootDir) {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootDir, entry.name, "skill.yaml"))
    .filter((filePath) => fs.existsSync(filePath))
    .sort();
}

function loadSkillMetadata(filePath) {
  const metadata = parseYamlSubset(fs.readFileSync(filePath, "utf8"));
  metadata.__file = filePath;
  metadata.__dir = path.dirname(filePath);
  return metadata;
}

function loadRegistry(rootDir) {
  const skills = findSkillYamlFiles(rootDir).map(loadSkillMetadata);
  const errors = validateRegistry(skills);
  return { skills, errors };
}

function validateRegistry(skills) {
  const errors = [];
  const seen = new Map();

  for (const skill of skills) {
    for (const field of [
      "name",
      "display_name",
      "type",
      "version",
      "description",
      "entry",
      "input_schema",
      "output_schema",
      "risk_level",
      "requires_human_approval",
      "supported_sites",
      "tags",
    ]) {
      if (skill[field] === undefined) {
        errors.push(`${skill.__file}: missing required field ${field}`);
      }
    }

    if (skill.name) {
      if (seen.has(skill.name)) {
        errors.push(`${skill.__file}: duplicate skill name ${skill.name}`);
      }
      seen.set(skill.name, skill.__file);
    }

    if (skill.type && !ALLOWED_TYPES.has(skill.type)) {
      errors.push(`${skill.__file}: unsupported type ${skill.type}`);
    }

    if (!Array.isArray(skill.supported_sites)) {
      errors.push(`${skill.__file}: supported_sites must be a list`);
    }
    if (!Array.isArray(skill.tags)) {
      errors.push(`${skill.__file}: tags must be a list`);
    }
    if (typeof skill.requires_human_approval !== "boolean") {
      errors.push(`${skill.__file}: requires_human_approval must be boolean`);
    }

    if (!skill.entry || typeof skill.entry !== "object") {
      errors.push(`${skill.__file}: entry must be an object`);
    } else {
      if (!skill.entry.type) {
        errors.push(`${skill.__file}: entry.type is required`);
      }
      if (!skill.entry.path) {
        errors.push(`${skill.__file}: entry.path is required`);
      } else {
        const entryPath = path.join(skill.__dir, skill.entry.path);
        if (!fs.existsSync(entryPath)) {
          errors.push(`${skill.__file}: entry.path does not exist: ${skill.entry.path}`);
        }
      }
    }
  }

  return errors;
}

function summarizeRegistry(skills) {
  return skills.map((skill) => ({
    name: skill.name,
    type: skill.type,
    version: skill.version,
    risk_level: skill.risk_level,
    requires_human_approval: skill.requires_human_approval,
    entry: skill.entry,
    supported_sites: skill.supported_sites,
    tags: skill.tags,
  }));
}

function main(argv = process.argv.slice(2)) {
  const command = argv[0] || "list";
  const rootDir = path.resolve(argv[1] || path.join(__dirname, "..", ".."));
  const registry = loadRegistry(rootDir);

  if (command === "validate") {
    if (registry.errors.length > 0) {
      for (const error of registry.errors) {
        console.error(error);
      }
      process.exitCode = 1;
      return;
    }
    console.log(`Validated ${registry.skills.length} skills`);
    return;
  }

  if (command === "json") {
    console.log(JSON.stringify(registry, null, 2));
    return;
  }

  if (command === "list") {
    for (const skill of summarizeRegistry(registry.skills)) {
      console.log(`${skill.name}\t${skill.type}\t${skill.version}`);
    }
    if (registry.errors.length > 0) {
      console.error(`Registry has ${registry.errors.length} validation error(s)`);
      process.exitCode = 1;
    }
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  ALLOWED_TYPES,
  findSkillYamlFiles,
  loadRegistry,
  loadSkillMetadata,
  parseYamlSubset,
  summarizeRegistry,
  validateRegistry,
};
