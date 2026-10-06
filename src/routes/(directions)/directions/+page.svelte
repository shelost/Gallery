<script>
	import { resolve } from '$app/paths';
	import Bust from '$lib/directions/Bust.svelte';
	import { DIRECTIONS } from '$lib/directions/content.js';

	const count =
		['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][DIRECTIONS.length] ??
		`${DIRECTIONS.length}`;
</script>

<svelte:head>
	<title>Directions · Heewon Ahn</title>
</svelte:head>

<main class="hub">
	<header>
		<div class="sfumato" style:--i={0}>
			<Bust size="8.5rem" />
		</div>
		<div class="intro">
			<h1 class="sfumato" style:--i={1}><span class="count">{count}</span> directions</h1>
			<p class="sfumato" style:--i={2}>
				The same portfolio, built {count} ways. Every page uses the real projects, essays, and media from
				the homepage.
			</p>
		</div>
	</header>

	<ol>
		{#each DIRECTIONS as direction, i (direction.slug)}
			<li class="sfumato" style:--i={i + 3}>
				<a href={resolve(/** @type {any} */ (direction.href))}>
					<span class="num">{direction.numeral}</span>
					<span class="body">
						<span class="name">{direction.name}</span>
						<span class="tagline">{direction.tagline}</span>
					</span>
					<span class="hint">{direction.hint}</span>
					<span class="arrow" aria-hidden="true">→</span>
				</a>
			</li>
		{/each}
	</ol>

	<p class="foot sfumato" style:--i={DIRECTIONS.length + 3}>
		Essays open in the side drawer on every page. Press <kbd>[</kbd> and <kbd>]</kbd> to flip between
		directions.
	</p>
</main>

<style>
	.hub {
		max-width: 52rem;
		margin: 0 auto;
		padding: clamp(3rem, 10vh, 7rem) 1.5rem 8rem;
	}

	header {
		display: flex;
		align-items: flex-end;
		gap: 1.75rem;
		margin-bottom: 3.5rem;
	}

	h1 {
		font-family: var(--serif);
		font-size: clamp(2.6rem, 6vw, 4rem);
		font-weight: 400;
		line-height: 0.95;
		letter-spacing: -0.02em;
		margin-bottom: 0.9rem;
	}

	.count {
		text-transform: capitalize;
	}

	.intro p {
		max-width: 38ch;
		color: var(--ink-2);
	}

	ol {
		border-top: 1px solid var(--rule);
	}

	li {
		border-bottom: 1px solid var(--rule);
	}

	a {
		display: grid;
		grid-template-columns: 3.25rem minmax(0, 1fr) auto auto;
		align-items: baseline;
		gap: 1rem;
		padding: 1.15rem 0.5rem;
		transition: background-color 150ms var(--ease-out);
	}

	a:hover {
		background: rgba(28, 27, 24, 0.035);
	}

	.num {
		font-family: var(--serif);
		font-size: 1.6rem;
		line-height: 1;
		color: var(--sanguine);
	}

	.body {
		display: grid;
		gap: 0.2rem;
	}

	.name {
		font-size: 1.15rem;
		font-weight: 500;
		letter-spacing: -0.03em;
	}

	.tagline {
		color: var(--ink-2);
		max-width: 46ch;
	}

	.hint {
		font-family: var(--mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ink-3);
	}

	.arrow {
		color: var(--ink-3);
		transition: transform 150ms var(--ease-out);
	}

	a:hover .arrow {
		transform: translateX(3px);
		color: var(--ink);
	}

	.foot {
		margin-top: 2rem;
		font-size: 13px;
		color: var(--ink-3);
	}

	kbd {
		display: inline-block;
		min-width: 1.4em;
		padding: 0 0.3em;
		border: 1px solid var(--rule);
		border-radius: 4px;
		font-family: var(--mono);
		font-size: 11px;
		text-align: center;
		color: var(--ink-2);
	}

	@media (max-width: 720px) {
		header {
			flex-direction: column;
			align-items: flex-start;
		}

		a {
			grid-template-columns: 2.5rem minmax(0, 1fr) auto;
		}

		.hint {
			display: none;
		}
	}
</style>
