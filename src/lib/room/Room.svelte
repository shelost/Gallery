<script>
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { Canvas } from '@threlte/core';
	import { NeutralToneMapping } from 'three';
	import Artifact from '$lib/directions/Artifact.svelte';
	import { SHELVES } from '$lib/directions/content.js';
	import { embed } from '$lib/directions/music.js';
	import { BIRTHDAY, HOME, Now, age, loadFacts, pad, wallClock } from '$lib/directions/today.js';
	import { MONO, SANS, block, loadCoverFonts } from '$lib/shelf/covers.js';
	import BrushDesk from './BrushDesk.svelte';
	import Crate from './Crate.svelte';
	import Explainer from './Explainer.svelte';
	import Library from './Library.svelte';
	import Sheet from './Sheet.svelte';
	import Soundwave from './Soundwave.svelte';
	import { BOOKS, CDS, RECORDS, TRACKS, findPiece, trackOf } from './furnishing.js';
	import RoomScene from './RoomScene.svelte';

	/** @typedef {import('./furnishing.js').Track} Track */
	/** @typedef {import('$lib/directions/today.js').Fact} Fact */
	/** @typedef {import('$lib/shelf/layout.js').ItemPiece} ItemPiece */
	/** @typedef {{ kind: 'crate' } | { kind: 'books' } | { kind: 'brush' } | { kind: 'item', piece: ItemPiece }} Opened */

	/**
	 * The hero: my room in 3D, without its walls. The widgets sit on the table; the calligraphy
	 * set, the books, the music and everything on the shelves open up in place when clicked.
	 * @type {{ area?: string }}
	 */
	let { area } = $props();

	const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const INK = '#1c1b18';
	const ACCENT = '#ff004c';

	/** What each thing in the room does, shown while it's pointed at. @type {Record<string, string>} */
	const HINTS = {
		tv: 'On this day · click for another',
		clock: `The time in ${HOME.place} · click for 12 or 24 hours`,
		age: 'My age, to the second',
		discman: 'CD player · play or pause',
		turntable: 'Turntable · pick a record',
		rack: 'CD rack · pick the music',
		arc: 'ARC grid · click to draw another',
		brush: 'Sveltebrush · pick up the brush'
	};

	const FIRST = TRACKS.find((track) => track.item.youtube === '-1JCohwW0EA') ?? TRACKS[0];

	/** The disc on the deck, once something has been played. @type {Track | null} */
	let loaded = $state.raw(null);
	let cd = $state.raw(FIRST.format === 'cd' ? FIRST : CDS[0]);
	let record = $state.raw(/** @type {Track | undefined} */ (RECORDS[0]));
	let playing = $state(false);
	let hovered = $state(/** @type {string | null} */ (null));
	let seed = $state(1);
	let hour12 = $state(true);
	let ready = $state(false);
	let facts = $state.raw(/** @type {Fact[]} */ ([]));
	let fact = $state(0);

	/** @type {Opened | null} */
	let opened = $state.raw(null);
	/** Where the last press landed, so a sheet can grow out of it. */
	let origin = $state.raw(/** @type {{ x: number, y: number } | null} */ (null));
	/** @type {number | null} */
	let book = $state(null);

	const fine = new Now(100);
	const coarse = new Now(1000);

	const current = $derived(loaded ?? FIRST);
	const spinning = $derived(playing ? current.format : null);
	const clock = $derived(coarse.current === null ? null : wallClock(coarse.current, HOME.zone));
	const life = $derived.by(() => {
		const at = prefersReducedMotion.current ? coarse.current : fine.current;
		return at === null ? null : age(at);
	});
	const shown = $derived(facts.length ? facts[fact % facts.length] : null);
	const audio = $derived(playing ? embed(current.item, { search: true }) : '');
	const hint = $derived.by(() => {
		if (!hovered) return 'Point at things in the room';
		const piece = findPiece(hovered);
		return HINTS[hovered] ?? (piece ? [piece.item.title, piece.item.by].filter(Boolean).join(' · ') : '');
	});

	/** @param {Track} track */
	function play(track) {
		loaded = track;
		if (track.format === 'cd') cd = track;
		else record = track;
		playing = true;
	}

	/** Plays a track, or pauses it if it's the one already playing. @param {Track | undefined} track */
	function toggle(track) {
		if (!track) return;
		if (playing && current === track) playing = false;
		else play(track);
	}

	/** @param {Opened} next */
	function open(next) {
		if (next.kind === 'books') book = null;
		opened = next;
	}

	/** @param {string} id */
	function pick(id) {
		if (id === 'rack' || id === 'turntable') open({ kind: 'crate' });
		else if (id === 'brush') open({ kind: 'brush' });
		else if (id === 'tv') fact += 1;
		else if (id === 'clock') hour12 = !hour12;
		else if (id === 'arc') seed += 1;
		else if (id === 'discman') toggle(cd);
		else {
			const piece = findPiece(id);
			if (!piece) return;
			if (piece.format === 'vinyl') open({ kind: 'crate' });
			else if (piece.format === 'book') open({ kind: 'books' });
			else open({ kind: 'item', piece });
		}
	}

	/** @param {PointerEvent} event */
	function press(event) {
		origin = { x: event.clientX, y: event.clientY };
	}

	/** @param {CanvasRenderingContext2D} ctx @param {number} w @param {number} h */
	function paintClock(ctx, w, h) {
		ctx.fillStyle = '#eef3ee';
		ctx.fillRect(0, 0, w, h);
		const hours = clock ? (hour12 ? clock.hour % 12 || 12 : clock.hour) : null;
		const main = clock ? `${pad(hours ?? 0)}:${pad(clock.minute)}` : '--:--';
		ctx.textBaseline = 'middle';
		ctx.font = `500 ${h * 0.66}px ${MONO}`;
		ctx.textAlign = 'left';
		ctx.fillStyle = 'rgba(28, 27, 24, 0.06)';
		ctx.fillText('88:88', w * 0.06, h * 0.54);
		ctx.fillStyle = INK;
		ctx.fillText(main, w * 0.06, h * 0.54);
		ctx.font = `500 ${h * 0.2}px ${MONO}`;
		ctx.textAlign = 'right';
		ctx.fillStyle = ACCENT;
		ctx.fillText(clock && hour12 ? (clock.hour < 12 ? 'AM' : 'PM') : '24H', w * 0.95, h * 0.3);
		ctx.fillStyle = 'rgba(28, 27, 24, 0.55)';
		ctx.fillText(clock ? pad(clock.second) : '--', w * 0.95, h * 0.72);
	}

	/** @param {CanvasRenderingContext2D} ctx @param {number} w @param {number} h */
	function paintAge(ctx, w, h) {
		ctx.fillStyle = '#fff6f1';
		ctx.fillRect(0, 0, w, h);
		const decimals = prefersReducedMotion.current ? 2 : 7;
		const [whole, part] = life ? life.years.toFixed(decimals).split('.') : ['--', '-'.repeat(decimals)];
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'left';
		ctx.font = `500 ${h * 0.56}px ${MONO}`;
		ctx.fillStyle = INK;
		ctx.fillText(whole, w * 0.05, h * 0.52);
		const at = w * 0.05 + ctx.measureText(whole).width;
		ctx.fillStyle = 'rgba(28, 27, 24, 0.45)';
		ctx.font = `500 ${h * 0.36}px ${MONO}`;
		ctx.fillText(`.${part}`, at, h * 0.6);
		ctx.font = `500 ${h * 0.17}px ${SANS}`;
		ctx.fillStyle = ACCENT;
		ctx.textAlign = 'right';
		ctx.fillText(`SINCE ${BIRTHDAY.year}`, w * 0.95, h * 0.22);
	}

	/** @param {CanvasRenderingContext2D} ctx @param {number} w @param {number} h */
	function paintTv(ctx, w, h) {
		const glass = ctx.createRadialGradient(w * 0.4, h * 0.35, 0, w * 0.5, h * 0.5, w * 0.75);
		glass.addColorStop(0, '#fbfffd');
		glass.addColorStop(1, '#dfeee8');
		ctx.fillStyle = glass;
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = 'rgba(28, 27, 24, 0.025)';
		for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1.5);
		const pad = w * 0.07;
		ctx.textBaseline = 'alphabetic';
		ctx.textAlign = 'left';
		ctx.font = `500 ${h * 0.065}px ${SANS}`;
		ctx.fillStyle = 'rgba(28, 27, 24, 0.5)';
		ctx.fillText(`ON THIS DAY${clock ? ` · ${MONTHS[clock.month - 1].toUpperCase()} ${clock.day}` : ''}`, pad, pad + h * 0.05);
		if (!shown) {
			ctx.fillStyle = INK;
			ctx.font = `400 ${h * 0.09}px ${SANS}`;
			ctx.fillText('Tuning in…', pad, h * 0.5);
			return;
		}
		ctx.fillStyle = ACCENT;
		ctx.font = `500 ${h * 0.2}px ${SANS}`;
		ctx.fillText(shown.year, pad, h * 0.38);
		ctx.fillStyle = INK;
		block(ctx, shown.text, { x: pad, y: h * 0.43, width: w - pad * 2, size: h * 0.085, font: SANS, leading: 1.18, max: 4 });
		ctx.font = `500 ${h * 0.055}px ${SANS}`;
		ctx.fillStyle = 'rgba(28, 27, 24, 0.4)';
		ctx.textAlign = 'right';
		ctx.fillText(`${(fact % facts.length) + 1}/${facts.length}`, w - pad, h - pad * 0.7);
	}

	onMount(() => {
		const controller = new AbortController();
		const { month, day } = wallClock(Date.now(), HOME.zone);
		loadFacts(month, day, controller.signal)
			.then((result) => (facts = result))
			.catch(() => {});
		loadCoverFonts().finally(() => (ready = true));
		return () => controller.abort();
	});
