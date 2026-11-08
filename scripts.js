// --- Theme Toggle ----------
// data-theme is set before first paint by the inline script in each <head>
// (saved choice, else prefers-color-scheme). Storage is only written on toggle.

const html = document.documentElement;
const STORAGE_KEY = "theme";
const DARK = "dark";
const LIGHT = "light";

// Match the navbar logo to the current theme
function syncLogo() {
  const navLogo = document.getElementById("nav-logo");
  if (navLogo) {
    navLogo.src =
      html.getAttribute("data-theme") === LIGHT
        ? "/assets/images/logo-light.png"
        : "/assets/images/logo.png";
  }
}

function toggleTheme() {
  const theme = html.getAttribute("data-theme") === DARK ? LIGHT : DARK;
  html.setAttribute("data-theme", theme);

  // Keep Key for other pages (storage can be blocked; that must not break the page)
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}

  syncLogo();
}

// --- Shared Components ---

// Inject one partial. A failed include is logged and skipped so the rest of
// the page still initialises (and a 404 page is never injected).
async function loadInclude(id, url) {
  const el = document.getElementById(id);
  if (!el) return;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    el.innerHTML = await r.text();
  } catch (err) {
    console.error("Include failed:", err);
  }
}

async function loadChrome() {
  await Promise.all([
    loadInclude("site-header", "/_includes/_nav.html"),
    loadInclude("site-sidebars", "/_includes/_sidebars.html"),
    loadInclude("site-chrome-bottom", "/_includes/_footer-modal.html"),
  ]);

  // Wire Theme Toggle (just been added to the DOM)
  document
    .getElementById("theme-toggle")
    ?.addEventListener("click", toggleTheme);

  // Swap logo right after injection, before the first paint of the nav
  syncLogo();

  // Mark the active nav link based on current page
  document
    .querySelector(`.nav-link[href="${location.pathname}"]`)
    ?.classList.add("active");
}

// Bootstrap tooltips live in page content, so they don't wait on the includes
function initTooltips() {
  if (!window.bootstrap) return;
  document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el));
}

document.addEventListener("DOMContentLoaded", () => {
  initTooltips();
  loadChrome();
});
