<script>
	import { untrack } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { gsap } from 'gsap';
	import { BRUSHES, INKS, InkCanvas, Inkstone } from '$lib/sveltebrush';
	import '$lib/sveltebrush/ui/paper.css';
	import { linkProps } from '$lib/directions/links.js';
	import { between, fitQuad, rectCorners } from './quad.js';

	/** @typedef {import('./quad.js').Point} Point */
	/** @typedef {[Point, Point, Point, Point]} Quad */

	/**
	 * The sheet of hanji from the table, picked up. While `open` it rises out of the scene into
	 * your hands, taking the paper's exact shape on screen as it leaves and turning to face you,
	 * and becomes a live sheet to write on with the sveltebrush tools. Closing lays it back down
	 * where it came from and hands over what was written, so the scene can print it.
	 * `corners` finds the paper in the scene; `printed` is the image on it there, to fade from.
	 * @type {{
	 *   open: boolean,
	 *   aspect: number,
	 *   corners: () => Quad | null,
	 *   printed: () => string | null,
	 *   onclose: () => void,
	 *   onlanded: (writing: HTMLCanvasElement | null) => void
	 * }}
	 */
	let { open, aspect, corners, printed, onclose, onlanded } = $props();

	const PHRASES = ['원', '永', '風林火山', '바람이 분다', '사랑해'];
	const PADDING = { top: 36, right: 36, bottom: 36, left: 36 };
	const TOOLS = 132;

	let brushes = $state(structuredClone(BRUSHES));
	let selected = $state(BRUSHES[0].id);
	const brush = $derived(brushes.find((entry) => entry.id === selected) ?? brushes[0]);
	let color = $state(INKS[0].color);
	let ink = $state(1);
	let history = $state({ undo: 0, redo: 0 });
	let strokes = $state(0);
	/** @type {ReturnType<typeof InkCanvas> | undefined} */
	let canvas = $state();
	/** @type {HTMLDivElement | undefined} */
	let sheet = $state();

	/** Where the sheet sits once it's in your hands. */
	let target = $state(place());
	let transform = $state('');
	/** The layer is up, from the moment the paper leaves the table until it's back. */
	let shown = $state(false);
	/** The sheet has arrived, so the tools can come up under it. */
	let settled = $state(false);
	let ghost = $state(/** @type {string | null} */ (null));
	let ghostOpacity = $state(0);
	/** @type {gsap.core.Tween | undefined} */
	let tween;

	function place() {
		const vw = typeof window === 'undefined' ? 1280 : window.innerWidth;
		const vh = typeof window === 'undefined' ? 800 : window.innerHeight;
		const w = Math.max(240, Math.min(vw - 48, (vh - TOOLS - 96) * aspect, 1080));
		const h = w / aspect;
		return { x: (vw - w) / 2, y: Math.max(28, (vh - TOOLS - h) / 2), w, h };
	}

	/** @returns {Quad} */
	const home = () => rectCorners(target.x, target.y, target.w, target.h);

	/** A small upright sheet in the middle, for when the paper can't be found in the scene. */
	/** @returns {Quad} */
	function fallback() {
		const w = target.w * 0.3;
		const h = w / aspect;
		return rectCorners(target.x + (target.w - w) / 2, target.y + (target.h - h) / 2, w, h);
	}

	/**
	 * @param {Quad} from
	 * @param {Quad} to
	 * @param {{ fadeGhost: (t: number) => number, lift: number, duration: number, done: () => void }} options
	 */
	function fly(from, to, { fadeGhost, lift, duration, done }) {
		tween?.kill();
		const progress = { t: 0 };
		const draw = () => {
			transform = fitQuad(target.w, target.h, between(from, to, progress.t, lift));
			ghostOpacity = fadeGhost(progress.t);
		};
		draw();
		tween = gsap.to(progress, {
			t: 1,
			duration: prefersReducedMotion.current ? 0 : duration,
			ease: 'power3.inOut',
			onUpdate: draw,
			onComplete: done
		});
	}

	function raise() {
		target = place();
		ghost = strokes ? null : printed();
		shown = true;
		fly(corners() ?? fallback(), home(), {
			fadeGhost: (t) => Math.max(0, 1 - t * 2.4),
			lift: 70,
			duration: 0.95,
			done: () => {
				settled = true;
				sheet?.focus({ preventScroll: true });
			}
		});
	}

	function lower() {
		settled = false;
		ghost = strokes ? null : printed();
		fly(home(), corners() ?? fallback(), {
			fadeGhost: (t) => Math.max(0, (t - 0.55) * 2.4),
			lift: 50,
			duration: 0.75,
			done: () => {
				const ink = snapshot();
				shown = false;
				transform = '';
				onlanded(ink);
			}
		});
	}

	/** A copy of the ink, for the scene to print on its paper. */
	function snapshot() {
		const source = sheet?.querySelector('canvas');
		if (!strokes || !source) return null;
		const copy = document.createElement('canvas');
		copy.width = source.width;
		copy.height = source.height;
		copy.getContext('2d')?.drawImage(source, 0, 0);
		return copy;
	}

	$effect(() => {
		const up = open;
		untrack(() => {
			if (up && !settled) raise();
			else if (!up && shown) lower();
		});
	});

	$effect(() => {
		if (!shown) return;
		const html = document.documentElement;
		const previous = html.style.overflow;
		html.style.overflow = 'hidden';
		return () => {
			html.style.overflow = previous;
		};
	});

	$effect(() => () => {
		tween?.kill();
		canvas?.stop();
	});

	function resize() {
		if (!settled) return;
		target = place();
		transform = fitQuad(target.w, target.h, home());
	}

	/** @param {string} text */
	function write(text) {
		canvas?.clear();
		canvas?.write(text, { padding: PADDING });
	}
