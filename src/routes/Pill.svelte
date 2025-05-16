<script>
	import { page } from '$app/stores';
	import logo from '$lib/images/svelte-logo.svg';
	import github from '$lib/images/github.svg';
  	import { goto } from '$app/navigation';
	import { onMount, onDestroy, tick } from 'svelte';
	import { Categories } from '$lib/config';
	import { currentContentCategoryStore } from '$lib/store'; // Ensure this path is correct

	let Pill; // Bound to the #pill div
	let activeTabRouteName = null; // e.g., 'home', 'games'
	let isPillVisible = false;

	// Determine active tab based on URL or content category
	$: {
		const currentPath = $page.url.pathname;
		let newActiveTabRouteName = null;

		// 1. Try direct match with Categories from URL
		const categoryFromUrl = Categories.find(cat =>
			('/' + cat.route === currentPath) || (cat.route === 'home' && currentPath === '/')
		);

		if (categoryFromUrl) {
			newActiveTabRouteName = categoryFromUrl.route;
		} else if ($currentContentCategoryStore) {
			// 2. Try match based on currentContentCategoryStore
			const categoryFromStore = Categories.find(cat => cat.route === $currentContentCategoryStore);
			if (categoryFromStore) {
				newActiveTabRouteName = categoryFromStore.route;
			}
		}
		activeTabRouteName = newActiveTabRouteName;
		// updatePillPositionAndVisibility might be called multiple times initially,
		// but await tick() should help manage DOM updates.
		updatePillPositionAndVisibility();
	}

	async function updatePillPositionAndVisibility() {
		await tick(); // Wait for DOM updates, especially for tab elements

		if (activeTabRouteName) {
			const tabElement = document.getElementById(activeTabRouteName);
			if (tabElement && Pill) {
				const rect = tabElement.getBoundingClientRect();

				Pill.style.left = `${rect.left}px`;
				Pill.style.top = `${rect.top}px`;
				Pill.style.width = `${rect.width}px`;
				Pill.style.height = `${rect.height}px`;
				isPillVisible = true;
			} else {
				isPillVisible = false; // Tab not found or Pill element not ready
			}
		} else {
			isPillVisible = false; // No active category determined
		}

		if (Pill) { // Always update opacity and pointer-events
			Pill.style.opacity = isPillVisible ? '1' : '0';
			Pill.style.pointerEvents = isPillVisible ? 'auto' : 'none';
		}
	}

	onMount(() => {
		// Initial call to position the pill.
		// A small delay can help if Categories or tab elements are not immediately ready/styled.
		setTimeout(updatePillPositionAndVisibility, 50);

		window.addEventListener('resize', updatePillPositionAndVisibility);
	});

	onDestroy(() => {
		window.removeEventListener('resize', updatePillPositionAndVisibility);
	});

	function handleTabClick(targetRoute) {
		if (targetRoute === 'home' || targetRoute === '/') {
			goto('/');
		} else {
			goto('/' + targetRoute);
		}
		// The reactive block will handle pill update due to $page.url.pathname change.
	}

	// Removed old title logic and problematic reactive empty function.
	// let title = $page.url.pathname.slice(1, 2).toUpperCase() + $page.url.pathname.slice(2)
	// $: title = $page.url.pathname.slice(1, 2).toUpperCase() + $page.url.pathname.slice(2)
</script>

