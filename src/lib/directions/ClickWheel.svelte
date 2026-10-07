<script>
	import { onMount, untrack } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { Clicks } from './clicks.svelte.js';
	import { buzz, tappable } from './haptics.js';

	/**
	 * The section bar as an iPod's click wheel, for phones. Running a thumb around the ring steps
	 * through the sections a click at a time, and the page flies to keep up. MENU goes back to the
	 * top; ⏮ and ⏭ step once, or scrub through the page while they're held; ⏯ sets the page
	 * scrolling by itself, and turning the wheel while it plays sets how fast, the way an iPod sets
	 * its volume. The middle names the section you're in and takes you back to its start.
	 * @type {{ sections: import('./sections.svelte.js').Sections }}
	 */
	let { sections } = $props();

	/** A click of the wheel is a twelfth of a turn. */
	const DETENT = Math.PI / 6;
	/** How far a press can wander, in pixels, before it's a turn. */
	const SLOP = 8;
	/** Closer to the middle than this, in pixels, the angle is too jumpy to read. */
	const HUB = 14;
	/** How long ⏮ or ⏭ is held, in milliseconds, before it scrubs. */
	const HOLD = 380;
	/** The page scrolling by itself, in pixels a second: where it starts, a click's change, its limits. */
	const CRUISE = { start: 280, step: 70, min: 70, max: 2100 };
	/** Scrubbing starts at `from` pixels a second and gains `gain` a second, up to `to`. */
	const SCRUB = { from: 900, gain: 2600, to: 4800 };
	/**
	 * Each kind of click: how it sounds, and how many milliseconds it buzzes on phones that can.
	 * @type {Record<'step' | 'press' | 'end' | 'play', { voice: import('./clicks.svelte.js').Voice, buzz: number }>}
	 */
	const FEEL = {
		step: { voice: 'detent', buzz: 8 },
		press: { voice: 'key', buzz: 12 },
		end: { voice: 'thunk', buzz: 26 },
		play: { voice: 'latch', buzz: 16 }
	};

	const clicks = new Clicks({ muted: false });
	const phone = new MediaQuery('max-width: 768px');

	/** The key under a press, lit while it's held. */
	let pressing = $state('');
	let turning = $state(false);
	/** Where the finger is on the ring while it turns, in radians clockwise from three o'clock. */
	let angle = $state(0);
	/** -1 or 1 while ⏮ or ⏭ is held down and scrubbing, else 0. */
	let scrubbing = $state(0);
	let cruise = $state(CRUISE.start);
	/** What the readout in the middle of the screen says. @type {'section' | 'speed' | 'play' | 'pause' | 'scrub'} */
	let readout = $state('section');
	let shown = $state(false);

	const playing = $derived(sections.running && scrubbing === 0);
	const here = $derived(sections.items[sections.active] ?? { label: 'About', numeral: '' });

	/**
	 * The press under way: its pointer, where it began, the middle of the wheel, the angle it was
	 * last read at, how far it has turned since the last click, and whether it began on the hub.
	 * @type {{ id: number, x: number, y: number, cx: number, cy: number, last: number, turned: number, hub: boolean } | null}
	 */
	let grip = null;
	/** Set once a press turns or scrubs, so the click the browser sends after it is let go. */
	let spent = false;
	/** Which end was last bumped, so pushing on against it doesn't keep bumping. */
	let bumped = 0;
	/** The speed to go back to when a scrub ends, or 0 to stop. */
	let resume = 0;
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let hold;
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let fade;

	/** @param {keyof typeof FEEL} kind */
	function feel(kind) {
		clicks.tick(FEEL[kind].voice);
		buzz(FEEL[kind].buzz);
	}

	/**
	 * Puts the readout up, and takes it down a moment after the last change.
	 * @param {typeof readout} what
	 */
	function show(what) {
		readout = what;
		shown = true;
		clearTimeout(fade);
		fade = setTimeout(() => (shown = false), what === 'section' ? 900 : 1100);
	}

	/**
	 * A click of the wheel, `way` 1 clockwise: the next section, or a notch faster while playing.
	 * @param {number} way
	 */
	function detent(way) {
		if (playing) {
			const next = Math.max(CRUISE.min, Math.min(CRUISE.max, cruise + way * CRUISE.step));
			if (next === cruise) return bump(way);
			cruise = next;
			sections.run(cruise);
			feel('step');
			return show('speed');
		}
		if (!sections.step(way)) return bump(way);
		bumped = 0;
		feel('step');
		show('section');
	}

	/** A thunk at the end of the line, once each time it's reached. @param {number} way */
	function bump(way) {
		if (bumped === way) return;
		bumped = way;
		feel('end');
	}

	/** The angle of a point around the middle of the wheel, and how far out it is. @param {PointerEvent} event */
	function locate(event) {
		if (!grip) return { theta: 0, reach: 0 };
		const dx = event.clientX - grip.cx;
		const dy = event.clientY - grip.cy;
		return { theta: Math.atan2(dy, dx), reach: Math.hypot(dx, dy) };
	}

	/** @param {PointerEvent & { currentTarget: HTMLElement }} event */
	function down(event) {
		if (grip || !event.isPrimary || event.button > 0) return;
		clicks.wake();
		const box = event.currentTarget.getBoundingClientRect();
		const cx = box.left + box.width / 2;
		const cy = box.top + box.height / 2;
		const dx = event.clientX - cx;
		const dy = event.clientY - cy;
		grip = { id: event.pointerId, x: event.clientX, y: event.clientY, cx, cy, last: Math.atan2(dy, dx), turned: 0, hub: Math.hypot(dx, dy) < HUB };
		spent = false;
		bumped = 0;
		const key = event.target instanceof Element ? event.target.closest('[data-key]') : null;
		pressing = key instanceof HTMLElement ? (key.dataset.key ?? '') : '';
		if (pressing === 'prev' || pressing === 'next') {
			const way = pressing === 'next' ? 1 : -1;
			hold = setTimeout(() => scrub(way), HOLD);
		}
	}

	/** @param {PointerEvent & { currentTarget: HTMLElement }} event */
	function move(event) {
		if (!grip || event.pointerId !== grip.id || scrubbing) return;
		const { theta, reach } = locate(event);
		if (!turning) {
			if (Math.hypot(event.clientX - grip.x, event.clientY - grip.y) < SLOP) return;
			clearTimeout(hold);
			turning = true;
			spent = true;
			pressing = '';
			event.currentTarget.setPointerCapture(event.pointerId);
		}
		angle = theta;
		if (reach < HUB) return void (grip.last = theta);
		let delta = theta - grip.last;
		if (delta > Math.PI) delta -= 2 * Math.PI;
		if (delta < -Math.PI) delta += 2 * Math.PI;
		grip.last = theta;
		grip.turned += delta;
		while (Math.abs(grip.turned) >= DETENT) {
			const way = Math.sign(grip.turned);
			grip.turned -= way * DETENT;
			detent(way);
		}
	}

	/** @param {PointerEvent} event */
	function up(event) {
		if (!grip || event.pointerId !== grip.id) return;
		clicks.wake();
		clearTimeout(hold);
		if (scrubbing) unscrub();
		grip = null;
		turning = false;
		pressing = '';
	}

	/** Holding ⏮ or ⏭ flies through the page, faster the longer it's held. @param {number} way */
	function scrub(way) {
		spent = true;
		resume = playing ? cruise : 0;
		scrubbing = way;
		sections.run(way * SCRUB.from, { gain: SCRUB.gain, limit: SCRUB.to });
		feel('press');
		show('scrub');
	}

	function unscrub() {
		scrubbing = 0;
		if (resume) sections.run(resume);
		else sections.stop();
		resume = 0;
	}

	/**
	 * A key's action, unless the press was a turn or a scrub. Keyboard clicks, which come with no
	 * press, always count.
	 * @param {MouseEvent} event
	 * @param {() => void} action
	 */
	function push(event, action) {
		if (event.detail > 0 && spent) return;
		action();
	}

	function top() {
		if (sections.active < 0 && !sections.running) return bump(-1);
		bumped = 0;
		sections.go(-1);
		feel('press');
		show('section');
	}

	/** @param {number} way */
	function skip(way) {
		if (!sections.step(way, { resume: true })) return bump(way);
		bumped = 0;
		feel('press');
		show('section');
	}

	function toggle() {
		bumped = 0;
		if (playing) {
			sections.stop();
			show('pause');
		} else {
			sections.run(cruise);
			show('play');
		}
		feel('play');
	}

	/** Back to the start of the section you're in. */
	function settle() {
		sections.go(sections.active);
		feel('press');
		show('section');
	}

	/** Browsers only let sound start inside a tap, so any tap on a phone gets the wheel ready. */
	function ready() {
		if (phone.current) clicks.wake();
	}

	// Passing a section while the page runs by itself clicks, and says which.
	$effect(() => {
		sections.active;
		untrack(() => {
			if (!sections.running) return;
			feel('step');
			show(scrubbing ? 'scrub' : 'section');
		});
	});

	onMount(() => () => {
		clearTimeout(hold);
		clearTimeout(fade);
		clicks.dispose();
	});
