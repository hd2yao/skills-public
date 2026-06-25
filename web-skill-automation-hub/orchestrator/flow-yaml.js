"use strict";

function toYaml(value, indent = 0) {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => {
        if (item && typeof item === "object") {
          return `${pad}- ${toYaml(item, indent + 2).trimStart()}`;
        }
        return `${pad}- ${formatScalar(item)}`;
      })
      .join("\n");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, child]) => {
        if (child && typeof child === "object") {
          const nested = toYaml(child, indent + 2);
          return `${pad}${key}:\n${nested}`;
        }
        return `${pad}${key}: ${formatScalar(child)}`;
      })
      .join("\n");
  }

  return `${pad}${formatScalar(value)}`;
}

function formatScalar(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  const text = String(value);
  if (/^[a-zA-Z0-9_./:-]+$/.test(text)) {
    return text;
  }
  return JSON.stringify(text);
}

module.exports = {
  toYaml,
};
