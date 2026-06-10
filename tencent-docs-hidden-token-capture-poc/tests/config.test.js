import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { createConfig } from "../src/config.js";

test("createConfig provides stable defaults", () => {
  const config = createConfig({});

  assert.equal(config.port, 4310);
  assert.equal(
    config.loginUrl,
    "https://docs.qq.com/scenario/open-claw.html?nlc=1"
  );
  assert.equal(config.autoCaptureOnCreate, true);
  assert.equal(config.browserHeadless, false);
  assert.equal(config.authTimeoutMs, 300000);
  assert.equal(config.captureTimeoutMs, 60000);
  assert.equal(
    config.publicDir,
    path.resolve(process.cwd(), "public")
  );
});
