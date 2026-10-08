<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { clamp, inView } from '$lib/directions/motion.js';
	import Atlas from './Atlas.svelte';
	import { ROUTE_KINDS, formatYear } from './atlas.js';
	import { CROSSED_SWORDS } from './paths.js';

	/**
	 * The atlas cropped around a few places in one year, with any campaign routes. Given `from`,
	 * the borders sweep from that year to `year` the first time it scrolls into view.
	 * @type {{
	 *   atlas: import('./atlas.js').Atlas,
	 *   year: number,
	 *   from?: number,
	 *   places?: string[],
	 *   routes?: string[],
	 *   title?: string,
	 *   caption?: string
	 * }}
	 */
	let { atlas, year, from, places = [], routes = [], title, caption } = $props();

	/** Map units around the framed places; the crop is never narrower than MIN_W. */
	const PAD = 70;
	const MIN_W = 260;
	const ASPECT = 1.6;
	/** Route maps may stand squarer, so a north–south march is not padded out with sea. */
	const ROUTE_ASPECT = 1.25;
	/** Years per second while the borders sweep. */
	const SWEEP_SPEED = 6;

	let shownRoutes = $derived(routes.map((id) => atlas.routes[id]).filter(Boolean));

	let crop = $derived.by(() => {
		const { view } = atlas;
		const points = [
			...places.map((id) => atlas.places[id]).filter(Boolean).map((p) => [p.x, p.y]),
			...shownRoutes.flatMap(atlas.routePoints)
		];
		if (!points.length) return view;
		const xs = points.map((p) => p[0]);
		const ys = points.map((p) => p[1]);
		const aspect = shownRoutes.length ? ROUTE_ASPECT : ASPECT;
		let w = Math.max(Math.max(...xs) - Math.min(...xs) + PAD * 2, MIN_W);
		let h = Math.max(Math.max(...ys) - Math.min(...ys) + PAD * 2, w / ASPECT);
		w = Math.min(Math.max(w, h * aspect), view.w);
		h = Math.min(h, view.h);
		const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
		const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
		return {
			x: clamp(cx - w / 2, view.x, view.x + view.w - w),
			y: clamp(cy - h / 2, view.y, view.y + view.h - h),
			w,
			h
		};
	});

	let legend = $derived({
		sides: [...new Set(shownRoutes.map((r) => r.side))],
		kinds: /** @type {(keyof typeof ROUTE_KINDS)[]} */ ([...new Set(shownRoutes.map((r) => r.kind ?? 'march'))]),
		battle: shownRoutes.some((r) => r.battle)
	});

	let summary = $derived(
		[title ?? `Map, ${formatYear(year)}`, ...shownRoutes.map((r) => `${atlas.polities[r.side].label}: ${r.label}`)].join('. ')
	);

	/** Routes draw, and the borders sweep, the first time the map scrolls into view. */
	let live = $state(false);
	/** @type {number | null} */
	let shown = $state(null);
	let current = $derived(shown ?? from ?? year);
	let playing = $state(false);
	let played = $state(false);
	let frame = 0;

	function play() {
		if (from === undefined || playing) return;
		if (prefersReducedMotion.current) {
			shown = year;
			played = true;
			return;
		}
		const start = from;
		const span = year - start;
		const duration = clamp((Math.abs(span) / SWEEP_SPEED) * 1000, 1200, 4000);
		let began = 0;
		playing = true;
		shown = start;
		frame = requestAnimationFrame(function step(t) {
			began ||= t;
			const k = Math.min((t - began) / duration, 1);
			shown = Math.round(start + span * (1 - (1 - k) ** 3));
			if (k < 1) frame = requestAnimationFrame(step);
			else {
				playing = false;
				played = true;
			}
		});
	}

	/** @param {boolean} visible */
	function enter(visible) {
		if (!visible || live) return;
		live = true;
		play();
	}

	$effect(() => () => cancelAnimationFrame(frame));
</script>

