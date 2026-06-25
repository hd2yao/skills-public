"use strict";

const path = require("node:path");
const { loadRegistry } = require("../scripts/skill-registry");
const { toYaml } = require("./flow-yaml");
const { generatePlan } = require("./planner");
const { createRunStore, writeRunReport } = require("./run-store");
const { normalizeTask } = require("./task-normalizer");

function executeDryRun(input, options = {}) {
  const rootDir = path.resolve(options.rootDir || path.join(__dirname, "..", ".."));
  const registry = loadRegistry(rootDir);
  if (registry.errors.length > 0) {
    throw new Error(`Skill registry is invalid:\n${registry.errors.join("\n")}`);
  }

  const task = normalizeTask(input);
  const plan = generatePlan(task, registry);
  const store = createRunStore({
    runsDir: options.runsDir || path.join(__dirname, "..", "runs"),
    runId: options.runId,
  });

  store.writeJson("input.json", input);
  store.writeJson("task.json", task);
  store.writeText("plan.yaml", `${toYaml(plan)}\n`);

  for (const planStep of plan.steps) {
    store.appendStepLog({
      step_id: planStep.id,
      title: planStep.title,
      selected_skill: planStep.selected_skill,
      status: "planned",
      success_signal: planStep.success_signal,
      risk_level: planStep.risk_level,
    });
  }

  const result = {
    run_id: store.runId,
    success: true,
    dry_run: true,
    task_name: task.task_name,
    task_type: task.task_type,
    used_skills: Array.from(
      new Set(plan.steps.map((step) => step.selected_skill).filter(Boolean)),
    ),
    result_files: [
      path.join(store.runDir, "task.json"),
      path.join(store.runDir, "plan.yaml"),
      path.join(store.runDir, "step_logs.jsonl"),
    ],
    screenshots: [],
    template_generated: false,
    next_action: "Run with a browser adapter to execute the planned steps.",
  };

  store.writeJson("result.json", result, { redact: false });
  writeRunReport(store, result);

  return {
    ...result,
    run_dir: store.runDir,
    plan,
  };
}

module.exports = {
  executeDryRun,
};
