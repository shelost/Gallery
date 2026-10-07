<script>
	import { onMount, untrack } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { Clicks } from './clicks.svelte.js';
	import { Dial } from './dial.svelte.js';
	import { buzz, tappable } from './haptics.js';
	import { clamp } from './motion.js';

	/**
	 * The section bar as a big wheel for phones, dressed like an iPod's click wheel, with only its
	 * top showing above the bottom of the screen. Its wedges ring a plain hub, each named along the
	 * rim: the top of the page and then each section, and the one under the pointer is where the
	 * page is. Turning it with a finger flies the page to each section as it comes under the
	 * pointer; flicking it sets it spinning, ticking past each peg, and the page flies to the
	 * section it will land on. Tapping a section turns the wheel to it, and scrolling the page turns
	 * the wheel to match.
	 * @type {{ sections: import('./sections.svelte.js').Sections }}
	 */
	let { sections } = $props();
	const uid = $props.id();

	/** How far a press can wander, in pixels, before it turns the wheel. */
	const SLOP = 8;
	/** How far, in degrees, a peg pushes the pointer aside before it slips past. */
	const TILT = 26;
	/** How near a peg comes, as a share of a wedge, before it meets the pointer. */
	const CONTACT = 0.3;
	/** How many milliseconds each peg buzzes, on phones that can. */
	const BUZZ = 6;
	/** The wedge for the top of the page, above the first section. */
	const TOP = { id: 'top', label: 'About', numeral: '' };
	/** How far out the plain hub reaches, with the rim at 100. The wedges, spokes and names ring it. */
	const HUB = 64;
	/** How far out the names sit, and outside them their numerals. */
	const NAME = 74;
	const NUMERAL = 81;
	/** How far out the pegs between wedges sit. */
	const PEG = 94;
	/** How far round from the top, each way, the arcs the names follow reach, in radians. */
	const SWEEP = 0.45 * Math.PI;

	const wedges = $derived([TOP, ...sections.items]);
	const clicks = new Clicks({ muted: false });
	const phone = new MediaQuery('max-width: 768px');
	const dial = new Dial(() => wedges.length, cross);

	const selected = $derived(dial.selected);
	/** The pointer's lean as a peg pushes past it, in degrees clockwise. */
	const flap = $derived.by(() => {
		const ahead = dial.way > 0 ? 0.5 - dial.phase : 0.5 + dial.phase;
		return dial.way * TILT * clamp(1 - ahead / CONTACT, 0, 1);
	});
	/**
	 * Each wedge's face, in a box 200 across with the middle of the wheel at 0, 0: its stretch of
	 * the ring, the spoke and peg at its end, and how far round it is, in degrees, for its name.
	 */
	const shapes = $derived(
		wedges.map((wedge, i) => {
			const start = (i - 0.5) * dial.step;
			const end = start + dial.step;
			return {
				...wedge,
				sector: `M${point(start, HUB)}L${point(start, 100)}A100 100 0 0 1 ${point(end, 100)}L${point(end, HUB)}A${HUB} ${HUB} 0 0 0 ${point(start, HUB)}Z`,
				spoke: `M${point(end, HUB)}L${point(end, 100)}`,
				peg: at(end, PEG),
				turn: (i * dial.step * 180) / Math.PI
			};
		})
	);
	/**
	 * Each section's tap target, in the same units: centred across the ring, all but touching the
	 * hub and the rim, and as wide as its wedge where that's narrowest, by the hub.
	 */
	const target = $derived({
		reach: (HUB + 100) / 2,
		depth: 100 - HUB - 2,
		span: 2 * (HUB + 1) * Math.tan(dial.step / 2) - 1
	});

	/**
	 * The press under way: its pointer, where it began, the middle of the wheel, the angle it was
	 * last at, and whether it has started turning the wheel.
	 * @type {{ id: number, x: number, y: number, cx: number, cy: number, last: number, turning: boolean } | null}
	 */
	let grip = null;
	/** Set once a press turns the wheel, so the click the browser sends after it is let go. */
	let spent = false;
	/** Set a frame after mounting; until then the wheel is put where the page is, not turned there. */
	let placed = false;

	/**
	 * A point `r` out from the middle, `turn` radians clockwise from the top.
	 * @param {number} turn
	 * @param {number} r
	 * @returns {[number, number]}
	 */
	function at(turn, r) {
		return [+(r * Math.sin(turn)).toFixed(2), +(-r * Math.cos(turn)).toFixed(2)];
	}

	/** @param {number} turn @param {number} r */
	function point(turn, r) {
		return at(turn, r).join(' ');
	}

	/**
	 * An arc `r` out from the middle, over the top from `SWEEP` anticlockwise of it to `SWEEP`
	 * clockwise, for a name to follow.
	 * @param {number} r
	 */
	function arc(r) {
		return `M${point(-SWEEP, r)}A${r} ${r} 0 0 1 ${point(SWEEP, r)}`;
	}

	/**
	 * A new wedge under the pointer: a peg's click and buzz, unless the wheel is only following the
	 * page, and while a finger turns it, the page flies to that section.
	 * @param {boolean} held
	 * @param {boolean} quiet
	 */
	function cross(held, quiet) {
		if (!quiet) {
			clicks.tick('detent');
			buzz(BUZZ);
		}
		if (held) sections.go(dial.selected - 1);
	}

	/** @param {PointerEvent & { currentTarget: HTMLElement }} event */
	function down(event) {
		if (grip || !event.isPrimary || event.button > 0) return;
		clicks.wake();
		const box = event.currentTarget.getBoundingClientRect();
		const cx = box.left + box.width / 2;
		const cy = box.top + box.height / 2;
		const last = Math.atan2(event.clientY - cy, event.clientX - cx);
		grip = { id: event.pointerId, x: event.clientX, y: event.clientY, cx, cy, last, turning: false };
		spent = false;
	}

	/** @param {PointerEvent & { currentTarget: HTMLElement }} event */
	function move(event) {
		if (!grip || event.pointerId !== grip.id) return;
		if (!grip.turning) {
			const dx = event.clientX - grip.x;
			const dy = event.clientY - grip.y;
			if (Math.hypot(dx, dy) < SLOP) return;
			if (Math.abs(dy) > Math.abs(dx)) return void (grip = null);
			grip.turning = spent = true;
			event.currentTarget.setPointerCapture(event.pointerId);
			dial.grab();
		}
		const theta = Math.atan2(event.clientY - grip.cy, event.clientX - grip.cx);
		let delta = theta - grip.last;
		if (delta > Math.PI) delta -= 2 * Math.PI;
		if (delta < -Math.PI) delta += 2 * Math.PI;
		grip.last = theta;
		dial.turn(delta);
	}

	/** @param {PointerEvent} event */
	function up(event) {
		if (!grip || event.pointerId !== grip.id) return;
		const turned = grip.turning;
		grip = null;
		clicks.wake();
		if (!turned) return;
		const landing = dial.release();
		if (landing !== sections.active + 1) sections.go(landing - 1);
	}

	/**
	 * A tap on a section turns the wheel to it and flies the page there, unless the press turned
	 * the wheel. Keyboard clicks, which come with no press, always count.
	 * @param {MouseEvent} event
	 * @param {number} i
	 */
	function choose(event, i) {
		if (event.detail > 0 && spent) return;
		dial.aim(i);
		sections.go(i - 1);
	}

	/**
	 * Tabbing onto a section turns the wheel to show it.
	 * @param {FocusEvent & { currentTarget: HTMLElement }} event
	 * @param {number} i
	 */
	function peek(event, i) {
		if (event.currentTarget.matches(':focus-visible')) dial.aim(i, { quiet: true });
	}

	/** Tabbing away turns it back to where the page is. @param {FocusEvent & { currentTarget: HTMLElement }} event */
	function leave(event) {
		if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
		dial.aim(sections.active + 1, { quiet: true });
	}

	/** Browsers only let sound start inside a tap, so any tap on a phone gets the wheel's clicks ready. */
	function ready() {
		if (phone.current) clicks.wake();
	}

	// Scrolling the page turns the wheel to match, without a sound.
	$effect(() => {
		const i = sections.active + 1;
		untrack(() => {
			if (placed && phone.current) dial.aim(i, { quiet: true });
			else dial.place(i);
		});
	});

	onMount(() => {
		const frame = requestAnimationFrame(() => (placed = true));
		return () => {
			cancelAnimationFrame(frame);
			dial.dispose();
			clicks.dispose();
		};
	});
