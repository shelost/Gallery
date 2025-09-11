<script>
	import Header from './Header.svelte';
	import Navbar from './Navbar.svelte';
	import { dev } from '$app/environment';
	import { onMount } from 'svelte'
	import { themeColor, animationsEnabled } from '$lib/store'
	import { writable } from 'svelte/store'
	import { fade, fly, scale } from 'svelte/transition'
	import { loading, openDrawer, showHeader } from '$lib/store'
	import { injectAnalytics } from '@vercel/analytics/sveltekit'
	import { page } from '$app/stores';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import '../app.css';

	injectAnalytics({ mode: dev ? 'development' : 'production' });

	let { children } = $props();

	let currentPath = $page.url.pathname;
	let prevRouteId = null;

	let mouseX = -1000, mouseY = -1000; 
    let intensity = .35;
    let radius = 300; 

	themeColor.set('FAFBFD')

	let Bar, Scroll
	let loadingProgress = writable(0);
	let logoMask;
	let percentageText;


</script>


<svelte:head>
	<title>Heewon</title>
	<meta name="description" content="Ahn Heewon's Portfolio" />
	<meta property="og:title" content="Heewon" />
	<link rel="icon" href="/ahwsq.png" />
	<link href="https://fonts.googleapis.com/css2?family=Hedvig+Letters+Serif:opsz@12..24&display=swap" rel="stylesheet">
	<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400..700;1,400..700&family=Inter:wght@100..900&family=Newsreader:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet">

	<link rel="stylesheet" href="https://use.typekit.net/kqx0rwr.css">
</svelte:head>


<div class="app" >


	<canvas id = 'canvas'>
	</canvas>

	{#key $page.url.pathname}
		<main class="main-content">
			{@render children()}
		</main>
	{/key}

</div>



<style lang="scss">


	#dark{
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(black, .7);
		z-index: 5;
		transition: .2s ease;
	}

	.animation-toggle {
		position: fixed;
		bottom: 20px;
		right: 20px;
		padding: 8px 16px;
		background-color: white;
		color: #030025;
		border: 1px solid #030025;
		border-radius: 8px;
		cursor: pointer;
		z-index: 1000;
		font-family: 'Inter', sans-serif;
	}


	#loading{
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: white;
		z-index: 100;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		img{
			height: 100px;
		}
	}

	#scroll{
		position: fixed;
		top: 10px;
		right: 10px;
		width: 12px;
		height: calc(100vh - 28px);
		margin: 12px;
		background: rgba(#030025, .3);
		background: white;
		border-radius: 5px;
		box-shadow: 20px 8px 32px rgba(black, .5);
		z-index: 2;
		overflow: hidden;

		#bar{
			position: absolute;
			top: 0;
			left: 0;
			width: 12px;
			height: 36px;
			background: rgba(#030025, 1);
			border-radius: 5px;
			transition: .1s ease;

			box-shadow: 20px 8px 32px rgba(black, .5), inset 3px 0px 3px rgba(white, .4), inset -2px 0px 2px rgba(white, .9);

			&::after{
				content: '';
				position: absolute;
				bottom: 3px;
				left: 2.25px;
				background: white;
				width: 6px;
				height: 6px;
				border-radius: 4px;
			}
		}
	}


	#canvas{
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: -4;
		display: none;
	}

	.app {
		display: flex;
		position: relative;
		justify-content: center !important;
		align-items:  center !important;
		width: clamp(400px, 100%, 1800px);
		margin: auto;
	}

	main {
		flex: 1;
		width: 100%;
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




</style>
