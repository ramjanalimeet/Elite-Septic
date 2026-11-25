#!/usr/bin/env python3
"""Refresh the static copy of the public Elite Septic website."""

from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import unquote, urlparse, urljoin
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

ORIGIN = "https://elitesepticservice.net"
ROOT = Path(__file__).resolve().parents[1]
KINDS = ("page", "service", "location", "author", "post")
DYNAMIC_CHUNKS = ("accordion", "background-slideshow", "background-video", "nested-accordion", "text-editor")
ASSET_RE = re.compile(r"(?:https?:)?//elitesepticservice\.net/(?:wp-content|wp-includes)/[^\s\"'<>)]*|/(?:wp-content|wp-includes)/[^\s\"'<>)]*", re.I)
CSS_URL_RE = re.compile(r"url\(\s*['\"]?([^'\")]+)", re.I)


def fetch(url: str) -> bytes:
    result = subprocess.run(
        ["curl", "--fail", "--silent", "--show-error", "--location", "--retry", "2", "--max-time", "45", url],
        check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    return result.stdout


def local_path(url: str) -> Path:
    path = unquote(urlparse(url).path).lstrip("/")
    if ".." in Path(path).parts:
        raise ValueError(url)
    return ROOT / path


def asset_urls(text: str) -> set[str]:
    text = text.replace("\\/", "/").replace("&amp;", "&")
    found = {urljoin(ORIGIN, match.group(0)).split("?", 1)[0].rstrip("\\") for match in ASSET_RE.finditer(text)}
    return {url for url in found if "*" not in url and Path(urlparse(url).path).suffix}


def get_page(url: str) -> tuple[str, set[str]]:
    raw = fetch(url).decode("utf-8", "replace")
    assets = asset_urls(raw)
    # Keep navigation and local media on this static host.
    html = raw.replace("\\/", "/").replace(ORIGIN, "")
    if 'frm-fluent-form' in html or 'esb__form' in html:
        html = html.replace('</body>', '<script src="/mirror.js" defer></script></body>')
    path = local_path(url) / "index.html"
    path.parent.mkdir(parents=True, exist_ok=True)
    if not (urlparse(url).path == "/" and path.exists() and "data-elite-home" in path.read_text()):
        path.write_text(html)
    return url, assets


def get_asset(url: str) -> tuple[str, set[str]]:
    dest = local_path(url)
    if dest.exists() and dest.stat().st_size:
        data = dest.read_bytes() if dest.suffix == ".css" else b""
    else:
        data = fetch(url)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
    nested = set()
    if dest.suffix == ".css":
        css = data.decode("utf-8", "replace")
        nested |= asset_urls(css)
        for ref in CSS_URL_RE.findall(css):
            if ref.startswith("data:"):
                continue
            resolved = urljoin(url, ref)
            if urlparse(resolved).netloc == urlparse(ORIGIN).netloc and Path(urlparse(resolved).path).suffix:
                nested.add(resolved.split("?", 1)[0])
        dest.write_text(css.replace(ORIGIN, ""))
    return url, nested


def main() -> None:
    pages = set()
    for kind in KINDS:
        xml = ET.fromstring(fetch(f"{ORIGIN}/{kind}-sitemap.xml"))
        pages.update(node.text for node in xml.iter() if node.tag.endswith('loc') and node.text and not '/wp-content/' in node.text)
    print(f"Pages: {len(pages)}", flush=True)
    assets = set()
    with ThreadPoolExecutor(max_workers=8) as pool:
        jobs = {pool.submit(get_page, url): url for url in sorted(pages)}
        for job in as_completed(jobs):
            try:
                _, found = job.result()
                assets |= found
            except Exception as exc:
                print(f"PAGE FAILED {jobs[job]}: {exc}", file=sys.stderr)
    print(f"First-pass assets: {len(assets)}", flush=True)
    assets.update(f"{ORIGIN}/wp-content/plugins/elementor/assets/js/chunks/{name}.min.js" for name in DYNAMIC_CHUNKS)
    done = set()
    while assets - done:
        batch = assets - done
        done |= batch
        with ThreadPoolExecutor(max_workers=10) as pool:
            jobs = {pool.submit(get_asset, url): url for url in sorted(batch)}
            for job in as_completed(jobs):
                try:
                    _, nested = job.result()
                    assets |= nested
                except Exception as exc:
                    print(f"ASSET FAILED {jobs[job]}: {exc}", file=sys.stderr)
        print(f"Assets processed: {len(done)}; discovered: {len(assets)}", flush=True)
    print("Mirror complete", flush=True)


if __name__ == "__main__":
    main()
