"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { createLocalServer } = require("../server/local-server");

function withTempDir(fn) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "local-server-"));
  return Promise.resolve()
    .then(() => fn(tempDir))
    .finally(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server.address()));
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

function requestJson(address, method, pathname, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const request = http.request({
      host: address.address,
      port: address.port,
      method,
      path: pathname,
      headers: payload
        ? {
            "content-type": "application/json",
            "content-length": Buffer.byteLength(payload),
          }
        : {},
    }, (response) => {
      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        try {
          resolve({
            status: response.statusCode,
            body: JSON.parse(data),
          });
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on("error", reject);
    if (payload) request.write(payload);
    request.end();
  });
}

withTempDir(async (tempDir) => {
  const server = createLocalServer({
    rootDir: path.resolve(__dirname, "..", ".."),
    runsDir: path.join(tempDir, "runs"),
    templatesDir: path.join(tempDir, "templates"),
  });
  const address = await listen(server);
  try {
    const skills = await requestJson(address, "GET", "/api/skills");
    assert.equal(skills.status, 200);
    assert.ok(skills.body.skills.some((skill) => skill.name === "web-skill-automation-hub"));

    const dryRun = await requestJson(address, "POST", "/api/tasks/dry-run", {
      task_name: "读取订单",
      url: "https://example.com/admin",
      operation: {
        description: "登录后台后读取订单列表。",
      },
    });
    assert.equal(dryRun.status, 200);
    assert.equal(dryRun.body.success, true);
    assert.ok(dryRun.body.run_id);

    const runs = await requestJson(address, "GET", "/api/runs");
    assert.equal(runs.status, 200);
    assert.equal(runs.body.runs.length, 1);

    const template = await requestJson(address, "POST", "/api/templates", {
      run_id: dryRun.body.run_id,
      slug: "server-test-template",
    });
    assert.equal(template.status, 200);
    assert.equal(template.body.success, true);
  } finally {
    await close(server);
  }
}).then(() => {
  console.log("local-server tests ok");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
