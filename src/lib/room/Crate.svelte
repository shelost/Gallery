<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { T } from '@threlte/core';
	import { Clicks } from '$lib/directions/clicks.svelte.js';
	import Turntable, { DECK } from '$lib/shelf/Turntable.svelte';
	import Box from './Box.svelte';
	import Heading from './Heading.svelte';
	import ModelView from './ModelView.svelte';
	import Scrubber from './Scrubber.svelte';
	import Soundwave from './Soundwave.svelte';
	import { trackKey } from './furnishing.js';
	import { mahogany, pine } from './materials.js';

	/** @typedef {import('./furnishing.js').Track} Track */

	/**
	 * The record crate, and the turntable up close on its corner of the desk. Pulling a sleeve
	 * slides the record out and onto the platter, and the arm swings over once it's down; the
	 * record that was on slides back into its own sleeve. Only the crate scrolls. `time` and
	 * `duration` are how far into the record the needle is, in seconds.
	 * @type {{ crates: { id: string, label: string, tracks: Track[] }[], current: Track, playing: boolean, time: number, duration: number, onplay: (track: Track) => void, ontoggle: () => void, onseek: (seconds: number) => void }}
	 */
	let { crates, current, playing, time, duration, onplay, ontoggle, onseek } = $props();

	const SLIDE_MS = 420;
	/** The corner of the desk the turntable stands on: its writing slab over a moulding, in meters. */
	const CORNER = { w: 0.64, d: 0.5, h: 0.062, slab: 0.036 };

	const clicks = new Clicks({ muted: false });
	const wood = mahogany();
	const grain = pine();

	/** Sleeves pulled forward: the one being taken from and the one being put back. @type {string[]} */
	let open = $state([]);
	let pointing = $state(false);
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let timer;

	function toggle() {
		clicks.tick('key');
		ontoggle();
	}

	/** @param {Track} track */
	function pick(track) {
		if (open.length) return;
		if (track === current) return toggle();
		const quick = prefersReducedMotion.current;
		clicks.tick('latch');
		open = [trackKey(track), trackKey(current)];
		timer = setTimeout(() => {
			clicks.tick('thunk');
			onplay(track);
			timer = setTimeout(() => {
				clicks.tick('latch');
				open = [];
			}, quick ? 0 : 260);
		}, quick ? 0 : SLIDE_MS);
	}

	/** @param {Track} track */
	const cover = (track) => (track.item.cover ? `url("${track.item.cover}")` : undefined);

	$effect(() => () => {
		clearTimeout(timer);
		clicks.dispose();
	});
</script>

