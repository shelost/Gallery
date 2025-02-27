<script>
	import Header from './Header.svelte';
	import Navbar from './Navbar.svelte';
	import '../app.css';

	let { children } = $props();
	// 	<Header />

</script>

<div class="app">

	<canvas id = 'canvas'>
	</canvas>

	<Navbar />

	<main>
		{@render children()}
	</main>

</div>

<style lang="scss">

	#canvas{
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: -2;
	}



	.app {
		display: flex;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