</script>

<svelte:window onresize={resize} onkeydown={(event) => open && event.key === 'Escape' && onclose()} />

<div class={['layer', shown && 'shown']} aria-hidden={!shown}>
	{#if shown}
		<button
			type="button"
			class="scrim"
			aria-label="Put the paper down"
			tabindex="-1"
			onclick={onclose}
			transition:fade={{ duration: prefersReducedMotion.current ? 0 : 320 }}
		></button>
	{/if}

	<div
		bind:this={sheet}
		class="sheet sb-paper"
		role="dialog"
		aria-modal="true"
		aria-label="A sheet of hanji to write on"
		tabindex="-1"
		style:width="{target.w}px"
		style:height="{target.h}px"
		style:transform
	>
		<div class="stage">
			<InkCanvas bind:this={canvas} bind:ink bind:history bind:strokes {brush} {color} />
		</div>
		{#if ghost}
			<img class="ghost" src={ghost} alt="" style:opacity={ghostOpacity} />
		{/if}
	</div>

	{#if settled}
		<div
			class="tools sb-ui"
			style:top="{target.y + target.h + 16}px"
			style:width="{Math.max(target.w, 560)}px"
			style:left="{target.x + target.w / 2}px"
			transition:fade={{ duration: prefersReducedMotion.current ? 0 : 240 }}
		>
			<div class="well">
				<Inkstone level={ink} {color} onload={(amount) => canvas?.load(amount)} onset={(level) => canvas?.dip(level)} />
			</div>

			<div class="rows">
				<div class="row">
					<div class="group" role="radiogroup" aria-label="Brush">
						{#each brushes as entry (entry.id)}
							<button
								type="button"
								role="radio"
								class={['chip', selected === entry.id && 'on']}
								aria-checked={selected === entry.id}
								onclick={() => (selected = entry.id)}
							>
								{entry.name}
							</button>
						{/each}
					</div>
					<div class="group" role="radiogroup" aria-label="Ink">
						{#each INKS as entry (entry.color)}
							<button
								type="button"
								role="radio"
								class={['swatch', color === entry.color && 'on']}
								style:--swatch={entry.color}
								aria-checked={color === entry.color}
								aria-label={entry.name}
								title={entry.name}
								onclick={() => (color = entry.color)}
							></button>
						{/each}
					</div>
				</div>
				<div class="row">
					<div class="group" aria-label="Write a phrase for me">
						{#each PHRASES as phrase (phrase)}
							<button type="button" class="chip phrase" onclick={() => write(phrase)}>{phrase}</button>
						{/each}
					</div>
					<div class="group">
						<button type="button" class="chip" disabled={!history.undo} onclick={() => canvas?.undo()}>Undo</button>
						<button type="button" class="chip" disabled={!strokes} onclick={() => canvas?.clear()}>Clear</button>
						<a class="chip" {...linkProps('/brush')}>Studio</a>
						<button type="button" class="chip on" onclick={onclose}>Put it down</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.layer {
		position: fixed;
		inset: 0;
		z-index: 1000;
		visibility: hidden;
		pointer-events: none;
	}

	.layer.shown {
		visibility: visible;
		pointer-events: auto;
	}

	.scrim {
		position: absolute;
		inset: 0;
		border: 0;
		background: color-mix(in oklab, var(--ink, #1c1b18) 26%, transparent);
		backdrop-filter: blur(8px) saturate(1.1);
		cursor: default;
	}

	/* The sheet itself, at its in-hand size; a projective transform puts it anywhere else. */
	.sheet {
		position: absolute;
		top: 0;
		left: 0;
		overflow: hidden;
		transform-origin: 0 0;
		border-radius: 3px;
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.5) inset,
			0 40px 80px -30px rgba(30, 20, 10, 0.55),
			0 10px 24px -10px rgba(30, 20, 10, 0.35);
		outline: none;
		backface-visibility: hidden;
	}

	.shown .sheet {
		will-change: transform;
	}

	.stage {
		position: absolute;
		inset: 0;
		mix-blend-mode: multiply;
	}

	.ghost {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.tools {
		position: absolute;
		display: flex;
		align-items: center;
		gap: 1.1rem;
		max-width: calc(100vw - 2rem);
		padding: 0.7rem 0.9rem;
		border-radius: 1.1rem;
		background: rgba(251, 248, 242, 0.92);
		box-shadow:
			0 0 0 1px rgba(30, 24, 19, 0.08),
			0 18px 40px -20px rgba(30, 20, 10, 0.5);
		color: #2a221b;
		transform: translateX(-50%);
		backdrop-filter: blur(14px);
	}

	.well :global(.inkstone) {
		--size: 72px;
	}

	.rows {
		display: grid;
		gap: 0.5rem;
		min-width: 0;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1.1rem;
	}

	.group {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.3rem;
	}

	.chip {
		padding: 0.36rem 0.75rem;
		border: 1px solid rgb(30 24 19 / 0.14);
		border-radius: 999px;
		background: rgb(255 255 255 / 0.6);
		color: inherit;
		font: inherit;
		font-size: 0.78rem;
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color 160ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.chip:hover:not(:disabled) {
		background: rgb(255 255 255 / 0.95);
	}

	.chip:active:not(:disabled) {
		transform: scale(0.96);
	}

	.chip:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.chip.on {
		border-color: #1e1813;
		background: #1e1813;
		color: #f4ecdd;
	}

	.phrase {
		font-family: 'Gowun Batang', var(--korean), serif;
	}

	.swatch {
		width: 1.3rem;
		height: 1.3rem;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: var(--swatch);
		box-shadow:
			0 0 0 2px #fbf8f2,
			0 0 0 3px rgb(30 24 19 / 0.18);
		cursor: pointer;
		transition: box-shadow 160ms var(--ease-out);
	}

	.swatch.on {
		box-shadow:
			0 0 0 2px #fbf8f2,
			0 0 0 4px #1e1813;
	}
</style>
