<script>
	import { onDestroy } from 'svelte';
	import { on } from 'svelte/events';
	import Lcd from '$lib/directions/Lcd.svelte';
	import Media from '$lib/directions/Media.svelte';
	import { Clicks } from '$lib/directions/clicks.svelte.js';
	import { GROUPS, PROFILE } from '$lib/directions/content.js';
	import { getDirectionsContext } from '$lib/directions/context.js';
	import { isExternal, linkProps } from '$lib/directions/links.js';

	/** @typedef {import('$lib/directions/content.js').Work} Work */

	let { data } = $props();

	const directions = getDirectionsContext();
	const clicks = new Clicks();

	/** Degrees per knob detent. */
	const DETENT = 30;

	/** Works the screen draws itself rather than sampling their media. @type {Record<string, import('$lib/directions/lcd.js').LcdGlyph>} */
	const DRAWN = { stan: 'curve', arcaide: 'arc' };

	let bank = $state(GROUPS.findIndex((group) => group.id === 'games'));
	let item = $state(0);
	let turns = $state(0);

	const group = $derived(GROUPS[bank]);
	const work = $derived(group.works[item]);
	const minutes = $derived(data.essays[work.id]?.minutes ?? null);
	const meta = $derived([work.kind, work.year, minutes && `${minutes} min read`].filter(Boolean).join(' · '));
	const source = $derived(screenSource(work, minutes));
	/** The screen adds the kicker, skipping anything its font can't draw (such as Hangul) and any reading time it already draws. */
	const screenMeta = $derived(
		[
			work.kind,
			work.kicker !== work.kind && work.kicker,
			work.year,
			minutes && source.kind !== 'glyph' && `${minutes} min`
		]
			.filter((part) => typeof part === 'string' && /^[\x20-\x7e]+$/.test(part))
			.join(' · ')
	);
	const position = $derived(
		`${String(item + 1).padStart(2, '0')}/${String(group.works.length).padStart(2, '0')}`
	);
	const action = $derived(actionLabel(work));

	onDestroy(() => clicks.dispose());

	/** @param {Work} work @param {number | null} minutes @returns {import('$lib/directions/lcd.js').LcdSource} */
	function screenSource(work, minutes) {
		const drawn = DRAWN[work.id];
		if (drawn) return { kind: 'glyph', glyph: drawn };
		const media = work.media;
		if (media?.kind === 'graph') return { kind: 'glyph', glyph: 'graph' };
		if (media?.kind === 'video' && media.src) return { kind: 'video', src: media.src, poster: media.poster };
		if (media?.kind === 'image' && media.src) return { kind: 'image', src: media.src };
		return { kind: 'glyph', glyph: 'lines', value: minutes ? String(minutes) : '' };
	}

	/** @param {Work} work */
	function actionLabel(work) {
		if (work.section === 'games') return 'Play';
		if (work.section === 'writing') return 'Read';
		if (work.section === 'videos') return 'Watch';
		return isExternal(work.href) ? 'Visit' : 'Open';
	}

	/** Pressing the lit key again steps through its bank. @param {number} index */
	function press(index) {
		if (index === bank) {
			turn(1);
			return;
		}
		bank = index;
		item = 0;
		clicks.tick('key');
	}

	/** @param {number} delta */
	function turn(delta) {
		if (delta === 0) return;
		const total = group.works.length;
		item = (((item + delta) % total) + total) % total;
		turns += delta;
		clicks.tick('detent');
	}

	/** @param {KeyboardEvent} event */
	function onkeydown(event) {
		if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
		const target = event.target instanceof HTMLElement ? event.target : null;
		if (target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName ?? '')) return;
		if (document.querySelector('[aria-modal="true"]')) return;
		const digit = Number(event.key);
		if (Number.isInteger(digit) && digit >= 1 && digit <= GROUPS.length) press(digit - 1);
		else if (event.key === 'ArrowRight') turn(1);
		else if (event.key === 'ArrowLeft') turn(-1);
		else if (event.key === 'Enter' && !target?.closest('a, button')) directions.open(work.href);
		else if (event.key === 'm' || event.key === 'M') clicks.toggle();
		else return;
		event.preventDefault();
	}

	/** Slider keys while the knob has focus. @param {KeyboardEvent} event */
	function knobKey(event) {
		/** @type {Record<string, number>} */
		const steps = { ArrowRight: 1, ArrowUp: 1, PageUp: 1, ArrowLeft: -1, ArrowDown: -1, PageDown: -1 };
		if (event.key in steps) turn(steps[event.key]);
		else if (event.key === 'Home') turn(-item);
		else if (event.key === 'End') turn(group.works.length - 1 - item);
		else return;
		event.preventDefault();
	}

	/**
	 * Drag around the knob to turn it a detent at a time; a tap turns it toward
	 * the side you tapped; the wheel steps too.
	 * @param {HTMLElement} node
	 */
	function dial(node) {
		let angle = 0;
		let travel = 0;
		let moved = 0;
		let wheel = 0;

		/** @param {PointerEvent} event */
		function pointerAngle(event) {
			const rect = node.getBoundingClientRect();
			const x = event.clientX - (rect.left + rect.width / 2);
			const y = event.clientY - (rect.top + rect.height / 2);
			return (Math.atan2(y, x) * 180) / Math.PI;
		}

		const stops = [
			on(node, 'pointerdown', (event) => {
				node.setPointerCapture(event.pointerId);
				angle = pointerAngle(event);
				travel = 0;
				moved = 0;
			}),
			on(node, 'pointermove', (event) => {
				if (!node.hasPointerCapture(event.pointerId)) return;
				const next = pointerAngle(event);
				const delta = ((next - angle + 540) % 360) - 180;
				angle = next;
				travel += delta;
				moved += Math.abs(delta);
				while (Math.abs(travel) >= DETENT) {
					const step = Math.sign(travel);
					turn(step);
					travel -= step * DETENT;
				}
			}),
			on(node, 'pointerup', (event) => {
				if (moved >= 8) return;
				const rect = node.getBoundingClientRect();
				turn(event.clientX < rect.left + rect.width / 2 ? -1 : 1);
			}),
			on(
				node,
				'wheel',
				(event) => {
					event.preventDefault();
					wheel += event.deltaY;
					if (Math.abs(wheel) < 40) return;
					turn(Math.sign(wheel));
					wheel = 0;
				},
				{ passive: false }
			)
		];
		return () => stops.forEach((stop) => stop());
	}