</script>

<section
	class="room"
	style:--area={area}
	style:cursor={hovered ? 'pointer' : undefined}
	aria-label="My room"
	onpointerdown={press}
>
	{#if ready}
		<div class="canvas">
			<Canvas toneMapping={NeutralToneMapping} dpr={Math.min(devicePixelRatio, 2)}>
				<RoomScene
					{cd}
					{record}
					{spinning}
					{hovered}
					{seed}
					still={prefersReducedMotion.current}
					{paintTv}
					{paintClock}
					{paintAge}
					onhover={(id) => (hovered = id)}
					onpick={pick}
				/>
			</Canvas>
		</div>
	{/if}

	<p class="hint" aria-live="polite">{hint}</p>

	<div class={['deck', playing && 'on']}>
		<span class="disc" style:--tone={current.item.tone} style:--ink={current.item.ink} aria-hidden="true"></span>
		<div class="track">
			<span class="label">{playing ? 'Now playing' : loaded ? 'Paused' : 'On the deck'}</span>
			<span class="title" lang={current.item.lang}>{current.item.title}</span>
			{#if current.item.by}<span class="by" lang={current.item.lang}>{current.item.by}</span>{/if}
		</div>
		<Soundwave active={playing} class="wave" />
		<button type="button" class="key" aria-label={playing ? 'Pause' : 'Play'} onclick={() => toggle(current)}>
			<svg viewBox="0 0 16 16" aria-hidden="true">
				{#if playing}
					<path d="M5 3.5h2v9H5zM9 3.5h2v9H9z" />
				{:else}
					<path d="M5.5 3.5 12 8l-6.5 4.5z" />
				{/if}
			</svg>
		</button>
		<button type="button" class="change" onclick={() => open({ kind: 'crate' })}>Change</button>
	</div>

	<!-- Only the sound comes through; the player itself stays out of sight. -->
	{#if audio}
		{#key audio}
			<iframe class="audio" src={audio} title="Now playing: {current.item.title}" allow="autoplay; encrypted-media" tabindex="-1" aria-hidden="true"></iframe>
		{/key}
	{/if}
</section>

{#if opened?.kind === 'crate'}
	<Sheet {origin} label="The music shelf" width="66rem" surface="#f6efe3" onclose={() => (opened = null)}>
		<Crate tracks={TRACKS} {loaded} {playing} onplay={play} ontoggle={() => toggle(current)} />
	</Sheet>
{:else if opened?.kind === 'books'}
	<Sheet {origin} label="The bookshelf" width="58rem" onclose={() => (opened = null)}>
		<Library books={BOOKS} bind:selected={book} />
	</Sheet>
{:else if opened?.kind === 'brush'}
	<Sheet {origin} label="Sveltebrush" width="58rem" surface="#f7f2e8" onclose={() => (opened = null)}>
		<BrushDesk />
	</Sheet>
{:else if opened?.kind === 'item'}
	{@const piece = opened.piece}
	<Sheet {origin} label={piece.item.title} width="44rem" onclose={() => (opened = null)}>
		<div class="item">
			<div class="figure">
				<Artifact item={piece.item} format={piece.format} i={piece.i} />
			</div>
			<Explainer item={piece.item} kicker={SHELVES.find((entry) => entry.id === piece.shelf)?.label ?? ''} action="Find out more" />
		</div>
	</Sheet>
{/if}

<style>
	.room {
		position: relative;
		grid-area: var(--area);
		min-width: 0;
		min-height: 0;
	}

	.canvas {
		position: absolute;
		inset: 0;
		animation: dir-sfumato 900ms var(--ease-out) both;
	}

	.hint {
		position: absolute;
		top: 0.4rem;
		left: 0;
		padding: 0.35rem 0.7rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.75);
		box-shadow: 0 0 0 1px rgba(28, 27, 24, 0.05);
		backdrop-filter: blur(10px);
		color: var(--ink-2);
		font-size: 12px;
		pointer-events: none;
	}

	.deck {
		position: absolute;
		right: 0;
		bottom: 0.4rem;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto auto auto;
		align-items: center;
		gap: 0.7rem;
		width: min(24rem, 100%);
		padding: 0.55rem 0.6rem 0.55rem 0.55rem;
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.82);
		box-shadow:
			inset 0 1px 0 #fff,
			0 0 0 1px rgba(28, 27, 24, 0.06),
			0 18px 30px -18px rgba(28, 27, 24, 0.35);
		backdrop-filter: blur(14px);
	}

	.disc {
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 50%;
		background:
			radial-gradient(circle, #fff 0 9%, var(--ink) 10% 13%, var(--tone) 14% 46%, transparent 47%),
			conic-gradient(#e8ecf2, #f6e4ee, #dff0ea, #ece6f8, #e8ecf2);
		box-shadow: 0 0 0 1px rgba(28, 27, 24, 0.08);
	}

	.deck.on .disc {
		animation: spin 2.4s linear infinite;
	}

	.deck :global(.wave) {
		color: var(--accent);
	}

	.track {
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.2;
	}

	.label {
		color: var(--accent);
		font-size: 10.5px;
	}

	.title,
	.by {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.title {
		color: var(--ink);
		font-size: 13px;
		font-weight: 500;
	}

	.by {
		color: var(--ink-3);
		font-size: 11.5px;
	}

	.deck .key {
		width: 2.1rem;
		height: 2.1rem;
	}

	.change {
		padding: 0.45rem 0.7rem;
		border-radius: 999px;
		color: var(--ink-2);
		font-size: 12px;
		box-shadow: 0 0 0 1px rgba(28, 27, 24, 0.1);
		transition: color 160ms var(--ease-out);
	}

	.change:hover {
		color: var(--accent);
	}

	/* Big enough that browsers treat it as a real player, too faint and small to see. */
	.audio {
		position: absolute;
		right: 0;
		bottom: 0;
		width: 2px;
		height: 2px;
		border: 0;
		opacity: 0.01;
		pointer-events: none;
	}

	.item {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: clamp(1.4rem, 4vw, 3rem);
		padding: clamp(1.6rem, 4vw, 3rem);
	}

	.figure {
		display: grid;
		place-items: center;
		min-width: 8.5rem;
		min-height: 12.5rem;
		zoom: 1.45;
	}

	[lang='ko'] {
		font-family: var(--korean);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 640px) {
		.item {
			grid-template-columns: minmax(0, 1fr);
		}

		.figure {
			min-height: 0;
			zoom: 1.1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.deck.on .disc,
		.canvas {
			animation: none;
		}
	}
</style>
