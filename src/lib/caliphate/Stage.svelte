<script>
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { COLORS, PERIODS, antique, modern } from './sheets.js';
	import { glide } from './window.js';
	import Sheet from './Sheet.svelte';
	import { mapView } from './view.svelte.js';

	let index = $state(0);
	let origin = $state(0);
	let t = $state(1);
	let playing = $state(false);
	let visible = false;

	const period = $derived(PERIODS[index]);
	const lastIndex = $derived(PERIODS.length - 1);
	const legend = [
		{ key: 'romeEast', name: 'Eastern Rome / America' },
		{ key: 'romeWest', name: 'Western Rome / Europe' },
		{ key: 'persia', name: 'Persia / China' },
		{ key: 'greece', name: 'Greece / Japan' },
		{ key: 'caliphate', name: 'Caliphate / Kaliphate' },
		{ key: 'steppe', name: 'The steppe / Russia' },
		{ key: 'holy', name: 'Jerusalem / Paektu' }
	];

	/** @param {number} next */
	function go(next) {
		const i = (next + PERIODS.length) % PERIODS.length;
		if (i === index && t === 1) return;
		origin = index;
		index = i;
		const start = performance.now();
		const still = prefersReducedMotion.current;
		const step = (/** @type {number} */ now) => {
			const raw = still ? 1 : Math.min(1, (now - start) / 1800);
			t = glide(raw);
			if (raw < 1) requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	}

	/** @type {ReturnType<typeof setInterval> | undefined} */
	let timer;

	function stop() {
		playing = false;
		clearInterval(timer);
		timer = undefined;
	}

	function play() {
		if (prefersReducedMotion.current) return;
		playing = true;
		clearInterval(timer);
		timer = setInterval(() => {
			if (visible) go(index + 1);
		}, 5200);
	}

	onMount(() => {
		if (!prefersReducedMotion.current) play();
		return stop;
	});

	/** Autoplay only turns the page while someone can see it. @param {HTMLElement} node */
	function watch(node) {
		const io = new IntersectionObserver((entries) => {
			visible = entries.some((entry) => entry.isIntersecting);
		}, { threshold: 0.35 });
		io.observe(node);
		return () => io.disconnect();
	}

	/** @param {number} i */
	function markerLeft(i) {
		return lastIndex > 0 ? (i / lastIndex) * 100 : 0;
	}
</script>

<figure class="maps" {@attach watch}>
	<div class="pair">
		<Sheet world={antique} when={period.when.antique} {origin} {index} {t} />
		<Sheet world={modern} when={period.when.modern} {origin} {index} {t} />
	</div>

	<div class="timeline" role="group" aria-label="Along the story">
		<span class="timeline-heading">Along the story</span>
		<div class="timeline-track">
			<input
				class="timeline-range"
				type="range"
				min="0"
				max={lastIndex}
				step="1"
				value={index}
				aria-valuetext={period.name}
				oninput={(event) => {
					stop();
					go(Number(event.currentTarget.value));
				}}
			/>
			<div class="timeline-markers">
				{#each PERIODS as item, i (item.id)}
					<button
						type="button"
						class="marker"
						class:active={i === index}
						style:left="{markerLeft(i)}%"
						aria-current={i === index ? 'step' : undefined}
						title={item.pair}
						onclick={() => {
							stop();
							go(i);
						}}
					>
						<span class="dot" aria-hidden="true"></span>
						<span class="label">{item.name}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="bar">
		<button
			type="button"
			class="play"
			aria-pressed={playing}
			onclick={() => (playing ? stop() : play())}
		>
			{playing ? 'Pause' : 'Play'}
		</button>
		<button
			type="button"
			class="play"
			aria-pressed={mapView.relief}
			onclick={() => (mapView.relief = !mapView.relief)}
		>
			{mapView.relief ? '3D' : '2D'}
		</button>
	</div>

	<p class="line">{period.line}</p>

	<ul class="legend">
		{#each legend as item (item.key)}
			<li>
				<i style:background={COLORS[item.key].ink}></i>
				{item.name}
			</li>
		{/each}
	</ul>

	<figcaption>
		Matching colors mean matching roles. Pale shading marks client states, and the glow shows which power each step is about. Click a map to enlarge it.
	</figcaption>
</figure>

<style>
	.maps {
		margin: 1.5rem 0 2rem;
	}

	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.85rem;
	}

	.timeline {
		margin-top: 0.85rem;
	}

	.timeline-heading {
		display: block;
		margin-bottom: 0.3rem;
		color: var(--ink-3, #6d6860);
		font-size: 0.72rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.timeline-track {
		position: relative;
		padding: 0.35rem 0 4.25rem;
	}

	.timeline-track::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 1.15rem;
		height: 2px;
		background: color-mix(in srgb, var(--ink, #1c1b18) 22%, transparent);
		pointer-events: none;
	}

	.timeline-range {
		position: relative;
		z-index: 1;
		display: block;
		width: 100%;
		margin: 0;
		height: 2.25rem;
		accent-color: var(--ink, #1c1b18);
		background: transparent;
		cursor: pointer;
	}

	.timeline-markers {
		position: absolute;
		z-index: 3;
		left: 0;
		right: 0;
		top: 0;
		height: 2.25rem;
		pointer-events: none;
	}

	.marker {
		position: absolute;
		top: 0.72rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		width: min(5.25rem, 14vw);
		padding: 0;
		border: none;
		background: transparent;
		color: var(--ink-3, #6d6860);
		cursor: pointer;
		font: inherit;
		pointer-events: auto;
		transform: translateX(-50%);
	}

	.marker .dot {
		flex-shrink: 0;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		border: 2px solid var(--paper, #f6f4ef);
		background: color-mix(in srgb, var(--ink, #1c1b18) 35%, transparent);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--ink, #1c1b18) 25%, transparent);
		transition:
			transform 0.15s ease,
			background 0.15s ease;
	}

	.marker:hover .dot,
	.marker:focus-visible .dot {
		transform: scale(1.15);
		background: color-mix(in srgb, var(--ink, #1c1b18) 55%, transparent);
	}

	.marker.active .dot {
		width: 0.65rem;
		height: 0.65rem;
		background: var(--ink, #1c1b18);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--ink, #1c1b18) 20%, transparent);
	}

	.marker .label {
		position: absolute;
		top: 1.65rem;
		display: block;
		max-width: min(5.25rem, 14vw);
		font-size: clamp(0.58rem, 2.2vw, 0.68rem);
		line-height: 1.25;
		text-align: center;
		text-transform: none;
		letter-spacing: 0.01em;
		hyphens: auto;
	}

	.marker.active .label {
		color: var(--ink, #1c1b18);
		font-weight: 600;
	}

	.bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		margin-top: 0.85rem;
	}

	button.play {
		border: 1px solid color-mix(in srgb, var(--ink, #1c1b18) 18%, transparent);
		border-radius: 999px;
		background: transparent;
		color: var(--ink-2, #3a3834);
		cursor: pointer;
		font: inherit;
		font-size: 0.74rem;
		padding: 0.35rem 0.75rem;
	}

	.play {
		margin-left: auto;
	}

	.line {
		margin: 0.85rem 0 0.4rem;
		font-family: Iowan Old Style, Palatino, Georgia, serif;
		font-size: 1.05rem;
		font-style: italic;
		text-align: center;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem 0.9rem;
		justify-content: center;
		margin: 0.35rem 0 0;
		padding: 0;
		list-style: none;
		font-size: 0.78rem;
	}

	.legend li {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.legend i {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 2px;
	}

	figcaption {
		margin-top: 0.75rem;
		color: var(--ink-3, #6d6860);
		font-size: 0.84rem;
		line-height: 1.45;
		text-align: center;
	}

	@media (max-width: 720px) {
		.pair {
			grid-template-columns: 1fr;
		}

		.timeline-track {
			padding-bottom: 4.75rem;
		}

		.marker .label {
			max-width: min(4.5rem, 18vw);
			font-size: 0.56rem;
		}

		.play {
			margin-left: 0;
		}
	}

	@media (max-width: 480px) {
		.timeline-track {
			padding-bottom: 5.5rem;
		}

		.marker {
			width: min(4.25rem, 20vw);
		}

		.marker .label {
			max-width: min(4.25rem, 20vw);
			font-size: 0.52rem;
			line-height: 1.2;
		}
	}
</style>