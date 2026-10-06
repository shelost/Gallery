<script>
	import Panel from './Panel.svelte';
	import { PROFILE } from './content.js';
	import { linkProps } from './links.js';

	/** The last panel on a page: a balloon with the email, and the smiley as a seal. @type {{ area?: string }} */
	let { area = 'end' } = $props();
</script>

<Panel {area} class="text">
	<p class="balloon small">
		Let's collaborate!
		<a {...linkProps(PROFILE.links[0].href)}>{PROFILE.email}</a>
	</p>
	<img class="mark" src={PROFILE.avatar} alt="" />
	<p class="box">To be continued…</p>
</Panel>

<style>
	.mark {
		position: absolute;
		right: 1rem;
		bottom: 0.9rem;
		width: 64px;
	}
</style>
