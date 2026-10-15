<script>
	import { onMount } from 'svelte';
	import { withViewTransition } from './motion.js';

	/** Mirrors `data-theme` on <html>, which the inline script in app.html sets before paint. */
	let dark = $state(false);

	onMount(() => {
		dark = document.documentElement.dataset.theme === 'dark';
	});

	function apply() {
		dark = !dark;
		const theme = dark ? 'dark' : 'light';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('theme', theme);
		} catch {
			// Private mode: the choice just lasts for this page.
		}
	}

	function toggle() {
		const root = document.documentElement;
		root.classList.add('theme-shift');
		withViewTransition(apply).then(() => root.classList.remove('theme-shift'));
	}
</script>

<button
	class="theme"
	type="button"
	onclick={toggle}
	aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
	aria-pressed={dark}
>
	<svg viewBox="0 0 24 24" aria-hidden="true">
		{#if dark}
			<circle cx="12" cy="12" r="4.5" />
			<path
				d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"
			/>
		{:else}
			<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
		{/if}
	</svg>
</button>

<style>
	.theme {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 95;
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		background: color-mix(in srgb, var(--paper) 80%, transparent);
		backdrop-filter: blur(8px);
		box-shadow: 0 0 0 1px var(--rule);
		color: var(--ink-2);
		transition:
			color 160ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.theme:hover {
		color: var(--ink);
	}

	.theme:active {
		transform: scale(0.94);
	}

	:global(.theme-shift::view-transition-old(root)),
	:global(.theme-shift::view-transition-new(root)) {
		animation-duration: 480ms;
		animation-timing-function: cubic-bezier(0.65, 0, 0.35, 1);
	}

	svg {
		width: 16px;
		height: 16px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
