<script>
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { Canvas } from '@threlte/core';
	import { NeutralToneMapping } from 'three';
	import Artifact from '$lib/directions/Artifact.svelte';
	import { SHELVES } from '$lib/directions/content.js';
	import { BIRTHDAY, HOME, Now, age, pad, wallClock } from '$lib/directions/today.js';
	import { MONO, SANS, loadCoverFonts, loadCovers } from '$lib/shelf/covers.js';
	import BrushBoard from './BrushBoard.svelte';
	import Carousel from './Carousel.svelte';
	import ClockSheet from './ClockSheet.svelte';
	import Crate from './Crate.svelte';
	import Feature from './Feature.svelte';
	import Library from './Library.svelte';
	import LifeSheet from './LifeSheet.svelte';
	import PaintingFlow from './PaintingFlow.svelte';
	import Sheet from './Sheet.svelte';
	import Showcase from './Showcase.svelte';
	import Soundwave from './Soundwave.svelte';
	import StackSheet from './StackSheet.svelte';
	import StatueStage from './StatueStage.svelte';
	import VerseSheet from './VerseSheet.svelte';
	import { Player } from './player.svelte.js';
	import { BOOK_SHELF, CRATES, KEEPSAKES, MEDIA_SHELF, TAPES, TRACKS, findPiece } from './furnishing.js';
	import { PAINTINGS } from './paintings.js';
	import { STATUES } from './sculpt/statues.js';
	import { GRID, sprite } from './sprite.js';
	import RoomScene, { PAPER } from './RoomScene.svelte';

	/** @typedef {import('./furnishing.js').Track} Track */
	/** @typedef {import('$lib/shelf/layout.js').ItemPiece} ItemPiece */
	/** @typedef {'crate' | 'books' | 'media' | 'tapes' | 'laptop' | 'clock' | 'age' | 'bible' | 'statue' | 'painting' | 'arc'} Opened */

	/**
	 * The hero: my room in 3D, without its walls. Everything on the table and the shelves floats
	 * up when clicked: the widgets into fuller versions of themselves, the books and records into
	 * their shelves up close, and the sheet of hanji into your hands to write on.
	 * @type {{ area?: string }}
	 */
	let { area } = $props();

	const INK = '#1c1b18';
	const ACCENT = '#ff004c';
	const COFFEE = 'https://buymeacoffee.com/sailordantes';
	/** Where the statue and painting last chosen are kept between visits. */
	const KEPT = { statue: 'room:statue', painting: 'room:painting' };

	/** Sheets that open from a single thing in the room, and how wide they are. @type {Record<Opened, { label: string, width: string }>} */
	const SHEETS = {
		crate: { label: 'The record crate', width: '72rem' },
		books: { label: 'The bookshelf', width: '72rem' },
		media: { label: 'The media shelf', width: '58rem' },
		tapes: { label: 'Podcasts', width: '58rem' },
		laptop: { label: 'What I build with', width: '56rem' },
		clock: { label: 'The time at home', width: '58rem' },
		age: { label: 'Eighty years', width: '56rem' },
		bible: { label: 'Verse of the day', width: '44rem' },
		statue: { label: 'Choose a statue', width: '66rem' },
		painting: { label: 'Choose a painting', width: '66rem' },
		arc: { label: KEEPSAKES.arc.title, width: '50rem' }
	};

	/** What leaves the room while its sheet is open, so it reads as having floated up into it. @type {Partial<Record<Opened, string>>} */
	const RISES = { crate: 'turntable', tapes: 'tapes', laptop: 'laptop', clock: 'clock', age: 'age', bible: 'bible', statue: 'statue', painting: 'painting', arc: 'arc' };

	const FIRST = TRACKS.find((track) => track.item.title === 'Feel It Still') ?? TRACKS[0];

	/** The record on the deck, once something has been played. @type {Track | null} */
	let loaded = $state.raw(null);
	const player = new Player({ onended: () => play(TRACKS[(TRACKS.indexOf(current) + 1) % TRACKS.length]) });
	let hovered = $state(/** @type {string | null} */ (null));
	let seed = $state(1);
	let hour12 = $state(true);
	let ready = $state(false);
	let statue = $state(STATUES[0].id);
	let painting = $state(PAINTINGS[0].id);

	/** @type {Opened | null} */
	let opened = $state(null);
	/** What's up in the open sheet instead of in the room, until the sheet has shrunk back into it. */
	let away = $state(/** @type {string | null} */ (null));
	/** Where the last press landed, so a sheet can grow out of it. */
	let origin = $state.raw(/** @type {{ x: number, y: number } | null} */ (null));
	/** Which piece of an open shelf is chosen. @type {number | null} */
	let selected = $state(null);

	/** The paper is in your hands, and the board stays mounted after so the ink is kept. */
	let brushing = $state(false);
	let board = $state(false);
	let lifted = $state(false);
	/** @type {HTMLCanvasElement | null} */
	let writing = $state.raw(null);
	/** @type {ReturnType<typeof RoomScene> | undefined} */
	let scene = $state();

	const fine = new Now(100);
	const coarse = new Now(1000);

	const current = $derived(loaded ?? FIRST);
	const playing = $derived(player.playing);
	const clock = $derived(coarse.current === null ? null : wallClock(coarse.current, HOME.zone));
	const life = $derived.by(() => {
		const at = prefersReducedMotion.current ? coarse.current : fine.current;
		return at === null ? null : age(at);
	});
	const today = $derived(clock ?? wallClock(Date.now(), HOME.zone));

	/** Puts a statue or painting up, and remembers it for next time. @param {'statue' | 'painting'} kind @param {string} id */
	function hang(kind, id) {
		if (kind === 'statue') statue = id;
		else painting = id;
		try {
			localStorage.setItem(KEPT[kind], id);
		} catch {
			// Private windows can refuse storage; the choice still holds for this visit.
		}
	}

	/** @param {Track} track */
	function play(track) {
		loaded = track;
		player.play(track.item.youtube ?? '');
	}

	function toggle() {
		if (playing) player.pause();
		else play(current);
	}

	/** @param {Opened} next @param {number | null} [chosen] */
	function open(next, chosen = null) {
		selected = chosen;
		opened = next;
		away = RISES[next] ?? null;
	}

	function pickUpPaper() {
		board = true;
		lifted = true;
		brushing = true;
	}

	/** @param {HTMLCanvasElement | null} ink */
	function landed(ink) {
		writing = ink;
		lifted = false;
	}

	/** @param {string} id */
	function pick(id) {
		if (id === 'coffee') return void window.open(COFFEE, '_blank', 'noopener');
		if (id === 'brush') return pickUpPaper();
		if (id === 'turntable') return open('crate');
		if (id in SHEETS) return open(/** @type {Opened} */ (id));
		const piece = findPiece(id);
		if (!piece) return;
		if (piece.format === 'vinyl') open('crate');
		else if (piece.format === 'book') open('books');
		else if (piece.shelf === 'podcasts') open('tapes', TAPES.indexOf(piece));
		else open('media', MEDIA_SHELF.indexOf(piece));
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

	onMount(() => {
		try {
			const kept = { statue: localStorage.getItem(KEPT.statue), painting: localStorage.getItem(KEPT.painting) };
			if (STATUES.some((entry) => entry.id === kept.statue)) statue = /** @type {string} */ (kept.statue);
			if (PAINTINGS.some((entry) => entry.id === kept.painting)) painting = /** @type {string} */ (kept.painting);
		} catch {
			// Without storage the room starts with the defaults.
		}
		Promise.all([loadCoverFonts(), loadCovers(SHELVES.flatMap((entry) => entry.items))]).finally(() => (ready = true));
	});
</script>

{#snippet artifact(/** @type {ItemPiece} */ piece, /** @type {boolean} */ isOpen)}
	<span class="figure">
		<Artifact item={piece.item} format={piece.format} i={piece.i} open={isOpen} />
	</span>
{/snippet}

{#snippet pixels()}
	<div class="sprite" style:--grid={GRID} aria-label="A sprite after the ARC puzzles" role="img">
		{#each sprite(seed) as cell (`${cell.x}:${cell.y}`)}
			<span style:grid-area="{cell.y + 1} / {cell.x + 1}" style:background={cell.color}></span>
		{/each}
	</div>
	<button type="button" class="again" onclick={() => (seed += 1)}>Draw another</button>
{/snippet}

{#snippet statues(/** @type {(i: number) => number} */ offset, /** @type {(i: number) => void} */ go)}
	<StatueStage {offset} {go} />
{/snippet}

{#snippet paintings(/** @type {(i: number) => number} */ offset, /** @type {(i: number) => void} */ go)}
	<PaintingFlow {offset} {go} />
{/snippet}

<section
	class="room"
	style:--area={area}
	style:cursor={hovered ? 'pointer' : undefined}
	aria-label="My room"
	onpointerdown={press}
>
	<div class={['canvas', ready && 'shown']}>
		{#if ready}
			<Canvas toneMapping={NeutralToneMapping} dpr={Math.min(devicePixelRatio, 2)}>
				<RoomScene
					bind:this={scene}
					{statue}
					{painting}
					record={current.item}
					spinning={playing}
					{hovered}
					{seed}
					still={prefersReducedMotion.current}
					{lifted}
					{writing}
					{away}
					{paintClock}
					{paintAge}
					onhover={(id) => (hovered = id)}
					onpick={pick}
				/>
			</Canvas>
		{/if}
	</div>

	<!-- The record on the turntable, as a glass pill at the top of the page: the whole pill opens the crate. -->
	<button
		type="button"
		class={['deck', playing && 'on']}
		aria-haspopup="dialog"
		aria-label="{current.item.title}{current.item.by ? `, ${current.item.by}` : ''}{playing ? ', playing' : ''}. Choose a record"
		onclick={() => open('crate')}
	>
		<span
			class={['disc', current.item.cover && 'printed']}
			style:--tone={current.item.tone}
			style:--ink={current.item.ink}
			style:--cover={current.item.cover ? `url("${current.item.cover}")` : undefined}
			aria-hidden="true"
		></span>
		<span class="track">
			<span class="title" lang={current.item.lang}>{current.item.title}</span>
			{#if current.item.by}<span class="by" lang={current.item.lang}>{current.item.by}</span>{/if}
		</span>
		<Soundwave active={playing} class="wave" />
		<svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="m4.5 6.5 3.5 3.5 3.5-3.5" /></svg>
	</button>

	<!-- Only the sound comes through; the player itself stays out of sight. -->
	<div class="audio" aria-hidden="true" {@attach (node) => player.mount(node, FIRST.item.youtube ?? '')}></div>
</section>

{#if board}
	<BrushBoard
		open={brushing}
		aspect={PAPER.w / PAPER.d}
		corners={() => scene?.paperCorners() ?? null}
		printed={() => scene?.paperImage() ?? null}
		onclose={() => (brushing = false)}
		onlanded={landed}
	/>
{/if}

{#if opened}
	{@const sheet = SHEETS[opened]}
	<Sheet
		{origin}
		label={sheet.label}
		width={sheet.width}
		onclose={() => (opened = null)}
		onback={selected === null ? undefined : () => (selected = null)}
		onclosed={() => {
			if (!opened) away = null;
		}}
	>
		{#if opened === 'crate'}
			<Crate crates={CRATES} {current} {playing} time={player.time} duration={player.duration} onplay={play} ontoggle={toggle} onseek={(seconds) => player.seek(seconds)} />
		{:else if opened === 'books'}
			<Library books={BOOK_SHELF} bind:selected />
		{:else if opened === 'media'}
			<Showcase pieces={MEDIA_SHELF} bind:selected kicker="Watch & read" title="The media shelf" hint="Films, a channel and a blog. Pick one up." object={artifact} />
		{:else if opened === 'tapes'}
			<Showcase pieces={TAPES} bind:selected kicker="Listen" title="Podcasts" hint="The ones I keep on in the background." action="Listen" object={artifact} />
		{:else if opened === 'laptop'}
			<StackSheet />
		{:else if opened === 'clock'}
			<ClockSheet bind:hour12 />
		{:else if opened === 'age'}
			<LifeSheet />
		{:else if opened === 'bible'}
			<VerseSheet date={today} />
		{:else if opened === 'statue'}
			<Carousel entries={STATUES} active={statue} kicker="Statues" onpick={(id) => hang('statue', id)} stage={statues} />
		{:else if opened === 'painting'}
			<Carousel entries={PAINTINGS} active={painting} kicker="Paintings" onpick={(id) => hang('painting', id)} stage={paintings} />
		{:else if opened === 'arc'}
			<Feature item={KEEPSAKES.arc} kicker="On the wall" action="Try the puzzles" figure={pixels} />
		{/if}
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
	}

	.canvas.shown {
		animation: dir-sfumato 900ms var(--ease-out) both;
	}

	/*
	 * Liquid glass, as the kingdom site's pills: a sheen over a pale tint, a blurred and
	 * saturated backdrop, a bright top edge. Pinned to the top centre of the page, under any
	 * sheet that opens.
	 */
	.deck {
		--glass-tint: 42%;
		--glass-sheen: 14%;
		position: fixed;
		top: max(1rem, env(safe-area-inset-top));
		left: 50%;
		z-index: 80;
		display: flex;
		align-items: center;
		gap: 0.55rem;
		max-width: min(24rem, calc(100vw - 2rem));
		height: 2.6rem;
		padding: 0 0.75rem 0 0.3rem;
		border: 1px solid color-mix(in srgb, white 45%, transparent);
		border-radius: 999px;
		background:
			linear-gradient(
				180deg,
				color-mix(in srgb, white var(--glass-sheen), transparent),
				color-mix(in srgb, white calc(var(--glass-sheen) / 6), transparent) 60%
			),
			color-mix(in srgb, #fffefb var(--glass-tint), transparent);
		backdrop-filter: blur(32px) saturate(180%);
		-webkit-backdrop-filter: blur(32px) saturate(180%);
		box-shadow:
			inset 0 1px 0 color-mix(in srgb, white 70%, transparent),
			inset 0 -1px 0 color-mix(in srgb, white 14%, transparent),
			0 0 0 0.5px rgba(28, 27, 24, 0.08),
			0 10px 28px rgba(40, 30, 12, 0.09),
			0 2px 6px rgba(40, 30, 12, 0.06);
		color: var(--ink);
		font: inherit;
		text-align: left;
		cursor: pointer;
		translate: -50% 0;
		transition:
			--glass-tint 250ms var(--ease-out),
			scale 200ms var(--ease-out);
	}

	.deck:hover,
	.deck:focus-visible {
		--glass-tint: 64%;
	}

	.deck:active {
		scale: 0.98;
	}

	.chev {
		flex: none;
		width: 0.85rem;
		height: 0.85rem;
		fill: none;
		stroke: var(--ink-3);
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* A record seen from above, with its label printed from the cover when there is one. */
	.disc {
		flex: none;
		width: 1.95rem;
		height: 1.95rem;
		border-radius: 50%;
		background:
			radial-gradient(circle, #fff 0 5%, var(--tone) 5.5% 34%, #0b0b0b 34.5% 37%, transparent 37.5%),
			repeating-radial-gradient(circle, #151515 0 1px, #262626 1px 2px);
		box-shadow: 0 0 0 1px rgba(28, 27, 24, 0.08);
	}

	.disc.printed {
		background:
			radial-gradient(circle, #fff 0 5%, transparent 5.5% 34%, #0b0b0b 34.5% 37%, transparent 37.5%),
			radial-gradient(circle, transparent 0 34%, #151515 34.5%),
			var(--cover) center / 50% no-repeat,
			#151515;
	}

	.deck.on .disc {
		animation: spin 2.4s linear infinite;
	}

	.deck :global(.wave) {
		color: var(--accent);
	}

	.track {
		display: flex;
		align-items: baseline;
		gap: 0.45rem;
		min-width: 0;
		line-height: 1.2;
	}

	.title,
	.by {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.title {
		flex: none;
		max-width: 12rem;
		color: var(--ink);
		font-size: 13px;
		font-weight: 500;
	}

	.by {
		min-width: 0;
		color: var(--ink-3);
		font-size: 12px;
	}

	/* Full size, so YouTube will play it, but out of sight and out of the way. */
	.audio {
		position: fixed;
		left: 0;
		bottom: 0;
		z-index: -1;
		width: 200px;
		height: 200px;
		overflow: hidden;
		opacity: 0.01;
		pointer-events: none;
	}

	.figure {
		display: grid;
		place-items: end center;
		min-width: 8.5rem;
		min-height: 12.5rem;
		zoom: 1.45;
	}

	.sprite {
		display: grid;
		grid-template-columns: repeat(var(--grid), 1fr);
		grid-template-rows: repeat(var(--grid), 1fr);
		gap: 3px;
		width: min(100%, 18rem);
		aspect-ratio: 1;
		padding: 0.8rem;
		border-radius: 0.6rem;
		background:
			linear-gradient(rgba(28, 27, 24, 0.05) 1px, transparent 1px) 0 0 / calc(100% / var(--grid)) calc(100% / var(--grid)),
			#fff;
		box-shadow:
			0 0 0 10px #fff,
			0 0 0 11px rgba(28, 27, 24, 0.08),
			0 24px 40px -20px rgba(28, 27, 24, 0.35);
	}

	.sprite span {
		border-radius: 2px;
	}

	.again {
		padding: 0.5rem 0.95rem;
		border-radius: 999px;
		color: var(--ink-2);
		font-size: 0.8rem;
		box-shadow: 0 0 0 1px rgba(28, 27, 24, 0.12);
		transition: color 160ms var(--ease-out);
	}

	.again:hover {
		color: var(--accent);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 640px) {
		.figure {
			min-height: 0;
			zoom: 1.1;
		}
	}

	/* On a phone the scene is as wide as the screen and no taller than it draws. 1.8 is the
	   scene's own aspect. */
	@media (max-width: 560px) {
		.room {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}

		.canvas {
			position: relative;
			inset: auto;
			aspect-ratio: 1.8;
			margin-inline: calc(-1 * var(--page-pad));
		}

		.title {
			max-width: 9rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.deck.on .disc,
		.canvas.shown {
			animation: none;
		}
	}
</style>
