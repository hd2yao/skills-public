"use strict";

const SUBMIT_WORDS = [
  "提交",
  "发布",
  "删除",
  "接受",
  "结束制作",
  "支付",
  "下单",
  "转账",
  "批量",
  "submit",
  "publish",
  "delete",
  "accept",
  "pay",
];

const READ_WORDS = [
  "读取",
  "导出",
  "获取",
  "提取",
  "查看",
  "搜索结果",
  "read",
  "extract",
  "export",
  "download",
];

const FILL_WORDS = [
  "填写",
  "输入",
  "选择",
  "筛选",
  "勾选",
  "fill",
  "input",
  "select",
  "filter",
];

function normalizeTask(input = {}) {
  const operation = input.operation || {};
  const risk = input.risk || {};
  const template = input.template || {};
  const taskDescription =
    input.task_description ||
    operation.description ||
    input.description ||
    "";

  const normalized = {
    task_name: input.task_name || input.name || "web-skill-task",
    url: input.url || input.target_url || "",
    task_description: taskDescription,
    credential: input.credential || null,
    login_state: input.login_state || { enabled: false },
    challenge: input.challenge || {},
    operation,
    risk: {
      allow_submit: Boolean(risk.allow_submit),
      require_confirmation: risk.require_confirmation !== false,
    },
    output: input.output || { format: ["json"] },
    template: {
      save_if_success: Boolean(template.save_if_success),
      template_name: template.template_name || null,
      reference_skill: template.reference_skill || input.reference_skill || null,
    },
  };

  normalized.task_type = classifyTask(normalized);
  normalized.requires_login = requiresLogin(normalized);
  normalized.expected_challenges = normalizeExpectedChallenges(normalized.challenge);

  return normalized;
}

function classifyTask(task) {
  const description = [
    task.task_name,
    task.task_description,
    JSON.stringify(task.operation || {}),
  ]
    .join(" ")
    .toLowerCase();
  const types = new Set();

  if (task.url && !description.trim()) {
    types.add("login_only");
  }
  if (includesAny(description, READ_WORDS)) {
    types.add(description.includes("搜索") || description.includes("search")
      ? "search_and_extract"
      : "read_data");
  }
  if (includesAny(description, FILL_WORDS)) {
    types.add("form_fill");
  }
  if (description.includes("点击") || description.includes("click")) {
    types.add("click_operation");
  }
  if (includesAny(description, SUBMIT_WORDS)) {
    types.add("submit_task");
  }
  if (task.template.save_if_success || description.includes("生成") || description.includes("保存为")) {
    types.add("generate_skill");
  }
  if (task.template.reference_skill || description.includes("参考") || description.includes("模板")) {
    types.add("replay_template");
  }

  if (types.size === 0) {
    types.add("click_operation");
  }

  return Array.from(types);
}

function requiresLogin(task) {
  if (task.login_state && task.login_state.enabled) {
    return false;
  }
  return Boolean(task.credential || /登录|账号|密码|login/.test(task.task_description));
}

function normalizeExpectedChallenges(challenge = {}) {
  if (Array.isArray(challenge.expected_types)) {
    return challenge.expected_types;
  }
  if (challenge.challenge_type) {
    return [challenge.challenge_type];
  }
  return [];
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word.toLowerCase()));
}

module.exports = {
  classifyTask,
  normalizeTask,
  requiresLogin,
};
