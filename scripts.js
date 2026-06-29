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

async function loadChrome() {
  const [nav, sidebars, bottom] = await Promise.all([
    fetch("/_includes/_nav.html").then((r) => r.text()),
    fetch("/_includes/_sidebars.html").then((r) => r.text()),
    fetch("/_includes/_footer-modal.html").then((r) => r.text()),
  ]);

  document.getElementById("site-header").innerHTML = nav;
  document.getElementById("site-sidebars").innerHTML = sidebars;
  document.getElementById("site-chrome-bottom").innerHTML = bottom;

  // Wire Theme Toggle (just been added to the DOM)
  document
    .getElementById("theme-toggle")
    .addEventListener("click", toggleTheme);

  // Swap logo to match saved theme
  applyTheme(savedTheme);

  // Mark the active nav link based on current page
  document
    .querySelector(`.nav-link[href="${location.pathname}"]`)
    ?.classList.add("active");

  // Bootstarp tooltip
  document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el));
}

document.addEventListener("DOMContentLoaded", loadChrome);
