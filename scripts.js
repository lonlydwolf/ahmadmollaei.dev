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
      theme === DARK ? "/assets/logo.png" : "/assets/logo-light.png";
  }
}

function toggleTheme() {
  const current = html.getAttribute("data-theme");
  applyTheme(current === DARK ? LIGHT : DARK);
}

// Check Theme when loading page. if no Key Default DARK.
const savedTheme = localStorage.getItem(STORAGE_KEY) || DARK;
applyTheme(savedTheme);

// LISTENER
const themeToggleBtn = document.getElementById("theme-toggle");
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", toggleTheme);
}

// --- Bootstrap Tooltips ----------
const tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]',
);
const tooltipList = [...tooltipTriggerList].map(
  (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl),
);
