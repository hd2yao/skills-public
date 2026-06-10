import test from "node:test";
import assert from "node:assert/strict";

test("planned modules expose stable entry points", async () => {
  const tokenModule = await import("../src/token.js");
  const sessionStoreModule = await import("../src/session-store.js");
  const secureStoreModule = await import("../src/secure-store.js");
  const workerModule = await import("../src/tencent-docs-worker.js");

  assert.equal(typeof tokenModule.extractTokenFromText, "function");
  assert.equal(typeof sessionStoreModule.createSessionStore, "function");
  assert.equal(typeof secureStoreModule.createSecureStore, "function");
  assert.equal(typeof workerModule.createTencentDocsWorker, "function");
});
