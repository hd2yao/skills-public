# Tencent Docs Hidden Token Capture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local POC service that lets a user log into Tencent Docs in a controlled browser session, then hides the post-login steps while the backend captures and stores the MCP token.

**Architecture:** Create a small Node.js service with an HTML frontend and a Playwright-backed worker. The frontend starts a session and polls status, while the backend launches a headed browser for login, detects authenticated state, navigates to the `open-claw` page, intercepts copied token text, validates the token shape, and stores an encrypted artifact on disk.

**Tech Stack:** Node.js, Express, Playwright, built-in `node:test`, Web Crypto / `crypto`

---

### Task 1: Bootstrap the POC service

**Files:**
- Create: `tencent-docs-hidden-token-capture-poc/package.json`
- Create: `tencent-docs-hidden-token-capture-poc/src/`
- Create: `tencent-docs-hidden-token-capture-poc/public/`
- Create: `tencent-docs-hidden-token-capture-poc/tests/`

**Step 1: Write the failing test**

Create a smoke test that expects core modules to export the planned functions.

**Step 2: Run test to verify it fails**

Run: `cd tencent-docs-hidden-token-capture-poc && npm test`
Expected: FAIL because modules do not exist yet.

**Step 3: Write minimal implementation**

Add `package.json` and placeholder modules so tests can target stable paths.

**Step 4: Run test to verify it passes**

Run: `cd tencent-docs-hidden-token-capture-poc && npm test`
Expected: PASS for module existence checks.

**Step 5: Commit**

```bash
git add tencent-docs-hidden-token-capture-poc/package.json tencent-docs-hidden-token-capture-poc/src tencent-docs-hidden-token-capture-poc/tests
git commit -m "chore: bootstrap Tencent Docs token capture POC"
```

### Task 2: Implement token parsing and redaction

**Files:**
- Create: `tencent-docs-hidden-token-capture-poc/src/token.js`
- Create: `tencent-docs-hidden-token-capture-poc/tests/token.test.js`

**Step 1: Write the failing test**

Cover:
- extracting a bare token from copied text
- extracting a token from an install command
- rejecting unrelated text
- redacting tokens for logs

**Step 2: Run test to verify it fails**

Run: `cd tencent-docs-hidden-token-capture-poc && npm test -- tests/token.test.js`
Expected: FAIL with missing exports or incorrect parsing.

**Step 3: Write minimal implementation**

Implement `extractTokenFromText`, `extractInstallCommandToken`, and `redactSecrets`.

**Step 4: Run test to verify it passes**

Run: `cd tencent-docs-hidden-token-capture-poc && npm test -- tests/token.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add tencent-docs-hidden-token-capture-poc/src/token.js tencent-docs-hidden-token-capture-poc/tests/token.test.js
git commit -m "feat: add token parsing and redaction helpers"
```

### Task 3: Implement session state and encrypted token storage

**Files:**
- Create: `tencent-docs-hidden-token-capture-poc/src/session-store.js`
- Create: `tencent-docs-hidden-token-capture-poc/src/secure-store.js`
- Create: `tencent-docs-hidden-token-capture-poc/tests/session-store.test.js`
- Create: `tencent-docs-hidden-token-capture-poc/tests/secure-store.test.js`

**Step 1: Write the failing test**

Cover:
- session lifecycle creation/update/lookup
- persistence payload includes redacted metadata, not plaintext logs
- token encryption/decryption round-trip

**Step 2: Run test to verify it fails**

Run: `cd tencent-docs-hidden-token-capture-poc && npm test -- tests/session-store.test.js tests/secure-store.test.js`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement an in-memory session store and a file-backed encrypted token store under `data/`.

**Step 4: Run test to verify it passes**

Run: `cd tencent-docs-hidden-token-capture-poc && npm test -- tests/session-store.test.js tests/secure-store.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add tencent-docs-hidden-token-capture-poc/src/session-store.js tencent-docs-hidden-token-capture-poc/src/secure-store.js tencent-docs-hidden-token-capture-poc/tests/session-store.test.js tencent-docs-hidden-token-capture-poc/tests/secure-store.test.js
git commit -m "feat: add session and secure token storage"
```

### Task 4: Implement Playwright capture worker

**Files:**
- Create: `tencent-docs-hidden-token-capture-poc/src/tencent-docs-worker.js`
- Create: `tencent-docs-hidden-token-capture-poc/src/config.js`
- Create: `tencent-docs-hidden-token-capture-poc/tests/tencent-docs-worker.test.js`

**Step 1: Write the failing test**

Test pure worker helpers:
- login state detection from page signals
- token selection priority
- copy interception fallback logic

**Step 2: Run test to verify it fails**

Run: `cd tencent-docs-hidden-token-capture-poc && npm test -- tests/tencent-docs-worker.test.js`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement:
- headed browser launch
- clipboard interception injection
- authenticated page detection
- token capture from either token copy or install command copy

**Step 4: Run test to verify it passes**

Run: `cd tencent-docs-hidden-token-capture-poc && npm test -- tests/tencent-docs-worker.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add tencent-docs-hidden-token-capture-poc/src/tencent-docs-worker.js tencent-docs-hidden-token-capture-poc/src/config.js tencent-docs-hidden-token-capture-poc/tests/tencent-docs-worker.test.js
git commit -m "feat: add Tencent Docs browser capture worker"
```

### Task 5: Implement HTTP server and frontend

**Files:**
- Create: `tencent-docs-hidden-token-capture-poc/src/server.js`
- Create: `tencent-docs-hidden-token-capture-poc/public/index.html`
- Create: `tencent-docs-hidden-token-capture-poc/public/app.js`
- Create: `tencent-docs-hidden-token-capture-poc/public/styles.css`
- Create: `tencent-docs-hidden-token-capture-poc/tests/server.test.js`

**Step 1: Write the failing test**

Cover:
- session creation API
- status polling API
- static index response
- finalize flow triggers worker handoff

**Step 2: Run test to verify it fails**

Run: `cd tencent-docs-hidden-token-capture-poc && npm test -- tests/server.test.js`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement:
- `POST /api/sessions`
- `POST /api/sessions/:id/finalize`
- `GET /api/sessions/:id`
- static frontend with login instructions and progress states

**Step 4: Run test to verify it passes**

Run: `cd tencent-docs-hidden-token-capture-poc && npm test -- tests/server.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add tencent-docs-hidden-token-capture-poc/src/server.js tencent-docs-hidden-token-capture-poc/public tencent-docs-hidden-token-capture-poc/tests/server.test.js
git commit -m "feat: add POC server and frontend"
```

### Task 6: Verify end-to-end developer flow

**Files:**
- Modify: `tencent-docs-hidden-token-capture-poc/package.json`
- Create: `tencent-docs-hidden-token-capture-poc/.env.example`
- Create: `tencent-docs-hidden-token-capture-poc/data/.gitignore`

**Step 1: Write the failing test**

Add one small config validation test covering required environment defaults.

**Step 2: Run test to verify it fails**

Run: `cd tencent-docs-hidden-token-capture-poc && npm test`
Expected: FAIL on missing config contract.

**Step 3: Write minimal implementation**

Add npm scripts, developer defaults, and ignore runtime token artifacts.

**Step 4: Run test to verify it passes**

Run: `cd tencent-docs-hidden-token-capture-poc && npm test`
Expected: PASS.

**Step 5: Commit**

```bash
git add tencent-docs-hidden-token-capture-poc/package.json tencent-docs-hidden-token-capture-poc/.env.example tencent-docs-hidden-token-capture-poc/data/.gitignore
git commit -m "chore: finalize Tencent Docs POC developer flow"
```
