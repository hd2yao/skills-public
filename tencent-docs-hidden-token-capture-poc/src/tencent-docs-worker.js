import { extractTokenFromText, redactSecrets } from "./token.js";

const COPY_BUTTON_NAME = "复制";
const TOKEN_SECTION_TEXT = "如遇token泄露";
const LOGIN_BUTTON_NAME = "登录腾讯文档";
const AVATAR_IMAGE_NAME = "头像";

export function inferAuthState({
  hasAvatar,
  hasLoginButton,
  hasCopyButton,
}) {
  if (hasCopyButton) {
    return "capture_ready";
  }
  if (hasAvatar && !hasLoginButton) {
    return "authenticated";
  }
  return "waiting_login";
}

export function pickBestCopiedText(copiedTexts) {
  if (!Array.isArray(copiedTexts)) {
    return null;
  }

  const usableTexts = copiedTexts.filter(
    (value) => typeof value === "string" && extractTokenFromText(value)
  );
  if (!usableTexts.length) {
    return null;
  }

  const bareToken = usableTexts.find((value) => extractTokenFromText(value) === value.trim());
  return bareToken || usableTexts[usableTexts.length - 1];
}

function clipboardInitScript() {
  return () => {
    const copied = [];
    window.__capturedCopies = copied;
    window.__lastCopiedText = "";

    if (!navigator.clipboard?.writeText) {
      return;
    }

    const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = async (text) => {
      copied.push(text);
      window.__lastCopiedText = text;
      return originalWriteText(text);
    };
  };
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    throw new Error(
      "Playwright is not installed. Run `npm install` in tencent-docs-hidden-token-capture-poc first."
    );
  }
}

async function readSignals(page) {
  const hasAvatar = (await page.getByRole("img", { name: AVATAR_IMAGE_NAME }).count()) > 0;
  const hasLoginButton =
    (await page.getByRole("button", { name: LOGIN_BUTTON_NAME }).count()) > 0;
  const hasCopyButton = (await page.getByRole("button", { name: COPY_BUTTON_NAME }).count()) > 0;

  return {
    hasAvatar,
    hasLoginButton,
    hasCopyButton,
  };
}

async function waitForState(page, predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const signals = await readSignals(page);
    const state = inferAuthState(signals);
    if (predicate(state, signals)) {
      return { state, signals };
    }
    await page.waitForTimeout(1000);
  }

  throw new Error("Timed out waiting for Tencent Docs page state");
}

async function readCopiedTexts(page) {
  return page.evaluate(() => window.__capturedCopies || []);
}

async function clickPreferredCopyButton(page) {
  const tokenSection = page.getByText(TOKEN_SECTION_TEXT);
  if ((await tokenSection.count()) > 0) {
    const copyButtons = page.getByRole("button", { name: COPY_BUTTON_NAME });
    if ((await copyButtons.count()) >= 3) {
      await copyButtons.nth(2).click();
      return;
    }
  }

  await page.getByRole("button", { name: COPY_BUTTON_NAME }).first().click();
}

export function createTencentDocsWorker({
  loginUrl,
  browserHeadless = false,
  authTimeoutMs = 300000,
  captureTimeoutMs = 60000,
  logger = console,
} = {}) {
  const runtimes = new Map();

  return {
    async startSession({ sessionId, targetUrl = loginUrl }) {
      const { chromium } = await loadPlaywright();
      const browser = await chromium.launch({ headless: browserHeadless });
      const context = await browser.newContext();
      await context.addInitScript(clipboardInitScript());
      const page = await context.newPage();
      await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

      runtimes.set(sessionId, { browser, context, page, targetUrl });
      return { sessionId, targetUrl };
    },

    async finalizeSession({ sessionId, targetUrl = loginUrl }) {
      const runtime = runtimes.get(sessionId);
      if (!runtime) {
        throw new Error(`Unknown session: ${sessionId}`);
      }

      const { page } = runtime;
      await waitForState(
        page,
        (state) => state === "authenticated" || state === "capture_ready",
        authTimeoutMs
      );

      if (page.url() !== targetUrl) {
        await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
      }

      await waitForState(page, (state) => state === "capture_ready", captureTimeoutMs);
      await clickPreferredCopyButton(page);
      await page.waitForTimeout(500);

      const copiedText = pickBestCopiedText(await readCopiedTexts(page));
      const token = extractTokenFromText(copiedText);
      if (!token) {
        throw new Error("Unable to extract Tencent Docs token from copied text");
      }

      logger.info?.("Captured Tencent Docs token", {
        sessionId,
        copiedText: redactSecrets(copiedText),
      });

      return {
        token,
        tokenLast4: token.slice(-4),
        copiedText: redactSecrets(copiedText),
      };
    },

    async closeSession(sessionId) {
      const runtime = runtimes.get(sessionId);
      if (!runtime) {
        return;
      }

      runtimes.delete(sessionId);
      await runtime.context.close();
      await runtime.browser.close();
    },
  };
}
