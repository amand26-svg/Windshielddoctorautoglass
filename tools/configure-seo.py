#!/usr/bin/env python3
"""Add deployment URLs after the owner's real domain is chosen. No dependencies."""
import argparse
import html
import json
import re
from pathlib import Path
from urllib.parse import urlsplit
from xml.etree.ElementTree import Element, SubElement, ElementTree, register_namespace

parser = argparse.ArgumentParser(description='Configure the final website domain, canonicals and XML sitemap.')
parser.add_argument('domain', help='Final HTTPS origin, e.g. https://your-domain.ca')
args = parser.parse_args()
base = args.domain.rstrip('/')
parts = urlsplit(base)
if parts.scheme != 'https' or not parts.hostname or parts.username or parts.password or parts.query or parts.fragment or parts.path:
    parser.error('Use a complete HTTPS origin with no path, credentials, query or fragment.')
root = Path(__file__).resolve().parent.parent
pages = json.loads((root / 'pages.json').read_text())
for filename in pages:
    path = root / filename
    content = path.read_text()
    canonical = base + ('/' if filename == 'index.html' else '/' + filename)
    content = re.sub(r'<link rel="canonical"[^>]*>', '', content)
    content = re.sub(r'<meta property="og:url"[^>]*>', '', content)
    content = re.sub(r'<meta property="og:image"[^>]*>', f'<meta property="og:image" content="{html.escape(base, quote=True)}/assets/images/social-card.jpg">', content)
    content = content.replace('</head>', f'<link rel="canonical" href="{html.escape(canonical, quote=True)}"><meta property="og:url" content="{html.escape(canonical, quote=True)}"></head>')
    def update_schema(match):
        data = json.loads(match.group(1))
        for item in data:
            if item.get('@type') == 'AutomotiveBusiness':
                item['url'] = base + '/'
                item['@id'] = base + '/#business'
                item['logo'] = base + '/assets/images/logo.png'
                item['image'] = base + '/assets/images/social-card.jpg'
            if item.get('@type') == 'Service':
                item['url'] = canonical
                item['provider'] = {'@id': base + '/#business'}
        return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + '</script>'
    content = re.sub(r'<script type="application/ld\+json">(.*?)</script>', update_schema, content, flags=re.S)
    path.write_text(content)
namespace = 'http://www.sitemaps.org/schemas/sitemap/0.9'
register_namespace('', namespace)
urlset = Element('{' + namespace + '}urlset')
for filename in pages:
    url = SubElement(urlset, '{' + namespace + '}url')
    SubElement(url, '{' + namespace + '}loc').text = base + ('/' if filename == 'index.html' else '/' + filename)
ElementTree(urlset).write(root / 'sitemap.xml', encoding='utf-8', xml_declaration=True)
(root / 'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: ' + base + '/sitemap.xml\n')
print('Configured', len(pages), 'pages for', base)
