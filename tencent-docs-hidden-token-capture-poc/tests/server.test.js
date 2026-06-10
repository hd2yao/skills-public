import test from "node:test";
import assert from "node:assert/strict";

import { createSessionStore } from "../src/session-store.js";
import { createServerApp } from "../src/server.js";

function createWorkerStub() {
  return {
    async startSession({ sessionId, targetUrl }) {
      return {
        sessionId,
        targetUrl,
      };
    },
    async finalizeSession({ sessionId }) {
      return {
        token: "9b81b5ee94654228957b5a5f52b1f2dc",
        tokenLast4: "f2dc",
        copiedText: 'TENCENT_DOCS_TOKEN="<redacted>"',
        sessionId,
      };
    },
    async closeSession() {},
  };
}

function createSecureStoreStub() {
  return {
    async saveToken({ sessionId, token, source }) {
      return {
        sessionId,
        tokenLast4: token.slice(-4),
        source,
      };
    },
  };
}

test("server serves the index page", async () => {
  const app = createServerApp({
    config: {
      autoCaptureOnCreate: false,
      loginUrl: "https://docs.qq.com/scenario/open-claw.html?nlc=1",
      publicDir: new URL("../public/", import.meta.url),
    },
    sessionStore: createSessionStore(),
    worker: createWorkerStub(),
    secureStore: createSecureStoreStub(),
  });

  const { baseUrl, close } = await app.listen();
  const response = await fetch(baseUrl);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /腾讯文档隐藏式接入 POC/);

  await close();
});

test("server answers favicon requests without a 404", async () => {
  const app = createServerApp({
    config: {
      autoCaptureOnCreate: false,
      loginUrl: "https://docs.qq.com/scenario/open-claw.html?nlc=1",
      publicDir: new URL("../public/", import.meta.url),
    },
    sessionStore: createSessionStore(),
    worker: createWorkerStub(),
    secureStore: createSecureStoreStub(),
  });

  const { baseUrl, close } = await app.listen();
  const response = await fetch(`${baseUrl}/favicon.ico`);

  assert.equal(response.status, 204);

  await close();
});

test("server creates a session and returns its current state", async () => {
  const app = createServerApp({
    config: {
      autoCaptureOnCreate: false,
      loginUrl: "https://docs.qq.com/scenario/open-claw.html?nlc=1",
      publicDir: new URL("../public/", import.meta.url),
    },
    sessionStore: createSessionStore(),
    worker: createWorkerStub(),
    secureStore: createSecureStoreStub(),
  });

  const { baseUrl, close } = await app.listen();
  const createResponse = await fetch(`${baseUrl}/api/sessions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const createdSession = await createResponse.json();
  assert.equal(createResponse.status, 201);
  assert.equal(createdSession.status, "waiting_login");
  assert.match(createdSession.loginUrl, /docs\.qq\.com/);

  const getResponse = await fetch(`${baseUrl}/api/sessions/${createdSession.id}`);
  const storedSession = await getResponse.json();
  assert.equal(storedSession.id, createdSession.id);
  assert.equal(storedSession.status, "waiting_login");

  await close();
});

test("server can capture token automatically after login session starts", async () => {
  const app = createServerApp({
    config: {
      autoCaptureOnCreate: true,
      loginUrl: "https://docs.qq.com/scenario/open-claw.html?nlc=1",
      publicDir: new URL("../public/", import.meta.url),
    },
    sessionStore: createSessionStore(),
    worker: createWorkerStub(),
    secureStore: createSecureStoreStub(),
  });

  const { baseUrl, close } = await app.listen();
  const createResponse = await fetch(`${baseUrl}/api/sessions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const createdSession = await createResponse.json();

  await new Promise((resolve) => setTimeout(resolve, 10));
  const getResponse = await fetch(`${baseUrl}/api/sessions/${createdSession.id}`);
  const updatedSession = await getResponse.json();

  assert.equal(updatedSession.status, "captured");
  assert.equal(updatedSession.tokenLast4, "f2dc");

  await close();
});

test("server finalizes a session and stores token metadata", async () => {
  const app = createServerApp({
    config: {
      autoCaptureOnCreate: false,
      loginUrl: "https://docs.qq.com/scenario/open-claw.html?nlc=1",
      publicDir: new URL("../public/", import.meta.url),
    },
    sessionStore: createSessionStore(),
    worker: createWorkerStub(),
    secureStore: createSecureStoreStub(),
  });

  const { baseUrl, close } = await app.listen();
  const createResponse = await fetch(`${baseUrl}/api/sessions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const createdSession = await createResponse.json();

  const finalizeResponse = await fetch(
    `${baseUrl}/api/sessions/${createdSession.id}/finalize`,
    {
      method: "POST",
    }
  );
  const finalizedSession = await finalizeResponse.json();

  assert.equal(finalizeResponse.status, 200);
  assert.equal(finalizedSession.status, "captured");
  assert.equal(finalizedSession.tokenLast4, "f2dc");

  await close();
});
