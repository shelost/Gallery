<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { crossfade, fade } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { Clicks } from '$lib/directions/clicks.svelte.js';
	import Soundwave from './Soundwave.svelte';
	import { trackKey } from './furnishing.js';

	/** @typedef {import('./furnishing.js').Track} Track */

	/**
	 * The music shelf up close, beside the turntable. Picking a case opens its lid, the disc
	 * crosses to the platter, and the record only starts once it has landed and the arm is down.
	 * The disc that was playing flies back into its own case.
	 * @type {{ tracks: Track[], loaded: Track | null, playing: boolean, onplay: (track: Track) => void, ontoggle: () => void }}
	 */
	let { tracks, loaded, playing, onplay, ontoggle } = $props();

	const LID_MS = 420;

	const clicks = new Clicks({ muted: false });

	const [send, receive] = crossfade({
		duration: () => (prefersReducedMotion.current ? 0 : 760),
		easing: cubicInOut,
		fallback: (node) => fade(node, { duration: prefersReducedMotion.current ? 0 : 200 })
	});

	/** The disc in the air, between its case and the platter. @type {Track | null} */
	let moving = $state(null);
	/** Cases standing open: the one being taken from and the one being put back. @type {string[]} */
	let open = $state([]);
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let timer;

	const platter = $derived(moving ?? loaded);
	const spinning = $derived(playing && !moving && platter !== null);
	const cds = $derived(tracks.filter((track) => track.format === 'cd'));
	const records = $derived(tracks.filter((track) => track.format === 'vinyl'));

	/** @param {Track} track */
	function pick(track) {
		if (moving || open.length) return;
		if (track === loaded) {
			clicks.tick('key');
			ontoggle();
			return;
		}
		clicks.tick('latch');
		open = loaded ? [trackKey(track), trackKey(loaded)] : [trackKey(track)];
		timer = setTimeout(() => (moving = track), prefersReducedMotion.current ? 0 : LID_MS);
	}

	function land() {
		if (!moving) return;
		clicks.tick('thunk');
		onplay(moving);
		moving = null;
		timer = setTimeout(() => {
			clicks.tick('latch');
			open = [];
		}, 160);
	}

	$effect(() => () => {
		clearTimeout(timer);
		clicks.dispose();
	});
</script>

