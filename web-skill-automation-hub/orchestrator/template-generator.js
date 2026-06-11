"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { redactSecrets } = require("./sanitizer");
const { toYaml } = require("./flow-yaml");

function generateFlowTemplate(options = {}) {
  const runDir = path.resolve(options.runDir);
  const templatesDir = path.resolve(
    options.templatesDir || path.join(__dirname, "..", "templates"),
  );

  const task = readJson(path.join(runDir, "task.json"));
  const result = readJson(path.join(runDir, "result.json"));
  const plan = readPlan(path.join(runDir, "plan.yaml"));
  const slug = options.slug || slugify(task.template && task.template.template_name
    ? task.template.template_name
    : task.task_name);
  const templateDir = path.join(templatesDir, slug);
  const screenshotDir = path.join(templateDir, "screenshots");

  fs.mkdirSync(screenshotDir, { recursive: true });

  const flow = redactSecrets({
    name: slug,
    display_name: task.task_name,
    version: "0.1.0",
    domain: extractDomain(task.url),
    source_run_id: result.run_id,
    type: "template",
    risk_level: task.task_type.includes("submit_task") ? "high" : "medium",
    requires_confirmation: task.task_type.includes("submit_task"),
    inputs: inferInputs(task),
    outputs: task.output,
    used_skills: result.used_skills,
    steps: plan.steps.map((step) => ({
      id: step.id,
      use: step.selected_skill,
      purpose: step.purpose,
      success: step.success_signal,
      risk_level: step.risk_level,
    })),
    success_conditions: [
      "run result success is true",
      "all planned steps have evidence or explicit manual takeover state",
    ],
    failure_conditions: [
      "login failure",
      "challenge failure after retry limit",
      "element not found after screenshot and DOM capture",
      "submit failure without explicit retry confirmation",
    ],
  });

  const flowPath = path.join(templateDir, "flow.yaml");
  fs.writeFileSync(flowPath, `${toYaml(flow)}\n`);
  fs.writeFileSync(
    path.join(templateDir, "README.md"),
    buildTemplateReadme(flow, result),
  );

  return {
    success: true,
    template_name: slug,
    template_dir: templateDir,
    flow_path: flowPath,
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readPlan(filePath) {
  const { parseYamlSubset } = require("../scripts/skill-registry");
  return parseYamlSubset(fs.readFileSync(filePath, "utf8"));
}

function inferInputs(task) {
  const inputs = {
    url: "url",
  };
  if (task.requires_login) {
    inputs.username = "env:USERNAME";
    inputs.password = "env:PASSWORD";
  }
  if (task.operation && task.operation.description) {
    inputs.operation_description = "text";
  }
  return inputs;
}

function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (_error) {
    return "*";
  }
}

function slugify(value) {
  return String(value || "web-flow")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "web-flow";
}

function buildTemplateReadme(flow, result) {
  return [
    `# ${flow.display_name}`,
    "",
    `- Template: ${flow.name}`,
    `- Source run: ${flow.source_run_id}`,
    `- Risk level: ${flow.risk_level}`,
    `- Requires confirmation: ${flow.requires_confirmation}`,
    `- Used skills: ${(result.used_skills || []).join(", ")}`,
    "",
    "This template is generated from a sanitized run record. Credentials, cookies, tokens, OTPs, and captcha answers are not stored here.",
    "",
  ].join("\n");
}

module.exports = {
  generateFlowTemplate,
  slugify,
};
