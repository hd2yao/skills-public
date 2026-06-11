"use strict";

function createBrowserAdapter(kind, options = {}) {
  if (kind === "playwright") {
    const { PlaywrightAdapter } = require("./playwright-adapter");
    return new PlaywrightAdapter(options);
  }
  if (kind === "puppeteer") {
    const { PuppeteerAdapter } = require("./puppeteer-adapter");
    return new PuppeteerAdapter(options);
  }
  throw new Error(`Unsupported browser adapter: ${kind}`);
}

module.exports = {
  createBrowserAdapter,
};
