import test from "node:test";
import assert from "node:assert/strict";

import { createSessionStore } from "../src/session-store.js";

test("session store creates and updates session state", () => {
  const store = createSessionStore({
    now: () => "2026-05-07T15:40:00.000Z",
  });

  const session = store.createSession({
    id: "sess_123",
    loginUrl: "https://docs.qq.com/scenario/open-claw.html?nlc=1",
  });

  assert.deepEqual(session, {
    id: "sess_123",
    status: "waiting_login",
    loginUrl: "https://docs.qq.com/scenario/open-claw.html?nlc=1",
    tokenLast4: null,
    error: null,
    createdAt: "2026-05-07T15:40:00.000Z",
    updatedAt: "2026-05-07T15:40:00.000Z",
  });

  const updated = store.updateSession("sess_123", {
    status: "captured",
    tokenLast4: "f2dc",
  });

  assert.equal(updated.status, "captured");
  assert.equal(updated.tokenLast4, "f2dc");
  assert.equal(store.getSession("sess_123").status, "captured");
});

test("session store returns null for unknown session", () => {
  const store = createSessionStore();
  assert.equal(store.getSession("missing"), null);
});
