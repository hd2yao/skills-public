"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  loadRegistry,
  parseYamlSubset,
} = require("../scripts/skill-registry");

function withTempDir(fn) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "skill-registry-"));
  try {
    fn(tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function writeSkill(dir, slug, yaml) {
  const skillDir = path.join(dir, slug);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, "SKILL.md"), "# Test Skill\n");
  fs.writeFileSync(path.join(skillDir, "skill.yaml"), yaml);
}

function testYamlParser() {
  const parsed = parseYamlSubset(`
name: example
entry:
  type: markdown
  path: SKILL.md
supported_sites:
  - "*"
tags: [auth, login]
requires_human_approval: false
`);

  assert.equal(parsed.name, "example");
  assert.deepEqual(parsed.entry, { type: "markdown", path: "SKILL.md" });
  assert.deepEqual(parsed.supported_sites, ["*"]);
  assert.deepEqual(parsed.tags, ["auth", "login"]);
  assert.equal(parsed.requires_human_approval, false);

  const withBlock = parseYamlSubset(`
operation:
  description: |
    登录后台后进入订单管理。
    读取今天的数据。
`);
  assert.equal(
    withBlock.operation.description,
    "登录后台后进入订单管理。\n读取今天的数据。",
  );

  const withListObjects = parseYamlSubset(`
steps:
  - id: normalize
    selected_skill: web-skill-automation-hub
  - id: login
    selected_skill: web-skill-generic-login
`);
  assert.deepEqual(withListObjects.steps, [
    {
      id: "normalize",
      selected_skill: "web-skill-automation-hub",
    },
    {
      id: "login",
      selected_skill: "web-skill-generic-login",
    },
  ]);
}

function testRegistryValidation() {
  withTempDir((tempDir) => {
    writeSkill(tempDir, "example", `
name: example
display_name: 示例
type: auth
version: 0.1.0
description: 测试用 skill
entry:
  type: markdown
  path: SKILL.md
input_schema:
  url: string
output_schema:
  success: boolean
risk_level: low
requires_human_approval: false
supported_sites:
  - "*"
tags:
  - auth
`);

    const registry = loadRegistry(tempDir);
    assert.equal(registry.errors.length, 0);
    assert.equal(registry.skills.length, 1);
    assert.equal(registry.skills[0].name, "example");
  });
}

function testMissingRequiredField() {
  withTempDir((tempDir) => {
    writeSkill(tempDir, "broken", `
name: broken
display_name: Broken
type: auth
version: 0.1.0
description: broken
entry:
  type: markdown
  path: SKILL.md
input_schema:
  url: string
output_schema:
  success: boolean
risk_level: low
supported_sites:
  - "*"
tags:
  - auth
`);

    const registry = loadRegistry(tempDir);
    assert.ok(
      registry.errors.some((error) =>
        error.includes("requires_human_approval"),
      ),
    );
  });
}

testYamlParser();
testRegistryValidation();
testMissingRequiredField();

console.log("skill-registry tests ok");
