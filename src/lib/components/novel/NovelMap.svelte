<script>
	import { onMount } from 'svelte';

	let { location = 'silla', year = 632 } = $props();

	let dotEl = $state(null);
	let labelEl = $state(null);
	let gsapRef = $state(null);

	// Coordinates calibrated from real lat/lon against the SVG's geographic projection:
	// Reference: Gyeongju (35.85°N, 129.26°E) = SVG (60.5%, 67.7%)
	// Latitude scale: 67.1 SVG units per degree (Y inverted)
	// Longitude scale: 29.8 SVG units per degree
	const LOCATIONS = {
		silla:        { x: 60.5, y: 67.7, label: 'Silla (Gyeongju)',       color: '#75EC68' },
		baekje:       { x: 48.7, y: 64.3, label: 'Baekje (Sabi)',          color: '#FFE08F' },
		goguryeo:     { x: 42.9, y: 42.4, label: 'Goguryeo (Pyongyang)',   color: '#FF7E7E' },
		pyongyang:    { x: 42.9, y: 42.4, label: 'Pyongyang',              color: '#FF7E7E' },
		tang:         { x:  8.0, y: 79.7, label: "Tang (Chang'an)",        color: '#c9a227' },
		yamato:       { x: 93.3, y: 76.9, label: 'Yamato (Nara)',          color: '#e07b53' },
		ansi:         { x: 28.0, y: 28.4, label: 'Ansi Fortress',          color: '#FF7E7E' },
		daeya:        { x: 55.0, y: 69.9, label: 'Daeya Fortress',         color: '#75EC68' },
		hwangsanbul:  { x: 49.6, y: 65.0, label: 'Hwangsanbul (Nonsan)',   color: '#d4564e' },
		sabi:         { x: 48.7, y: 64.3, label: 'Sabi (Buyeo)',           color: '#FFE08F' },
		baekgang:     { x: 47.7, y: 66.5, label: 'Baekgang (Geum River)',  color: '#2e86ab' },
		mt_jupil:     { x: 30.0, y: 24.5, label: 'Mt. Jupil (Liaodong)',   color: '#FF7E7E' },
		sasu:         { x: 36.7, y: 34.6, label: 'Sasu River',             color: '#FF7E7E' },
		stele:        { x: 45.1, y: 25.5, label: "Gwanggaeto Stele (Ji'an)", color: '#FF7E7E' },
		salsu:        { x: 41.7, y: 37.0, label: 'Salsu River',            color: '#FF7E7E' },
	};

	let prevLocation = 'silla';

	onMount(async () => {
		const gsapModule = await import('gsap');
		gsapRef = gsapModule.gsap;
	});

	$effect(() => {
		if (!gsapRef || !dotEl || !labelEl) return;
		const loc = LOCATIONS[location] || LOCATIONS.silla;

		gsapRef.to(dotEl, {
			left: `${loc.x}%`,
			top: `${loc.y}%`,
			duration: prevLocation !== location ? 0.8 : 0,
			ease: 'power2.inOut',
		});

		gsapRef.to(dotEl, {
			'--dot-color': loc.color,
			duration: 0.3,
		});

		labelEl.textContent = loc.label;
		labelEl.style.color = loc.color;

		prevLocation = location;
	});
</script>

<aside class="novel-map" aria-label="Story location map">
	<div class="novel-map__year">{year} AD</div>
	<div class="novel-map__frame">
		<img
			src="/samhan/three_kingdoms_map.svg"
			alt="Map of the Three Kingdoms of Korea"
			class="novel-map__img"
			draggable="false"
		/>
		<div class="novel-map__dot" bind:this={dotEl}>
			<span class="novel-map__pulse"></span>
		</div>
	</div>
	<p class="novel-map__label" bind:this={labelEl}>Silla</p>
</aside>

<style lang="scss">
	.novel-map {
		position: fixed;
		right: max(16px, env(safe-area-inset-right, 0px));
		top: max(16px, env(safe-area-inset-top, 0px));
		z-index: 40;
		width: 160px;
		pointer-events: none;
		display: none;

		@media (min-width: 1280px) {
			display: block;
		}

		@media (min-width: 1600px) {
			width: 190px;
		}
	}

	.novel-map__year {
		text-align: center;
		font-family: 'DM Sans', 'Inter', sans-serif;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		color: var(--novel-text, #e2dff0);
		margin-bottom: 6px;
		font-variant-numeric: tabular-nums;
	}

	.novel-map__frame {
		position: relative;
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
		background: rgba(246, 237, 225, 0.95);
		box-shadow:
			0 4px 24px rgba(14, 10, 51, 0.08),
			0 0 0 1px rgba(14, 10, 51, 0.06);
		backdrop-filter: blur(8px);
	}

	.novel-map__img {
		display: block;
		width: 100%;
		height: auto;
		user-select: none;
		-webkit-user-drag: none;
	}

	.novel-map__dot {
		--dot-color: #75EC68;
		position: absolute;
		left: 60.5%;
		top: 67.7%;
		width: 12px;
		height: 12px;
		transform: translate(-50%, -50%);
		z-index: 2;

		&::before {
			content: '';
			position: absolute;
			inset: 0;
			border-radius: 50%;
			background: var(--dot-color);
			box-shadow: 0 0 8px var(--dot-color);
		}
	}

	.novel-map__pulse {
		position: absolute;
		inset: -6px;
		border-radius: 50%;
		border: 2px solid var(--dot-color);
		opacity: 0.5;
		animation: mapPulse 2s ease-out infinite;
	}

	@keyframes mapPulse {
		0% {
			transform: scale(1);
			opacity: 0.5;
		}
		100% {
			transform: scale(2.5);
			opacity: 0;
		}
	}

	.novel-map__label {
		text-align: center;
		font-family: 'DM Sans', 'Inter', sans-serif;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #75EC68;
		margin: 8px 0 0;
		transition: color 0.3s;
	}
</style>
