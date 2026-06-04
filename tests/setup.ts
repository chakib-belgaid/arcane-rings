import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

class TestAudio {
  loop = false;
  preload = "";
  volume = 1;
  playbackRate = 1;

  constructor(public src = "") {}

  play() {
    return Promise.resolve();
  }

  pause() {}
}

Object.defineProperty(dom.window, "Audio", {
  value: TestAudio,
  configurable: true,
});

Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  Audio: { value: TestAudio, configurable: true },
  HTMLElement: { value: dom.window.HTMLElement, configurable: true },
  HTMLButtonElement: { value: dom.window.HTMLButtonElement, configurable: true },
  HTMLInputElement: { value: dom.window.HTMLInputElement, configurable: true },
  Node: { value: dom.window.Node, configurable: true },
  MutationObserver: { value: dom.window.MutationObserver, configurable: true },
  getComputedStyle: { value: dom.window.getComputedStyle.bind(dom.window), configurable: true },
});
