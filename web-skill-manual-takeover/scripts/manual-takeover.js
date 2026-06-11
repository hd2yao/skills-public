"use strict";

function createManualTakeoverPayload(input = {}) {
  const reason = input.reason || "unknown";
  const resumeCondition = input.resume_condition || defaultResumeCondition(reason);
  return {
    success: false,
    manual_takeover_required: true,
    reason,
    source_step: input.source_step || "unknown",
    current_url: input.current_url || null,
    screenshot_path: input.screenshot_path || null,
    resume_condition: resumeCondition,
    status: "waiting_for_user",
    instruction: buildInstruction(reason, resumeCondition),
  };
}

function defaultResumeCondition(reason) {
  if (reason === "sms_otp") return "用户完成短信验证码并页面继续到下一步";
  if (reason === "email_otp") return "用户完成邮箱验证码并页面继续到下一步";
  if (reason === "qr_scan") return "用户完成扫码确认并页面继续到下一步";
  if (reason === "external_approval") return "用户完成外部审批并页面继续到下一步";
  return "用户完成阻塞步骤并页面状态发生可验证变化";
}

function buildInstruction(reason, resumeCondition) {
  return [
    `Manual takeover required: ${reason}.`,
    `Resume condition: ${resumeCondition}.`,
    "Do not record OTPs, approval codes, cookies, or tokens in logs.",
  ].join(" ");
}

if (require.main === module) {
  const input = JSON.parse(process.argv[2] || "{}");
  console.log(JSON.stringify(createManualTakeoverPayload(input), null, 2));
}

module.exports = {
  buildInstruction,
  createManualTakeoverPayload,
  defaultResumeCondition,
};
