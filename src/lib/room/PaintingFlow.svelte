<script>
	import { PAINTINGS } from './paintings.js';

	/**
	 * The painting carousel's stage: each painting in its gilt frame, at its own proportions,
	 * the one in the middle facing you and the rest turned away down the wall either side.
	 * Clicking one at the side brings it round.
	 * @type {{ offset: (i: number) => number, go: (i: number) => void }}
	 */
	let { offset, go } = $props();

	/** Each painting turns its own way through this much perspective, so its outline is known. */
	const DEPTH = 1200;
	const TURN = (42 * Math.PI) / 180;
	/** The gilt frame around the canvas, and the even gap left between one frame and the next. */
	const FRAME = 17.6;
	const GAP = 28;

	let wide = $state(0);
	let high = $state(0);
	const tall = $derived(Math.min(high * 0.68, 352));
	/** As tall as the wall allows, unless that would make it wider than half the wall. @param {number} i */
	const height = (i) => Math.min(tall, (wide * 0.5 * PAINTINGS[i].size[1]) / PAINTINGS[i].size[0]);

	const count = PAINTINGS.length;
	const clamp = (/** @type {number} */ value) => Math.max(-1, Math.min(1, value));
	const wrap = (/** @type {number} */ gap) => {
		const round = ((gap % count) + count) % count;
		return round > count / 2 ? round - count : round;
	};
	const shrink = (/** @type {number} */ at) => 1 / (1 + Math.abs(at) * 0.18);

	/**
	 * How far painting `i`, `at` places from the middle, reaches left and right of its centre on
	 * screen once turned and shrunk: the edge swung towards you spreads, the far one draws in.
	 * @param {number} i
	 * @param {number} at
	 */
	function reach(i, at) {
		const [w, h] = PAINTINGS[i].size;
		const half = ((height(i) * w) / h / 2 + FRAME) * shrink(at);
		const angle = clamp(at) * TURN;
		const across = half * Math.cos(Math.abs(angle)) * DEPTH;
		const depth = half * Math.sin(Math.abs(angle));
		const near = across / (DEPTH - depth);
		const far = across / (DEPTH + depth);
		return angle >= 0 ? { left: near, right: far } : { left: far, right: near };
	}

	/**
	 * Where every painting's centre sits with painting `middle` dead in the middle: each one
	 * set beside the last with the same gap between their frames, however wide they are.
	 * @param {number} middle
	 */
	function layout(middle) {
		const x = new Array(count).fill(0);
		for (const side of [1, -1]) {
			let last = middle;
			for (let j = 1; j <= Math.floor((side > 0 ? count : count - 1) / 2); j++) {
				const i = (((middle + side * j) % count) + count) % count;
				const before = reach(last, side * (j - 1));
				const here = reach(i, side * j);
				x[i] = x[last] + side * ((side > 0 ? before.right + here.left : before.left + here.right) + GAP);
				last = i;
			}
		}
		return x;
	}

	/** Between two resting places, every painting slides from where it sat to where it will sit. */
	const centres = $derived.by(() => {
		const along = wrap(-offset(0));
		const from = Math.floor(along);
		const part = along - from;
		const a = layout((((from % count) + count) % count));
		const b = layout((((from + 1) % count) + count) % count);
		return a.map((x, i) => x + (b[i] - x) * part);
	});
</script>

<div class="wall" bind:clientWidth={wide} bind:clientHeight={high}>
	{#each PAINTINGS as painting, i (painting.id)}
		{@const at = offset(i)}
		<button
			type="button"
			class="painting"
			style:height="{height(i)}px"
			style:aspect-ratio={painting.size[0] / painting.size[1]}
			style:transform="translate(-50%, -50%) translateX({centres[i]}px) perspective({DEPTH}px) rotateY({clamp(at) * 42}deg) scale({shrink(at)})"
			style:z-index={10 - Math.round(Math.abs(at) * 2)}
			style:opacity={wide ? Math.max(0, 1.6 - Math.abs(at) * 0.55) : 0}
			aria-label={`${painting.title}, ${painting.by}`}
			tabindex={Math.abs(at) < 0.5 ? -1 : 0}
			onclick={() => go(i)}
		>
			<span class="frame">
				<img src={painting.image} alt="" draggable="false" />
			</span>
		</button>
	{/each}
</div>

<style>
	.wall {
		position: absolute;
		inset: 0;
		overflow: hidden;
		background:
			radial-gradient(ellipse at 50% 42%, rgba(255, 255, 255, 0.9), transparent 62%),
			linear-gradient(#f3efe8, #ebe5da);
	}

	.painting {
		position: absolute;
		top: 46%;
		left: 50%;
		padding: 0;
		cursor: pointer;
	}

	.frame {
		position: absolute;
		inset: -1.1rem;
		padding: 1.1rem;
		background:
			linear-gradient(135deg, #7a5a22, #e7cc84 22%, #a47c34 45%, #f2dd9e 62%, #8a6628 82%, #d9bb6d),
			#b8913f;
		box-shadow:
			inset 0 0 0 2px rgba(60, 40, 10, 0.5),
			inset 0 0 0 0.55rem rgba(255, 240, 200, 0.18),
			0 30px 50px -24px rgba(28, 20, 10, 0.55),
			0 4px 10px rgba(28, 20, 10, 0.18);
	}

	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		box-shadow:
			0 0 0 0.3rem #efe6cf,
			0 0 0 calc(0.3rem + 1px) rgba(60, 40, 10, 0.35),
			inset 0 0 1.5rem rgba(0, 0, 0, 0.4);
		user-select: none;
	}

	.painting:focus-visible {
		outline: none;
	}

	.painting:focus-visible .frame {
		outline: 2px solid var(--accent);
		outline-offset: 4px;
	}
</style>
