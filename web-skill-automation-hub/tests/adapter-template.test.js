"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { BrowserAdapter } = require("../adapters/browser-adapter");
const { createBrowserAdapter } = require("../adapters");
const { executeDryRun } = require("../orchestrator/executor");
const { generateFlowTemplate, slugify } = require("../orchestrator/template-generator");

function withTempDir(fn) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "template-generator-"));
  try {
    return fn(tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function testBaseAdapterThrows() {
  const adapter = new BrowserAdapter();
  await assert.rejects(() => adapter.open("https://example.com"), /not implemented/);
}

function testAdapterFactoryRejectsUnknown() {
  assert.throws(() => createBrowserAdapter("unknown"), /Unsupported browser adapter/);
}

function testTemplateGeneration() {
  withTempDir((tempDir) => {
    const run = executeDryRun(
      {
        task_name: "读取今日订单",
        url: "https://example.com/admin",
        credential: {
          username: "demo",
          password: "secret",
        },
        operation: {
          description: "登录后台后读取今日订单，并保存为模板。",
        },
        template: {
          save_if_success: true,
          template_name: "read_today_orders",
        },
      },
      {
        runsDir: path.join(tempDir, "runs"),
        templatesDir: path.join(tempDir, "templates"),
        rootDir: path.resolve(__dirname, "..", ".."),
        runId: "template-run",
      },
    );

    const generated = generateFlowTemplate({
      runDir: run.run_dir,
      templatesDir: path.join(tempDir, "templates"),
    });

    assert.equal(generated.success, true);
    assert.equal(fs.existsSync(generated.flow_path), true);
    const flow = fs.readFileSync(generated.flow_path, "utf8");
    assert.equal(flow.includes("secret"), false);
    assert.equal(flow.includes("web-skill-generic-login"), true);
    assert.equal(flow.includes("read_today_orders"), true);
  });
}

function testSlugify() {
  assert.equal(slugify("Read Today Orders!"), "read-today-orders");
  assert.equal(slugify("读取今日订单"), "读取今日订单");
}

(async () => {
  await testBaseAdapterThrows();
  testAdapterFactoryRejectsUnknown();
  testTemplateGeneration();
  testSlugify();
  console.log("adapter-template tests ok");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
