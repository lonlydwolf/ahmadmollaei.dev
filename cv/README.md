# Maintaining the CV

The public download at `assets/pdf/cv.pdf` is generated from `content.json`.
Edit that file for wording, dates, links, and contact details; `build.py` owns the
two-page A4 layout. The website requires no Python runtime.

From the repository root, using Python 3.10 or newer:

```sh
python3 -m venv /tmp/ahmad-cv-venv
/tmp/ahmad-cv-venv/bin/pip install -r cv/requirements.txt
/tmp/ahmad-cv-venv/bin/python cv/build.py
```

ReportLab's standard Helvetica fonts avoid machine-specific font dependencies.
Metadata and document IDs are deterministic; the same content and dependency
version should produce the same PDF. Keep public claims aligned with the website
and project case studies. Course names are preserved as relevant coursework;
only the separately listed Duke course is presented as a certificate.

Before committing, inspect both pages. With [Poppler](https://poppler.freedesktop.org/)
installed (`brew install poppler` on macOS):

```sh
pdfinfo assets/pdf/cv.pdf
pdftotext -layout assets/pdf/cv.pdf -
mkdir -p /tmp/ahmad-cv-preview
pdftoppm -r 120 -png assets/pdf/cv.pdf /tmp/ahmad-cv-preview/page
```

Check that the result has exactly two pages, no clipped or overlapping text,
working project links, and readable type. Page breaks are intentional. If content
grows, tighten the copy or adjust the layout; do not silently shrink the body text
or accept extra pages with incorrect page numbering. Commit the editable source
and rebuilt PDF together. Preview images and virtual environments stay outside
the repository.
