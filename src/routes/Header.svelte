<script>
	import { page } from '$app/state';
	import logo from '$lib/images/svelte-logo.svg';
	import github from '$lib/images/github.svg';
  	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
  	import { formatDate } from '$lib/utils';

    let Pill

	function switchPage(page) {
		let tab = document.getElementById(page);
		if (tab){
			let rect = tab.getBoundingClientRect();

			/*
			if (Pill) {
				Pill.style.left = `${rect.left}px`;
				Pill.style.top = `${rect.top}px`;
				Pill.style.width = `${rect.width}px`;
				Pill.style.height = `${rect.height}px`;
			}
			*/
		}
		if (page === 'home' || page === '/') {
			goto('/')
		} else {
			goto('/' + page)
		}
	}


	let title = page.url.pathname.slice(1, 2).toUpperCase() + page.url.pathname.slice(2)
	$: title = page.url.pathname.slice(1, 2).toUpperCase() + page.url.pathname.slice(2)

	$: () => {
		let active = document.querySelector('.active')[0]
	}

</script>

<header>
	<div class="corner title" on:click={() => {switchPage('home')}}>
		<img id = 'logo' src='ahww.svg' alt="Logo" />
		<h3>
			{page.url.pathname.slice(1, 2).toUpperCase() + page.url.pathname.slice(2)}
		</h3>
	</div>


	<nav>
		<div class = 'tab' on:click={() => {goto('/games')}}>
			<h2>Games</h2>
		</div>

		<div class = 'tab' on:click={() => {goto('/design')}}>
			<h2>Design</h2>
		</div>

		<div class = 'tab' on:click={() => {goto('/blog')}}>
			<h2>Blog</h2>
		</div>

		<div class = 'tab' on:click={() => {goto('/comics')}}>
			<h2>Comics</h2>
		</div>

		<div class = 'tab' on:click={() => {goto('/apps')}}>
			<h2>Apps</h2>
		</div>
	</nav>

	<div class = 'corner right'>

		<div class = 'time'>
			<h2>
				{new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: true}).replace(/^0/, '').replace(/:0/, ':').replace(/^0/, '')}
			</h2>

			<h2>
				{new Date().toLocaleDateString([], {month: '2-digit', day: '2-digit', year: 'numeric'}).replace(/\//g, '.').replace(/^0/, '').replace(/\.0/g, '.').replace(/^0/, '').replace(/\.0/g, '.')}
			</h2>
		</div>
	</div>

</header>

<style lang="scss">

	@import 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';


	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		z-index: 10;
		height: 48px;
		padding: 0 8px;
		box-sizing: border-box;
		color: white;
		background: #121223;
	}

	#pill{
		position: fixed;
		width: 40px;
		height: 40px;
		top: -40px;
		left: 50%;
		border-radius: 50px;
		background: #6355FF;
		box-shadow: -2px 4px 12px rgba(#030025, 0.5), inset -2px -4px 8px rgba(#030025, 0.25), inset 2px 4px 8px rgba(white, 0.2);
		transition: .2s ease;
	}


	.corner{
		width: 200px;

		img{
			height: 36px;
		}

	}

	.time{
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		h2{
			font-size: 16px;
			font-weight: 600;
			letter-spacing: -.4px;
		}
	}

	.right{
       // display: none;
	   	display: flex;
		align-items: center;
		justify-content: right;
    }


	nav {
		display: flex;
		justify-content: center;
		position: relative;

		padding: 5px 5px;
		border-radius: 50px;
		color: rgba(white, .9);
		gap: 0px;
		z-index: 2;

		a{
			border: none;
			border-radius: 4px;

		}

	}


	.tab{
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 4;
		padding: 7px 12px 8px 12px;
		border-radius: 50px;
		gap: 4px;
		transition: .2s ease;
		cursor: pointer;

		h2{
			font-size: 14px;
			font-weight: 400;
			letter-spacing: -.1px;
			color: rgba(white, .5);
			transition: .2s ease;
		}
		span{
			font-size: 16px;
			color: rgba(black, .25);
			display: none;
			color: black !important;
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
			h2{
				color: rgba(white, .75);
			}
		}
	}



	.title{
		display: flex;
		align-items: center;
		justify-content: left;
		cursor: pointer;
		z-index: 4;
		gap: 4px;

		h3{
			font-size: 16px;
			font-weight: 300;
			letter-spacing: 0px;
			color: rgba(white, .6);
		}
	}

	#logo{
		width: auto;
		height: 22px;
		border-radius: 8px;
		object-fit: contain;
        margin-bottom: 2px;
        cursor: pointer;
		filter: drop-shadow( -6px 6px 6px rgba(#030025, 0.1));
	}

	#text{
		width: auto;
		height: 20px;
		border-radius: 8px;
		display: none;
	}

	svg {
		width: 2em;
		height: 3em;
		display: none;
	}

	path {
		//fill: var(--background);
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

	a:hover {
		color: var(--color-theme-1);
	}
</style>
