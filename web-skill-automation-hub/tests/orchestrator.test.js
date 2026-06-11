"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { executeDryRun } = require("../orchestrator/executor");
const { generatePlan } = require("../orchestrator/planner");
const { buildSubmitGate, isSubmitLike } = require("../orchestrator/risk-checker");
const { normalizeTask } = require("../orchestrator/task-normalizer");

function withTempDir(fn) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "orchestrator-"));
  try {
    return fn(tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function testTaskClassification() {
  const task = normalizeTask({
    task_name: "读取订单",
    url: "https://example.com/admin",
    credential: {
      username: "demo",
      password: "secret",
    },
    operation: {
      description: "登录后台后筛选今天订单，读取订单号、手机号、金额，并保存为模板。",
    },
    template: {
      save_if_success: true,
      template_name: "read_today_orders",
    },
  });

  assert.equal(task.requires_login, true);
  assert.ok(task.task_type.includes("read_data"));
  assert.ok(task.task_type.includes("form_fill"));
  assert.ok(task.task_type.includes("generate_skill"));
}

function testSubmitGate() {
  assert.equal(isSubmitLike("点击结束制作"), true);
  assert.equal(isSubmitLike("读取订单列表"), false);

  const task = normalizeTask({
    task_name: "提交任务",
    operation: {
      description: "填写内容后点击提交。",
    },
    risk: {
      allow_submit: false,
    },
  });
  const gate = buildSubmitGate(task, { title: "Submit confirmation gate" });
  assert.equal(gate.required, true);
  assert.equal(gate.allow_submit, false);
}

function testPlanGeneration() {
  const task = normalizeTask({
    task_name: "结束制作演练",
    url: "https://hub.51job.com/#/make",
    credential: {
      username: "env:USER",
      password: "env:PASS",
    },
    challenge: {
      expected_types: ["slider_puzzle"],
    },
    operation: {
      description: "选择已开始任务，进入详情，点击结束制作后返回。",
    },
    risk: {
      allow_submit: false,
    },
  });
  const plan = generatePlan(task, {
    skills: [
      { name: "web-skill-generic-login" },
      { name: "web-skill-challenge-router" },
      { name: "slider-captcha-browser-automation" },
      { name: "web-skill-page-workflow" },
      { name: "web-skill-submit-guard" },
    ],
  });

  assert.ok(plan.steps.some((step) => step.id === "login"));
  assert.ok(plan.steps.some((step) => step.id === "slider-challenge"));
  assert.ok(plan.steps.some((step) => step.id === "submit-guard"));
}

function testDryRunWritesArtifacts() {
  withTempDir((tempDir) => {
    const result = executeDryRun(
      {
        task_name: "读取订单",
        url: "https://example.com/admin",
        credential: {
          username: "demo",
          password: "secret",
        },
        operation: {
          description: "登录后台后读取订单列表。",
        },
      },
      {
        runsDir: tempDir,
        runId: "test-run",
        rootDir: path.resolve(__dirname, "..", ".."),
      },
    );

    assert.equal(result.run_id, "test-run");
    assert.equal(fs.existsSync(path.join(result.run_dir, "input.json")), true);
    assert.equal(fs.existsSync(path.join(result.run_dir, "task.json")), true);
    assert.equal(fs.existsSync(path.join(result.run_dir, "plan.yaml")), true);
    assert.equal(fs.existsSync(path.join(result.run_dir, "step_logs.jsonl")), true);
    assert.equal(fs.existsSync(path.join(result.run_dir, "result.json")), true);
    const input = fs.readFileSync(path.join(result.run_dir, "input.json"), "utf8");
    assert.equal(input.includes("secret"), false);
    assert.equal(input.includes("<redacted>"), true);
  });
}

testTaskClassification();
testSubmitGate();
testPlanGeneration();
testDryRunWritesArtifacts();

console.log("orchestrator tests ok");
