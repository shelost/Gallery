<script module>
	const NODE_W = 34;
	const NODE_H = 16;

	const NODES = [
		{ id: 'prompt', x: 6, y: 6, label: 'prompt' },
		{ id: 'image', x: 6, y: 36, label: 'image' },
		{ id: 'model', x: 63, y: 26, label: 'model', accent: true },
		{ id: 'draft', x: 120, y: 6, label: 'draft' },
		{ id: 'final', x: 120, y: 50, label: 'final' }
	];

	const EDGES = [
		['prompt', 'model'],
		['image', 'model'],
		['model', 'draft'],
		['model', 'final']
	];

	/** @param {string} from @param {string} to */
	function edgePath(from, to) {
		const a = NODES.find((node) => node.id === from);
		const b = NODES.find((node) => node.id === to);
		if (!a || !b) return '';
		const x1 = a.x + NODE_W;
		const y1 = a.y + NODE_H / 2;
		const x2 = b.x;
		const y2 = b.y + NODE_H / 2;
		const bend = (x2 - x1) / 2;
		return `M${x1} ${y1} C${x1 + bend} ${y1} ${x2 - bend} ${y2} ${x2} ${y2}`;
	}
</script>

<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { inView } from './motion.js';

	/**
	 * @type {{
	 *   media: import('./content.js').Media | null | undefined,
	 *   playing?: boolean,
	 *   fit?: 'cover' | 'contain',
	 *   title?: string,
	 *   class?: string
	 * }}
	 */
	let { media, playing, fit, title = '', class: className = '' } = $props();

	let visible = $state(false);

	const active = $derived((playing ?? visible) && !prefersReducedMotion.current);
	const objectFit = $derived(fit ?? media?.fit ?? 'cover');

	/** @param {HTMLVideoElement} video */
	function playback(video) {
		if (active) video.play().catch(() => {});
		else video.pause();
	}
</script>

<div
	class={['media', className]}
	style:--fit={objectFit}
	{@attach inView((isVisible) => (visible = isVisible), { threshold: 0.35 })}
>
	{#if !media}
		<div class="card">
			<span>{title}</span>
		</div>
	{:else if media.kind === 'image'}
		<img src={media.src} alt={media.alt ?? ''} loading="lazy" decoding="async" />
	{:else if media.kind === 'video'}
		<video
			src={media.src}
			poster={media.poster}
			aria-label={media.alt}
			muted
			loop
			playsinline
			preload="none"
			{@attach playback}
		></video>
	{:else}
		<svg class="graph" viewBox="0 0 160 90" role="img" aria-label={media.alt ?? 'Node graph'}>
			{#each EDGES as [from, to] (from + to)}
				<path class="edge" d={edgePath(from, to)} pathLength="1" />
				<path class="pulse" d={edgePath(from, to)} pathLength="1" />
			{/each}
			{#each NODES as node (node.id)}
				<g class={['node', node.accent && 'accent']} transform="translate({node.x} {node.y})">
					<rect width={NODE_W} height={NODE_H} rx="3" />
					<text x={NODE_W / 2} y={NODE_H / 2 + 2.6}>{node.label}</text>
				</g>
			{/each}
		</svg>
	{/if}
</div>

<style>
	.media {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: var(--media-bg, var(--paper-2, #ece9e1));
	}

	img,
	video {
		width: 100%;
		height: 100%;
		object-fit: var(--fit);
	}

	.card {
		display: grid;
		place-items: center;
		height: 100%;
		padding: 1.5rem;
		text-align: center;
	}

	.card span {
		font-family: var(--serif, Georgia, serif);
		font-size: clamp(1.25rem, 3vw, 2rem);
		font-style: italic;
		line-height: 1.1;
		color: var(--ink-2, #5d5950);
	}

	.graph {
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		padding: 8%;
		color: var(--graph-ink, var(--ink, #1c1b18));
	}

	.edge {
		fill: none;
		stroke: currentColor;
		stroke-width: 0.8;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		opacity: 0.55;
		animation: draw 900ms cubic-bezier(0.23, 1, 0.32, 1) 120ms forwards;
	}

	.pulse {
		fill: none;
		stroke: var(--graph-accent, var(--sanguine, #a8432b));
		stroke-width: 1.4;
		stroke-linecap: round;
		stroke-dasharray: 0.06 0.94;
		stroke-dashoffset: 1;
		animation: flow 2.4s linear 1s infinite;
	}

	.node rect {
		fill: var(--graph-fill, var(--paper, #f6f4ef));
		stroke: currentColor;
		stroke-width: 0.8;
	}

	.node.accent rect {
		stroke: var(--graph-accent, var(--sanguine, #a8432b));
	}

	.node text {
		font-family: var(--mono, ui-monospace, monospace);
		font-size: 5.6px;
		text-anchor: middle;
		fill: currentColor;
		letter-spacing: 0.02em;
	}

	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes flow {
		to {
			stroke-dashoffset: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.edge {
			animation: none;
			stroke-dashoffset: 0;
		}

		.pulse {
			display: none;
		}
	}
</style>
