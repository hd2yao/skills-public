"use strict";

const assert = require("node:assert/strict");
const {
  createManualTakeoverPayload,
  defaultResumeCondition,
} = require("./manual-takeover");

assert.equal(defaultResumeCondition("sms_otp"), "用户完成短信验证码并页面继续到下一步");

const payload = createManualTakeoverPayload({
  reason: "qr_scan",
  current_url: "https://example.com/login",
});

assert.equal(payload.success, false);
assert.equal(payload.manual_takeover_required, true);
assert.equal(payload.status, "waiting_for_user");
assert.ok(payload.instruction.includes("Do not record OTPs"));

console.log("manual-takeover tests ok");
