<script>
	import { untrack } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { inView } from './motion.js';
	import { Pond } from './pond.js';

	/**
	 * @type {{
	 *   works: import('./content.js').Work[],
	 *   palette: import('./pond.js').PondPalette,
	 *   active?: string | null,
	 *   onpick: (work: import('./content.js').Work) => void,
	 *   onhover?: (id: string, hovering: boolean) => void
	 * }}
	 */
	let { works, palette, active = null, onpick, onhover } = $props();

	let visible = $state(false);
	let hovered = $state(/** @type {string | null} */ (null));
	/** @type {HTMLElement | undefined} */
	let tags;

	const focus = $derived(hovered ?? active);

	/**
	 * The pond is created once; child effects push the palette, focus, ripples, and play state into it.
	 * @param {HTMLCanvasElement} canvas
	 */
	function pond(canvas) {
		const sim = new Pond(canvas, {
			koi: works.map((work) => ({ id: work.id, featured: work.featured })),
			onhover: (id) => {
				if (hovered) onhover?.(hovered, false);
				hovered = id;
				if (id) onhover?.(id, true);
			},
			onpick: (id) => {
				const work = works.find((entry) => entry.id === id);
				if (work) onpick(work);
			},
			onframe: (anchor) => {
				if (!anchor || !tags) return;
				tags.style.translate = `${anchor.x}px ${anchor.y}px`;
				tags.style.transform = anchor.below ? 'translate(-50%, 10px)' : '';
			}
		});

		$effect(() => {
			sim.setPalette(palette);
		});
		$effect(() => {
			sim.setFocus(focus);
		});
		// A koi hovered in the pond already ripples, so only hovers from outside it pulse.
		$effect(() => {
			if (active && active !== untrack(() => hovered)) sim.pulse(active);
		});
		$effect(() => {
			sim.setMotion(visible, prefersReducedMotion.current);
		});

		return () => sim.destroy();
	}
</script>

<div
	class="pond"
	style:--water={palette.water}
	role="img"
	aria-label="A koi pond. Each koi is one of the works listed alongside."
	{@attach inView((isVisible) => (visible = isVisible))}
>
	<canvas {@attach pond}></canvas>
	<div class="tags" aria-hidden="true" {@attach (node) => void (tags = node)}>
		{#each works as work (work.id)}
			<p class={['tag', work.id === focus && 'shown']}>
				<span class="title">{work.title}</span>
				<span class="kind">{work.kind}</span>
			</p>
		{/each}
	</div>
</div>

<style>
	.pond {
		position: absolute;
		inset: 0;
		overflow: hidden;
		border-radius: inherit;
		background-color: var(--water);
		background-image: radial-gradient(130% 110% at 35% 25%, transparent 45%, rgba(0, 0, 0, 0.07));
		transition: background-color 500ms var(--ease-out);
		animation: surface 400ms var(--ease-out);
	}

	.pond::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		box-shadow:
			inset 0 0 0 1px rgba(0, 0, 0, 0.06),
			inset 0 18px 36px -24px rgba(0, 0, 0, 0.28);
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: manipulation;
	}

	.tags {
		position: absolute;
		top: 0;
		left: 0;
		display: grid;
		pointer-events: none;
		translate: -999px -999px;
		transform: translate(-50%, calc(-100% - 10px));
	}

	.tag {
		grid-area: 1 / 1;
		justify-self: center;
		display: flex;
		align-items: baseline;
		gap: 0.45rem;
		padding: 0.3rem 0.65rem;
		border-radius: 999px;
		font-size: 12px;
		white-space: nowrap;
		background: rgba(252, 251, 248, 0.94);
		box-shadow:
			0 0 0 1px rgba(28, 27, 24, 0.08),
			0 4px 12px -4px rgba(28, 27, 24, 0.18);
		opacity: 0;
		transform: translateY(4px) scale(0.96);
		transform-origin: 50% 100%;
		transition:
			opacity 150ms var(--ease-out),
			transform 150ms var(--ease-out);
	}

	.tag.shown {
		opacity: 1;
		transform: none;
	}

	.title {
		color: var(--ink);
	}

	.kind {
		color: var(--ink-3);
	}

	@keyframes surface {
		from {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pond {
			animation: none;
			transition: none;
		}

		.tag {
			transition: none;
		}
	}
</style>
