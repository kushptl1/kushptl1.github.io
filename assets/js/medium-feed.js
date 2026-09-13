/* Fetches the latest Medium posts and renders them as cards. */

const MEDIUM_USER = "@krp20502050";
const MAX_POSTS = 3;

const container = document.getElementById("medium-posts");

function firstImage(html) {
	const doc = new DOMParser().parseFromString(html, "text/html");
	const img = doc.querySelector("img");
	return img ? img.src : "";
}

function excerpt(html, maxLen = 140) {
	const doc = new DOMParser().parseFromString(html, "text/html");
	const text = (doc.body.textContent || "").trim().replace(/\s+/g, " ");
	return text.length > maxLen ? text.slice(0, maxLen).trimEnd() + "…" : text;
}

function renderPosts(items) {
	container.innerHTML = "";
	items.slice(0, MAX_POSTS).forEach((item) => {
		const card = document.createElement("a");
		card.className = "card post-card";
		card.href = item.link;
		card.target = "_blank";
		card.rel = "noreferrer noopener";

		const html = item.content || item.description || "";
		const thumb = item.thumbnail && item.thumbnail.startsWith("http")
			? item.thumbnail
			: firstImage(html);

		const date = new Date(item.pubDate).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});

		if (thumb) {
			const img = document.createElement("img");
			img.className = "post-thumb";
			img.src = thumb;
			img.alt = "";
			img.loading = "lazy";
			card.appendChild(img);
		}

		const meta = document.createElement("span");
		meta.className = "post-date";
		meta.textContent = date;

		const title = document.createElement("h3");
		title.textContent = item.title;

		const desc = document.createElement("p");
		desc.textContent = excerpt(html);

		const link = document.createElement("span");
		link.className = "card-link";
		link.textContent = "Read on Medium →";

		card.append(meta, title, desc, link);
		container.appendChild(card);
	});
}

fetch(
	"https://api.rss2json.com/v1/api.json?rss_url=" +
		encodeURIComponent(`https://medium.com/feed/${MEDIUM_USER}`)
)
	.then((res) => res.json())
	.then((data) => {
		if (data.status !== "ok" || !data.items || data.items.length === 0) {
			throw new Error("No posts");
		}
		renderPosts(data.items);
	})
	.catch(() => {
		container.innerHTML =
			'<p class="posts-status">Couldn’t load posts right now. ' +
			`<a href="https://medium.com/${MEDIUM_USER}" target="_blank" rel="noreferrer noopener">Read them on Medium</a>.</p>`;
	});
