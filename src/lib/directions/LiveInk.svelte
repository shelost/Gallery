<script>
	import { BRUSHES, InkCanvas } from 'sveltebrush';
	import 'sveltebrush/paper.css';
	import { linkProps } from './links.js';

	/**
	 * Sveltebrush, live: a sheet of hanji that writes a phrase when it comes into view, and that
	 * anyone with a mouse or pen can draw on. Write starts the next phrase.
	 * @type {{ href: string, demo?: string }}
	 */
	let { href, demo } = $props();

	const PHRASES = ['永', '바람', '風林火山', '사랑해', '一期一會'];
	const PADDING = { top: 22, right: 96, bottom: 22, left: 22 };

	/** @type {ReturnType<typeof InkCanvas> | undefined} */
	let canvas = $state();
	let next = 0;

	function write() {
		canvas?.clear();
		canvas?.write(PHRASES[next++ % PHRASES.length], { padding: PADDING, maxCell: 170 });
	}

	/** The first phrase waits until the sheet is in view. @param {HTMLElement} node */
	function onview(node) {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				observer.disconnect();
				write();
			},
			{ threshold: 0.6 }
		);
		observer.observe(node);
		return () => observer.disconnect();
	}
</script>

<div class="live sb-paper" {@attach onview}>
	<InkCanvas bind:this={canvas} brush={BRUSHES[0]} infinite timelapse={false} />
	<div class="actions">
		<button type="button" onclick={write}>Write</button>
		<a {...linkProps(href)}>GitHub ↗</a>
		{#if demo}
			<a {...linkProps(demo)}>Demo ↗</a>
		{/if}
	</div>
</div>

<style>
	.live {
		position: absolute;
		inset: 0;
	}

	.live :global(.ink-canvas) {
		cursor: crosshair;
	}

	/* Fingers scroll the page here; only a mouse or pen draws. */
	@media (pointer: coarse) {
		.live :global(.ink-canvas) {
			pointer-events: none;
		}
	}

	.actions {
		position: absolute;
		top: 0.6rem;
		right: 0.6rem;
		display: grid;
		gap: 0.3rem;
		justify-items: end;
	}

	.actions button,
	.actions a {
		padding: 0.25rem 0.6rem;
		border: 1px solid rgb(30 24 19 / 0.16);
		border-radius: 999px;
		background: rgb(255 255 255 / 0.55);
		color: #2a221b;
		font: inherit;
		font-size: 0.72rem;
		text-decoration: none;
		cursor: pointer;
		transition: background-color 160ms var(--ease-out);
	}

	.actions button:hover,
	.actions a:hover {
		background: rgb(255 255 255 / 0.9);
	}
</style>
