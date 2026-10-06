<script>
	import { PROFILE } from './content.js';
	import { linkProps } from './links.js';

	/** @type {{ i?: number, inline?: boolean }} `i` is the position in the page's sfumato stagger; `inline` drops the rule for use inside the intro. */
	let { i = 0, inline = false } = $props();
</script>

<svelte:element
	this={inline ? 'nav' : 'footer'}
	class={['links', 'sfumato', inline && 'inline']}
	style:--i={i}
	aria-label={inline ? 'Elsewhere' : undefined}
>
	{#each PROFILE.links as link (link.href)}
		<a {...linkProps(link.href)} title={link.handle}>{link.label}</a>
	{/each}
</svelte:element>

<style>
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.25rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--rule);
		color: var(--ink-3);
	}

	.inline {
		padding-top: 1.1rem;
		border-top: 0;
	}

	a {
		transition: color 160ms var(--ease-out);
	}

	a:hover {
		color: var(--accent);
	}
</style>
