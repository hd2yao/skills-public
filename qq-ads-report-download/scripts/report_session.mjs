#!/usr/bin/env node

import fs from "node:fs";
import { createRequire } from "node:module";
import process from "node:process";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const defaultPlaywrightModulePath =
  "/Users/dysania/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

async function loadPlaywright() {
  if (process.env.PLAYWRIGHT_MODULE_PATH) {
    return import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href);
  }

  try {
    return require("playwright");
  } catch {
    if (fs.existsSync(defaultPlaywrightModulePath)) {
      return import(pathToFileURL(defaultPlaywrightModulePath).href);
    }
  }

  throw new Error(
    "Playwright was not found. Install playwright locally or set PLAYWRIGHT_MODULE_PATH.",
  );
}

const { chromium } = await loadPlaywright();

function parseArgs(argv) {
  const args = {
    endpoint: "http://127.0.0.1:9222",
    reportUrl: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help") {
      console.log(
        "Usage: report_session.mjs [--endpoint http://127.0.0.1:9222] --report-url <url>",
      );
      process.exit(0);
    } else if (arg === "--endpoint") {
      args.endpoint = argv[i + 1];
      i += 1;
    } else if (arg === "--report-url") {
      args.reportUrl = argv[i + 1];
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.reportUrl) {
    throw new Error("--report-url is required");
  }

  return args;
}

function matchesReportPage(url, reportUrl) {
  return url.startsWith(reportUrl) || /ad\.qq\.com\/atlas\/\d+\/report/.test(url);
}

function inferLoginRequired(url, title, text) {
  const loginUrl = /(sso\.e\.qq\.com|graph\.qq\.com|ad\.qq\.com\/ap\/sso)/.test(url);
  const loginText = /(登录|授权|扫码|微信快捷登录|QQ登录)/.test(text);
  const loginTitle = /(登录|授权)/.test(title);
  return loginUrl || loginText || loginTitle;
}

async function findPage(browser, reportUrl, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const contexts = browser.contexts();
    const pages = contexts.flatMap((context) => context.pages());
    const matched = pages.find((candidate) =>
      matchesReportPage(candidate.url(), reportUrl),
    );

    if (matched) {
      return matched;
    }

    if (pages[0]) {
      return pages[0];
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return null;
}

const args = parseArgs(process.argv.slice(2));
const browser = await chromium.connectOverCDP(args.endpoint);

try {
  const page = await findPage(browser, args.reportUrl);

  if (!page) {
    throw new Error("No Chrome pages were found on the CDP endpoint.");
  }

  await page.bringToFront();
  await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});

  const url = page.url();
  const title = await page.title().catch(() => "");
  const bodyText = await page.locator("body").innerText().catch(() => "");
  const loginRequired = inferLoginRequired(url, title, bodyText);
  const alreadyLoggedIn = !loginRequired && /ad\.qq\.com\/(lite|atlas)\//.test(url);

  const payload = {
    endpoint: args.endpoint,
    reportUrl: args.reportUrl,
    currentUrl: url,
    title,
    loginRequired,
    alreadyLoggedIn,
    reason: loginRequired
      ? "The debug Chrome session is at a login or authorization page."
      : alreadyLoggedIn
        ? "The debug Chrome session already has a valid login state."
        : "The debug Chrome session is open, but the page state should be checked manually.",
  };

  console.log(JSON.stringify(payload, null, 2));
} finally {
  await browser.close();
}