</script>

<svelte:window {onkeydown} />

<svelte:head>
	<title>Instrument · Heewon Ahn</title>
</svelte:head>

<main class="instrument">
	<header class="intro sfumato">
		<h1>{PROFILE.name}</h1>
		<p>Keys 1–8 choose a kind of work. Turn the knob or use ← →. Enter opens it. M for sound.</p>
	</header>

	<div class="device sfumato" style:--i="1">
		<div class="top">
			<div class="brand">
				{#key work.id}<span class="led" aria-hidden="true"></span>{/key}
				<span class="model">HW-1</span>
				<span class="silk">Field instrument</span>
			</div>
			<span class="grille" aria-hidden="true"></span>
		</div>

		<div class="middle">
			<div class="bezel">
				<Lcd
					header={{ left: `${group.numeral} ${group.verb}`, right: position }}
					title={work.title}
					meta={screenMeta}
					marquee={work.blurb}
					{source}
					label="{work.title} on the instrument screen"
				/>
			</div>

			<div class="controls">
				<div class="control">
					<div
						class="knob"
						role="slider"
						tabindex="0"
						aria-label="Work in {group.label}"
						aria-valuemin={1}
						aria-valuemax={group.works.length}
						aria-valuenow={item + 1}
						aria-valuetext={work.title}
						onkeydown={knobKey}
						{@attach dial}
					>
						<span class="cap" style:rotate="{turns * DETENT}deg"><span class="notch"></span></span>
					</div>
					<span class="silk">Turn</span>
				</div>
				<div class="pair">
					<div class="control">
						<a class="key small" aria-label="{action} {work.title}" {...linkProps(work.href)}>
							<span aria-hidden="true">↵</span>
						</a>
						<span class="silk">Enter</span>
					</div>
					<div class="control">
						<button
							type="button"
							class={['key', 'small', !clicks.muted && 'lit']}
							aria-label="Sound"
							aria-pressed={!clicks.muted}
							onclick={() => clicks.toggle()}
						>
							<svg viewBox="0 0 16 16" aria-hidden="true">
								<path d="M2.5 6h2.5l3.5-3v10l-3.5-3h-2.5z" />
								{#if !clicks.muted}
									<path class="wave" d="M11 5.5a3.5 3.5 0 0 1 0 5" />
								{/if}
							</svg>
						</button>
						<span class="silk">Sound</span>
					</div>
				</div>
			</div>
		</div>

		<div class="banks" role="group" aria-label="Kinds of work">
			{#each GROUPS as entry, i (entry.id)}
				<div class="control">
					<button
						type="button"
						class={['key', i === bank && 'active']}
						aria-label="{entry.numeral} {entry.label}"
						aria-pressed={i === bank}
						onclick={() => press(i)}
					>
						{entry.numeral}
					</button>
					<span class={['silk', i === bank && 'current']}>{entry.verb}</span>
				</div>
			{/each}
		</div>
	</div>

	<section class="pane sfumato" style:--i="2" aria-label="Selected work">
		<div class="copy" aria-live="polite">
			{#key work.id}
				<div class="swap">
					<p class="kicker">
						<span>{group.numeral} · {group.label}</span>
						<span>{item + 1} of {group.works.length}</span>
					</p>
					<h2>{work.title}</h2>
					<p class="blurb">{work.blurb}</p>
					<p class="meta">{meta}</p>
					<a class="action" {...linkProps(work.href)}>
						{action}<span aria-hidden="true">{isExternal(work.href) ? '↗' : '→'}</span>
					</a>
				</div>
			{/key}
		</div>
		{#key work.id}
			<figure class="still swap">
				<Media media={work.media} title={work.title} />
			</figure>
		{/key}
	</section>
</main>

<style>
	.instrument {
		max-width: 46rem;
		margin: 0 auto;
		padding: 3.5rem 1.25rem 9rem;
	}

	.intro {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 2rem;
		margin-bottom: 1.75rem;
	}

	.intro h1 {
		font-weight: 500;
		letter-spacing: -0.03em;
	}

	.intro p {
		max-width: 22rem;
		font-size: 13px;
		color: var(--ink-3);
		text-align: right;
	}

	/* The device */
	.device {
		padding: 1.1rem 1.25rem 1.25rem;
		border-radius: 22px;
		background: linear-gradient(180deg, var(--te-body), var(--te-body-2));
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.75),
			inset 0 -1px 0 rgba(0, 0, 0, 0.08),
			0 1px 2px rgba(0, 0, 0, 0.08),
			0 28px 48px -26px rgba(40, 36, 28, 0.45);
	}

	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.85rem;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.model {
		font-family: var(--mono);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.12em;
		color: #3b3933;
	}

	.silk.current {
		color: #2b2a26;
	}

	.grille {
		width: 4.75rem;
		height: 1.1rem;
		background-image: radial-gradient(circle, rgba(0, 0, 0, 0.32) 1.1px, transparent 1.5px);
		background-size: 6px 6px;
	}

	.middle {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 1.25rem;
		align-items: center;
	}

	.bezel {
		padding: 7px;
		border-radius: 12px;
		background: #2c2a26;
		box-shadow:
			inset 0 1px 2px rgba(0, 0, 0, 0.5),
			0 1px 0 rgba(255, 255, 255, 0.6);
		overflow: hidden;
	}

	.controls {
		display: grid;
		justify-items: center;
		gap: 1rem;
		width: 7.5rem;
	}

	.control {
		display: grid;
		justify-items: center;
		gap: 0.45rem;
	}

	.pair {
		display: flex;
		gap: 0.75rem;
	}

	/* Knob: detents snap with a slight overshoot */
	.knob {
		position: relative;
		width: 5rem;
		aspect-ratio: 1;
		border-radius: 50%;
		background: radial-gradient(circle at 50% 32%, #f6f4ee, #dad6cc 72%);
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, 0.14),
			0 3px 0 #b5b1a7,
			0 10px 18px -8px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 #fff;
		cursor: grab;
		touch-action: none;
	}

	.knob:active {
		cursor: grabbing;
	}

	.knob::before {
		content: '';
		position: absolute;
		inset: -9px;
		border-radius: 50%;
		background: repeating-conic-gradient(from -0.5deg, var(--te-silk) 0 1deg, transparent 1deg 30deg);
		-webkit-mask: radial-gradient(circle, transparent 62%, #000 63%, #000 72%, transparent 73%);
		mask: radial-gradient(circle, transparent 62%, #000 63%, #000 72%, transparent 73%);
		opacity: 0.7;
	}

	.cap {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		transition: rotate 180ms var(--ease-detent);
	}

	.notch {
		position: absolute;
		left: 50%;
		top: 9%;
		width: 3px;
		height: 26%;
		margin-left: -1.5px;
		border-radius: 2px;
		background: var(--te-key);
	}

	.key .wave {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.4;
		stroke-linecap: round;
	}

	.banks {
		display: grid;
		grid-template-columns: repeat(8, minmax(0, 1fr));
		gap: 0.6rem;
		margin-top: 1.25rem;
	}

	.banks .control {
		gap: 0.55rem;
	}

	/* Reading pane: plain text, so the device never stands between you and the words */
	.pane {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 0.95fr);
		gap: 2.25rem;
		align-items: start;
		margin-top: 2.75rem;
	}

	.kicker {
		display: flex;
		justify-content: space-between;
		font-family: var(--mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--ink-3);
	}

	h2 {
		margin-top: 0.6rem;
		font-size: 28px;
		font-weight: 400;
		line-height: 1.15;
		letter-spacing: -0.03em;
	}

	.blurb {
		margin-top: 0.75rem;
		color: var(--ink-2);
		text-wrap: pretty;
	}

	.meta {
		margin-top: 0.6rem;
		font-size: 13px;
		color: var(--ink-3);
	}

	.action {
		display: inline-flex;
		gap: 0.35rem;
		margin-top: 1.25rem;
		padding: 0.5rem 0.95rem;
		border-radius: 999px;
		background: var(--ink);
		color: var(--paper);
		font-size: 13px;
		transition: transform 120ms var(--ease-out);
	}

	.action:active {
		transform: scale(0.97);
	}

	.still {
		aspect-ratio: 16 / 10;
		border-radius: 10px;
		overflow: hidden;
		background: var(--paper-2);
	}

	.swap {
		animation: swap 200ms var(--ease-out) both;
	}

	@keyframes swap {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
	}

	@media (max-width: 680px) {
		.intro {
			display: block;
		}

		.intro p {
			margin-top: 0.4rem;
			text-align: left;
		}

		.middle {
			grid-template-columns: minmax(0, 1fr);
		}

		.controls {
			display: flex;
			justify-content: space-between;
			align-items: center;
			width: auto;
			padding: 0 0.5rem;
		}

		.knob {
			width: 4.25rem;
		}

		.banks {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			row-gap: 0.9rem;
		}

		.pane {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.swap {
			animation: none;
		}

		.cap {
			transition: none;
		}
	}
</style>
