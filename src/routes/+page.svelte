<script>
	import Counter from './Counter.svelte';
	import welcome from '$lib/images/svelte-welcome.webp';
	import welcomeFallback from '$lib/images/svelte-welcome.png';
	import * as Config from '$lib/config.ts'

</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section id = 'page'>


	<section class = 'splash'>
		<h1> Heewon Ahn </h1>
		<h2> Design Engineer </h2>

		<div id = 'search'>
			<input placeholder = 'Search...'>
		</div>

	</section>


	{#each Config.SECTIONS as link, i}
		<section class = 'sec'>
			<h1> {link.title} </h1>
			<h2> {link.subtitle} </h2>
		</section>
	{/each}


</section>

<style lang="scss">

	input{
		font-family: 'Inter', sans-serif;
		font-weight: 500;
		letter-spacing: -.4px;
		border: none;
		background: rgba(white, .8);
		box-shadow: 8px 12px 24px rgba(#030025, .06);
		border: 2px solid white;
		width: 300px;
		padding: 12px 16px;
		border-radius: 50px;
		margin: 28px 0;
		&:focus{
			outline: none;
		}
	}


	.sec{
		padding: 20px 0;
	}

	.splash{
		height: 100vh;

		display: flex;
		flex-direction: column;
		justify-content: center;
	}



	h1{
		font-size: 28px;
		font-weight: 700;
		letter-spacing: -.9px;
		text-align: left;
		margin-bottom: 4px;
	}

	h2{
		font-size: 18px;
		font-weight: 500;
		letter-spacing: -.5px;
		text-align: left;
	}


</style>