</script>

<svelte:window onclick={ready} />

<nav
	class="wheel"
	aria-label="Sections"
	data-steer
	onpointerdown={down}
	onpointermove={move}
	onpointerup={up}
	onpointercancel={up}
>
	<svg class="progress" viewBox="0 0 100 100" aria-hidden="true">
		<circle class="track" cx="50" cy="50" r="48.6" />
		<circle class="done" cx="50" cy="50" r="48.6" pathLength="1" stroke-dasharray="{sections.progress} 1" />
	</svg>
	<span class={['finger', turning && 'shown']} style:rotate="{angle}rad" aria-hidden="true"></span>

	<button
		type="button"
		class={['key', 'menu', pressing === 'menu' && 'down']}
		data-key="menu"
		aria-label="Back to the top"
		onclick={(event) => push(event, top)}
		{@attach tappable}
	>
		MENU
	</button>
	<button
		type="button"
		class={['key', 'next', pressing === 'next' && 'down']}
		data-key="next"
		aria-label="Next section; hold to fast-forward"
		onclick={(event) => push(event, () => skip(1))}
		{@attach tappable}
	>
		<svg viewBox="0 0 20 12" aria-hidden="true"><path d="M1 1l7 5-7 5zM8.5 1l7 5-7 5zM16.5 1h2.5v10h-2.5z" /></svg>
	</button>
	<button
		type="button"
		class={['key', 'play', pressing === 'play' && 'down', playing && 'on']}
		data-key="play"
		aria-label="Scroll by itself"
		aria-pressed={playing}
		onclick={(event) => push(event, toggle)}
		{@attach tappable}
	>
		<svg viewBox="0 0 20 12" aria-hidden="true"><path d="M1 1l7.5 5L1 11zM11.5 1H14v10h-2.5zM16.5 1H19v10h-2.5z" /></svg>
	</button>
	<button
		type="button"
		class={['key', 'prev', pressing === 'prev' && 'down']}
		data-key="prev"
		aria-label="Previous section; hold to rewind"
		onclick={(event) => push(event, () => skip(-1))}
		{@attach tappable}
	>
		<svg viewBox="0 0 20 12" aria-hidden="true"><path d="M19 1l-7 5 7 5zM11.5 1l-7 5 7 5zM3.5 1H1v10h2.5z" /></svg>
	</button>
	<button
		type="button"
		class={['center', pressing === 'center' && 'down']}
		data-key="center"
		aria-label="Back to the start of {here.label}"
		onclick={(event) => push(event, settle)}
		{@attach tappable}
	>
		{here.label}
	</button>
