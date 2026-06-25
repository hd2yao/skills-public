#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { executeDryRun } = require("../orchestrator/executor");
const { parseYamlSubset } = require("./skill-registry");

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (!args.task) {
    console.error("Usage: run-orchestrator.js --task task.json|task.yaml [--runs-dir path] [--run-id id]");
    process.exitCode = 1;
    return;
  }

  const input = readTaskFile(args.task);
  const result = executeDryRun(input, {
    runsDir: args.runsDir,
    runId: args.runId,
    rootDir: path.resolve(__dirname, "..", ".."),
  });
  console.log(JSON.stringify({
    run_id: result.run_id,
    run_dir: result.run_dir,
    task_type: result.task_type,
    used_skills: result.used_skills,
    result_files: result.result_files,
  }, null, 2));
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === "--task") {
      args.task = value;
      index += 1;
    } else if (key === "--runs-dir") {
      args.runsDir = value;
      index += 1;
    } else if (key === "--run-id") {
      args.runId = value;
      index += 1;
    }
  }
  return args;
}

function readTaskFile(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  if (/\.ya?ml$/i.test(filePath)) {
    return parseYamlSubset(source);
  }
  return JSON.parse(source);
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
  parseArgs,
  readTaskFile,
};
