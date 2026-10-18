#!/usr/bin/env python3
"""Check static navigation, local assets, metadata, and page landmarks."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PAGES = [Path(name) for name in ('index.html', 'about/index.html', 'projects/index.html', 'experience/index.html', '404.html')]


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.ids, self.links, self.meta, self.h1, self.main = [], [], {}, 0, 0
        self.canonical = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        self.h1 += tag == 'h1'
        self.main += tag == 'main'
        if tag == 'meta':
            self.meta[attrs.get('name', attrs.get('property'))] = attrs.get('content')
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical.append(attrs.get('href'))
        for name in ('href', 'src'):
            if attrs.get(name):
                self.links.append(attrs[name])


errors = []
files = PAGES + [p.relative_to(ROOT) for p in (ROOT / '_includes').glob('*.html')]
for relative in files:
    page = Page((ROOT / relative).read_text())
    if len(page.ids) != len(set(page.ids)):
        errors.append(f'{relative}: duplicate IDs')
    if relative in PAGES:
        if page.h1 != 1 or page.main != 1:
            errors.append(f'{relative}: expected one h1 and main landmark')
        for key in ('description', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt', 'twitter:card'):
            if not page.meta.get(key):
                errors.append(f'{relative}: missing {key}')
        if relative.name != '404.html' and len(page.canonical) != 1:
            errors.append(f'{relative}: expected one canonical URL')
        for id_ in ('main-content', 'site-header', 'site-chrome-bottom'):
            if id_ not in page.ids:
                errors.append(f'{relative}: missing {id_}')
    for url in page.links + ([page.meta['og:image']] if 'og:image' in page.meta else []):
        parsed = urlsplit(url)
        if parsed.scheme and parsed.netloc != 'ahmadmollaei.dev':
            continue
        if parsed.netloc and parsed.netloc != 'ahmadmollaei.dev':
            continue
        path = unquote(parsed.path)
        target = ROOT / path.lstrip('/') if path.startswith('/') else ROOT / relative.parent / path
        if not path:
            target = ROOT / relative
        if target.is_dir():
            target /= 'index.html'
        if not target.is_file():
            errors.append(f'{relative}: missing target {url}')
        elif parsed.fragment and target.suffix == '.html':
            if unquote(parsed.fragment) not in Page(target.read_text()).ids:
                errors.append(f'{relative}: missing anchor {url}')

ET.parse(ROOT / 'sitemap.xml')
if errors:
    print('\n'.join(errors), file=sys.stderr)
    sys.exit(1)
print(f'Checked {len(PAGES)} pages, shared fragments, local links, metadata, and sitemap.')
