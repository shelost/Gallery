<script>
	import { onMount } from 'svelte';

	/**
	 * A floating bar of the page's sections. The highlight slides to whichever section the reader
	 * has scrolled to, a fainter marker follows the label under the pointer, and clicking a label
	 * scrolls there.
	 * @type {{ items: { id: string, label: string }[] }}
	 */
	let { items } = $props();

	/** How far below the top of the viewport a section counts as reached. */
	const REACH = 200;

	let active = $state(0);
	let left = $state(0);
	let width = $state(0);

	/** The hovered label, or -1. The marker appears in place rather than sliding in from wherever it last was. */
	let hovered = $state(-1);
	let hoverLeft = $state(0);
	let hoverWidth = $state(0);
	let arriving = $state(false);

	/** @param {number} i */
	function hover(i) {
		const button = buttons[i];
		if (!button) return;
		arriving = hovered === -1;
		hovered = i;
		hoverLeft = button.offsetLeft;
		hoverWidth = button.offsetWidth;
	}

	/** @type {HTMLElement | undefined} */
	let bar = $state();
	/** @type {HTMLButtonElement[]} */
	const buttons = $state([]);

	/** Set while a click is scrolling the page, so the passing sections don't steal the highlight. */
	let jumping = false;
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let settle;

	function measure() {
		const button = buttons[active];
		if (!button || !bar) return;
		left = button.offsetLeft;
		width = button.offsetWidth;
		bar.scrollTo({ left: button.offsetLeft - (bar.clientWidth - button.offsetWidth) / 2, behavior: 'smooth' });
	}

	function track() {
		if (jumping) return;
		for (let i = items.length - 1; i >= 0; i--) {
			const section = document.getElementById(items[i].id);
			if (section && section.getBoundingClientRect().top <= REACH) {
				active = i;
				return;
			}
		}
		active = 0;
	}

	/** @param {number} i */
	function jump(i) {
		active = i;
		jumping = true;
		document.getElementById(items[i].id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		clearTimeout(settle);
		settle = setTimeout(() => (jumping = false), 1000);
	}

	$effect(measure);

	onMount(() => {
		track();
		return () => clearTimeout(settle);
	});
</script>

<svelte:window onscroll={track} onresize={measure} />

<nav class="sections" aria-label="Sections" bind:this={bar} onpointerleave={() => (hovered = -1)}>
	<span
		class={['hover', hovered !== -1 && 'shown', arriving && 'arriving']}
		style:left="{hoverLeft}px"
		style:width="{hoverWidth}px"
		aria-hidden="true"
	></span>
	<span class="highlight" style:left="{left}px" style:width="{width}px" aria-hidden="true"></span>
	{#each items as item, i (item.id)}
		<button
			type="button"
			class={[i === active && 'on']}
			aria-current={i === active ? 'true' : undefined}
			bind:this={buttons[i]}
			onclick={() => jump(i)}
			onpointerenter={() => hover(i)}
			onfocus={() => hover(i)}
			onblur={() => (hovered = -1)}
		>
			{item.label}
		</button>
	{/each}
</nav>

<style>
	.sections {
		position: fixed;
		left: 50%;
		bottom: 16px;
		z-index: 90;
		display: flex;
		gap: 4px;
		max-width: calc(100vw - 24px);
		padding: 4px;
		overflow-x: auto;
		scrollbar-width: none;
		transform: translateX(-50%);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 28px;
		background: rgba(0, 0, 0, 0.9);
		box-shadow: -12px 32px 48px rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
	}

	.sections::-webkit-scrollbar {
		display: none;
	}

	.highlight,
	.hover {
		position: absolute;
		top: 4px;
		bottom: 4px;
		border-radius: 22px;
		transition:
			left 300ms cubic-bezier(0.4, 0, 0.2, 1),
			width 300ms cubic-bezier(0.4, 0, 0.2, 1),
			opacity 200ms ease;
	}

	.highlight {
		background: var(--accent);
		box-shadow: 0 2px 10px rgba(255, 0, 76, 0.4);
	}

	.hover {
		background: rgba(255, 255, 255, 0.14);
		opacity: 0;
		transition-duration: 220ms, 220ms, 200ms;
	}

	.hover.shown {
		opacity: 1;
	}

	.hover.arriving {
		transition-property: opacity;
	}

	button {
		position: relative;
		margin: 0;
		padding: 10px 18px;
		border: none;
		border-radius: 40px;
		background: transparent;
		box-shadow: none;
		font-family: var(--sans);
		font-size: 15px;
		font-weight: 300;
		letter-spacing: -0.03em;
		line-height: 1;
		white-space: nowrap;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		transition: color 200ms ease;
	}

	button:hover {
		opacity: 1;
		color: #fff;
	}

	button.on {
		color: #fff;
	}

	@media (max-width: 768px) {
		.sections {
			bottom: 8px;
		}

		button {
			padding: 9px 12px;
			font-size: 13px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.highlight,
		.hover {
			transition: none;
		}
	}
</style>
