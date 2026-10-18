# ahmadmollaei.dev

My personal portfolio: current work on Faculty, completed learning projects,
professional background, and a downloadable CV.

Plain HTML, CSS, and JavaScript, hosted on GitHub Pages from the `main` branch.
There is no application build step or server-side runtime. Bootstrap provides
layout utilities; the small navigation and theme script has no JavaScript
dependencies.

## Preview locally

From the repository root:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000>. Serve the repository root: links and shared
fragments use absolute paths. Opening HTML directly as `file://` will not load
shared fragments.

## Edit content

- `index.html`: introduction and current work.
- `projects/index.html`: Faculty and archived learning projects.
- `about/index.html`: personal background, tool badges, and learning topics.
- `experience/index.html`: employment history.
- `_includes/`: enhanced navigation, sidebars, and footer. The historical
  `_footer-modal.html` filename is retained; it now contains only the footer.
- `styles.css` and `scripts.js`: both themes, responsive layout, navigation,
  and independent fragment loading.
- `cv/content.json`: editable CV content. See [CV build instructions](cv/README.md)
  and commit `assets/pdf/cv.pdf` with its source whenever it changes.

Every page includes basic navigation and contact/CV links before JavaScript
runs. If a fragment fails to load, those links remain usable. Theme storage is
optional; blocked browser storage does not stop navigation or theme switching.

Faculty appears on the home and projects pages. Keep those descriptions and the
CV consistent. Treat project status and limitations as part of the portfolio:
archived experiments remain linked to their source and retrospectives. Do not
publish confidential employment details or unsupported performance claims.

The social preview lives in `assets/images/social-preview.svg` (editable source)
and `social-preview.png` (1200 × 630 web preview). Re-export the SVG as PNG after
editing it; social crawlers use the PNG. Each page has its own title, description,
and canonical URL. The 404 page is excluded from indexing.

## Validate changes

```sh
python3 scripts/check_site.py
node --check scripts.js
node --test tests/chrome.test.cjs
git diff --check
```

The GitHub Actions workflow runs static-link/metadata checks and JavaScript
regression tests. These do not replace a browser review. Before merging:

- Check all pages in dark and light themes, at 320px, phone, tablet, and desktop widths.
- Use the mobile menu, Escape, keyboard focus, skip link, and direct CV links.
- Verify the site with JavaScript disabled and with a shared fragment request blocked.
- Check external project/case-study links and inspect the social preview.
- If the CV changed, render and inspect both pages as described in `cv/README.md`.

Merging to `main` publishes through the repository's existing GitHub Pages
configuration and `CNAME`. Pull requests do not deploy the live site.
