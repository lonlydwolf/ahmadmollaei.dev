#!/usr/bin/env python3
"""Build the public two-page CV from content.json using ReportLab."""

import json
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab import rl_config
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    HRFlowable, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT.parent / "assets" / "pdf" / "cv.pdf"
DATA = json.loads((ROOT / "content.json").read_text(encoding="utf-8"))
rl_config.invariant = 1  # Stable metadata and document IDs for repeatable builds.

INK = colors.HexColor("#172739")
MUTED = colors.HexColor("#48586A")
ACCENT = colors.HexColor("#125E73")
LINE = colors.HexColor("#C7D7DF")
PAGE_W, PAGE_H = A4
MARGIN = 43
# SimpleDocTemplate frames have six points of inset padding on each side.
WIDTH = PAGE_W - 2 * MARGIN - 12

STYLES = {
    "name": ParagraphStyle("name", fontName="Helvetica-Bold", fontSize=26, leading=30, textColor=INK, spaceAfter=5),
    "direction": ParagraphStyle("direction", fontName="Helvetica-Bold", fontSize=11, leading=15, textColor=ACCENT, spaceAfter=7),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9.5, leading=13.2, textColor=INK, spaceAfter=5),
    "small": ParagraphStyle("small", fontName="Helvetica", fontSize=8.5, leading=11.5, textColor=MUTED, spaceAfter=4),
    "section": ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=ACCENT, spaceBefore=12, spaceAfter=7),
    "title": ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=10.3, leading=13.4, textColor=INK, spaceAfter=3),
    "date": ParagraphStyle("date", fontName="Helvetica", fontSize=8.5, leading=13.4, textColor=MUTED, alignment=TA_RIGHT),
    "bullet": ParagraphStyle("bullet", fontName="Helvetica", fontSize=9.5, leading=13.2, textColor=INK, leftIndent=10, firstLineIndent=-10, spaceAfter=4),
}


def p(text, style="body"):
    return Paragraph(text, STYLES[style])


def safe(text):
    return escape(text)


def link(text, url):
    return f'<a href="{escape(url, {chr(34): "&quot;"})}" color="#125E73">{safe(text)}</a>'


def section(title):
    return p(safe(title), "section")


def title_row(title, date, url=None):
    title_text = link(title, url) if url else safe(title)
    row = Table([[p(title_text, "title"), p(safe(date), "date")]], colWidths=[WIDTH - 109, 109], hAlign="LEFT")
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return row


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN + 6, 32, PAGE_W - MARGIN - 6, 32)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(MARGIN + 6, 20, f'{DATA["name"]} | {DATA["website"]}')
    canvas.drawRightString(PAGE_W - MARGIN - 6, 20, f"{doc.page} / 2")
    canvas.restoreState()


story = [p(safe(DATA["name"]), "name"), p(safe(DATA["direction"]), "direction")]
story.append(p(" | ".join([
    link(DATA["email"], "mailto:" + DATA["email"]),
    link(DATA["website"], "https://" + DATA["website"]),
    link(DATA["github"], "https://" + DATA["github"]),
]), "small"))
story.append(p(f'{safe(DATA["location"])} | {safe(DATA["phone"])}', "small"))
story.extend([Spacer(1, 5), HRFlowable(width="100%", thickness=1, color=ACCENT), Spacer(1, 9), p(safe(DATA["summary"]))])

current = DATA["current"]
story.extend([
    section("Current work"),
    p(link(current["name"], current["url"]), "title"),
    p(safe(current["status"]), "small"),
    p(safe(current["description"])),
    p(safe(current["lesson"])),
    section("Selected learning projects"),
    p("Completed and archived. Project titles link to case studies and technical retrospectives.", "small"),
])
for project in DATA["projects"]:
    story.append(KeepTogether([
        Spacer(1, 5),
        title_row(project["name"], project["date"], project["url"]),
        p(safe(project["stack"]), "small"),
        p(safe(project["description"])),
    ]))

story.extend([PageBreak(), p("Experience & foundations", "name"), p("Operational experience alongside independent software development", "small"), section("Work experience")])
for job in DATA["employment"]:
    story.append(KeepTogether([
        title_row(job["role"], job["dates"]),
        p(safe(job["company"]), "small"),
        *[p("- " + safe(item), "bullet") for item in job["bullets"]],
        Spacer(1, 7),
    ]))

story.append(section("Tools I've worked with"))
for category, tools in DATA["skills"]:
    story.append(p(f"<b>{safe(category)}:</b> {safe(tools)}"))

education = DATA["education"]
story.extend([
    section("Education"),
    p(safe(education["continuing"]), "title"),
    p("Relevant Coursework: " + safe(education["coursework"])),
    Spacer(1, 4),
    title_row(education["university"], education["dates"]),
    p(f'{safe(education["degree"])} | GPA: {safe(education["gpa"])}'),
    section("Certificates"),
    title_row(DATA["certificate"]["name"], DATA["certificate"]["date"]),
    p(safe(DATA["certificate"]["issuer"])),
    section("Languages"),
    p(safe(DATA["languages"])),
])

document = SimpleDocTemplate(
    str(OUTPUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=37, bottomMargin=45, title="Ahmad Mollaei - CV",
    author=DATA["name"], subject="Software engineering portfolio and professional experience",
    pageCompression=1,
)
document.build(story, onFirstPage=footer, onLaterPages=footer)
if document.page != 2:
    raise SystemExit(f"Expected two pages, produced {document.page}; adjust copy or layout before publishing.")
print(OUTPUT)
