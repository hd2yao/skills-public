"use strict";

const { buildSubmitGate } = require("./risk-checker");

function generatePlan(task, registry = { skills: [] }) {
  const skillNames = new Set(registry.skills.map((skill) => skill.name));
  const steps = [];

  steps.push(step({
    id: "normalize",
    title: "Normalize task",
    selected_skill: "web-skill-automation-hub",
    purpose: "标准化输入、识别任务类型、风险和输出要求。",
    success_signal: "task.json 写入运行目录。",
  }));

  steps.push(step({
    id: "open-browser",
    title: "Open browser state",
    selected_skill: "browser-adapter",
    purpose: "打开目标 URL 或加载登录态。",
    success_signal: "当前 URL 可访问并保存首屏截图。",
  }));

  if (task.requires_login) {
    steps.push(step({
      id: "login",
      title: "Login",
      selected_skill: choose(skillNames, "web-skill-generic-login"),
      purpose: "使用授权凭据或登录态完成网页登录。",
      success_signal: "登录后 URL、身份接口或页面用户信息可验证。",
    }));
  }

  steps.push(step({
    id: "challenge-route",
    title: "Detect and route challenge",
    selected_skill: choose(skillNames, "web-skill-challenge-router"),
    purpose: "判断是否出现滑块、算术验证码、OTP、扫码或外部审批。",
    success_signal: "无验证阻塞，或返回可处理验证结果。",
  }));

  if (task.expected_challenges.includes("slider_puzzle")) {
    steps.push(step({
      id: "slider-challenge",
      title: "Solve slider challenge",
      selected_skill: choose(skillNames, "slider-captcha-browser-automation"),
      purpose: "处理滑块拼图验证。",
      success_signal: "后端 verify 响应成功。",
    }));
  }

  if (task.expected_challenges.includes("arithmetic")) {
    steps.push(step({
      id: "arithmetic-challenge",
      title: "Solve arithmetic challenge",
      selected_skill: choose(skillNames, "arithmetic-captcha-browser-automation"),
      purpose: "处理 100 以内加减法验证码。",
      success_signal: "验证码答案提交后页面继续。",
    }));
  }

  steps.push(step({
    id: "page-workflow",
    title: "Execute page workflow",
    selected_skill: choose(skillNames, "web-skill-page-workflow"),
    purpose: "执行导航、点击、输入、筛选、翻页、读取等低风险页面步骤。",
    success_signal: "目标页面状态或提取结果符合任务要求。",
  }));

  if (task.task_type.includes("submit_task")) {
    const submitStep = step({
      id: "submit-guard",
      title: "Submit confirmation gate",
      selected_skill: choose(skillNames, "web-skill-submit-guard"),
      purpose: "最终提交前展示摘要、截图和风险信息，等待明确确认。",
      success_signal: "用户明确确认后才执行一次最终提交。",
      risk_level: "high",
    });
    submitStep.submit_gate = buildSubmitGate(task, submitStep);
    steps.push(submitStep);
  }

  steps.push(step({
    id: "save-result",
    title: "Save result",
    selected_skill: "web-skill-automation-hub",
    purpose: "保存 result.json、report.md、截图索引和错误报告。",
    success_signal: "运行目录完整可复盘。",
  }));

  if (task.template.save_if_success || task.task_type.includes("generate_skill")) {
    steps.push(step({
      id: "template-draft",
      title: "Generate flow template or child skill draft",
      selected_skill: choose(skillNames, "web-skill-flow-builder", "web-skill-template-draft"),
      purpose: "从成功运行记录生成 flow.yaml 或流程子 Skill 草稿。",
      success_signal: "模板或 Skill 草稿不含敏感信息并标记验证状态。",
    }));
  }

  return {
    task_name: task.task_name,
    task_type: task.task_type,
    steps,
  };
}

function step(fields) {
  return {
    risk_level: "medium",
    screenshot: true,
    on_failure: "capture_screenshot_and_stop",
    ...fields,
  };
}

function choose(skillNames, preferred, fallback = null) {
  if (skillNames.has(preferred)) {
    return preferred;
  }
  if (fallback && skillNames.has(fallback)) {
    return fallback;
  }
  return preferred;
}

module.exports = {
  generatePlan,
};
