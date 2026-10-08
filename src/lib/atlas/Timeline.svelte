<script>
	import { untrack } from 'svelte';
	import Atlas from './Atlas.svelte';
	import { formatYear } from './atlas.js';
	import { YearPlayer } from './player.svelte.js';

	/**
	 * The whole atlas on a slider: scrub or play through the years, or jump to an event or to a
	 * realm at its height.
	 * @type {{ atlas: import('./atlas.js').Atlas, title?: string, caption?: string, speed?: number }}
	 */
	let { atlas, title, caption, speed = 24 } = $props();

	const uid = $props.id();
	/** Opens on the first year. */
	let year = $state(untrack(() => atlas.range.from));
	const player = new YearPlayer(
		() => year,
		(next) => (year = next),
		() => ({ ...atlas.range, speed })
	);

	let event = $derived(atlas.eventAt(year));

	/** @param {number} y */
	const at = (y) => ((y - atlas.range.from) / (atlas.range.to - atlas.range.from)) * 100;

	/** @param {number} y */
	function jump(y) {
		player.stop();
		year = y;
	}

	$effect(() => () => player.stop());
</script>

<figure class="timeline">
	<Atlas {atlas} {year} places={atlas.highlights} label="Map of who held what in {formatYear(year)}" />

	<div class="controls">
		<div class="readout">
			<button
				type="button"
				class="play"
				onclick={() => player.toggle()}
				aria-label={player.playing ? 'Pause the timeline' : 'Play the timeline'}
			>
				{#if player.playing}
					<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" /></svg>
				{:else}
					<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" /></svg>
				{/if}
			</button>
			<output class="year" for="{uid}-year">{formatYear(year)}</output>
			{#if event}
				<span class="event"><span class="when">{formatYear(event.year)}</span>{event.text}</span>
			{/if}
		</div>

		<div class="track">
			<input
				id="{uid}-year"
				type="range"
				min={atlas.range.from}
				max={atlas.range.to}
				step="1"
				bind:value={year}
				oninput={() => player.stop()}
				aria-label="Year"
				aria-valuetext={formatYear(year)}
				style:--fill={at(year) / 100}
			/>
			<div class="lane ticks" aria-hidden="true">
				{#each atlas.events as e (e.year + e.text)}
					<button
						type="button"
						tabindex="-1"
						class={['tick', e.year <= year && 'past']}
						style:left="{at(e.year)}%"
						title="{formatYear(e.year)}: {e.text}"
						aria-label="{formatYear(e.year)}: {e.text}"
						onclick={() => jump(e.year)}
					></button>
				{/each}
			</div>
		</div>

		<div class="lane peaks">
			{#each atlas.peaks as peak, i (peak.year)}
				<button
					type="button"
					class={['peak', i % 2 === 1 && 'low', peak.year <= year && 'reached', at(peak.year) < 12 && 'start', at(peak.year) > 88 && 'end']}
					style:left="{at(peak.year)}%"
					style:--c={atlas.polities[peak.polity].color}
					title="{formatYear(peak.year)}: {peak.text}"
					aria-label="{peak.label} at its height, {formatYear(peak.year)}"
					onclick={() => jump(peak.year)}
				>
					<span class="name">{peak.label}</span>
				</button>
			{/each}
		</div>
	</div>

	{#if title || caption}
		<figcaption>
			{#if title}<span class="title">{title}</span>{/if}
			{#if caption}<span class="caption">{caption}</span>{/if}
		</figcaption>
	{/if}
</figure>

<style>
	.timeline {
		container-type: inline-size;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.85rem 0.1rem 0;
		font-family: var(--sans);
		letter-spacing: 0;
		line-height: 1.3;
	}

	.readout {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		min-width: 0;
	}

	.play {
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--ink);
		color: var(--paper);
		cursor: pointer;
		transition: scale 160ms var(--ease-out);
	}

	.play:active {
		scale: 0.92;
	}

	.play:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.play svg {
		width: 11px;
		height: 11px;
		fill: currentColor;
	}

	.year {
		flex: 0 0 auto;
		min-width: 4.6em;
		color: var(--ink);
		font-size: 18px;
		font-weight: 550;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
	}

	.event {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		color: var(--ink-2);
		font-size: 13px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.when {
		margin-right: 0.45em;
		color: var(--ink-3);
		font-family: var(--mono);
		font-size: 11px;
	}

	.track {
		position: relative;
		height: 1.5rem;
	}

	/* Lanes share the range input's inner width, so a year sits under the thumb. */
	.lane {
		position: absolute;
		left: 0.5rem;
		right: 0.5rem;
	}

	/* The thumb is 1rem wide so its centre travels the same inset as the lanes; the global
	   range style in app.css is overridden in full. */
	input[type='range'] {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		border-radius: 0;
		background: none;
		box-shadow: none;
		cursor: pointer;
		appearance: none;
		--track: linear-gradient(
			90deg,
			var(--accent) calc(0.5rem + (100% - 1rem) * var(--fill)),
			var(--rule) 0
		);
	}

	input[type='range']::-webkit-slider-runnable-track {
		height: 3px;
		border-radius: 999px;
		background: var(--track);
	}

	input[type='range']::-moz-range-track {
		height: 3px;
		border-radius: 999px;
		background: var(--track);
	}

	input[type='range']::-webkit-slider-thumb {
		box-sizing: border-box;
		width: 1rem;
		height: 1rem;
		margin-top: calc(1.5px - 0.5rem);
		border: 2px solid var(--paper);
		border-radius: 50%;
		background: var(--ink);
		box-shadow: 0 1px 4px rgba(28, 27, 24, 0.35);
		backdrop-filter: none;
		transform: none;
		appearance: none;
		transition: scale 120ms var(--ease-out);
	}

	input[type='range']::-moz-range-thumb {
		box-sizing: border-box;
		width: 1rem;
		height: 1rem;
		border: 2px solid var(--paper);
		border-radius: 50%;
		background: var(--ink);
		box-shadow: 0 1px 4px rgba(28, 27, 24, 0.35);
	}

	input[type='range']:hover::-webkit-slider-thumb {
		scale: 1.15;
	}

	input[type='range']:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
		border-radius: 4px;
	}

	.ticks {
		bottom: -0.2rem;
		height: 0.4rem;
	}

	.tick {
		position: absolute;
		top: 0;
		width: 2px;
		height: 100%;
		translate: -50% 0;
		background: var(--ink-3);
		opacity: 0.5;
		cursor: pointer;
	}

	.tick.past {
		background: var(--accent);
		opacity: 0.85;
	}

	.peaks {
		position: relative;
		left: auto;
		right: auto;
		height: 2.2rem;
		margin: 0.15rem 0.5rem 0;
	}

	/* Each realm at its height: a coloured peak, its name beneath, alternate rows never collide. */
	.peak {
		position: absolute;
		top: 0;
		width: 10px;
		height: 8px;
		translate: -50% 0;
		opacity: 0.5;
		cursor: pointer;
		transition: opacity 300ms var(--ease-out);
	}

	.peak::before {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--c);
		clip-path: polygon(50% 0, 100% 100%, 0 100%);
	}

	.peak.reached,
	.peak:hover {
		opacity: 1;
	}

	.peak:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.name {
		position: absolute;
		top: 10px;
		left: 50%;
		translate: -50% 0;
		color: color-mix(in srgb, var(--c) 72%, var(--ink));
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.04em;
		white-space: nowrap;
	}

	.low .name {
		top: 22px;
	}

	.start .name {
		left: 0;
		translate: none;
	}

	.end .name {
		left: auto;
		right: 0;
		translate: none;
	}

	figcaption {
		display: grid;
		gap: 0.2rem;
	}

	.title {
		color: var(--ink-2);
		font-weight: 500;
	}

	@container (max-width: 480px) {
		.readout {
			flex-wrap: wrap;
			row-gap: 0.35rem;
		}

		.event {
			flex-basis: 100%;
			white-space: normal;
		}
	}
</style>
