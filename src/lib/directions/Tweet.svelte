<script module>
	/** @type {Promise<any> | undefined} */
	let widgets;

	/** X's embed script, loaded once for every tweet on the page. */
	function load() {
		widgets ??= new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = 'https://platform.twitter.com/widgets.js';
			script.async = true;
			script.onload = () => resolve(/** @type {any} */ (window).twttr);
			script.onerror = reject;
			document.head.append(script);
		});
		return widgets;
	}
</script>

<script>
	import { linkProps } from './links.js';

	/**
	 * An embedded post. Until X's widget renders (or if it never does: blocked, deleted, offline),
	 * a quiet card with the text and a link stands in.
	 * @type {{ id: string, user?: string, name?: string, text?: string, date?: string }}
	 */
	let { id, user = 'WhiteHouse', name = 'The White House', text = '', date = '' } = $props();

	const href = $derived(`https://x.com/${user}/status/${id}`);
	let embedded = $state(false);

	/** @param {HTMLElement} node */
	function embed(node) {
		let gone = false;
		load()
			.then((twttr) => twttr?.widgets.createTweet(id, node, { dnt: true, align: 'center', conversation: 'none' }))
			.then((element) => {
				if (!gone && element) embedded = true;
			})
			.catch(() => {});
		return () => {
			gone = true;
			node.replaceChildren();
		};
	}
</script>

<div class="tweet">
	<div class="widget" {@attach embed}></div>
	{#if !embedded}
		<a class="card" {...linkProps(href)}>
			<span class="who"><b>{name}</b> @{user}{#if date} · {date}{/if}</span>
			{#if text}<span class="text">{text}</span>{/if}
			<span class="open">View on X ↗</span>
		</a>
	{/if}
</div>

<style>
	.tweet {
		margin: 2.25rem 0;
	}

	.widget :global(.twitter-tweet) {
		margin: 0 auto !important;
	}

	.card {
		display: grid;
		gap: 0.5rem;
		max-width: 34rem;
		margin: 0 auto;
		padding: 1rem 1.15rem;
		border: 0 !important;
		border-radius: 14px;
		background: #fff;
		box-shadow:
			0 0 0 1px var(--rule),
			0 18px 32px -24px rgba(28, 27, 24, 0.4);
		text-decoration: none !important;
		transition: transform 200ms var(--ease-out);
	}

	.card:hover {
		transform: translateY(-1px);
	}

	.who {
		color: var(--ink-3);
		font-size: 13px;
	}

	.who b {
		color: var(--ink);
		font-weight: 500;
	}

	.text {
		color: var(--ink);
		font-size: 15px;
		line-height: 1.45;
		white-space: pre-line;
	}

	.open {
		color: var(--accent);
		font-size: 12.5px;
	}
</style>
