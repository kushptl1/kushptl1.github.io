#!/usr/bin/env python3
"""Fetch the latest Medium posts and write them to assets/posts.json.

Run by .github/workflows/medium.yml on a daily schedule so the site can read a
local file instead of calling a third-party API on every page load.
"""

import json
import pathlib
import re
import urllib.request
import xml.etree.ElementTree as ET

FEED = "https://medium.com/feed/@krp20502050"
OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "posts.json"
MAX_POSTS = 6
NS = {"content": "http://purl.org/rss/1.0/modules/content/"}


def text_of(html, max_len=140):
	text = re.sub(r"<[^>]+>", " ", html or "")
	text = re.sub(r"&[a-zA-Z#0-9]+;", " ", text)
	text = re.sub(r"\s+", " ", text).strip()
	return text[:max_len].rstrip() + "…" if len(text) > max_len else text


def first_image(html):
	match = re.search(r'<img[^>]+src="([^"]+)"', html or "")
	return match.group(1) if match else ""


def main():
	request = urllib.request.Request(FEED, headers={"User-Agent": "kushptl1.github.io"})
	with urllib.request.urlopen(request, timeout=30) as response:
		root = ET.fromstring(response.read())

	posts = []
	for item in root.findall("./channel/item")[:MAX_POSTS]:
		body = item.findtext("content:encoded", default="", namespaces=NS)
		posts.append({
			"title": item.findtext("title", default="").strip(),
			"link": (item.findtext("link") or "").split("?")[0],
			"pubDate": item.findtext("pubDate", default=""),
			"excerpt": text_of(body),
			"thumbnail": first_image(body),
		})

	if not posts:
		raise SystemExit("No posts found in feed; leaving existing posts.json alone.")

	OUT.write_text(json.dumps(posts, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
	print(f"Wrote {len(posts)} posts to {OUT}")


if __name__ == "__main__":
	main()
