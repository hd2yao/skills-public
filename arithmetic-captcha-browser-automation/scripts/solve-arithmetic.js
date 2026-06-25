"use strict";

function solveArithmeticCaptcha(text) {
  const normalized = normalizeExpression(text);
  const match = normalized.match(/(-?\d+)\s*([+\-])\s*(-?\d+)/);
  if (!match) {
    throw new Error(`Could not parse arithmetic captcha: ${text}`);
  }

  const left = Number(match[1]);
  const operator = match[2];
  const right = Number(match[3]);
  if (!Number.isInteger(left) || !Number.isInteger(right)) {
    throw new Error(`Arithmetic captcha values must be integers: ${text}`);
  }
  if (Math.abs(left) > 100 || Math.abs(right) > 100) {
    throw new Error(`Arithmetic captcha values exceed supported range: ${text}`);
  }

  return String(operator === "+" ? left + right : left - right);
}

function normalizeExpression(text) {
  return String(text)
    .replace(/加/g, "+")
    .replace(/减/g, "-")
    .replace(/＋/g, "+")
    .replace(/－/g, "-")
    .replace(/[=?？]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

if (require.main === module) {
  const input = process.argv.slice(2).join(" ");
  try {
    console.log(solveArithmeticCaptcha(input));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  normalizeExpression,
  solveArithmeticCaptcha,
};
