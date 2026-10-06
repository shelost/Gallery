<script module>
	/** Screen palettes in the order Select steps through them, darkest shade first. Color shows the game as it is. */
	const PALETTES = [
		{ id: 'dmg', shades: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] },
		{ id: 'pocket', shades: ['#1f201c', '#4c4e46', '#8b8d83', '#c5c7ba'] },
		{ id: 'color', shades: ['#1c1b18', '#5d5950', '#ece9e1', '#f6f4ef'] }
	];

	/** @type {Record<string, number>} */
	const STEPS = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };

	/**
	 * One channel of a palette as an feFunc table, so the filter maps each of four luminance bands
	 * to a shade.
	 * @param {string[]} shades
	 * @param {number} channel 0 for red, 1 for green, 2 for blue
	 */
	function table(shades, channel) {
		return shades
			.map((hex) => (parseInt(hex.slice(1 + channel * 2, 3 + channel * 2), 16) / 255).toFixed(3))
			.join(' ');
	}
</script>

<script>
	import { on } from 'svelte/events';
	import ActionLines from './ActionLines.svelte';
	import Media from './Media.svelte';
	import { hash } from './motion.js';

	/**
	 * A handheld console for the games, with their cartridges beside it. Click a cartridge to put it
	 * in. The D-pad and arrow keys step through them, A or Start opens the one that's in, B pauses
	 * it, and Select changes the screen's palette. Hovering a cartridge, or its row, previews it.
	 * @type {{
	 *   games: import('./content.js').Work[],
	 *   zoom: import('./zoom.svelte.js').Zoom,
	 *   active?: string | null,
	 *   onhover?: (id: string, hovering: boolean) => void
	 * }}
	 */
	let { games, zoom, active = null, onhover } = $props();

	const uid = $props.id();

	let inserted = $state(0);
	let palette = $state(0);
	let paused = $state(false);

	const previewed = $derived(games.findIndex((game) => game.id === active));
	const shown = $derived(games[previewed >= 0 ? previewed : inserted]);
	const screen = $derived(PALETTES[palette]);

	/** @param {number} index */
	function insert(index) {
		inserted = (index + games.length) % games.length;
		paused = false;
	}

	function start() {
		zoom.show(shown.id, 'console');
	}

	/** Arrow keys step through the cartridges while focus is anywhere on the console. @param {HTMLElement} node */
	function arrows(node) {
		return on(node, 'keydown', (event) => {
			const step = STEPS[event.key];
			if (!step) return;
			event.preventDefault();
			insert(inserted + step);
		});
	}
</script>

