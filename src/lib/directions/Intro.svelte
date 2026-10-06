<script>
	import Footer from './Footer.svelte';
	import Stat from './Stat.svelte';
	import { PROFILE } from './content.js';
	import { linkProps } from './links.js';

	/** @type {{ avatar?: boolean, links?: boolean, children?: import('svelte').Snippet }} */
	let { avatar = false, links = false, children } = $props();
</script>

<header class="sfumato" style:--i={0}>
	{#if avatar}
		<img class="avatar" src={PROFILE.avatar} alt="" width="40" height="40" />
	{/if}
	<h1>{PROFILE.name}</h1>
	<p class="role">Designer, engineer, and occasional artist.</p>
</header>

<p class="bio sfumato" style:--i={1}>
	Founding designer at <a {...linkProps('https://stan.store')}>Stan</a>, where we grew from $0 to
	<Stat value={30} prefix="$" suffix="M" /> ARR in three years. Now building a new UX paradigm for
	generative AI. {@render children?.()}
</p>

{#if links}
	<Footer inline i={2} />
{/if}

<style>
	header {
		margin-bottom: 1.75rem;
	}

	.avatar {
		width: 40px;
		height: 40px;
		margin: 0 0 1.25rem -6px;
	}

	h1 {
		font-size: 15px;
		font-weight: 500;
		letter-spacing: -0.02em;
	}

	.role {
		color: var(--ink-3);
	}

	.bio {
		max-width: 33rem;
		color: var(--ink-2);
		text-wrap: pretty;
	}

	.bio a {
		color: var(--ink);
		text-decoration: underline;
		text-decoration-color: var(--rule);
		text-decoration-thickness: 1px;
		text-underline-offset: 3px;
	}

	.bio a:hover {
		text-decoration-color: var(--ink);
	}

	.bio :global(.stat),
	.bio :global(code) {
		color: var(--ink);
	}

	.bio :global(code) {
		font-family: var(--mono);
		font-size: 13px;
	}
</style>