<header>
	<nav>
		<div id='pill' bind:this={Pill} style="opacity: {isPillVisible ? 1 : 0}; pointer-events: {isPillVisible ? 'auto' : 'none'};"></div>

		{#each Categories as cat (cat.route)}
			<div id={cat.route} class='tab' class:active={activeTabRouteName === cat.route} on:click={() => handleTabClick(cat.route)}>
				<span style='color: {cat.color}' class='material-icons'>
					{cat.icon}
				</span>
				<h2>
					{cat.text}
				</h2>
			</div>
		{/each}
	</nav>
</header>

<style lang="scss">
	@import 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';

	header {
		display: flex;
		align-items: center;
		justify-content: center;
		position: fixed;
		bottom: 12px;
		left: 0;
		width: 100%;
		z-index: 10;
		margin-top: 10px;
		padding: 0 12px;
		box-sizing: border-box;
	}

	#pill{
		position: fixed; /* Kept as fixed based on original styling */
		width: 40px; /* Default/initial width, will be overridden */
		height: 40px; /* Default/initial height, will be overridden */
		border-radius: 50px;
		background: #6355FF;
		box-shadow: -2px 4px 12px rgba(#030025, 0.5), inset -2px -4px 8px rgba(#030025, 0.25), inset 2px 4px 8px rgba(white, 0.2);
		transition: left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease, opacity 0.3s ease;
		opacity: 0; /* Start hidden */
		pointer-events: none; /* Start non-interactive */
	}

	.corner{
		width: 200px;
		img{
			height: 36px;
		}
	}

	.right{
		display: flex;
		align-items: center;
		justify-content: right;
    }

	.title{
		display: flex;
		align-items: center;
		justify-content: left;
		cursor: pointer;
		z-index: 4;
		gap: 8px;

		h3{
			font-size: 18px;
			font-weight: 650;
			letter-spacing: -.75px;
		}
	}

	nav {
		display: flex;
		justify-content: center;
		position: relative; /* Important if pill were absolute, but pill is fixed */

		padding: 10px 10px 10px 10px;
		border-radius: 26px;
		background: rgba(white, 1);
		box-shadow: -6px 36px 36px rgba(#030025, 0.4), 0 4px 8px rgba(#030025, 0.1), inset -2px -2px 4px rgba(#030025, 0.05), inset 2px 4px 8px rgba(white, 0.2);
		gap: 0px;
		z-index: 2;
	}

	.tab{
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 4; /* Ensure tabs are above the nav's background but below the pill if z-index stacking is complex */
		padding: 8px 14px 9px 14px;
		border-radius: 50px;
		gap: 4px;
		transition: .2s ease; /* For hover effects on tab */

		h2{
			font-size: 15px;
			font-weight: 600;
			letter-spacing: -.4px;
			color: black; /* Default color */
		}
		span{
			font-size: 16px;
			/* color: rgba(black, .25); */ /* Original, but overridden by direct style */
			display: none; /* Original, but overridden by direct style in HTML */
			color: black !important; /* Original */
		}

		&.active{
			h2{
				color: white;
				text-shadow: -2px 6px 8px rgba(black, .6);
			}
			span{
				color: rgba(white, .8) !important;
				filter: drop-shadow( -2px 2px 4px rgba(black, .5));
			}
		}
		&:hover{
			background: rgba(black, .1);
		}
	}

	#logo{
		width: auto;
		height: 28px;
		border-radius: 8px;
		object-fit: contain;
        margin-left: 4px;
        cursor: pointer;
		filter: drop-shadow( -6px 6px 6px rgba(#030025, 0.1));
	}

	#text{
		width: auto;
		height: 20px;
		border-radius: 8px;
	}

	svg {
		width: 2em;
		height: 3em;
		display: none;
	}

	path {
		/* fill: var(--background); */
	}

	li {
		position: relative;
		height: 100%;
	}

	li[aria-current='page'] {
	}

	li[aria-current='page']::before {
		--size: 6px;
		content: '';
		width: 0;
		height: 0;
		position: absolute;
		top: 0px;
		left: calc(50% - var(--size));
		border: var(--size) solid transparent;
		border-top: var(--size) solid var(--color-theme-1);
		transition: .2s ease;
	}

	nav a { /* This style was for <a> tags, not used by current .tab divs */
		font-family: 'Inter', sans-serif;
		display: flex;
		height: 100%;
		align-items: center;
		padding: 0 0.5rem;
		color: var(--color-text);
		font-weight: 600;
		font-size: 14px;
		letter-spacing: -0.25px;
		text-decoration: none;
		transition: color 0.2s linear;
	}

	a:hover { /* This style was for <a> tags */
		color: var(--color-theme-1);
	}
</style>
