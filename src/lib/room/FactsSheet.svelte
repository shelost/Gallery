<script>
	import { linkProps } from '$lib/directions/links.js';
	import Heading from './Heading.svelte';

	/**
	 * The little TV, picked up: everything that happened on this date, the one on screen first.
	 * Choosing another puts it on the TV.
	 * @type {{ facts: import('$lib/directions/today.js').Fact[], fact?: number, date: string }}
	 */
	let { facts, fact = $bindable(0), date } = $props();

	const on = $derived(facts.length ? fact % facts.length : -1);
</script>

<div class="facts">
	<Heading kicker="On this day · {date}" title="What happened today" hint="Pick one to put it on the TV." />

	{#if facts.length}
		<ol>
			{#each facts as entry, i (entry.text)}
				<li class={[i === on && 'on']}>
					<button type="button" aria-pressed={i === on} onclick={() => (fact = i)}>
						<span class="year">{entry.year}</span>
						<span class="text">{entry.text}</span>
					</button>
					{#if entry.href}
						<a class="go" {...linkProps(entry.href)} aria-label="Read about {entry.year} on Wikipedia">
							<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 8.5l5-5M4.5 3.5h4v4" /></svg>
						</a>
					{/if}
				</li>
			{/each}
		</ol>
	{:else}
		<p class="empty">Still tuning in. Wikipedia’s “On this day” hasn’t answered yet.</p>
	{/if}
</div>

<style>
	.facts {
		display: grid;
		gap: 1.2rem;
		padding: clamp(1.4rem, 3vw, 2.4rem);
	}

	ol {
		display: grid;
		gap: 0.3rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.4rem;
		border-radius: 0.9rem;
		transition: background-color 160ms var(--ease-out);
	}

	li:hover {
		background: rgba(28, 27, 24, 0.04);
	}

	li.on {
		background: #eef6f1;
	}

	li button {
		display: grid;
		grid-template-columns: 3.6rem minmax(0, 1fr);
		align-items: baseline;
		gap: 0.8rem;
		padding: 0.75rem 0.9rem;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.year {
		color: var(--accent);
		font-family: var(--mono);
		font-size: 0.95rem;
	}

	.text {
		color: var(--ink);
		font-size: 0.95rem;
		line-height: 1.45;
		text-wrap: pretty;
	}

	.on .text {
		font-weight: 500;
	}

	.go {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		margin-right: 0.6rem;
		border-radius: 50%;
		color: var(--ink-2);
		transition:
			background-color 160ms var(--ease-out),
			color 160ms var(--ease-out);
	}

	.go:hover {
		background: var(--ink);
		color: var(--paper);
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

	.empty {
		margin: 0;
		color: var(--ink-2);
	}
</style>