{#snippet disc(/** @type {Track} */ track)}
	<span class="art" style:--tone={track.item.tone} style:--ink={track.item.ink}>
		<span class={['label', track.item.cover && 'printed']} style:--cover={cover(track)}>
			{#if !track.item.cover}
				<span lang={track.item.lang}>{track.item.title}</span>
			{/if}
		</span>
	</span>
{/snippet}

<div class="crate">
	<div class="shelves">
		<Heading kicker="Music" title="The crate" hint="Pull a sleeve. The record goes on the turntable." />
		<div class="scroller">
			{#each crates as crate (crate.id)}
				<section class="group">
					<h3>{crate.label}</h3>
					<div class="board">
						{#each crate.tracks as track (trackKey(track))}
							{@const on = track === current}
							<button
								type="button"
								class={['sleeve', open.includes(trackKey(track)) && 'open', on && 'loaded']}
								style:--tone={track.item.tone}
								style:--ink={track.item.ink}
								aria-label="{on && playing ? 'Pause' : 'Play'} {track.item.title}{track.item.by ? ` by ${track.item.by}` : ''}"
								aria-pressed={on && playing}
								onclick={() => pick(track)}
							>
								<span class="inner">
									{#if !on}
										<span class="slot" transition:fade={{ duration: prefersReducedMotion.current ? 0 : 220 }}>{@render disc(track)}</span>
									{/if}
								</span>
								<span class={['jacket', track.item.cover && 'printed']} style:--cover={cover(track)}>
									{#if !track.item.cover}
										<span class="title" lang={track.item.lang}>{track.item.title}</span>
										{#if track.item.by}
											<span class="by" lang={track.item.lang}>{track.item.by}</span>
										{/if}
									{/if}
								</span>
							</button>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	</div>

	<div class="deck">
		<div class="player">
			<ModelView
				size={[CORNER.w, CORNER.h + DECK.h, CORNER.d]}
				yaw={0.5}
				pitch={0.62}
				label="The turntable, with {current.item.title} on it. Drag to turn it."
				cursor={pointing ? 'pointer' : 'grab'}
			>
				<Box size={[CORNER.w, CORNER.slab, CORNER.d]} radius={0.01} map={wood} roughness={0.3} sheen={0.75} position={[0, CORNER.h - CORNER.slab / 2, 0]} />
				<Box
					size={[CORNER.w - 0.03, CORNER.h - CORNER.slab, CORNER.d - 0.03]}
					radius={0.006}
					map={wood}
					color="#c99c8c"
					roughness={0.34}
					sheen={0.6}
					position={[0, (CORNER.h - CORNER.slab) / 2, 0]}
				/>
				<T.Group position={[0, CORNER.h, -(DECK.d / 2 + 0.012)]}>
					<Turntable
						item={current.item}
						still={prefersReducedMotion.current}
						spinning={playing}
						finish="#ffffff"
						{grain}
						onpick={toggle}
						onhover={(on) => (pointing = on)}
					/>
				</T.Group>
			</ModelView>
		</div>

		<div class="now">
			<div class="meta">
				<span class="title" lang={current.item.lang}>{current.item.title}</span>
				<span class="by" lang={current.item.lang}>{current.item.by ?? 'Record'}</span>
			</div>
			<Soundwave active={playing} bars={18} class="meter" />
			<button type="button" class="key" disabled={open.length > 0} aria-label={playing ? 'Pause' : 'Play'} onclick={toggle}>
				{#if playing}
					<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 2.5v7M8.5 2.5v7" /></svg>
				{:else}
					<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 2.2l6 3.8-6 3.8z" /></svg>
				{/if}
			</button>
			<div class="scrub">
				<Scrubber {time} {duration} {onseek} />
			</div>
		</div>
	</div>
</div>

<style>
	/* Padding inside its height, so the crate never outgrows the sheet and the sheet never scrolls. */
	.crate {
		box-sizing: border-box;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(19rem, 26rem);
		gap: clamp(1.4rem, 3vw, 2.6rem);
		height: min(44rem, calc(100dvh - 4rem));
		padding: clamp(1rem, 2.4vw, 1.8rem);
	}

	.shelves {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		gap: 0.6rem;
		min-height: 0;
	}

	/* The only part that scrolls, fading out at its edges rather than ending on a hard line. */
	.scroller {
		display: grid;
		align-content: start;
		gap: 2rem;
		min-height: 0;
		margin: 0 -1rem;
		padding: 1rem 1rem 2.6rem;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		mask-image: linear-gradient(transparent, #000 1rem, #000 calc(100% - 2.4rem), transparent);
	}

	h3 {
		margin: 0;
		color: var(--ink-3);
		font-family: var(--mono);
		font-size: 0.68rem;
		font-weight: 400;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.group {
		display: grid;
		gap: 0.6rem;
	}

	/* Sleeves stand in a pine crate, lit from above and shadowed against the back. */
	.board {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 1.1rem 0.6rem;
		padding: 1rem 0.9rem 0;
		border-radius: 0.5rem 0.5rem 0 0;
		background: linear-gradient(180deg, #e7dcc8, #f1e9db 70%);
		box-shadow:
			inset 0 10px 18px -12px rgba(60, 40, 10, 0.35),
			0 0.55rem 0 #d7a964,
			0 0.6rem 0 #b9844a,
			0 1.6rem 1.4rem -0.8rem rgba(60, 40, 10, 0.35);
	}

	.sleeve {
		position: relative;
		flex: none;
		width: 7.4rem;
		height: 7.4rem;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
		transition: transform 260ms var(--ease-out);
	}

	.sleeve:hover {
		transform: translateY(-4px);
	}

	.sleeve:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
		border-radius: 3px;
	}

	/* The paper inner sleeve; the record slides out of its open edge before it goes on. */
	.inner {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		border-radius: 2px;
		background: #f3eee4;
		box-shadow: 0 6px 10px -4px rgba(0, 0, 0, 0.3);
	}

	.slot {
		display: block;
		width: 94%;
		aspect-ratio: 1;
		transition: transform 420ms var(--ease-out);
	}

	.open .slot {
		transform: translateX(46%);
	}

	.jacket {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.7rem;
		overflow: hidden;
		border-radius: 2px;
		background:
			radial-gradient(circle at 70% 64%, var(--ink) 0 22%, transparent 22.5%),
			var(--tone);
		color: var(--ink);
		text-align: left;
		box-shadow: 0 6px 12px -6px rgba(0, 0, 0, 0.4);
		transition: opacity 260ms var(--ease-out);
	}

	.jacket.printed {
		background: var(--cover) center / cover no-repeat, var(--tone);
	}

	/* Light catching the laminate. */
	.jacket::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(118deg, rgba(255, 255, 255, 0.3) 0 10%, transparent 26%, transparent 76%, rgba(255, 255, 255, 0.1));
		pointer-events: none;
	}

	.jacket .title {
		position: relative;
		z-index: 1;
		max-width: 70%;
		font-size: 0.82rem;
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: -0.01em;
	}

	.jacket .by {
		position: relative;
		z-index: 1;
		margin-top: auto;
		font-size: 0.5rem;
		letter-spacing: 0.04em;
		opacity: 0.8;
	}

	.loaded:not(.open) .jacket {
		opacity: 0.86;
	}

	/* The record: grooves, a run-out ring and the label, printed with the cover when there is one. */
	.art {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		border-radius: 50%;
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

	.label.printed {
		background: var(--cover) center / cover no-repeat;
		-webkit-mask: radial-gradient(circle, transparent 0 9%, #000 10%);
		mask: radial-gradient(circle, transparent 0 9%, #000 10%);
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

	/* The turntable stays put beside the crate, with what's on under it. */
	.deck {
		display: grid;
		grid-template-rows: minmax(0, 1fr) auto;
		gap: 0.9rem;
		min-height: 0;
	}

	.player {
		min-height: 0;
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
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			0 18px 30px -18px rgba(28, 27, 24, 0.5);
	}

	.meta {
		display: grid;
		min-width: 0;
	}

	.scrub {
		grid-column: 1 / -1;
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

	/* On a phone the turntable comes first, a strip across the top, and the crate scrolls under it. */
	@media (max-width: 760px) {
		.crate {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: auto minmax(0, 1fr);
			height: calc(100dvh - 4.6rem);
		}

		.deck {
			order: -1;
			grid-template-rows: 12rem auto;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.slot,
		.sleeve,
		.jacket {
			transition: none;
		}
	}
</style>
