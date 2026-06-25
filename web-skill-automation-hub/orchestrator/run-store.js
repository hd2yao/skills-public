"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { redactSecrets } = require("./sanitizer");

function createRunStore(options = {}) {
  const runsDir = path.resolve(options.runsDir || path.join(__dirname, "..", "runs"));
  const runId = options.runId || buildRunId(new Date());
  const runDir = path.join(runsDir, runId);
  const screenshotsDir = path.join(runDir, "screenshots");
  const domDir = path.join(runDir, "dom");
  const errorDir = path.join(runDir, "error");

  fs.mkdirSync(screenshotsDir, { recursive: true });
  fs.mkdirSync(domDir, { recursive: true });
  fs.mkdirSync(errorDir, { recursive: true });

  return {
    runId,
    runDir,
    screenshotsDir,
    domDir,
    errorDir,
    writeJson(name, value, options = {}) {
      const data = options.redact === false ? value : redactSecrets(value);
      fs.writeFileSync(
        path.join(runDir, name),
        `${JSON.stringify(data, null, 2)}\n`,
      );
    },
    writeText(name, value) {
      fs.writeFileSync(path.join(runDir, name), value);
    },
    appendStepLog(entry) {
      fs.appendFileSync(
        path.join(runDir, "step_logs.jsonl"),
        `${JSON.stringify(redactSecrets(entry))}\n`,
      );
    },
  };
}

function writeRunReport(store, result) {
  const lines = [
    `# Run Report: ${store.runId}`,
    "",
    `- Success: ${result.success}`,
    `- Task: ${result.task_name}`,
    `- Task type: ${result.task_type.join(", ")}`,
    `- Used skills: ${result.used_skills.join(", ") || "none"}`,
    `- Template generated: ${result.template_generated}`,
    "",
    "## Result Files",
    "",
    ...result.result_files.map((file) => `- ${file}`),
    "",
  ];
  store.writeText("report.md", `${lines.join("\n")}\n`);
}

function buildRunId(date) {
  const pad = (number) => String(number).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "_",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

module.exports = {
  buildRunId,
  createRunStore,
  writeRunReport,
};
