<script>
	import { onMount } from 'svelte';
	import Footer from '$lib/directions/Footer.svelte';
	import Intro from '$lib/directions/Intro.svelte';
	import KoiPond from '$lib/directions/KoiPond.svelte';
	import WorkGroups from '$lib/directions/WorkGroups.svelte';
	import { GROUPS, KOI } from '$lib/directions/content.js';
	import { getDirectionsContext } from '$lib/directions/context.js';
	import { PALETTES, timeOfDay } from '$lib/directions/pond.js';

	/** @typedef {import('$lib/directions/pond.js').PondTime} PondTime */

	const TIMES = /** @type {PondTime[]} */ (Object.keys(PALETTES));

	const directions = getDirectionsContext();

	/** Unknown until the visitor's clock is read, so the pond never opens in the wrong light. */
	let time = $state(/** @type {PondTime | null} */ (null));
	let active = $state(/** @type {string | null} */ (null));
	const palette = $derived(PALETTES[time ?? 'day']);

	onMount(() => {
		time = timeOfDay(new Date().getHours());
	});
</script>

<svelte:head>
	<title>Pond · Heewon Ahn</title>
</svelte:head>

<main class="pond-page">
	<section class="hero" aria-label="Introduction">
		<div class="intro">
			<Intro>I really like the <code>&lt;canvas&gt;</code> element, so this one is alive.</Intro>
			<ul class="legend sfumato" style:--i={2}>
				<li>
					<span class="swatch" style:background={palette.koi}></span>
					Products in progress
				</li>
				<li>
					<span class="swatch" style:background={palette.pale}></span>
					<span class="swatch" style:background={palette.ink}></span>
					Everything else
				</li>
			</ul>
		</div>

		<figure class="pool sfumato" style:--i={1}>
			<div class="water">
				{#if time}
					<KoiPond works={KOI} {palette} {active} onpick={(work) => directions.open(work.href)} />
				{/if}
			</div>
			<figcaption>
				<span>
					Hover a koi to read it, click to open it.
					<span class="feed">Click the water to feed them.</span>
				</span>
				<span class="times" role="group" aria-label="Time of day">
					{#each TIMES as option (option)}
						<button type="button" aria-pressed={time === option} onclick={() => (time = option)}>
							{option}
						</button>
					{/each}
				</span>
			</figcaption>
		</figure>
	</section>

	<div class="groups">
		<WorkGroups groups={GROUPS} offset={3} bind:active />
	</div>

	<div class="end">
		<Footer i={GROUPS.length + 3} />
	</div>
</main>

<style>
	.pond-page {
		max-width: 74rem;
		margin: 0 auto;
		padding: clamp(3rem, 9vh, 6rem) clamp(1.25rem, 4vw, 3rem) 9rem;
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(15rem, 19rem) minmax(0, 1fr);
		align-items: center;
		gap: clamp(2rem, 5vw, 4.5rem);
	}

	.legend {
		display: grid;
		gap: 0.35rem;
		margin-top: 1.75rem;
		font-size: 13px;
		color: var(--ink-3);
	}

	.legend li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.swatch {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		box-shadow: 0 0 0 1px rgba(28, 27, 24, 0.16);
	}

	.swatch + .swatch {
		margin-left: -0.3rem;
	}

	.pool {
		margin: 0;
	}

	.water {
		position: relative;
		height: min(72vh, 40rem);
		border-radius: 28px;
		background: var(--paper-2);
	}

	figcaption {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		margin-top: 0.8rem;
		font-size: 12px;
		color: var(--ink-3);
	}

	.times {
		display: flex;
		gap: 2px;
	}

	.times button {
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		color: var(--ink-3);
		text-transform: capitalize;
		cursor: pointer;
		transition:
			background-color 150ms var(--ease-out),
			color 150ms var(--ease-out);
	}

	.times button:hover {
		color: var(--ink);
	}

	.times button[aria-pressed='true'] {
		background: var(--ink);
		color: var(--paper);
	}

	.times button:focus-visible {
		outline: 1px solid var(--ink);
		outline-offset: 2px;
	}

	.groups {
		max-width: 36rem;
		margin-top: clamp(4rem, 10vh, 7rem);
	}

	.end {
		max-width: 36rem;
	}

	@media (max-width: 860px) {
		.hero {
			grid-template-columns: minmax(0, 1fr);
		}

		.water {
			height: min(66vh, 30rem);
			border-radius: 20px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.feed {
			display: none;
		}

		.times button {
			transition: none;
		}
	}
</style>
