<script>
	import { Canvas } from '@threlte/core';
	import { on } from 'svelte/events';
	import { prefersReducedMotion } from 'svelte/motion';
	import { NeutralToneMapping } from 'three';
	import ArcadeScene from '$lib/room/ArcadeScene.svelte';

	/** @type {Record<string, number>} */
	const STEPS = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };

	/**
	 * The games on a little desk in 3D: a monitor, a keyboard, and a cartridge for each game.
	 * Pointing at a cartridge, or at a game in the list, puts it on the screen. Clicking a
	 * cartridge puts it in, and the screen or the keyboard start it. The arrow keys step
	 * through the cartridges while focus is on the desk.
	 * @type {{
	 *   games: import('./content.js').Work[],
	 *   zoom: import('./zoom.svelte.js').Zoom,
	 *   active?: string | null,
	 *   onhover?: (id: string, hovering: boolean) => void
	 * }}
	 */
	let { games, zoom, active = null, onhover } = $props();

	let inserted = $state(0);
	let pointing = $state(false);
	/** On screen now, and whether it has been yet, so the scene is built the first time it's near. */
	let seen = $state(false);
	let woken = $state(false);

	const previewed = $derived(games.findIndex((game) => game.id === active));
	const shown = $derived(games[previewed >= 0 ? previewed : inserted]);

	/** @param {number} index */
	function insert(index) {
		inserted = (index + games.length) % games.length;
	}

	function start() {
		zoom.show(shown.id, 'console');
	}

	/** @param {HTMLElement} node */
	function desk(node) {
		const observer = new IntersectionObserver(
			([entry]) => {
				seen = entry.isIntersecting;
				if (seen) woken = true;
			},
			{ rootMargin: '200px' }
		);
		observer.observe(node);
		const off = on(node, 'keydown', (event) => {
			const step = STEPS[event.key];
			if (!step) return;
			event.preventDefault();
			insert(inserted + step);
		});
		return () => {
			observer.disconnect();
			off();
		};
	}
</script>

<div
	class="arcade"
	style:cursor={pointing ? 'pointer' : undefined}
	style:view-transition-name={zoom.tileName('console')}
	role="group"
	aria-label="Games desk. Arrow keys change the cartridge."
	{@attach desk}
>
	{#if woken}
	<Canvas toneMapping={NeutralToneMapping} dpr={Math.min(devicePixelRatio, 2)}>
		<ArcadeScene
			{games}
			{shown}
			{inserted}
			{active}
			playing={seen}
			still={prefersReducedMotion.current}
			oninsert={insert}
			onhover={(id, on) => {
				pointing = on;
				onhover?.(id, on);
			}}
			onpoint={(on) => (pointing = on)}
			onstart={start}
		/>
	</Canvas>
	{/if}

	<p class="now" aria-live="polite">
		<span class="title">{shown.title}</span>
		<span class="kind">{shown.kicker}</span>
	</p>

	<ul class="carts" aria-label="Cartridges">
		{#each games as game, i (game.id)}
			<li>
				<button
					type="button"
					aria-pressed={i === inserted}
					onclick={() => insert(i)}
					onfocus={() => onhover?.(game.id, true)}
					onblur={() => onhover?.(game.id, false)}
				>
					{game.title}
				</button>
			</li>
		{/each}
		<li><button type="button" onclick={start}>Start {shown.title}</button></li>
	</ul>
</div>

<style>
	.arcade {
		position: relative;
		height: clamp(22rem, 36vw, 28rem);
		border-radius: 8px;
		background: #f1f0ed;
	}

	.arcade:has(:focus-visible) {
		box-shadow: 0 0 0 2px var(--accent);
	}

	.now {
		position: absolute;
		top: 0.9rem;
		left: 1rem;
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		margin: 0;
		pointer-events: none;
	}

	.title {
		color: var(--ink);
		font-size: 0.9rem;
		font-weight: 500;
	}

	.kind {
		color: var(--ink-3);
		font-family: var(--mono);
		font-size: 0.66rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	/* For keyboards and screen readers; pointers use the cartridges on the desk. */
	.carts {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		list-style: none;
	}
</style>
