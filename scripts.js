// --- Theme Toggle ----------
// data-theme is set before first paint by the inline script in each <head>
// (saved choice, else prefers-color-scheme). Storage is only written on toggle.

const html = document.documentElement;
const STORAGE_KEY = "theme";
const DARK = "dark";
const LIGHT = "light";

// Match the navbar logo and the toggle's label to the current theme
function syncThemeUI() {
  const isLight = html.getAttribute("data-theme") === LIGHT;
  const navLogo = document.getElementById("nav-logo");
  if (navLogo) {
    navLogo.src = isLight
      ? "/assets/images/logo-light.png"
      : "/assets/images/logo.png";
  }
  document
    .getElementById("theme-toggle")
    ?.setAttribute(
      "aria-label",
      isLight ? "Switch to dark theme" : "Switch to light theme",
    );
}

function toggleTheme() {
  const theme = html.getAttribute("data-theme") === DARK ? LIGHT : DARK;
  html.setAttribute("data-theme", theme);

  // Keep Key for other pages (storage can be blocked; that must not break the page)
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}

  syncThemeUI();
}

// --- Shared Components ---

// Inject one partial. A failed include is logged and skipped so the rest of
// the page still initialises (and a 404 page is never injected).
// Resolves true once the partial is in the DOM.
async function loadInclude(id, url) {
  const el = document.getElementById(id);
  if (!el) return false;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    el.innerHTML = await r.text();
    return true;
  } catch (err) {
    console.error("Include failed:", err);
    return false;
  }
}

// Each include loads on its own, so a slow sidebar or footer never delays the
// navbar's setup.
function loadChrome() {
  loadInclude("site-header", "/_includes/_nav.html").then((ok) => {
    if (ok) initNav();
  });
  loadInclude("site-sidebars", "/_includes/_sidebars.html");
  loadInclude("site-chrome-bottom", "/_includes/_footer-modal.html");
}

function initNav() {
  // Wire Theme Toggle (just been added to the DOM)
  document
    .getElementById("theme-toggle")
    ?.addEventListener("click", toggleTheme);

  // Swap logo right after injection, before the first paint of the nav
  syncThemeUI();

  // Mark the active nav link (/about/ and /about/index.html both match)
  const path = location.pathname.replace(/index\.html$/, "");
  const activeLink = document.querySelector(`.navbar .nav-link[href="${path}"]`);
  if (activeLink) {
    activeLink.classList.add("active");
    activeLink.setAttribute("aria-current", "page");
  }
}

// Bootstrap tooltips live in page content, so they don't wait on the includes
function initTooltips() {
  if (!window.bootstrap) return;
  document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el));

  // Skill icons are already named by aria-label. Bootstrap also points
  // aria-describedby at the tooltip (same text), so screen readers say the
  // name twice. "inserted" fires on every show, right after Bootstrap sets it.
  document.querySelectorAll(".icon-badge[aria-label]").forEach((el) =>
    el.addEventListener("inserted.bs.tooltip", () =>
      el.removeAttribute("aria-describedby"),
    ),
  );
}

document.addEventListener("DOMContentLoaded", () => {
  initTooltips();
  loadChrome();
});
