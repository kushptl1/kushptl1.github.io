/* Renders the latest Medium posts.
 *
 * Reads assets/posts.json, refreshed daily by .github/workflows/medium.yml, so
 * the common path makes no third-party request. If that file is missing or
 * stale-empty, falls back to fetching the feed through rss2json at runtime.
 */

const MEDIUM_USER = "@krp20502050";
const MAX_POSTS = 4;
const FALLBACK_TIMEOUT = 6000;

const container = document.getElementById("medium-posts");
const freshness = document.getElementById("posts-freshness");

function stripHtml(html, maxLen = 140) {
	const doc = new DOMParser().parseFromString(html, "text/html");
	// Same rule as scripts/fetch_medium.py: captions, code, and headings aren't excerpt material.
	doc.querySelectorAll("figure, pre, h1, h2, h3, h4, h5, h6").forEach((el) => el.remove());
	const text = (doc.body.textContent || "")
		.replace(/https?:\/\/\S+/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	return text.length > maxLen ? text.slice(0, maxLen).trimEnd() + "…" : text;
}

function firstImage(html) {
	const doc = new DOMParser().parseFromString(html, "text/html");
	const img = doc.querySelector("img");
	return img ? img.src : "";
}

function formatDate(value) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function renderPosts(posts) {
	container.innerHTML = "";
	const latest = posts
		.map((post) => new Date(post.pubDate))
		.filter((date) => !Number.isNaN(date.getTime()))
		.sort((a, b) => b - a)[0];
	if (freshness && latest) {
		freshness.textContent = `Latest post: ${formatDate(latest.toISOString())}`;
	}
	posts.slice(0, MAX_POSTS).forEach((post) => {
		const card = document.createElement("a");
		card.className = "card post-card";
		card.href = post.link;
		card.target = "_blank";
		card.rel = "noreferrer noopener";

		if (post.thumbnail) {
			const img = document.createElement("img");
			img.className = "post-thumb";
			img.src = post.thumbnail;
			img.alt = "";
			img.loading = "lazy";
			img.decoding = "async";
			// Drop the image rather than leaving an empty box if it 404s.
			img.addEventListener("error", function () {
				img.remove();
			});
			card.appendChild(img);
		}

		const meta = document.createElement("span");
		meta.className = "post-date";
		meta.textContent = formatDate(post.pubDate);

		const title = document.createElement("h3");
		title.textContent = post.title;

		const desc = document.createElement("p");
		desc.textContent = post.excerpt;

		const link = document.createElement("span");
		link.className = "card-link";
		link.textContent = "Read on Medium →";

		card.append(meta, title, desc, link);
		container.appendChild(card);
	});
}

function showFallbackMessage() {
	container.innerHTML =
		'<p class="posts-status">Couldn’t load posts right now. ' +
		`<a href="https://medium.com/${MEDIUM_USER}" target="_blank" rel="noreferrer noopener">Read them on Medium</a>.</p>`;
}

/* Last resort: the old runtime path through rss2json. */
function fetchFromRss2Json() {
	const url =
		"https://api.rss2json.com/v1/api.json?rss_url=" +
		encodeURIComponent(`https://medium.com/feed/${MEDIUM_USER}`);

	return fetch(url, { signal: AbortSignal.timeout(FALLBACK_TIMEOUT) })
		.then((res) => res.json())
		.then((data) => {
			if (data.status !== "ok" || !data.items || data.items.length === 0) {
				throw new Error("No posts");
			}
			renderPosts(
				data.items.map((item) => {
					const html = item.content || item.description || "";
					return {
						title: item.title,
						link: item.link,
						pubDate: item.pubDate,
						excerpt: stripHtml(html),
						thumbnail:
							item.thumbnail && item.thumbnail.startsWith("http")
								? item.thumbnail
								: firstImage(html),
					};
				})
			);
		});
}

fetch("assets/posts.json", { cache: "no-cache" })
	.then((res) => {
		if (!res.ok) throw new Error("posts.json unavailable");
		return res.json();
	})
	.then((posts) => {
		if (!Array.isArray(posts) || posts.length === 0) throw new Error("posts.json empty");
		renderPosts(posts);
	})
	.catch(() => fetchFromRss2Json().catch(showFallbackMessage));
