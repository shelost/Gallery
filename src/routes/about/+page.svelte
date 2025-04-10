<script>
	import { onMount } from 'svelte';
	import { fly, crossfade } from 'svelte/transition';

	const [send, receive] = crossfade({
		duration: 100,
		fallback: fly
	});


	let visible = false;

	onMount(() => {
		visible = true;
	});

	// transition:fly={{y: 50, duration: 100}}

</script>


<svelte:head>
	<title>About Heewon</title>
	<meta name="description" content="About Heewon, a software engineer and designer" />
</svelte:head>

<div class="text-column" in:fly={{y: 50, duration: 100, delay: 100}}  out:fly={{y: -50, duration: 100}}>
	<h1>
		About Me
	</h1>

	<p>
		Hi! My name is Heewon, and I'm a Design Engineer based in Ithaca, NY.
	</p>

	<p>
		I was briefly at <a href="https://cornell.edu">Cornell</a>, before joining <a href="https://stan.store">Stan</a> as its Founding Designer.

	</p>

	<p>
		Since then, I've been working on many projects & freelancing for early-stage startups.
	</p>
</div>

<style lang="scss">

	.text-column{
		padding: 100px 0;
		width: 100%;
		max-width: 600px;
		margin: auto;
	}

	h1{
		margin: 40px 0;
		letter-spacing: -.25px;
	}

	p{
		font-size: 14px;
		font-weight: 450;
		letter-spacing: -0.35px;
		margin: 8px 0;
	}

</style>
