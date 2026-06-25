"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { BrowserAdapter, resolveTarget } = require("./browser-adapter");

class PlaywrightAdapter extends BrowserAdapter {
  constructor(options = {}) {
    super();
    this.options = options;
    this.context = null;
    this.page = null;
  }

  async init() {
    if (this.context) return this;
    const { chromium } = require("playwright");
    this.context = await chromium.launchPersistentContext(
      this.options.profileDir || "",
      {
        headless: this.options.headless !== false,
        viewport: this.options.viewport || { width: 1440, height: 900 },
        channel: this.options.channel,
      },
    );
    this.page = this.context.pages()[0] || await this.context.newPage();
    return this;
  }

  async open(url) {
    await this.init();
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async click(selectorOrText) {
    await resolveTarget(this.page, selectorOrText).click();
  }

  async fill(selectorOrText, value) {
    await resolveTarget(this.page, selectorOrText).fill(value);
  }

  async screenshot(name) {
    const screenshotDir = this.options.screenshotDir || process.cwd();
    fs.mkdirSync(screenshotDir, { recursive: true });
    const filePath = path.join(screenshotDir, `${name}.png`);
    await this.page.screenshot({ path: filePath, fullPage: true });
    return filePath;
  }

  async getText(selector) {
    if (!selector) {
      return this.page.locator("body").innerText();
    }
    return resolveTarget(this.page, selector).innerText();
  }

  async getDomSnapshot() {
    return {
      url: this.page.url(),
      title: await this.page.title(),
      html: await this.page.content(),
    };
  }

  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async saveLoginState(name) {
    const profileDir = this.options.stateDir || path.join(process.cwd(), "profiles");
    fs.mkdirSync(profileDir, { recursive: true });
    const filePath = path.join(profileDir, `${name}.storage-state.json`);
    await this.context.storageState({ path: filePath });
    return filePath;
  }

  async loadLoginState(_name) {
    throw new Error("Playwright storage state must be loaded before context creation");
  }

  async close() {
    if (this.context) {
      await this.context.close();
      this.context = null;
      this.page = null;
    }
  }
}

module.exports = {
  PlaywrightAdapter,
};
