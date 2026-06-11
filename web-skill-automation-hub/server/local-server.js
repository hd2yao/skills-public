#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { executeDryRun } = require("../orchestrator/executor");
const { generateFlowTemplate } = require("../orchestrator/template-generator");
const { loadRegistry, summarizeRegistry } = require("../scripts/skill-registry");

const HUB_DIR = path.resolve(__dirname, "..");
const ROOT_DIR = path.resolve(HUB_DIR, "..");

function createLocalServer(options = {}) {
  const rootDir = path.resolve(options.rootDir || ROOT_DIR);
  const hubDir = path.resolve(options.hubDir || HUB_DIR);
  const runsDir = path.resolve(options.runsDir || path.join(hubDir, "runs"));
  const templatesDir = path.resolve(options.templatesDir || path.join(hubDir, "templates"));
  const webDir = path.resolve(options.webDir || path.join(hubDir, "web"));

  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");

      if (request.method === "GET" && url.pathname === "/api/skills") {
        const registry = loadRegistry(rootDir);
        sendJson(response, {
          skills: summarizeRegistry(registry.skills),
          errors: registry.errors,
        }, registry.errors.length ? 500 : 200);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/tasks/dry-run") {
        const body = await readJsonBody(request);
        const result = executeDryRun(body, { rootDir, runsDir });
        sendJson(response, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/runs") {
        sendJson(response, { runs: listRuns(runsDir) });
        return;
      }

      const runMatch = url.pathname.match(/^\/api\/runs\/([^/]+)$/);
      if (request.method === "GET" && runMatch) {
        const runId = decodeURIComponent(runMatch[1]);
        sendJson(response, readRun(runsDir, runId));
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/templates") {
        const body = await readJsonBody(request);
        const runDir = body.run_dir || path.join(runsDir, body.run_id || "");
        const result = generateFlowTemplate({
          runDir,
          templatesDir,
          slug: body.slug,
        });
        sendJson(response, result);
        return;
      }

      if (request.method === "GET" && url.pathname.startsWith("/")) {
        serveStatic(response, webDir, url.pathname);
        return;
      }

      sendJson(response, { error: "not_found" }, 404);
    } catch (error) {
      sendJson(response, { error: String(error.message || error) }, 500);
    }
  });
}

function listRuns(runsDir) {
  if (!fs.existsSync(runsDir)) {
    return [];
  }
  return fs.readdirSync(runsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const runDir = path.join(runsDir, entry.name);
      const resultPath = path.join(runDir, "result.json");
      let result = null;
      if (fs.existsSync(resultPath)) {
        result = JSON.parse(fs.readFileSync(resultPath, "utf8"));
      }
      return {
        run_id: entry.name,
        run_dir: runDir,
        success: result ? result.success : null,
        task_name: result ? result.task_name : null,
        task_type: result ? result.task_type : [],
      };
    })
    .sort((a, b) => b.run_id.localeCompare(a.run_id));
}

function readRun(runsDir, runId) {
  const runDir = path.join(runsDir, runId);
  if (!fs.existsSync(runDir)) {
    throw new Error(`Run not found: ${runId}`);
  }
  return {
    run_id: runId,
    run_dir: runDir,
    task: readJsonIfExists(path.join(runDir, "task.json")),
    plan: fs.existsSync(path.join(runDir, "plan.yaml"))
      ? fs.readFileSync(path.join(runDir, "plan.yaml"), "utf8")
      : null,
    result: readJsonIfExists(path.join(runDir, "result.json")),
    report: fs.existsSync(path.join(runDir, "report.md"))
      ? fs.readFileSync(path.join(runDir, "report.md"), "utf8")
      : null,
  };
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error(`Invalid JSON body: ${error.message}`));
      }
    });
    request.on("error", reject);
  });
}

function serveStatic(response, webDir, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(webDir, `.${safePath}`);
  if (!filePath.startsWith(webDir)) {
    sendJson(response, { error: "invalid_path" }, 400);
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendJson(response, { error: "not_found" }, 404);
    return;
  }
  response.writeHead(200, {
    "content-type": contentType(filePath),
  });
  fs.createReadStream(filePath).pipe(response);
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

function sendJson(response, payload, status = 200) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function main(argv = process.argv.slice(2)) {
  const port = Number(readArg(argv, "--port") || 8787);
  const host = readArg(argv, "--host") || "127.0.0.1";
  const server = createLocalServer();
  server.listen(port, host, () => {
    const address = server.address();
    console.log(`Web Skill Automation Hub listening on http://${address.address}:${address.port}`);
  });
}

function readArg(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  return argv[index + 1] || null;
}

if (require.main === module) {
  main();
}

module.exports = {
  createLocalServer,
  listRuns,
  readRun,
};
