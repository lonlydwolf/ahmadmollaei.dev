const html = document.documentElement;
const STORAGE_KEY = "theme";
const DARK = "dark";
const LIGHT = "light";

function readTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) === LIGHT ? LIGHT : DARK;
  } catch {
    return DARK;
  }
}

function applyTheme(theme, persist = false) {
  html.setAttribute("data-theme", theme);
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Theme switching still works when browser storage is unavailable.
    }
  }

  const navLogo = document.getElementById("nav-logo");
  if (navLogo) {
    navLogo.src =
      theme === DARK
        ? "/assets/images/logo.png"
        : "/assets/images/logo-light.png";
  }
  document
    .getElementById("theme-toggle")
    ?.setAttribute(
      "aria-label",
      `Switch to ${theme === DARK ? LIGHT : DARK} theme`,
    );
}

function toggleTheme() {
  applyTheme(html.getAttribute("data-theme") === DARK ? LIGHT : DARK, true);
}

applyTheme(readTheme());

function normalizePath(path) {
  return path.replace(/index\.html$/, "").replace(/\/$/, "") || "/";
}

function initializeNavigation() {
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) themeToggle.onclick = toggleTheme;
  applyTheme(html.getAttribute("data-theme"));

  document.querySelectorAll("#site-header a[href]").forEach((link) => {
    const active =
      normalizePath(link.getAttribute("href")) ===
      normalizePath(location.pathname);
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  // Bootstrap supplies the layout; navigation works even if its JS CDN fails.
  const menuToggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("navbarNav");
  if (menuToggle && menu) {
    const setExpanded = (expanded) => {
      menu.classList.toggle("show", expanded);
      menuToggle.setAttribute("aria-expanded", String(expanded));
    };
    menuToggle.onclick = () =>
      setExpanded(menuToggle.getAttribute("aria-expanded") !== "true");
    document.getElementById("site-header").onkeydown = (event) => {
      if (
        event.key === "Escape" &&
        menuToggle.getAttribute("aria-expanded") === "true"
      ) {
        setExpanded(false);
        menuToggle.focus();
      }
    };
  }
}

async function loadFragment(id, path, initialize) {
  const target = document.getElementById(id);
  if (!target) return;
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markup = await response.text();
    target.innerHTML = markup;
  } catch (error) {
    // Keep the page's usable static links rather than replacing them with an error page.
    console.warn(`Could not load ${path}; keeping the page fallback.`, error);
  }
  initialize?.();
}

async function loadChrome() {
  initializeNavigation();
  await Promise.allSettled([
    loadFragment("site-header", "/_includes/_nav.html", initializeNavigation),
    loadFragment("site-sidebars", "/_includes/_sidebars.html"),
    loadFragment("site-chrome-bottom", "/_includes/_footer-modal.html"),
  ]);
}

document.addEventListener("DOMContentLoaded", loadChrome);
