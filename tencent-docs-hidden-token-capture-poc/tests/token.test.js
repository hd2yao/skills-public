import test from "node:test";
import assert from "node:assert/strict";

import { extractTokenFromText, redactSecrets } from "../src/token.js";

const SAMPLE_TOKEN = "9b81b5ee94654228957b5a5f52b1f2dc";

test("extractTokenFromText returns a bare token", () => {
  assert.equal(extractTokenFromText(SAMPLE_TOKEN), SAMPLE_TOKEN);
});

test("extractTokenFromText returns a token embedded in an install command", () => {
  const command =
    "https://cdn.addon.tencentsuite.com/static/tencent-docs.zip 下载 zip 包并 unzip 解压，帮我安装这个 skills，然后设置环境变量TENCENT_DOCS_TOKEN=\"" +
    SAMPLE_TOKEN +
    "\"。";

  assert.equal(extractTokenFromText(command), SAMPLE_TOKEN);
});

test("extractTokenFromText returns null for unrelated text", () => {
  assert.equal(extractTokenFromText("hello world"), null);
});

test("redactSecrets masks both command and bare token output", () => {
  const command =
    "TENCENT_DOCS_TOKEN=\"" + SAMPLE_TOKEN + "\" and token: " + SAMPLE_TOKEN;

  assert.equal(
    redactSecrets(command),
    'TENCENT_DOCS_TOKEN="<redacted>" and token: <redacted>'
  );
});
