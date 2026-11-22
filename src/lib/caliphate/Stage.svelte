<script>
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { COLORS, PERIODS, antique, modern } from './sheets.js';
	import { glide } from './window.js';
	import Sheet from './Sheet.svelte';

	let index = $state(0);
	let origin = $state(0);
	let t = $state(1);
	let playing = $state(false);
	let visible = false;

	const period = $derived(PERIODS[index]);
	const legend = [
		{ key: 'romeEast', name: 'Eastern Rome / America' },
		{ key: 'romeWest', name: 'Western Rome / the Atlantic' },
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
</script>

<figure class="maps" {@attach watch}>
	<div class="pair">
		<Sheet world={antique} when={period.when.antique} {origin} {index} {t} />
		<Sheet world={modern} when={period.when.modern} {origin} {index} {t} />
	</div>

	<div class="bar">
		<div class="periods" role="tablist" aria-label="Periods">
			{#each PERIODS as item, i (item.id)}
				<button
					type="button"
					role="tab"
					aria-selected={i === index}
					onclick={() => {
						stop();
						go(i);
					}}
				>
					{item.title}
				</button>
			{/each}
		</div>
		<button
			type="button"
			class="play"
			aria-pressed={playing}
			onclick={() => (playing ? stop() : play())}
		>
			{playing ? 'Pause' : 'Play'}
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
		Same color, same role. Pale washes are client states. The glow marks who each moment is about. Click a map to enlarge it.
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

	.bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		margin-top: 0.85rem;
	}

	.periods {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	button {
		border: 1px solid color-mix(in srgb, var(--ink, #1c1b18) 18%, transparent);
		border-radius: 999px;
		background: transparent;
		color: var(--ink-2, #3a3834);
		cursor: pointer;
		font: inherit;
		font-size: 0.82rem;
		padding: 0.35rem 0.75rem;
	}

	button[aria-selected='true'] {
		background: var(--ink, #1c1b18);
		color: var(--paper, #f6f4ef);
		border-color: transparent;
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

		.play {
			margin-left: 0;
		}
	}
</style>
