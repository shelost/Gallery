<script>
	import { browser } from '$app/environment';
	import { Canvas } from '@threlte/core';
	import { MediaQuery } from 'svelte/reactivity';
	import { NeutralToneMapping } from 'three';
	import Fonts from '$lib/directions/Fonts.svelte';
	import Scene, { ROOF, VIEWS } from '$lib/house/Scene.svelte';
	import { SQFT, area, feet, gable, stack } from '$lib/house/geometry.js';
	import { HOUSE } from '$lib/house/plan.js';
	import '$lib/directions/directions.css';

	/** Storeys from the top down, the way the elevator lists them. */
	const STOREYS = [...HOUSE.floors].reverse();
	const TIERS = [
		{ id: ROOF, key: 'R', name: 'Roof' },
		...STOREYS.map((floor) => ({ id: floor.id, key: floor.short, name: floor.name }))
	];
	const FLOOR_AREA = HOUSE.width * HOUSE.depth;
	const GROSS = FLOOR_AREA * HOUSE.floors.length;
	const RIDGE = stack(HOUSE).eaves + gable(HOUSE).rise;
	/** @type {Record<string, [number, number]>} */
	const ARROWS = { ArrowLeft: [-1.5, 0], ArrowRight: [1.5, 0], ArrowUp: [0, 1.5], ArrowDown: [0, -1.5] };

	let level = $state(ROOF);
	let exploded = $state(false);
	let dragPans = $state(false);
	let shift = $state(false);
	/** @type {string | null} */
	let hovered = $state(null);
	/** @type {string | null} */
	let selected = $state(null);
	let pointing = $state(false);
	/** @type {ReturnType<typeof Scene> | undefined} */
	let scene = $state();

	const coarse = new MediaQuery('(pointer: coarse)', false);
	const floor = $derived(HOUSE.floors.find((candidate) => candidate.id === level));

	/** @param {string} id */
	const owner = (id) => HOUSE.floors.find((candidate) => candidate.rooms.some((room) => room.id === id));

	/** @param {string} id */
	function go(id) {
		if (selected && owner(selected)?.id !== id) selected = null;
		level = id;
		hovered = null;
		pointing = false;
		scene?.frame(id);
	}

	/** @param {string} id */
	function pick(id) {
		const home = owner(id);
		if (selected === id || !home) {
			selected = null;
			return;
		}
		selected = id;
		level = home.id;
		scene?.focus(id);
	}

	function explode() {
		exploded = !exploded;
		scene?.frame(level);
	}

	/** @param {string | null} id */
	function hover3d(id) {
		hovered = id;
		pointing = id !== null;
	}

	/** @param {KeyboardEvent} event */
	function keydown(event) {
		if (event.key === 'Shift') shift = true;
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return;

		const move = ARROWS[event.key];
		if (move) {
			event.preventDefault();
			scene?.nudge(...move);
			return;
		}
		if (event.repeat) return;

		const key = event.key.toUpperCase();
		const tier = TIERS.find((candidate) => candidate.key === key);
		if (tier) go(tier.id);
		else if (key === 'E') explode();
		else if (key === 'ESCAPE') selected = null;
		else if (key === '=' || key === '+') scene?.zoom(4);
		else if (key === '-') scene?.zoom(-4);
	}
</script>

<svelte:head>
	<title>Dream House · Heewon</title>
	<meta name="description" content="A 3D model of my dream house, one room at a time." />
</svelte:head>

<svelte:window
	onkeydown={keydown}
	onkeyup={(event) => {
		if (event.key === 'Shift') shift = false;
	}}
	onblur={() => (shift = false)}
/>

<Fonts />

