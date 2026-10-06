<script>
	import Footer from '$lib/directions/Footer.svelte';
	import Intro from '$lib/directions/Intro.svelte';
	import WorkGroups from '$lib/directions/WorkGroups.svelte';
	import { GROUPS } from '$lib/directions/content.js';
</script>

<svelte:head>
	<title>Index · Heewon Ahn</title>
</svelte:head>

<main class="index">
	<Intro avatar>I really like the <code>&lt;canvas&gt;</code> element.</Intro>

	<div class="groups">
		<WorkGroups groups={GROUPS} offset={2} />
	</div>

	<Footer i={GROUPS.length + 2} />
</main>

<style>
	.index {
		max-width: 36rem;
		margin: 0 auto;
		padding: clamp(4rem, 12vh, 8rem) 1.5rem 9rem;
	}

	.groups {
		margin-top: 3.5rem;
	}

	@media (min-width: 1180px) {
		.index {
			margin-left: calc(50% - 28rem);
		}
	}
</style>
