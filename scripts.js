// --- Theme Toggle ----------

const html = document.documentElement;
const STORAGE_KEY = "theme";
const DARK = "dark";
const LIGHT = "light";

function applyTheme(theme) {
  // Set data-theme on <html>
  html.setAttribute("data-theme", theme);

  // Keep Key for other pages
  localStorage.setItem(STORAGE_KEY, theme);

  // Swap navbar logo
  const navLogo = document.getElementById("nav-logo");
  if (navLogo) {
    navLogo.src =
      theme === DARK
        ? "/assets/images/logo.png"
        : "/assets/images/logo-light.png";
  }
}

function toggleTheme() {
  const current = html.getAttribute("data-theme");
  applyTheme(current === DARK ? LIGHT : DARK);
}

// Check Theme when loading page. if no Key Default DARK.
const savedTheme = localStorage.getItem(STORAGE_KEY) || DARK;
document.documentElement.setAttribute("data-theme", savedTheme);

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

  // Swap logo to match saved theme
  applyTheme(savedTheme);

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