{#snippet disc(/** @type {Track} */ track)}
	<span class={['art', track.format]} style:--tone={track.item.tone} style:--ink={track.item.ink}>
		<span class="label"><span lang={track.item.lang}>{track.item.title}</span></span>
	</span>
{/snippet}

{#snippet holder(/** @type {Track} */ track)}
	{@const key = trackKey(track)}
	<button
		type="button"
		class={['holder', track.format, open.includes(key) && 'open', track === loaded && 'loaded']}
		style:--tone={track.item.tone}
		style:--ink={track.item.ink}
		aria-label="{track === loaded ? (playing ? 'Pause' : 'Play') : 'Play'} {track.item.title}{track.item.by ? ` by ${track.item.by}` : ''}"
		aria-pressed={track === loaded && playing}
		onclick={() => pick(track)}
	>
		<span class="tray">
			{#if platter !== track}
				<span class="slot" in:receive={{ key }} out:send={{ key }}>{@render disc(track)}</span>
			{/if}
		</span>
		<span class="lid">
			<span class="insert">
				<span class="title" lang={track.item.lang}>{track.item.title}</span>
				{#if track.item.by}
					<span class="by" lang={track.item.lang}>{track.item.by}</span>
				{/if}
			</span>
		</span>
	</button>
{/snippet}

<div class="crate">
	<div class="shelves">
		<header>
			<p class="kicker">Music</p>
			<h2>The rack</h2>
			<p class="hint">Pick a case. The disc goes on the turntable.</p>
		</header>
		<div class="board cds">
			{#each cds as track (trackKey(track))}
				{@render holder(track)}
			{/each}
		</div>
		<div class="board records">
			{#each records as track (trackKey(track))}
				{@render holder(track)}
			{/each}
		</div>
	</div>

	<div class={['deck', spinning && 'spinning']}>
		<div class="plinth">
			<div class="platter">
				<span class="mat"></span>
				{#if platter}
					{#key platter}
						<span
							class="slot on"
							in:receive|global={{ key: trackKey(platter) }}
							out:send|global={{ key: trackKey(platter) }}
							onintroend={land}
						>
							{@render disc(platter)}
						</span>
					{/key}
				{/if}
				<span class="spindle"></span>
			</div>
			<span class="arm" aria-hidden="true"><span class="head"></span></span>
			<span class="pivot" aria-hidden="true"></span>
			<span class="led" aria-hidden="true"></span>
			<span class="speed" aria-hidden="true">33⅓</span>
		</div>

		<div class="now">
			<div class="meta">
				{#if platter}
					<span class="title" lang={platter.item.lang}>{platter.item.title}</span>
					<span class="by" lang={platter.item.lang}>{platter.item.by ?? (platter.format === 'cd' ? 'Single' : 'Record')}</span>
				{:else}
					<span class="title">Nothing on</span>
					<span class="by">Choose something from the rack</span>
				{/if}
			</div>
			<Soundwave active={spinning} bars={18} class="meter" />
			<button
				type="button"
				class="key"
				disabled={!loaded || moving !== null}
				aria-label={playing ? 'Pause' : 'Play'}
				onclick={() => {
					clicks.tick('key');
					ontoggle();
				}}
			>
				{#if playing}
					<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 2.5v7M8.5 2.5v7" /></svg>
				{:else}
					<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 2.2l6 3.8-6 3.8z" /></svg>
				{/if}
			</button>
		</div>
	</div>
</div>

<style>
	.crate {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 21rem;
		gap: clamp(1.2rem, 3vw, 2.4rem);
		padding: clamp(1.4rem, 3vw, 2.2rem);
		background: linear-gradient(180deg, #f8f3ea, #efe6d6);
	}

	header {
		display: grid;
		gap: 0.2rem;
		margin-bottom: 1.2rem;
	}

	.kicker {
		margin: 0;
		color: var(--ink-3);
		font-family: var(--mono);
		font-size: 0.68rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0;
		font-family: var(--serif);
		font-size: 1.6rem;
		font-weight: 400;
	}

	.hint {
		margin: 0;
		color: var(--ink-3);
		font-size: 0.85rem;
	}

	/* Shelf boards: cases stand on a lit maple edge, shadowed against the back panel. */
	.board {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 1.1rem 0.55rem;
		padding: 1rem 0.9rem 0;
		border-radius: 0.5rem 0.5rem 0 0;
		background: linear-gradient(180deg, #e7dcc8, #f1e9db 70%);
		box-shadow:
			inset 0 10px 18px -12px rgba(60, 40, 10, 0.35),
			0 0.55rem 0 #d9c6a3,
			0 0.6rem 0 #c9b38b,
			0 1.6rem 1.4rem -0.8rem rgba(60, 40, 10, 0.35);
	}

	.board + .board {
		margin-top: 2rem;
	}

	.holder {
		--w: 5.4rem;
		--h: 4.8rem;
		position: relative;
		flex: none;
		width: var(--w);
		height: var(--h);
		margin-bottom: 0;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
		perspective: 900px;
		transition: transform 260ms var(--ease-out);
	}

	.holder:hover {
		transform: translateY(-4px);
	}

	.holder:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
		border-radius: 3px;
	}

	.records .holder {
		--w: 7.4rem;
		--h: 7.4rem;
	}

	/* The tray behind the lid: smoked plastic for a case, a paper inner for a sleeve. */
	.tray {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		border-radius: 2px;
		background: linear-gradient(135deg, #2c2c30, #18181b);
		box-shadow:
			0 6px 10px -4px rgba(0, 0, 0, 0.4),
			inset 0 0 0 1px rgba(255, 255, 255, 0.06);
	}

	.records .tray {
		background: #f3eee4;
		box-shadow: 0 6px 10px -4px rgba(0, 0, 0, 0.3);
	}

	.slot {
		display: block;
		width: 84%;
		aspect-ratio: 1;
		transition: transform 420ms var(--ease-out);
	}

	.records .slot {
		width: 94%;
	}

	/* A record slides out of the sleeve's open edge before it leaves. */
	.records.open .slot {
		transform: translateX(46%);
	}

	.lid {
		position: absolute;
		inset: 0;
		transform-origin: left center;
		transform-style: preserve-3d;
		transition: transform 420ms var(--ease-out);
	}

	.cd.open .lid {
		transform: rotateY(-118deg);
	}

	.insert {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.45rem 0.45rem 0.4rem 0.85rem;
		overflow: hidden;
		border-radius: 2px;
		background: var(--tone);
		color: var(--ink);
		text-align: left;
		backface-visibility: hidden;
	}

	.records .insert {
		padding: 0.7rem;
		background:
			radial-gradient(circle at 70% 64%, var(--ink) 0 22%, transparent 22.5%),
			var(--tone);
		box-shadow: 0 6px 12px -6px rgba(0, 0, 0, 0.4);
	}

	/* The hinge strip down the left of a jewel case. */
	.cd .insert::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 0.42rem;
		background: repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.55) 0 2px, rgba(255, 255, 255, 0.22) 2px 4px);
		box-shadow: 1px 0 0 rgba(0, 0, 0, 0.18);
	}

	/* Gloss across the clear plastic. */
	.insert::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(118deg, rgba(255, 255, 255, 0.46) 0 14%, transparent 30%, transparent 72%, rgba(255, 255, 255, 0.14));
		pointer-events: none;
	}

	.insert .title {
		font-size: 0.66rem;
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: -0.01em;
	}

	.insert .by {
		margin-top: auto;
		font-size: 0.5rem;
		letter-spacing: 0.04em;
		opacity: 0.8;
	}

	.records .insert .title {
		position: relative;
		z-index: 1;
		max-width: 70%;
		font-size: 0.82rem;
	}

	.records .insert .by {
		position: relative;
		z-index: 1;
	}

	/* An empty case: the lid sits a touch open so you can see the disc is out. */
	.cd.loaded:not(.open) .lid {
		transform: rotateY(-14deg);
	}

	.records.loaded:not(.open) .insert {
		opacity: 0.86;
	}

	/* Discs. */
	.art {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.art.cd {
		background:
			radial-gradient(circle, transparent 0 7%, rgba(0, 0, 0, 0.16) 7.5% 9%, #e9edf0 9.5% 15%, transparent 15.5%),
			conic-gradient(from 20deg, #e7ebee, #c8d2db, #f2e7f3, #d2e6df, #e7ebee, #cdd5dd, #f0ece0, #e7ebee);
		box-shadow:
			inset 0 0 0 1px rgba(0, 0, 0, 0.1),
			0 2px 6px rgba(0, 0, 0, 0.2);
		-webkit-mask: radial-gradient(circle, transparent 0 7%, #000 7.5%);
		mask: radial-gradient(circle, transparent 0 7%, #000 7.5%);
	}

	.art.vinyl {
		background:
			radial-gradient(circle, transparent 0 34%, #0b0b0b 34.5% 36%, transparent 36.5%),
			repeating-radial-gradient(circle, #151515 0 1.5px, #232323 1.5px 3px);
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
	}

	.label {
		display: grid;
		place-items: center;
		width: 36%;
		aspect-ratio: 1;
		overflow: hidden;
		border-radius: 50%;
		background: radial-gradient(circle, transparent 0 9%, var(--tone) 10%);
		color: var(--ink);
	}

	.art.cd .label {
		width: 62%;
		background: radial-gradient(circle, transparent 0 23%, color-mix(in oklab, var(--tone) 70%, transparent) 24%);
		-webkit-mask: radial-gradient(circle, transparent 0 21%, #000 22%);
		mask: radial-gradient(circle, transparent 0 21%, #000 22%);
	}

	.label span {
		max-width: 82%;
		transform: translateY(-0.9em);
		overflow: hidden;
		font-size: clamp(4px, 0.5em, 9px);
		font-weight: 600;
		line-height: 1;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.art.cd .label span {
		transform: translateY(-1.7em);
	}

	/* The turntable, seen from above. */
	.deck {
		display: grid;
		align-content: start;
		gap: 1rem;
	}

	.plinth {
		position: relative;
		aspect-ratio: 1 / 0.92;
		border-radius: 1.1rem;
		background: linear-gradient(160deg, #fbf7f0, #e9e0d1);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			inset 0 -3px 0 rgba(0, 0, 0, 0.06),
			0 22px 40px -18px rgba(60, 40, 10, 0.5),
			0 4px 10px -4px rgba(60, 40, 10, 0.25);
	}

	.platter {
		position: absolute;
		left: 7%;
		top: 8%;
		width: 74%;
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: linear-gradient(145deg, #d9d6d0, #a9a6a0);
		box-shadow:
			0 6px 14px -6px rgba(0, 0, 0, 0.5),
			inset 0 0 0 2px rgba(255, 255, 255, 0.4);
	}

	.platter > * {
		grid-area: 1 / 1;
	}

	.mat {
		width: 94%;
		aspect-ratio: 1;
		border-radius: 50%;
		background: repeating-radial-gradient(circle, #2a2a2c 0 2px, #222224 2px 4px);
	}

	.slot.on {
		width: 92%;
		z-index: 1;
	}

	.slot.on .art {
		animation: spin 1.8s linear infinite;
		animation-play-state: paused;
	}

	.spinning .slot.on .art {
		animation-play-state: running;
	}

	.slot.on .art.cd {
		animation-duration: 1.2s;
	}

	@keyframes spin {
		to {
			rotate: 360deg;
		}
	}

	.spindle {
		z-index: 2;
		width: 3.2%;
		aspect-ratio: 1;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 35%, #fff, #9a9a9a);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	/* The tonearm pivots from the top right and swings in once the disc has landed. */
	.arm {
		position: absolute;
		z-index: 3;
		top: 9%;
		right: 9%;
		width: 3.5%;
		height: 66%;
		border-radius: 999px;
		background: linear-gradient(90deg, #d8d8d8, #f6f6f6 45%, #bdbdbd);
		box-shadow: 2px 4px 6px -2px rgba(0, 0, 0, 0.4);
		transform-origin: 50% 4%;
		transform: rotate(2deg);
		transition: transform 900ms var(--ease-out);
	}

	.spinning .arm {
		transform: rotate(23deg);
	}

	.head {
		position: absolute;
		left: 50%;
		bottom: -6%;
		width: 260%;
		height: 11%;
		border-radius: 2px;
		background: linear-gradient(90deg, #2a2a2a, #4a4a4a);
		transform: translateX(-50%) rotate(-18deg);
	}

	.pivot {
		position: absolute;
		z-index: 4;
		top: 5.5%;
		right: 5.6%;
		width: 10%;
		aspect-ratio: 1;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 35%, #fafafa, #b8b8b8 70%);
		box-shadow: 0 3px 6px -2px rgba(0, 0, 0, 0.45);
	}

	.led {
		position: absolute;
		left: 7%;
		bottom: 5%;
		width: 0.42rem;
		height: 0.42rem;
		border-radius: 50%;
		background: #c9c2b6;
		transition:
			background-color 200ms var(--ease-out),
			box-shadow 200ms var(--ease-out);
	}

	.spinning .led {
		background: var(--accent);
		box-shadow: 0 0 8px var(--accent);
	}

	.speed {
		position: absolute;
		left: calc(7% + 0.8rem);
		bottom: calc(5% - 0.15rem);
		color: var(--ink-3);
		font-family: var(--mono);
		font-size: 0.6rem;
	}

	.now {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 0.8rem;
		padding: 0.7rem 0.7rem 0.7rem 0.95rem;
		border-radius: 0.9rem;
		background: #1d1c1a;
		color: #f2ede4;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	.meta {
		display: grid;
		min-width: 0;
	}

	.meta .title {
		overflow: hidden;
		font-size: 0.86rem;
		font-weight: 500;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.meta .by {
		overflow: hidden;
		color: #a39d92;
		font-size: 0.72rem;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.now :global(.meter) {
		color: var(--accent);
	}

	.key {
		display: grid;
		place-items: center;
		width: 2.3rem;
		height: 2.3rem;
		border: 0;
		border-radius: 50%;
		background: linear-gradient(180deg, #f6f2ea, #d9d2c5);
		color: #1d1c1a;
		box-shadow:
			0 2px 0 #9e978a,
			0 4px 8px rgba(0, 0, 0, 0.4);
		cursor: pointer;
		transition:
			transform 90ms var(--ease-out),
			box-shadow 90ms var(--ease-out);
	}

	.key:active:not(:disabled) {
		transform: translateY(2px);
		box-shadow:
			0 0 0 #9e978a,
			0 2px 4px rgba(0, 0, 0, 0.4);
	}

	.key:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.key svg {
		width: 0.8rem;
		height: 0.8rem;
		fill: currentColor;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	[lang='ko'] {
		font-family: var(--korean);
	}

	@media (max-width: 760px) {
		.crate {
			grid-template-columns: minmax(0, 1fr);
		}

		.deck {
			order: -1;
			max-width: 22rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.slot,
		.lid,
		.arm,
		.holder {
			transition: none;
		}

		.spinning .slot.on .art {
			animation-play-state: paused;
		}
	}
</style>
