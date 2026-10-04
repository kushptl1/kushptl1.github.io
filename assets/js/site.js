/* Shared behaviour for every page: footer year, theme toggle, mobile nav. */

(function () {
	"use strict";

	/* ---------- Footer year ---------- */

	const yearEl = document.getElementById("year");
	if (yearEl) {
		yearEl.textContent = new Date().getFullYear();
	}

	/* ---------- Experience durations ----------
	 * The HTML ships correct values; this recomputes them so an open-ended role
	 * doesn't go stale a month after it was written.
	 */

	(function () {
		const roles = [].slice.call(document.querySelectorAll(".tl-role-item[data-start]"));
		const groups = [].slice.call(document.querySelectorAll(".tl-group[data-start]"));
		if (!roles.length && !groups.length) return;

		const now = new Date();
		const today = [now.getFullYear(), now.getMonth() + 1];

		function parse(value) {
			const parts = String(value || "").split("-").map(Number);
			return Number.isFinite(parts[0]) && Number.isFinite(parts[1]) ? parts : null;
		}

		function span(el) {
			const from = parse(el.dataset.start);
			const to = el.dataset.end ? parse(el.dataset.end) : today;
			if (!from || !to) return null;
			return Math.max(1, (to[0] - from[0]) * 12 + (to[1] - from[1]) + 1);
		}

		function label(total) {
			const years = Math.floor(total / 12);
			const months = total % 12;
			return [years ? years + " yr" : "", months ? months + " mo" : ""]
				.filter(Boolean)
				.join(" ");
		}

		// Employer tenure spans every role held there.
		groups.forEach(function (group) {
			const total = span(group);
			const pill = group.querySelector(".js-tenure");
			if (total && pill) pill.textContent = label(total);
		});

		// Bars are scaled against the longest single role.
		const spans = roles.map(span);
		const longest = Math.max.apply(null, spans.filter(Boolean).concat(1));

		roles.forEach(function (role, i) {
			const total = spans[i];
			if (!total) return;

			const pill = role.querySelector(".js-duration");
			if (pill) pill.textContent = label(total);

			const bar = role.querySelector(".tl-bar span");
			if (bar) bar.style.setProperty("--w", ((total / longest) * 100).toFixed(1) + "%");
		});
	})();

	/* ---------- Hero stats ----------
	 * Years-in-IT and the project count are derived so they can't drift.
	 */

	(function () {
		const since = document.querySelector(".stats dd[data-since]");
		if (since) {
			const parts = String(since.dataset.since).split("-").map(Number);
			if (Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
				const now = new Date();
				const months = (now.getFullYear() - parts[0]) * 12 + (now.getMonth() + 1 - parts[1]);
				const years = Math.floor(months / 12);
				if (years > 0) since.textContent = years + "+";
			}
		}

		const count = document.querySelector(".js-project-count");
		const projects = document.querySelectorAll("#projects .project-card").length;
		if (count && projects) count.textContent = String(projects);
	})();

	/* ---------- Theme ---------- */

	const root = document.documentElement;
	const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

	function stored() {
		try {
			const value = localStorage.getItem("theme");
			return value === "light" || value === "dark" ? value : null;
		} catch (e) {
			return null;
		}
	}

	function activeTheme() {
		return root.getAttribute("data-theme") || (systemDark.matches ? "dark" : "light");
	}

	function applyTheme(theme) {
		root.setAttribute("data-theme", theme);
		try {
			localStorage.setItem("theme", theme);
		} catch (e) {
			/* Private browsing or blocked storage: the theme still applies for this page. */
		}
	}

	const themeToggle = document.querySelector(".theme-toggle");

	function updateThemeControl() {
		if (!themeToggle) return;
		const dark = activeTheme() === "dark";
		themeToggle.setAttribute("aria-pressed", String(dark));
		themeToggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
	}

	if (themeToggle) {
		themeToggle.addEventListener("click", function () {
			applyTheme(activeTheme() === "dark" ? "light" : "dark");
			updateThemeControl();
		});
		updateThemeControl();
	}

	// Follow the OS while the visitor hasn't picked a theme themselves.
	systemDark.addEventListener("change", function () {
		if (!stored()) {
			root.removeAttribute("data-theme");
			updateThemeControl();
		}
	});

	/* ---------- Active section ----------
	 * Boxes the nav link for whichever section the reader is currently in.
	 */

	(function () {
		// Certifications marks its own nav link as the current page. Skip the scroll
		// highlight there so the footer doesn't box Contact as well.
		if (document.querySelector('.site-nav a[aria-current="page"]')) return;

		const links = [].slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
		if (!links.length) return;

		const targets = links
			.map(function (link) {
				return { link: link, section: document.getElementById(link.hash.slice(1)) };
			})
			.filter(function (pair) {
				return pair.section;
			});
		if (!targets.length) return;

		let current = null;
		let queued = false;

		function update() {
			queued = false;

			// The section crossing a line a third of the way down the viewport wins.
			const line = window.scrollY + window.innerHeight * 0.33;
			const atBottom =
				window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;

			let active = null;
			targets.forEach(function (pair) {
				if (pair.section.offsetTop <= line) active = pair;
			});
			if (atBottom) active = targets[targets.length - 1];

			if (active === current) return;
			current = active;

			targets.forEach(function (pair) {
				if (pair === active) pair.link.setAttribute("aria-current", "true");
				else pair.link.removeAttribute("aria-current");
			});
		}

		function onScroll() {
			if (queued) return;
			queued = true;
			window.requestAnimationFrame(update);
		}

		update();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);
	})();

	/* ---------- Mobile nav ---------- */

	const navToggle = document.querySelector(".nav-toggle");
	const nav = document.getElementById("site-nav");

	if (navToggle && nav) {
		const mobile = window.matchMedia("(max-width: 760px)");

		function setNav(open) {
			navToggle.setAttribute("aria-expanded", String(open));
			nav.classList.toggle("open", open);
		}

		function syncNav() {
			setNav(false);
		}

		syncNav();
		mobile.addEventListener("change", syncNav);

		navToggle.addEventListener("click", function () {
			setNav(navToggle.getAttribute("aria-expanded") !== "true");
		});

		// Tapping a link or pressing Escape closes the panel.
		nav.addEventListener("click", function (event) {
			if (event.target.closest("a") && mobile.matches) setNav(false);
		});

		document.addEventListener("keydown", function (event) {
			if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
				setNav(false);
				navToggle.focus();
			}
		});

		document.addEventListener("click", function (event) {
			if (
				mobile.matches &&
				navToggle.getAttribute("aria-expanded") === "true" &&
				!event.target.closest(".site-header")
			) {
				setNav(false);
			}
		});
	}
})();
