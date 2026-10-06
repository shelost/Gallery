<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { DIRECTIONS } from './content.js';

	const hub = $derived(page.url.pathname === '/directions');
	const index = $derived(DIRECTIONS.findIndex((direction) => direction.href === page.url.pathname));

	/** @param {KeyboardEvent} event */
	function onkeydown(event) {
		if (event.key !== '[' && event.key !== ']') return;
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		const target = /** @type {HTMLElement} */ (event.target);
		if (target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
		const step = event.key === ']' ? 1 : -1;
		const next =
			index < 0
				? step > 0
					? 0
					: DIRECTIONS.length - 1
				: (index + step + DIRECTIONS.length) % DIRECTIONS.length;
		goto(resolve(/** @type {any} */ (DIRECTIONS[next].href)));
	}
</script>

<svelte:window {onkeydown} />

<nav class="switcher" aria-label="Portfolio directions">
	<a href={resolve('/directions')} class={['all', hub && 'on']} aria-current={hub ? 'page' : undefined}>All</a>
	{#each DIRECTIONS as direction, i (direction.slug)}
		<a
			href={resolve(/** @type {any} */ (direction.href))}
			class={[i === index && 'on']}
			aria-current={i === index ? 'page' : undefined}
			title={direction.tagline}
		>
			<span class="num">{direction.numeral}</span>
			<span class="name">{direction.name}</span>
		</a>
	{/each}
</nav>

<style>
	.switcher {
		position: fixed;
		left: 50%;
		bottom: 18px;
		z-index: 90;
		display: flex;
		gap: 2px;
		padding: 4px;
		transform: translateX(-50%);
		border-radius: 999px;
		background: rgba(24, 23, 21, 0.86);
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.06) inset,
			0 10px 30px rgba(20, 16, 10, 0.18);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		view-transition-name: switcher;
	}

	a {
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
		padding: 6px 12px 7px;
		border-radius: 999px;
		font-family: var(--sans);
		font-size: 12.5px;
		font-weight: 400;
		letter-spacing: -0.01em;
		color: rgba(246, 244, 239, 0.62);
		white-space: nowrap;
		transition: color 150ms var(--ease-out);
	}

	a:hover {
		color: rgba(246, 244, 239, 0.95);
	}

	a.on {
		background: #f6f4ef;
		color: #1c1b18;
	}

	.num {
		font-family: var(--serif);
		font-size: 14px;
		line-height: 1;
	}

	@media (max-width: 640px) {
		.name {
			display: none;
		}

		a {
			padding: 6px 10px 7px;
		}
	}
</style>
