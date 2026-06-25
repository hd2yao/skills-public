"use strict";

const assert = require("node:assert/strict");
const {
  normalizeExpression,
  solveArithmeticCaptcha,
} = require("./solve-arithmetic");

assert.equal(normalizeExpression("12 加 8 = ?"), "12 + 8");
assert.equal(solveArithmeticCaptcha("12 + 8 = ?"), "20");
assert.equal(solveArithmeticCaptcha("30减7"), "23");
assert.equal(solveArithmeticCaptcha("5 - 9 ="), "-4");
assert.throws(() => solveArithmeticCaptcha("abc"), /Could not parse/);
assert.throws(() => solveArithmeticCaptcha("101 + 1"), /exceed/);

console.log("solve-arithmetic tests ok");
