"use strict";

const HIGH_RISK_ACTIONS = new Set([
  "submit",
  "publish",
  "delete",
  "accept",
  "pay",
  "transfer",
  "batch_update",
  "final_confirm",
]);

const HIGH_RISK_TEXT = /(提交|发布|删除|接受|结束制作|支付|下单|转账|批量|submit|publish|delete|accept|pay)/i;

function isSubmitLike(stepOrText) {
  if (typeof stepOrText === "string") {
    return HIGH_RISK_TEXT.test(stepOrText);
  }

  if (!stepOrText || typeof stepOrText !== "object") {
    return false;
  }

  if (stepOrText.action && HIGH_RISK_ACTIONS.has(stepOrText.action)) {
    return true;
  }

  return HIGH_RISK_TEXT.test(
    [stepOrText.title, stepOrText.target, stepOrText.description]
      .filter(Boolean)
      .join(" "),
  );
}

function buildSubmitGate(task, step) {
  const allowSubmit = Boolean(task.risk && task.risk.allow_submit);
  const requireConfirmation = !task.risk || task.risk.require_confirmation !== false;

  return {
    required: isSubmitLike(step),
    allow_submit: allowSubmit,
    require_confirmation: requireConfirmation,
    can_execute: allowSubmit && !requireConfirmation,
    reason: allowSubmit
      ? "submit action allowed by task risk config"
      : "submit action requires explicit user approval",
  };
}

function assertSubmitAllowed(task, step) {
  const gate = buildSubmitGate(task, step);
  if (!gate.required) {
    return gate;
  }
  if (!gate.allow_submit) {
    throw new Error(`Submit-like action blocked before approval: ${step.title || step.target || step.action}`);
  }
  return gate;
}

module.exports = {
  buildSubmitGate,
  isSubmitLike,
  assertSubmitAllowed,
};
