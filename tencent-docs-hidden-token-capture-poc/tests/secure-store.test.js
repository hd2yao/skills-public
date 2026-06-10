import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createSecureStore } from "../src/secure-store.js";

const SAMPLE_TOKEN = "9b81b5ee94654228957b5a5f52b1f2dc";
const SAMPLE_SECRET = "0123456789abcdef0123456789abcdef";

test("secure store encrypts token on disk and can load it back", async () => {
  const baseDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "tdoc-hidden-token-store-")
  );
  const store = createSecureStore({
    baseDir,
    secret: SAMPLE_SECRET,
  });

  const saved = await store.saveToken({
    sessionId: "sess_123",
    token: SAMPLE_TOKEN,
    source: "copy_button",
  });

  assert.equal(saved.tokenLast4, "f2dc");

  const raw = await fs.readFile(path.join(baseDir, "sess_123.json"), "utf8");
  assert.equal(raw.includes(SAMPLE_TOKEN), false);

  const loaded = await store.loadToken("sess_123");
  assert.equal(loaded.token, SAMPLE_TOKEN);
  assert.equal(loaded.source, "copy_button");
  assert.equal(loaded.tokenLast4, "f2dc");
});
