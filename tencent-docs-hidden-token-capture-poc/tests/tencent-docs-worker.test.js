import test from "node:test";
import assert from "node:assert/strict";

import {
  inferAuthState,
  pickBestCopiedText,
} from "../src/tencent-docs-worker.js";

const SAMPLE_TOKEN = "9b81b5ee94654228957b5a5f52b1f2dc";

test("inferAuthState marks session as authenticated when avatar is present", () => {
  assert.equal(
    inferAuthState({
      hasAvatar: true,
      hasLoginButton: false,
      hasCopyButton: false,
    }),
    "authenticated"
  );
});

test("inferAuthState marks session as capture_ready when copy actions are present", () => {
  assert.equal(
    inferAuthState({
      hasAvatar: true,
      hasLoginButton: false,
      hasCopyButton: true,
    }),
    "capture_ready"
  );
});

test("pickBestCopiedText prefers a bare token over an install command", () => {
  const installCommand =
    'https://cdn.addon.tencentsuite.com/static/tencent-docs.zip ... TENCENT_DOCS_TOKEN="' +
    SAMPLE_TOKEN +
    '"';

  assert.equal(
    pickBestCopiedText([installCommand, SAMPLE_TOKEN]),
    SAMPLE_TOKEN
  );
});

test("pickBestCopiedText falls back to install command token copy", () => {
  const installCommand =
    'https://cdn.addon.tencentsuite.com/static/tencent-docs.zip ... TENCENT_DOCS_TOKEN="' +
    SAMPLE_TOKEN +
    '"';

  assert.equal(pickBestCopiedText([installCommand]), installCommand);
});

test("pickBestCopiedText returns null for unusable clipboard history", () => {
  assert.equal(pickBestCopiedText(["hello world"]), null);
});
