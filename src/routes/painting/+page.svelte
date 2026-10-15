<script>
	import { resolve } from '$app/paths';

	const shots = [
		{ x: 0.5, y: 0.5, zoom: 1.05, hold: 0 },
		{ x: 0.69, y: 0.3, zoom: 3.2, hold: 4 },
		{ x: 0.66, y: 0.36, zoom: 2.6, hold: 3 },
		{ x: 0.42, y: 0.5, zoom: 2.6, hold: 4 },
		{ x: 0.13, y: 0.5, zoom: 2.6, hold: 4 },
		{ x: 0.5, y: 0.5, zoom: 1.05, hold: 5 }
	];

	const links = ['Collection', 'Exhibitions', 'Visit'];

	/** @param {{ x: number, y: number, zoom: number }} shot */
	function frame({ x, y, zoom }) {
		const edge = 0.5 / zoom;
		/** @param {number} v */
		const pan = (v) => (0.5 - Math.min(Math.max(v, edge), 1 - edge)) * 100;
		return `scale(${zoom}) translate(${pan(x)}%, ${pan(y)}%)`;
	}

	/** @param {HTMLElement} node */
	function camera(node) {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const total = shots.reduce((sum, s) => sum + s.hold, 0);
		let elapsed = 0;
		const keyframes = shots.map((shot) => {
			elapsed += shot.hold;
			return { transform: frame(shot), offset: elapsed / total, easing: 'cubic-bezier(.65,0,.35,1)' };
		});
		const animation = node.animate(keyframes, { duration: total * 1000, iterations: Infinity });
		return () => animation.cancel();
	}
</script>

<svelte:head>
	<title>The Creation — Heewon</title>
	<link rel="preload" as="image" href="/painting/creation-of-adam.jpg" />
</svelte:head>

<section class="hero">
	<div class="stage">
		<img
			{@attach camera}
			src="/painting/creation-of-adam.jpg"
			alt="Michelangelo's Creation of Adam, Sistine Chapel ceiling"
			style:transform={frame(shots[0])}
		/>
	</div>
	<div class="shade"></div>

	<nav>
		<a class="mark" href={resolve('/')}>Heewon</a>
		<ul>
			{#each links as link (link)}
				<li><a href={resolve('/painting')}>{link}</a></li>
			{/each}
		</ul>
		<a class="cta" href={resolve('/')}>Enter</a>
	</nav>

	<div class="copy">
		<h1>You feel the work<br />before it speaks®</h1>
		<p>
			Michelangelo painted a gap of a few centimeters between two fingers and let five centuries
			argue about what crosses it.
		</p>
	</div>

	<small class="credit">Michelangelo Buonarroti, <em>The Creation of Adam</em>, c. 1512</small>
</section>

<style>
	.hero {
		position: fixed;
		inset: 0;
		z-index: 10;
		overflow: hidden;
		background: #0b0b0c;
		color: #fff;
		font-family: 'Inter', sans-serif;
	}

	.stage {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.stage img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		will-change: transform;
		filter: saturate(1.05) contrast(1.04);
	}

	.shade {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(to top, rgb(0 0 0 / 0.75), transparent 45%),
			radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.35));
		pointer-events: none;
	}

	nav {
		position: absolute;
		top: 16px;
		left: 50%;
		translate: -50% 0;
		width: min(1200px, calc(100% - 32px));
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 8px 8px 24px;
		border-radius: 14px;
		background: rgb(255 255 255 / 0.08);
		border: 1px solid rgb(255 255 255 / 0.14);
		backdrop-filter: blur(18px) saturate(1.4);
		-webkit-backdrop-filter: blur(18px) saturate(1.4);
	}

	nav a {
		color: inherit;
		text-decoration: none;
		font-size: 13px;
	}

	nav a:hover {
		text-decoration: none;
		opacity: 0.7;
	}

	.mark {
		font-family: 'Hedvig Letters Serif', serif;
		font-size: 18px;
		letter-spacing: 0.04em;
	}

	ul {
		display: flex;
		gap: 40px;
		margin: 0;
		padding: 0;
		list-style: none;
		opacity: 0.85;
	}

	.cta {
		padding: 9px 18px;
		border-radius: 9px;
		background: #fff;
		color: #111;
		font-weight: 500;
	}

	.copy {
		position: absolute;
		left: clamp(20px, 3vw, 48px);
		bottom: clamp(32px, 7vh, 72px);
		max-width: 560px;
		animation: rise 1.4s cubic-bezier(0.2, 0.7, 0.2, 1) both 0.3s;
	}

	h1 {
		margin: 0 0 20px;
		font-size: clamp(36px, 5.2vw, 68px);
		font-weight: 400;
		line-height: 1.04;
		letter-spacing: -0.02em;
		text-align: left;
		color: #fff;
	}

	.copy p {
		margin: 0;
		max-width: 380px;
		font-size: 14px;
		line-height: 1.5;
		color: rgb(255 255 255 / 0.8);
	}

	.credit {
		position: absolute;
		right: clamp(20px, 3vw, 48px);
		bottom: clamp(32px, 7vh, 72px);
		font-size: 11px;
		opacity: 0.6;
	}

	@keyframes rise {
		from {
			opacity: 0;
			translate: 0 24px;
		}
	}

	@media (max-width: 640px) {
		ul,
		.credit {
			display: none;
		}
	}
</style>