</script>

<svelte:window onclick={ready} />

<nav
	class="wheel"
	aria-label="Sections"
	onpointerdown={down}
	onpointermove={move}
	onpointerup={up}
	onpointercancel={up}
	onfocusout={leave}
>
	<div
		class="disc"
		style:rotate="{dial.angle}rad"
		style:--reach={target.reach}
		style:--depth={target.depth}
		style:--span={target.span}
	>
		<svg class="face" viewBox="-100 -100 200 200" aria-hidden="true">
			<defs>
				<path id="{uid}-name" d={arc(NAME)} />
				<path id="{uid}-numeral" d={arc(NUMERAL)} />
			</defs>
			{#each shapes as shape, i (shape.id)}
				<path class={['wedge', i % 2 === 1 && 'odd', i === selected && 'lit']} d={shape.sector} />
			{/each}
			<circle class="hub" r={HUB} />
			{#each shapes as shape, i (shape.id)}
				<path class="spoke" d={shape.spoke} />
				<circle class="peg" cx={shape.peg[0]} cy={shape.peg[1]} r="1.4" />
				<g class={['label', i === selected && 'on']} transform="rotate({shape.turn})">
					<text class="name"><textPath href="#{uid}-name" startOffset="50%">{shape.label}</textPath></text>
					{#if shape.numeral}
						<text class="numeral"><textPath href="#{uid}-numeral" startOffset="50%">{shape.numeral}</textPath></text>
					{/if}
				</g>
			{/each}
		</svg>
		{#each wedges as wedge, i (wedge.id)}
			<button
				type="button"
				class="slot"
				style:--turn="{i * dial.step}rad"
				aria-current={i === sections.active + 1 ? 'true' : undefined}
				onclick={(event) => choose(event, i)}
				onfocus={(event) => peek(event, i)}
				{@attach tappable}
			>
				<span class="visually-hidden">{wedge.numeral} {wedge.label}</span>
			</button>
		{/each}
	</div>
	<svg class="pointer" style:rotate="{flap}deg" viewBox="0 0 16 26" aria-hidden="true">
		<path d="M8 0a8 8 0 0 1 8 8c0 5-4.4 10.6-8 18C4.4 18.6 0 13 0 8a8 8 0 0 1 8-8z" />
		<circle cx="8" cy="8" r="2.4" />
	</svg>
</nav>

<style>
	.wheel {
		--size: min(calc(100vw - 1.25rem), 27rem);
		--peek: calc(var(--size) * 0.34);
		/* One unit of the face's viewBox, which is 200 across. */
		--unit: calc(var(--size) / 200);
		position: fixed;
		left: 50%;
		bottom: calc(var(--peek) + env(safe-area-inset-bottom) - var(--size));
		z-index: 90;
		display: none;
		box-sizing: border-box;
		width: var(--size);
		aspect-ratio: 1;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		translate: -50% 0;
		background: radial-gradient(circle at 50% 20%, rgba(50, 50, 53, 0.96), rgba(12, 12, 13, 0.96) 56%);
		box-shadow:
			0 -14px 44px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.14);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		touch-action: pan-y;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
		-webkit-tap-highlight-color: transparent;
	}

	.wheel::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: radial-gradient(70% 30% at 50% 0%, rgba(255, 255, 255, 0.09), transparent);
		pointer-events: none;
	}

	.disc {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		will-change: rotate;
	}

	.face {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.wedge {
		fill: transparent;
		transition: fill 160ms ease;
	}

	.wedge.odd {
		fill: rgba(255, 255, 255, 0.028);
	}

	.wedge.lit {
		fill: color-mix(in srgb, var(--accent) 16%, transparent);
	}

	.hub,
	.spoke {
		fill: none;
		stroke: rgba(255, 255, 255, 0.08);
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}

	.hub {
		fill: rgba(0, 0, 0, 0.22);
	}

	.peg {
		fill: rgba(255, 255, 255, 0.4);
	}

	.label {
		fill: rgba(255, 255, 255, 0.5);
		text-anchor: middle;
		transition: fill 160ms ease;
	}

	.label.on {
		fill: #fff;
	}

	.name {
		font-family: var(--sans);
		font-size: 5.6px;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.numeral {
		fill: rgba(255, 255, 255, 0.32);
		font-family: var(--mono);
		font-size: 4.3px;
		letter-spacing: 0.08em;
	}

	.label.on .numeral {
		fill: var(--accent);
	}

	.slot {
		position: absolute;
		top: calc(50% - var(--depth) * var(--unit) / 2);
		left: calc(50% - var(--span) * var(--unit) / 2);
		width: calc(var(--span) * var(--unit));
		height: calc(var(--depth) * var(--unit));
		margin: 0;
		padding: 0;
		border: 0;
		border-radius: 0.7rem;
		transform: rotate(var(--turn)) translateY(calc(var(--reach) * var(--unit) * -1));
		background: none;
		box-shadow: none;
		transition: none;
		-webkit-tap-highlight-color: transparent;
	}

	.slot:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}

	.pointer {
		position: absolute;
		top: -12px;
		left: calc(50% - 8px);
		z-index: 1;
		width: 16px;
		height: 26px;
		overflow: visible;
		transform-origin: 8px 8px;
		fill: var(--accent);
		filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.45));
		pointer-events: none;
	}

	.pointer circle {
		fill: rgba(0, 0, 0, 0.35);
	}

	@media (max-width: 768px) {
		.wheel {
			display: block;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.wedge,
		.label {
			transition: none;
		}
	}
</style>
