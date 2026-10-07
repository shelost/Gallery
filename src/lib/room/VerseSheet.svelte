<script>
	import { linkProps } from '$lib/directions/links.js';
	import { verseLink, verseOfTheDay } from '$lib/directions/verses.js';

	/**
	 * The Bible on the table, opened to the verse of the day.
	 * @type {{ date: { year: number, month: number, day: number } }}
	 */
	let { date } = $props();

	const verse = $derived(verseOfTheDay(date));
</script>

<article class="verse">
	<p class="kicker">Verse of the day</p>
	<blockquote>
		<p>{verse.text}</p>
	</blockquote>
	<p class="ref">{verse.ref} <span>KJV</span></p>
	<a class="go" {...linkProps(verseLink(verse))}>
		Read the chapter
		<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 8.5l5-5M4.5 3.5h4v4" /></svg>
	</a>
</article>

<style>
	.verse {
		display: grid;
		justify-items: center;
		gap: 1rem;
		padding: clamp(2.4rem, 6vw, 4.4rem) clamp(1.6rem, 6vw, 4.4rem);
		background:
			radial-gradient(ellipse at 50% 0%, rgba(201, 162, 39, 0.12), transparent 60%),
			linear-gradient(180deg, #fbf7ee, #f4ecdb);
		text-align: center;
	}

	.kicker {
		margin: 0;
		color: #9a7b22;
		font-family: var(--mono);
		font-size: 0.68rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	blockquote {
		margin: 0;
	}

	blockquote p {
		max-width: 30ch;
		margin: 0;
		color: #2a2118;
		font-family: var(--serif);
		font-size: clamp(1.5rem, 3.4vw, 2.3rem);
		line-height: 1.3;
		text-wrap: balance;
	}

	blockquote p::before {
		content: '“';
	}

	blockquote p::after {
		content: '”';
	}

	.ref {
		margin: 0;
		color: #5e4a2a;
		font-size: 0.95rem;
		font-weight: 500;
	}

	.ref span {
		margin-left: 0.3rem;
		color: #9a7b22;
		font-family: var(--mono);
		font-size: 0.66rem;
		letter-spacing: 0.1em;
	}

	.go {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		margin-top: 0.4rem;
		padding: 0.6rem 1rem 0.6rem 1.1rem;
		border-radius: 999px;
		background: #2a2118;
		color: #f7efdc;
		font-size: 0.85rem;
		font-weight: 500;
		text-decoration: none;
		transition: background-color 160ms var(--ease-out);
	}

	.go:hover {
		background: #7a2a1a;
	}

	.go svg {
		width: 0.7rem;
		height: 0.7rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
