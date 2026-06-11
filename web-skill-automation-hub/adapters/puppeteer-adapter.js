"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { BrowserAdapter } = require("./browser-adapter");

class PuppeteerAdapter extends BrowserAdapter {
  constructor(options = {}) {
    super();
    this.options = options;
    this.browser = null;
    this.page = null;
  }

  async init() {
    if (this.browser) return this;
    const puppeteer = require("puppeteer");
    this.browser = await puppeteer.launch({
      headless: this.options.headless !== false,
      userDataDir: this.options.profileDir,
      defaultViewport: this.options.viewport || { width: 1440, height: 900 },
    });
    this.page = await this.browser.newPage();
    return this;
  }

  async open(url) {
    await this.init();
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async click(selectorOrText) {
    const target = await this.resolveTarget(selectorOrText);
    if (typeof target === "string") {
      await this.page.click(target);
    } else {
      await target.click();
    }
  }

  async fill(selectorOrText, value) {
    const target = await this.resolveTarget(selectorOrText);
    if (typeof target === "string") {
      await this.page.focus(target);
    } else {
      await target.focus();
    }
    await this.page.keyboard.down(process.platform === "darwin" ? "Meta" : "Control");
    await this.page.keyboard.press("KeyA");
    await this.page.keyboard.up(process.platform === "darwin" ? "Meta" : "Control");
    await this.page.keyboard.type(String(value));
  }

  async screenshot(name) {
    const screenshotDir = this.options.screenshotDir || process.cwd();
    fs.mkdirSync(screenshotDir, { recursive: true });
    const filePath = path.join(screenshotDir, `${name}.png`);
    await this.page.screenshot({ path: filePath, fullPage: true });
    return filePath;
  }

  async getText(selector = "body") {
    const target = await this.resolveTarget(selector);
    if (typeof target === "string") {
      return this.page.$eval(target, (element) => element.innerText || element.textContent || "");
    }
    return target.evaluate((element) => element.innerText || element.textContent || "");
  }

  async getDomSnapshot() {
    return {
      url: this.page.url(),
      title: await this.page.title(),
      html: await this.page.content(),
    };
  }

  async waitForLoad() {
    await this.page.waitForNetworkIdle();
  }

  async saveLoginState(name) {
    const profileDir = this.options.stateDir || path.join(process.cwd(), "profiles");
    fs.mkdirSync(profileDir, { recursive: true });
    const filePath = path.join(profileDir, `${name}.cookies.json`);
    const cookies = await this.page.cookies();
    fs.writeFileSync(filePath, `${JSON.stringify(cookies, null, 2)}\n`);
    return filePath;
  }

  async loadLoginState(name) {
    await this.init();
    const profileDir = this.options.stateDir || path.join(process.cwd(), "profiles");
    const filePath = path.join(profileDir, `${name}.cookies.json`);
    const cookies = JSON.parse(fs.readFileSync(filePath, "utf8"));
    await this.page.setCookie(...cookies);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  async resolveTarget(selectorOrText) {
    if (/^[.#\[]|^[a-z]+[.#[]/i.test(selectorOrText)) {
      return selectorOrText;
    }
    const handle = await this.page.evaluateHandle((text) => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      let current = walker.currentNode;
      while (current) {
        if ((current.innerText || "").includes(text)) {
          return current;
        }
        current = walker.nextNode();
      }
      return null;
    }, selectorOrText);
    const element = handle.asElement();
    if (!element) {
      throw new Error(`Could not resolve text target: ${selectorOrText}`);
    }
    return element;
  }
}

module.exports = {
  PuppeteerAdapter,
};
