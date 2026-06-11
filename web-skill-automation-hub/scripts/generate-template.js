#!/usr/bin/env node
"use strict";

const { generateFlowTemplate } = require("../orchestrator/template-generator");

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (!args.runDir) {
    console.error("Usage: generate-template.js --run-dir runs/<run-id> [--templates-dir path] [--slug name]");
    process.exitCode = 1;
    return;
  }
  const result = generateFlowTemplate({
    runDir: args.runDir,
    templatesDir: args.templatesDir,
    slug: args.slug,
  });
  console.log(JSON.stringify(result, null, 2));
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === "--run-dir") {
      args.runDir = value;
      index += 1;
    } else if (key === "--templates-dir") {
      args.templatesDir = value;
      index += 1;
    } else if (key === "--slug") {
      args.slug = value;
      index += 1;
    }
  }
  return args;
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
  parseArgs,
};