<div class="dir house">
	<div class="stage" style:cursor={pointing ? 'pointer' : undefined}>
		<Canvas toneMapping={NeutralToneMapping} dpr={browser ? Math.min(devicePixelRatio, 2) : 1}>
			<Scene
				bind:this={scene}
				house={HOUSE}
				{level}
				{exploded}
				panning={dragPans || shift}
				{hovered}
				{selected}
				onhover={hover3d}
				onpick={pick}
			/>
		</Canvas>
	</div>

	<header class="title sfumato">
		<h1>Dream House</h1>
		<p>Model 01 · {HOUSE.width} × {HOUSE.depth} m · {GROSS} m²</p>
	</header>

	<nav class="elevator sfumato" style:--i="1" aria-label="Levels">
		{#each TIERS as tier (tier.id)}
			<button
				class={['tier', level === tier.id && 'on']}
				aria-pressed={level === tier.id}
				aria-label={tier.name}
				aria-keyshortcuts={tier.key}
				onclick={() => go(tier.id)}
			>
				<span class="name" aria-hidden="true">{tier.name}</span>
				<span aria-hidden="true">{tier.key}</span>
			</button>
		{/each}
	</nav>

	<div class="dock">
		<section class="card sfumato" style:--i="2" aria-labelledby="card-title">
			{#if floor}
				<header>
					<h2 id="card-title">{floor.name}</h2>
					<span>{FLOOR_AREA} m²</span>
				</header>
				<ul>
					{#each floor.rooms as room (room.id)}
						<li>
							<button
								class={['row', room.id === hovered && 'hot', room.id === selected && 'on']}
								aria-pressed={room.id === selected}
								onclick={() => pick(room.id)}
								onpointerenter={() => (hovered = room.id)}
								onpointerleave={() => (hovered = null)}
								onfocus={() => (hovered = room.id)}
								onblur={() => (hovered = null)}
							>
								<span>{room.name}</span>
								<span class="num">{area(room.rect).toFixed(1)} m²</span>
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<header>
					<h2 id="card-title">The house</h2>
					<span>{HOUSE.floors.length} storeys</span>
				</header>
				<ul>
					{#each STOREYS as storey (storey.id)}
						<li>
							<button class="row" onclick={() => go(storey.id)}>
								<span>{storey.name}</span>
								<span class="num">{storey.rooms.length} rooms</span>
							</button>
						</li>
					{/each}
				</ul>
				<dl>
					<div>
						<dt>Footprint</dt>
						<dd>{HOUSE.width} × {HOUSE.depth} m<small>{feet(HOUSE.width)} × {feet(HOUSE.depth)}</small></dd>
					</div>
					<div>
						<dt>Floor area</dt>
						<dd>{GROSS} m²<small>{Math.round(GROSS * SQFT).toLocaleString('en-US')} ft²</small></dd>
					</div>
					<div>
						<dt>Ridge</dt>
						<dd>{RIDGE.toFixed(1)} m<small>{HOUSE.roof.pitch}° gable</small></dd>
					</div>
				</dl>
			{/if}
		</section>

		<p class="hint">
			{coarse.current
				? 'Drag to orbit · Two fingers to pan and zoom'
				: 'Drag to orbit · Shift- or right-drag to pan · Scroll to zoom'}
		</p>

		<div class="tools sfumato" style:--i="3">
			<div class="segmented" role="group" aria-label="Camera">
				{#each Object.entries(VIEWS) as [id, view] (id)}
					<button onclick={() => scene?.view(/** @type {keyof typeof VIEWS} */ (id))}>{view.name}</button>
				{/each}
			</div>
			<div class="segmented" role="group" aria-label="Dragging">
				<button aria-pressed={!dragPans} onclick={() => (dragPans = false)}>Orbit</button>
				<button aria-pressed={dragPans} onclick={() => (dragPans = true)}>Pan</button>
			</div>
			<button class={['explode', exploded && 'on']} aria-pressed={exploded} aria-keyshortcuts="E" onclick={explode}>
				<span class="icon" aria-hidden="true"><i></i><i></i><i></i></span>
				Explode
			</button>
		</div>
	</div>
</div>

<style>
	.house {
		position: fixed;
		inset: 0;
		min-height: 0;
		overflow: hidden;
		user-select: none;
		-webkit-user-select: none;
	}

	.stage {
		position: absolute;
		inset: 0;
		animation: stage-in 700ms var(--ease-out) 120ms both;
	}

	@keyframes stage-in {
		from {
			opacity: 0;
		}
	}

	.title {
		position: absolute;
		top: 28px;
		left: 32px;
		pointer-events: none;
	}

	h1 {
		font-family: var(--serif);
		font-size: 44px;
		line-height: 1;
		letter-spacing: -0.02em;
	}

	.title p {
		margin-top: 10px;
		color: var(--ink-3);
		font: 400 11px/1 var(--mono);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.elevator {
		position: absolute;
		top: 50%;
		right: 28px;
		translate: 0 -50%;
		display: grid;
		gap: 6px;
		padding: 6px;
		border-radius: 16px;
		background: color-mix(in srgb, var(--paper) 82%, transparent);
		box-shadow:
			0 0 0 1px var(--rule),
			0 8px 24px rgb(28 27 24 / 0.06);
		backdrop-filter: blur(12px);
	}

	.tier {
		position: relative;
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 11px;
		color: var(--ink-2);
		font: 400 13px/1 var(--mono);
		transition:
			background-color 150ms ease-out,
			color 150ms ease-out,
			transform 120ms ease-out;
	}

	.tier::after {
		content: '';
		position: absolute;
		top: 6px;
		right: 6px;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--sanguine);
		box-shadow: 0 0 6px var(--sanguine);
		opacity: 0;
		transition: opacity 150ms ease-out;
	}

	.tier:active {
		transform: scale(0.94);
	}

	.tier.on {
		background: var(--ink);
		color: var(--paper);
	}

	.tier.on::after {
		opacity: 1;
	}

	.name {
		position: absolute;
		right: calc(100% + 16px);
		color: var(--ink-2);
		font: 400 12px/1 var(--sans);
		white-space: nowrap;
		opacity: 0;
		translate: 4px 0;
		pointer-events: none;
		transition:
			opacity 150ms ease-out,
			translate 150ms ease-out;
	}

	.tier.on .name,
	.tier:focus-visible .name {
		opacity: 1;
		translate: 0 0;
	}

	.dock {
		position: absolute;
		inset: auto 28px 28px 32px;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 24px;
		pointer-events: none;
	}

	.dock > * {
		pointer-events: auto;
	}

	.card,
	.segmented,
	.explode {
		background: color-mix(in srgb, var(--paper) 86%, transparent);
		box-shadow: 0 0 0 1px var(--rule);
		backdrop-filter: blur(14px);
	}

	.card {
		flex: none;
		width: 264px;
		padding: 14px 8px 8px;
		border-radius: 18px;
		box-shadow:
			0 0 0 1px var(--rule),
			0 12px 32px rgb(28 27 24 / 0.07);
	}

	.card header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		padding: 0 10px 10px;
	}

	h2,
	.card header span {
		color: var(--ink-3);
		font: 400 11px/1 var(--mono);
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	h2 {
		color: var(--ink-2);
	}

	.row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		width: 100%;
		padding: 8px 10px;
		border-radius: 10px;
		font-size: 14px;
		transition:
			background-color 150ms ease-out,
			color 150ms ease-out,
			transform 120ms ease-out;
	}

	.row:active {
		transform: scale(0.985);
	}

	.row.hot {
		background: var(--paper-2);
	}

	.row.on {
		background: var(--ink);
		color: var(--paper);
	}

	.num {
		color: var(--ink-3);
		font: 400 11.5px/1 var(--mono);
		font-variant-numeric: tabular-nums;
		transition: color 150ms ease-out;
	}

	.row.on .num {
		color: color-mix(in srgb, var(--paper) 60%, transparent);
	}

	dl {
		display: grid;
		gap: 9px;
		margin: 8px 10px 6px;
		padding-top: 12px;
		border-top: 1px solid var(--rule);
	}

	dl div {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}

	dt {
		color: var(--ink-3);
		font-size: 12.5px;
	}

	dd {
		font: 400 12px/1.35 var(--mono);
		text-align: right;
	}

	dd small {
		display: block;
		color: var(--ink-3);
		font-size: 10.5px;
	}

	.hint {
		flex: 1;
		padding-bottom: 8px;
		color: var(--ink-3);
		font: 400 11px/1.4 var(--mono);
		text-align: center;
		pointer-events: none;
	}

	.tools {
		display: flex;
		flex: none;
		align-items: center;
		gap: 8px;
	}

	.segmented {
		display: flex;
		padding: 3px;
		border-radius: 12px;
	}

	.segmented button,
	.explode {
		color: var(--ink-2);
		font-size: 12.5px;
		transition:
			background-color 150ms ease-out,
			color 150ms ease-out,
			transform 120ms ease-out;
	}

	.segmented button {
		padding: 7px 11px;
		border-radius: 9px;
	}

	.segmented button[aria-pressed='true'],
	.explode.on {
		background: var(--ink);
		color: var(--paper);
	}

	.segmented button:active,
	.explode:active {
		transform: scale(0.96);
	}

	.explode {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px 10px 12px;
		border-radius: 12px;
	}

	.icon {
		display: grid;
		gap: 2px;
	}

	.icon i {
		display: block;
		width: 12px;
		height: 2px;
		border-radius: 1px;
		background: currentColor;
		transition: translate 200ms var(--ease-out);
	}

	.explode.on .icon i:first-child {
		translate: 0 -2px;
	}

	.explode.on .icon i:last-child {
		translate: 0 2px;
	}

	@media (hover: hover) {
		.tier:hover:not(.on),
		.segmented button:hover:not([aria-pressed='true']),
		.explode:hover:not(.on) {
			background: var(--paper-2);
			color: var(--ink);
		}

		.tier:hover .name {
			opacity: 1;
			translate: 0 0;
		}

		.row:hover:not(.on) {
			background: var(--paper-2);
		}
	}

	@media (max-width: 760px) {
		.title {
			top: 18px;
			left: 18px;
		}

		h1 {
			font-size: 32px;
		}

		.elevator {
			right: 12px;
		}

		.name {
			display: none;
		}

		.dock {
			inset: auto 12px 12px;
			flex-direction: column-reverse;
			align-items: stretch;
			gap: 8px;
		}

		.card {
			width: auto;
			max-height: 36svh;
			overflow-y: auto;
		}

		.card ul {
			display: grid;
			grid-template-columns: 1fr 1fr;
		}

		.hint {
			display: none;
		}

		.tools {
			flex-wrap: wrap;
			justify-content: space-between;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.stage {
			animation: none;
		}
	}
</style>
