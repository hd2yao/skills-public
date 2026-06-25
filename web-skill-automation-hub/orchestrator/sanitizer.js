"use strict";

const SECRET_KEY_PATTERN = /(password|passwd|token|cookie|secret|credential|otp|captcha|session)/i;

function redactSecrets(value) {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      output[key] = "<redacted>";
    } else {
      output[key] = redactSecrets(child);
    }
  }
  return output;
}

module.exports = {
  redactSecrets,
};
