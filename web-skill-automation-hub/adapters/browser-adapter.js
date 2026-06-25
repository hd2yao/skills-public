"use strict";

class BrowserAdapter {
  async open(_url) {
    throw new Error("open() is not implemented");
  }

  async click(_selectorOrText) {
    throw new Error("click() is not implemented");
  }

  async fill(_selectorOrText, _value) {
    throw new Error("fill() is not implemented");
  }

  async screenshot(_name) {
    throw new Error("screenshot() is not implemented");
  }

  async getText(_selector) {
    throw new Error("getText() is not implemented");
  }

  async getDomSnapshot() {
    throw new Error("getDomSnapshot() is not implemented");
  }

  async waitForLoad() {
    throw new Error("waitForLoad() is not implemented");
  }

  async saveLoginState(_name) {
    throw new Error("saveLoginState() is not implemented");
  }

  async loadLoginState(_name) {
    throw new Error("loadLoginState() is not implemented");
  }

  async close() {}
}

function resolveTarget(page, selectorOrText) {
  if (/^[.#\[]|^[a-z]+[.#[]/i.test(selectorOrText)) {
    return page.locator(selectorOrText).first();
  }
  return page.getByText(selectorOrText, { exact: false }).first();
}

module.exports = {
  BrowserAdapter,
  resolveTarget,
};
