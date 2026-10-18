const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "../scripts.js"), "utf8");
const fragments = {
  "/_includes/_nav.html": "site-header",
  "/_includes/_sidebars.html": "site-sidebars",
  "/_includes/_footer-modal.html": "site-chrome-bottom",
};

function element(attributes = {}) {
  const classes = new Set();
  return {
    attributes: { ...attributes },
    innerHTML: "Static fallback links",
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    getAttribute(name) {
      return this.attributes[name] ?? null;
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    querySelectorAll() {
      return [];
    },
    focus() {
      this.focused = true;
    },
    classList: {
      toggle(name, enabled) {
        enabled ? classes.add(name) : classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
  };
}

function setup({ storageDenied = false, savedTheme = null, fetchImpl } = {}) {
  const elements = Object.fromEntries(
    [
      ...Object.values(fragments),
      "nav-logo",
      "theme-toggle",
      "nav-toggle",
      "navbarNav",
    ].map((id) => [id, element()]),
  );
  elements["nav-toggle"].setAttribute("aria-expanded", "false");
  const links = ["/", "/projects/", "/about/", "/assets/pdf/cv.pdf"].map(
    (href) => element({ href }),
  );
  const root = element();
  let onReady;
  let storedTheme = savedTheme;
  const context = vm.createContext({
    document: {
      documentElement: root,
      getElementById: (id) => elements[id] ?? null,
      querySelectorAll: (selector) =>
        selector === "#site-header a[href]" ? links : [],
      addEventListener: (event, listener) => {
        if (event === "DOMContentLoaded") onReady = listener;
      },
    },
    location: { pathname: "/projects/index.html" },
    localStorage: {
      getItem() {
        if (storageDenied) throw new Error("SecurityError");
        return storedTheme;
      },
      setItem(key, value) {
        if (storageDenied) throw new Error("SecurityError");
        storedTheme = value;
      },
    },
    fetch:
      fetchImpl ||
      (async (url) => ({ ok: true, text: async () => `Loaded ${url}` })),
    console: { warn() {} },
  });
  vm.runInContext(script, context);
  return {
    elements,
    root,
    links,
    ready: () => onReady(),
    storedTheme: () => storedTheme,
  };
}

test("denied storage does not block chrome or theme switching", async () => {
  const page = setup({ storageDenied: true });
  await page.ready();
  assert.equal(page.root.getAttribute("data-theme"), "dark");
  for (const id of Object.values(fragments))
    assert.match(page.elements[id].innerHTML, /^Loaded /);
  page.elements["theme-toggle"].onclick();
  assert.equal(page.root.getAttribute("data-theme"), "light");
  assert.equal(page.elements["nav-logo"].src, "/assets/images/logo-light.png");
  assert.equal(
    page.elements["theme-toggle"].getAttribute("aria-label"),
    "Switch to dark theme",
  );
});

test("stored theme accepts only supported values and toggles persist", async () => {
  for (const [savedTheme, expected] of [
    ["light", "light"],
    ["dark", "dark"],
    ["unknown", "dark"],
  ]) {
    const page = setup({ savedTheme });
    await page.ready();
    assert.equal(page.root.getAttribute("data-theme"), expected);
    page.elements["theme-toggle"].onclick();
    assert.equal(page.storedTheme(), expected === "dark" ? "light" : "dark");
  }
});

for (const [failedPath, failedId] of Object.entries(fragments)) {
  for (const failure of ["network", "http"]) {
    test(`${failure} failure in ${failedId} retains fallback and lets other fragments load`, async () => {
      const page = setup({
        fetchImpl: async (url) => {
          if (url === failedPath) {
            if (failure === "network") throw new Error("Offline");
            return {
              ok: false,
              status: 404,
              text: async () => "Not found error page",
            };
          }
          return { ok: true, text: async () => `Loaded ${url}` };
        },
      });
      await page.ready();
      for (const id of Object.values(fragments)) {
        if (id === failedId)
          assert.equal(page.elements[id].innerHTML, "Static fallback links");
        else assert.match(page.elements[id].innerHTML, /^Loaded /);
      }
      assert.equal(page.links[1].getAttribute("aria-current"), "page");
    });
  }
}

test("a stalled fragment does not delay usable navigation or other chrome", async () => {
  let resolveSidebar;
  const page = setup({
    fetchImpl: (url) =>
      url.includes("_sidebars")
        ? new Promise((resolve) => {
            resolveSidebar = resolve;
          })
        : Promise.resolve({ ok: true, text: async () => `Loaded ${url}` }),
  });
  const complete = page.ready();
  await new Promise((resolve) => setImmediate(resolve));
  assert.match(page.elements["site-header"].innerHTML, /^Loaded /);
  assert.match(page.elements["site-chrome-bottom"].innerHTML, /^Loaded /);
  page.elements["theme-toggle"].onclick();
  assert.equal(page.root.getAttribute("data-theme"), "light");
  resolveSidebar({ ok: true, text: async () => "Sidebar" });
  await complete;
});

test("mobile navigation works without Bootstrap and Escape restores focus", async () => {
  const page = setup();
  await page.ready();
  const toggle = page.elements["nav-toggle"];
  toggle.onclick();
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert.equal(page.elements.navbarNav.classList.contains("show"), true);
  page.elements["site-header"].onkeydown({ key: "Escape" });
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(page.elements.navbarNav.classList.contains("show"), false);
  assert.equal(toggle.focused, true);
  assert.equal(page.links[1].getAttribute("aria-current"), "page");
  assert.equal(page.links[0].getAttribute("aria-current"), null);
});
