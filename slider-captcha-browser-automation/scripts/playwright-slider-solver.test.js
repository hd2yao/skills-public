"use strict";

const assert = require("node:assert/strict");
const {
  solveSliderWithRetries,
} = require("./playwright-slider-solver");

async function run() {
  const sliderState = {
    latestCreate: null,
    latestVerify: null,
    history: [],
  };
  const verifies = [
    { code: "000014", data: false, info: "校验失败" },
    { code: "000000", data: true, info: "校验成功" },
  ];
  const captchaCreates = [
    { data: { captchaKey: "first", cutImage: "cut-1", dealImage: "bg-1" } },
    { data: { captchaKey: "second", cutImage: "cut-2", dealImage: "bg-2" } },
  ];
  let evaluateCount = 0;
  const draggedDistances = [];

  const page = {
    async evaluate() {
      evaluateCount += 1;
      return {
        bestX: evaluateCount === 1 ? 104 : 125,
        bestScore: 100,
      };
    },
    async waitForTimeout() {},
    mouse: {
      async move() {},
      async down() {},
      async up() {
        const verify = verifies.shift();
        sliderState.latestVerify = verify;
        sliderState.history.push({
          type: "verify",
          code: verify.code,
        });
        if (verify.code !== "000000") {
          const create = captchaCreates.shift();
          sliderState.latestCreate = create;
          sliderState.history.push({ type: "create" });
        }
      },
    },
    locator() {
      return {
        first() {
          return this;
        },
        async boundingBox() {
          return { x: 10, y: 20, width: 40, height: 40 };
        },
      };
    },
  };

  sliderState.latestCreate = captchaCreates.shift();
  sliderState.history.push({ type: "create" });

  const result = await solveSliderWithRetries(page, sliderState, {
    handleSelector: ".slider",
    compensationCandidates: [25, 0, -5],
    dragOptions: {
      steps: 1,
      minStepDelayMs: 0,
      maxStepDelayMs: 0,
      settleDelayMs: 0,
    },
    verifyWaitTimeoutMs: 100,
    createWaitTimeoutMs: 100,
  });

  for (const attempt of result.attempts) {
    draggedDistances.push(attempt.dragDistance);
  }

  assert.equal(result.success, true);
  assert.equal(result.attempts.length, 2);
  assert.deepEqual(
    result.attempts.map((attempt) => attempt.compensation),
    [25, 0],
  );
  assert.deepEqual(draggedDistances, [129, 125]);
  assert.equal(result.verify.code, "000000");
}

run()
  .then(() => {
    console.log("playwright-slider-solver tests ok");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