<div class="console" style:--shade-0={screen.shades[0]} style:--shade-3={screen.shades[3]} {@attach arrows}>
	<svg class="filters" aria-hidden="true">
		{#each PALETTES as { id, shades } (id)}
			<filter id="{uid}-{id}" color-interpolation-filters="sRGB">
				<feColorMatrix
					type="matrix"
					values="0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0.299 0.587 0.114 0 0 0 0 0 1 0"
				/>
				<feComponentTransfer>
					<feFuncR type="discrete" tableValues={table(shades, 0)} />
					<feFuncG type="discrete" tableValues={table(shades, 1)} />
					<feFuncB type="discrete" tableValues={table(shades, 2)} />
				</feComponentTransfer>
			</filter>
		{/each}
	</svg>

	<span class="seam" aria-hidden="true">◁ OFF · ON ▷</span>

	<div class="bezel">
		<p class="stripe" aria-hidden="true">Dot matrix · drawn by hand</p>
		<span class={['lamp', !paused && 'on']} aria-hidden="true"></span>
		<div class="screen" style:view-transition-name={zoom.tileName('console')}>
			{#key shown.id}
				<div class="picture" style:filter={screen.id === 'color' ? null : `url(#${uid}-${screen.id})`}>
					<Media media={shown.media} playing={paused ? false : undefined} title={shown.title} />
				</div>
				<ActionLines kind="speed" seed={hash(shown.id)} count={14} class="whoosh" />
				<p class="boot"><span>{shown.title}</span></p>
			{/key}
			{#if paused}<p class="paused">Paused</p>{/if}
		</div>
	</div>

	<p class="brand"><i>Heewon</i> <b>GAMES</b></p>

	<div class="controls">
		<div class="dpad">
			<button type="button" class="up" tabindex="-1" aria-hidden="true" onclick={() => insert(inserted - 1)}></button>
			<button type="button" class="left" aria-label="Previous game" onclick={() => insert(inserted - 1)}></button>
			<span class="hub" aria-hidden="true"></span>
			<button type="button" class="right" aria-label="Next game" onclick={() => insert(inserted + 1)}></button>
			<button type="button" class="down" tabindex="-1" aria-hidden="true" onclick={() => insert(inserted + 1)}></button>
		</div>
		<div class="ab">
			<button type="button" class="round" aria-label={paused ? 'Resume' : 'Pause'} aria-pressed={paused} onclick={() => (paused = !paused)}>
				<span>B</span>
			</button>
			<button type="button" class="round" aria-label="Open {shown.title}" onclick={start}>
				<span>A</span>
			</button>
		</div>
	</div>

	<div class="pills">
		<button type="button" aria-label="Change the screen's palette" onclick={() => (palette = (palette + 1) % PALETTES.length)}>
			<span class="pill"></span>Select
		</button>
		<button type="button" aria-label="Start {shown.title}" onclick={start}>
			<span class="pill"></span>Start
		</button>
	</div>

	<span class="speaker" aria-hidden="true"></span>
</div>

<ul class="carts" aria-label="Cartridges">
	{#each games as game, i (game.id)}
		<li>
			<button
				type="button"
				class={['cart', i === inserted && 'in', game.id === active && 'lit']}
				aria-pressed={i === inserted}
				onclick={() => insert(i)}
				onpointerenter={() => onhover?.(game.id, true)}
				onpointerleave={() => onhover?.(game.id, false)}
				onfocus={() => onhover?.(game.id, true)}
				onblur={() => onhover?.(game.id, false)}
			>
				<span class="grip" aria-hidden="true"></span>
				<span class="label">
					<img src={game.media?.poster} alt="" loading="lazy" decoding="async" draggable="false" />
				</span>
				<span class="name">{game.title}</span>
				<span class="kind">{game.kicker}</span>
			</button>
		</li>
	{/each}
</ul>

<style>
	.console {
		--plastic: #d9d7d0;
		--plastic-2: #c8c5bc;
		--navy: #2c3170;
		position: relative;
		align-self: start;
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 17.5rem;
		aspect-ratio: 90 / 148;
		padding: 1.7rem 1.05rem 1.2rem;
		border: var(--line, 2px) solid var(--ink);
		border-radius: 10px 10px 3.6rem 10px;
		background: linear-gradient(180deg, var(--plastic), var(--plastic-2));
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.8),
			inset -3px -4px 0 rgba(0, 0, 0, 0.05),
			6px 6px 0 var(--ink);
	}

	.filters {
		position: absolute;
		width: 0;
		height: 0;
	}

	.seam {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		padding: 0.3rem 1rem 0;
		height: 1.15rem;
		border-bottom: 1.5px solid rgba(28, 27, 24, 0.2);
		font-family: var(--mono);
		font-size: 7.5px;
		letter-spacing: 0.14em;
		color: rgba(28, 27, 24, 0.45);
	}

	.bezel {
		position: relative;
		padding: 1.25rem 1.6rem 1.35rem 2rem;
		border-radius: 7px 7px 2.4rem 7px;
		background: #5c5b67;
	}

	.stripe {
		position: absolute;
		top: 0.42rem;
		left: 0.6rem;
		right: 0.6rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--mono);
		font-size: 6.5px;
		line-height: 1;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		white-space: nowrap;
		color: #cfcdd8;
	}

	.stripe::before,
	.stripe::after {
		content: '';
		flex: 1;
		height: 5px;
		background: linear-gradient(#8d2a4c 0 1.5px, transparent 1.5px 3.5px, #2d3d8b 3.5px 5px);
	}

	.stripe::before {
		flex: 0 0 0.6rem;
	}

	.lamp {
		position: absolute;
		top: 46%;
		left: 0.75rem;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #3b2c2c;
		transition:
			background-color 200ms,
			box-shadow 200ms;
	}

	.lamp.on {
		background: #ee4a3b;
		box-shadow: 0 0 7px #ff5a47;
	}

	.screen {
		position: relative;
		aspect-ratio: 10 / 9;
		overflow: hidden;
		background: var(--shade-3);
		box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.3);
	}

	/* The dot matrix. */
	.screen::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px) 0 0 / 100% 3px,
			linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px) 0 0 / 3px 100%;
	}

	.picture {
		position: absolute;
		inset: 0;
		--media-bg: var(--shade-3);
	}

	.screen :global(.whoosh) {
		--lines-ink: var(--shade-0);
		animation: fade 360ms 320ms var(--ease-out) forwards;
	}

	/* A cartridge boots: its title drops into place, then gives way to the game. */
	.boot {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 0 0.75rem;
		background: var(--shade-3);
		font-family: var(--mono);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		text-align: center;
		color: var(--shade-0);
		animation: fade 240ms 640ms steps(2, end) forwards;
	}

	.boot span {
		animation: drop 520ms var(--ease-out) both;
	}

	.paused {
		position: absolute;
		left: 50%;
		top: 50%;
		padding: 0.2rem 0.45rem;
		transform: translate(-50%, -50%);
		background: var(--shade-0);
		color: var(--shade-3);
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	@keyframes drop {
		from {
			transform: translateY(-5rem);
		}
	}

	@keyframes fade {
		to {
			opacity: 0;
			visibility: hidden;
		}
	}

	.brand {
		margin: 0.55rem 0 0 0.15rem;
		color: var(--navy);
		font-size: 13px;
		line-height: 1;
	}

	.brand i {
		font-family: var(--serif);
		font-size: 16px;
	}

	.brand b {
		font-weight: 700;
		font-style: italic;
		letter-spacing: 0.02em;
	}

	.controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1.15rem;
	}

	.dpad {
		display: grid;
		grid-template: repeat(3, 1.65rem) / repeat(3, 1.65rem);
		filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.25));
	}

	.dpad button,
	.hub {
		background: #2b2a30;
	}

	.dpad button:active {
		background: #1a191d;
	}

	.up {
		grid-area: 1 / 2;
		border-radius: 3px 3px 0 0;
	}

	.left {
		grid-area: 2 / 1;
		border-radius: 3px 0 0 3px;
	}

	.hub {
		grid-area: 2 / 2;
		background-image: radial-gradient(circle, #1d1c21 34%, transparent 36%);
	}

	.right {
		grid-area: 2 / 3;
		border-radius: 0 3px 3px 0;
	}

	.down {
		grid-area: 3 / 2;
		border-radius: 0 0 3px 3px;
	}

	.ab {
		display: flex;
		gap: 0.75rem;
		padding-bottom: 1rem;
		transform: rotate(-25deg);
	}

	.round {
		position: relative;
		width: 2.6rem;
		aspect-ratio: 1;
		border-radius: 50%;
		background: radial-gradient(
			circle at 40% 35%,
			color-mix(in srgb, var(--accent), #fff 22%),
			var(--accent) 60%,
			color-mix(in srgb, var(--accent), #000 40%)
		);
		box-shadow:
			0 2px 0 rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.25);
		transition: transform 80ms var(--ease-out);
	}

	.round:nth-child(2) {
		top: -0.9rem;
	}

	.round:active,
	.pills button:active .pill {
		transform: translateY(1px) scale(0.95);
	}

	.round[aria-pressed='true'] {
		box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.4);
	}

	.round span {
		position: absolute;
		top: calc(100% + 0.3rem);
		right: 0;
		font-family: var(--mono);
		font-size: 11px;
		font-weight: 600;
		color: var(--navy);
	}

	.pills {
		display: flex;
		justify-content: center;
		gap: 0.9rem;
		margin: 0.9rem 0 0 -1.6rem;
		transform: rotate(-25deg);
	}

	.pills button {
		display: grid;
		justify-items: center;
		gap: 0.35rem;
		font-family: var(--mono);
		font-size: 7.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--navy);
	}

	.pill {
		width: 2.5rem;
		height: 0.6rem;
		border-radius: 999px;
		background: #8f8c95;
		box-shadow: 0 1px 0 rgba(0, 0, 0, 0.3);
		transition: transform 80ms var(--ease-out);
	}

	.speaker {
		position: absolute;
		right: 1.15rem;
		bottom: 1.5rem;
		width: 3.4rem;
		height: 2.6rem;
		background: repeating-linear-gradient(90deg, rgba(28, 27, 24, 0.42) 0 4px, transparent 4px 9px);
		border-radius: 4px;
		transform: rotate(-25deg);
	}

	/* Cartridges */
	.carts {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--gutter, 14px);
		align-content: start;
	}

	.cart {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		width: 100%;
		padding: 1.05rem 0.6rem 0.75rem;
		border: var(--line, 2px) solid var(--ink);
		border-radius: 3px 3px 10px 10px;
		background: linear-gradient(180deg, #d6d3cc, #c4c0b7);
		transition:
			transform 260ms var(--ease-out),
			box-shadow 260ms var(--ease-out);
	}

	/* The notch in a cartridge's top corner. */
	.cart::before {
		content: '';
		position: absolute;
		top: calc(-1 * var(--line, 2px));
		right: calc(-1 * var(--line, 2px));
		width: 13px;
		height: 13px;
		background: var(--paper);
		border-left: var(--line, 2px) solid var(--ink);
		border-bottom: var(--line, 2px) solid var(--ink);
	}

	.grip {
		position: absolute;
		top: 0.35rem;
		left: 0.6rem;
		right: 1.5rem;
		height: 0.35rem;
		background: repeating-linear-gradient(90deg, rgba(28, 27, 24, 0.3) 0 2px, transparent 2px 5px);
	}

	.label {
		aspect-ratio: 4 / 3;
		overflow: hidden;
		border: 1.5px solid var(--ink);
		background: var(--paper);
	}

	.label img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.name {
		margin-top: 0.15rem;
		font-size: 13px;
		line-height: 1.2;
		color: var(--ink);
	}

	.kind {
		font-family: var(--mono);
		font-size: 9.5px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.cart:hover,
	.cart.lit {
		transform: translateY(-4px) rotate(-1.2deg);
	}

	.cart.in {
		transform: translateY(-6px);
		box-shadow: 5px 5px 0 var(--ink);
	}

	.cart:active {
		transform: translateY(-2px) scale(0.98);
	}

	@media (hover: none) {
		.label img {
			filter: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.boot,
		.boot span,
		.screen :global(.whoosh) {
			animation: none;
		}

		.boot,
		.screen :global(.whoosh) {
			display: none;
		}

		.cart {
			transition: none;
		}
	}
</style>