<figure class="excerpt" {@attach inView(enter, { threshold: 0.4 })}>
	<Atlas {atlas} year={current} {crop} {places} {routes} {live} label={summary}>
		<span class="year" aria-live="polite" data-atlas-reserve>{formatYear(current)}</span>
		{#if from !== undefined}
			<button
				type="button"
				data-atlas-reserve
				class={['play', playing && 'playing']}
				onclick={play}
				aria-label={played ? 'Replay the border change' : 'Play the border change'}
			>
				<svg viewBox="0 0 12 12" aria-hidden="true">
					{#if played}
						<path d="M6 2.2a3.8 3.8 0 1 1-3.6 2.6l1.3.5A2.4 2.4 0 1 0 6 3.6v1.6L3.4 2.9 6 .6z" />
					{:else}
						<path d="M3 1.5v9l7.5-4.5z" />
					{/if}
				</svg>
				{formatYear(from)} → {formatYear(year)}
			</button>
		{/if}
	</Atlas>

	{#if shownRoutes.length}
		<div class="legend" aria-hidden="true">
			{#each legend.sides as side (side)}
				<span><i class="swatch" style:--c={atlas.polities[side].color}></i>{atlas.polities[side].label}</span>
			{/each}
			{#each legend.kinds as kind (kind)}
				<span>
					<svg class="sample" viewBox="0 0 28 8">
						<path class="stroke" d="M1.5 4H19" stroke-dasharray={ROUTE_KINDS[kind].dash} />
						<path class="tip" d="M26 4L19 0.8L20 4L19 7.2Z" />
					</svg>
					{ROUTE_KINDS[kind].label}
				</span>
			{/each}
			{#if legend.battle}
				<span>
					<svg class="sample swords" viewBox="-1.25 -1.25 2.5 2.5"><path d={CROSSED_SWORDS} /></svg>
					Battle
				</span>
			{/if}
		</div>
	{/if}

	{#if title || caption}
		<figcaption>
			{#if title}<span class="title">{title}</span>{/if}
			{#if caption}<span class="caption">{caption}</span>{/if}
		</figcaption>
	{/if}
</figure>

<style>
	.year,
	.play {
		position: absolute;
		z-index: 4;
		bottom: 0.55rem;
		font-family: var(--sans);
		font-variant-numeric: tabular-nums;
		letter-spacing: 0;
	}

	.year {
		right: 0.7rem;
		color: var(--ink);
		font-size: clamp(13px, 2.6cqw, 17px);
		font-weight: 550;
		text-shadow: 0 0 6px var(--land), 0 0 2px var(--land);
	}

	.play {
		left: 0.55rem;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.3rem 0.65rem 0.3rem 0.5rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--paper) 82%, transparent);
		box-shadow: 0 0 0 1px var(--rule);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		color: var(--ink);
		font-size: 11.5px;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 160ms var(--ease-out),
			scale 160ms var(--ease-out);
	}

	.play:hover {
		background: var(--paper);
	}

	.play:active {
		scale: 0.96;
	}

	.play:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.play.playing {
		opacity: 0.6;
		pointer-events: none;
	}

	.play svg {
		width: 11px;
		height: 11px;
		fill: var(--accent);
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.3rem 1rem;
		margin-top: 0.75rem;
		color: var(--ink-2);
		font-family: var(--sans);
		font-size: 12px;
		letter-spacing: 0;
		line-height: 1.3;
	}

	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.swatch {
		width: 10px;
		height: 10px;
		border-radius: 3px;
		background: var(--c);
	}

	.sample {
		width: 26px;
		height: 8px;
		overflow: visible;
	}

	.sample .stroke {
		fill: none;
		stroke: var(--ink-2);
		stroke-width: 2px;
		stroke-linecap: round;
	}

	.sample .tip {
		fill: var(--ink-2);
	}

	.sample.swords {
		width: 12px;
		height: 12px;
	}

	.sample.swords path {
		fill: none;
		stroke: var(--ink);
		stroke-width: 0.26;
		stroke-linecap: round;
	}

	figcaption {
		display: grid;
		gap: 0.2rem;
	}

	.title {
		color: var(--ink-2);
		font-weight: 500;
	}
</style>
