<script>
	import { untrack } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import Explainer from './Explainer.svelte';

	/**
	 * @typedef {{ id: string, title: string, by: string, year: string, place: string, note: string, href?: string, wiki?: string }} Entry
	 * @typedef {(i: number) => number} Offset how far an entry is from the middle of the stage,
	 * in places, the short way round: 0 in the middle, negative to the left
	 */

	/**
	 * A character select, the way games have them: one thing at a time in the middle of the
	 * stage with its neighbours waiting either side, arrows and the keyboard to move along, round
	 * and round without end. Whatever is in the middle is the one taken: `onpick` hears each time
	 * it changes. `stage` draws them all, given where each one is; it starts on `active`, and
	 * `kicker` names the lot. The text under the stage keeps one height whatever it says.
	 * @type {{
	 *   entries: Entry[],
	 *   active: string,
	 *   kicker: string,
	 *   onpick: (id: string) => void,
	 *   stage: import('svelte').Snippet<[Offset, (i: number) => void]>
	 * }}
	 */
	let { entries, active, kicker, onpick, stage } = $props();

	const count = $derived(entries.length);
	/** Every step taken, without wrapping, so moving past the end keeps going the same way. It starts on the one taken. */
	let step = $state(untrack(() => Math.max(0, entries.findIndex((entry) => entry.id === active))));
	const index = $derived(((step % count) + count) % count);
	const shown = $derived(entries[index]);

	const place = Tween.of(() => step, { duration: () => (prefersReducedMotion.current ? 0 : 620), easing: cubicOut });

	/** @type {Offset} */
	const offset = (i) => {
		const gap = (((i - place.current) % count) + count) % count;
		return gap > count / 2 ? gap - count : gap;
	};

	/** Steps to `next`, and takes whatever lands in the middle. @param {number} next */
	function move(next) {
		step = next;
		onpick(entries[((next % count) + count) % count].id);
	}

	/** Moves to entry `i` the short way round. @param {number} i */
	function go(i) {
		const gap = (((i - index) % count) + count) % count;
		move(step + (gap > count / 2 ? gap - count : gap));
	}

	/** @param {KeyboardEvent} event */
	function key(event) {
		if (event.defaultPrevented || event.target instanceof HTMLInputElement) return;
		if (event.key === 'ArrowLeft') move(step - 1);
		else if (event.key === 'ArrowRight') move(step + 1);
		else return;
		event.preventDefault();
	}

	const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');
</script>

<svelte:window onkeydown={key} />

<div class="carousel">
	<div class="stage">
		{@render stage(offset, go)}
		<button type="button" class="arrow previous" aria-label="Previous" onclick={() => move(step - 1)}>
			<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M7.5 2.5 4 6l3.5 3.5" /></svg>
		</button>
		<button type="button" class="arrow next" aria-label="Next" onclick={() => move(step + 1)}>
			<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6 4.5 9.5" /></svg>
		</button>
	</div>

	<div class="dots" role="tablist" aria-label="Choose one">
		{#each entries as entry, i (entry.id)}
			<button
				type="button"
				role="tab"
				class={['dot', i === index && 'here']}
				aria-selected={i === index}
				aria-label={entry.title}
				onclick={() => go(i)}
			></button>
		{/each}
	</div>

	<div class="about">
		{#key shown.id}
			<div class="text" in:fade={{ duration: prefersReducedMotion.current ? 0 : 240 }}>
				<Explainer item={{ ...shown, by: [shown.by, shown.place].join(' · ') }} kicker="{pad(index + 1)} / {pad(count)} · {kicker}" action="Read about it" />
			</div>
		{/key}
	</div>
</div>

<style>
	.carousel {
		display: grid;
		gap: 1rem;
		padding: clamp(1.2rem, 3vw, 2.2rem);
	}

	.stage {
		position: relative;
		height: min(30rem, 52dvh);
		margin: calc(-1 * clamp(1.2rem, 3vw, 2.2rem)) calc(-1 * clamp(1.2rem, 3vw, 2.2rem)) 0;
		overflow: hidden;
	}

	.arrow {
		position: absolute;
		top: 50%;
		z-index: 20;
		display: grid;
		place-items: center;
		width: 2.8rem;
		height: 2.8rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.86);
		box-shadow:
			0 0 0 1px rgba(28, 27, 24, 0.08),
			0 10px 24px -12px rgba(28, 27, 24, 0.4);
		backdrop-filter: blur(10px);
		color: var(--ink);
		translate: 0 -50%;
		transition:
			color 160ms var(--ease-out),
			scale 120ms var(--ease-out);
	}

	.arrow:hover {
		color: var(--accent);
	}

	.arrow:active {
		scale: 0.94;
	}

	.previous {
		left: clamp(0.6rem, 2vw, 1.4rem);
	}

	.next {
		right: clamp(0.6rem, 2vw, 1.4rem);
	}

	.arrow svg {
		width: 0.9rem;
		height: 0.9rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.dots {
		display: flex;
		justify-content: center;
		gap: 0.45rem;
	}

	.dot {
		width: 0.5rem;
		height: 0.5rem;
		padding: 0;
		border-radius: 999px;
		background: rgba(28, 27, 24, 0.16);
		transition:
			width 260ms var(--ease-out),
			background-color 200ms var(--ease-out);
	}

	.dot.here {
		width: 1.5rem;
		background: var(--ink);
	}

	/* Every entry's text is stacked in one cell of a fixed height, so a long title or note
	   never makes the sheet taller or shorter while moving along. */
	.about {
		display: grid;
		height: 15rem;
		overflow: hidden;
	}

	.text {
		grid-area: 1 / 1;
		min-width: 0;
	}

	.text :global(h3) {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	.text :global(.note) {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
	}

	@media (max-width: 640px) {
		.stage {
			height: min(22rem, 46dvh);
		}

		.about {
			height: 17rem;
		}
	}
</style>