</nav>

<div class={['readout', shown && 'shown']} aria-hidden="true">
	{#if readout === 'speed'}
		<span class="kicker">Speed</span>
		<span class="meter"><span style:width="{((cruise - CRUISE.min) / (CRUISE.max - CRUISE.min)) * 100}%"></span></span>
	{:else if readout === 'play' || readout === 'pause'}
		<svg class="glyph" viewBox="0 0 14 16">
			<path d={readout === 'play' ? 'M2 1l10 7-10 7z' : 'M2 1h3.5v14H2zM8.5 1H12v14H8.5z'} />
		</svg>
		<span class="kicker">{readout === 'play' ? 'Scrolling' : 'Paused'}</span>
	{:else}
		{#if readout === 'scrub'}
			<span class="kicker">{scrubbing < 0 ? 'Rewind' : 'Fast-forward'}</span>
		{:else if here.numeral}
			<span class="kicker">{here.numeral}</span>
		{/if}
		<span class="name">{here.label}</span>
	{/if}
</div>

<style>
	.wheel {
		position: fixed;
		left: 50%;
		bottom: max(12px, env(safe-area-inset-bottom));
		z-index: 90;
		display: none;
		box-sizing: border-box;
		width: 8rem;
		aspect-ratio: 1;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		translate: -50% 0;
		background: radial-gradient(circle at 50% 30%, rgba(46, 46, 48, 0.94), rgba(8, 8, 9, 0.94) 72%);
		box-shadow:
			-12px 32px 48px rgba(0, 0, 0, 0.45),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
		-webkit-tap-highlight-color: transparent;
	}

	.progress {
		position: absolute;
		inset: 0;
		rotate: -90deg;
		overflow: visible;
		pointer-events: none;
	}

	.progress circle {
		fill: none;
		stroke-width: 1.3;
	}

	.track {
		stroke: rgba(255, 255, 255, 0.07);
	}

	.done {
		stroke: var(--accent);
	}

	.finger {
		position: absolute;
		inset: 0;
		opacity: 0;
		pointer-events: none;
		transition: opacity 160ms ease;
	}

	.finger.shown {
		opacity: 1;
	}

	.finger::after {
		content: '';
		position: absolute;
		top: calc(50% - 0.22rem);
		left: calc(50% - 0.22rem);
		width: 0.44rem;
		height: 0.44rem;
		border-radius: 50%;
		translate: 2.85rem 0;
		background: var(--accent);
		box-shadow: 0 0 10px 2px rgba(255, 0, 76, 0.55);
	}

	.key,
	.center {
		position: absolute;
		display: grid;
		place-items: center;
		margin: 0;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: none;
		box-shadow: none;
		opacity: 1;
		color: rgba(255, 255, 255, 0.62);
		font-family: var(--sans);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition:
			color 120ms ease,
			scale 120ms ease;
	}

	.key {
		width: 2.5rem;
		height: 2.5rem;
	}

	.key svg {
		width: 0.95rem;
		fill: currentColor;
	}

	.menu {
		top: 0.15rem;
		left: calc(50% - 1.25rem);
		font-size: 0.56rem;
		font-weight: 600;
		letter-spacing: 0.1em;
	}

	.next {
		top: calc(50% - 1.25rem);
		right: 0.15rem;
	}

	.play {
		bottom: 0.15rem;
		left: calc(50% - 1.25rem);
	}

	.prev {
		top: calc(50% - 1.25rem);
		left: 0.15rem;
	}

	.key.down,
	.play.on {
		color: var(--accent);
	}

	.center {
		top: calc(50% - 1.7rem);
		left: calc(50% - 1.7rem);
		width: 3.4rem;
		height: 3.4rem;
		padding: 0.3rem;
		overflow: hidden;
		background: linear-gradient(180deg, #232325, #0e0e0f);
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.08),
			0 3px 8px rgba(0, 0, 0, 0.55),
			inset 0 1px 0 rgba(255, 255, 255, 0.07);
		color: #fff;
		font-size: 0.58rem;
		line-height: 1.15;
		letter-spacing: -0.01em;
		text-align: center;
	}

	.center.down {
		scale: 0.95;
	}

	.key:focus-visible,
	.center:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}

	.readout {
		position: fixed;
		top: 44%;
		left: 50%;
		z-index: 95;
		display: none;
		justify-items: center;
		gap: 0.45rem;
		min-width: 9rem;
		max-width: calc(100vw - 4rem);
		box-sizing: border-box;
		padding: 0.95rem 1.4rem 1.05rem;
		border-radius: 1.1rem;
		translate: -50% -50%;
		background: rgba(0, 0, 0, 0.8);
		box-shadow: 0 18px 40px rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		color: #fff;
		text-align: center;
		opacity: 0;
		scale: 0.94;
		pointer-events: none;
		transition:
			opacity 160ms ease,
			scale 160ms ease;
	}

	.readout.shown {
		opacity: 1;
		scale: 1;
	}

	.kicker {
		color: rgba(255, 255, 255, 0.55);
		font-family: var(--mono);
		font-size: 0.62rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.name {
		font-family: var(--sans);
		font-size: 1.55rem;
		line-height: 1.1;
		letter-spacing: -0.03em;
	}

	.glyph {
		width: 1.5rem;
		fill: #fff;
	}

	.meter {
		width: 7.5rem;
		height: 0.32rem;
		overflow: hidden;
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.18);
	}

	.meter span {
		display: block;
		height: 100%;
		background: var(--accent);
		transition: width 120ms ease;
	}

	@media (max-width: 768px) {
		.wheel {
			display: block;
		}

		.readout {
			display: grid;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.key,
		.center,
		.finger,
		.readout,
		.meter span {
			transition: none;
		}
	}
</style>
