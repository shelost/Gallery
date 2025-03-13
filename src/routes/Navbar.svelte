<script>
	import { page } from '$app/state';
	import logo from '$lib/images/svelte-logo.svg';
	import github from '$lib/images/github.svg';
	import { goto } from '$app/navigation';
	import * as Config from '$lib/config.ts'
	import { activeElem, activeObject, Posts } from '$lib/store'
	import { onMount } from 'svelte'
	import { titleCase } from '$lib/utils'
	 import { createEventDispatcher } from 'svelte'

	export let data

	let Pill;

	onMount(() => {

		let left = 12, top = 5

		function updateScroll(){

			let nav = document.getElementById('navbar').getBoundingClientRect()

			if ($activeObject){

				let elem = document.querySelectorAll('.active')[0]
				if (elem && Pill){
					let rect = elem.getBoundingClientRect()
					Pill.style.top = rect.top - nav.top - top + 'px'
					Pill.style.left = rect.left - nav.left - 4 - left + 'px'
					Pill.style.width = rect.width + 20 + 'px'
				}

			}
		}

		window.addEventListener('scroll', updateScroll)
		updateScroll()
	})


	// 	on:click = {() => {goto('/' + link.slug)}}

</script>

<div id = 'navbar'>

	<div id = 'mast' on:click={()=> {goto('/')}}>
		<img src = 'ahnheewon3.png' alt = 'Logo'>
	</div>

	<div id = 'pill' bind:this={Pill} class:hidden={!$activeObject}></div>

	<div id = 'nav'>
		{#each $Posts as link, i}
			{#if i == 0 || i > 0 && link.meta.type != $Posts[i-1].meta.type }
				<div class = 'title'>
					<h1> {titleCase(link.meta.type)} </h1>
				</div>
			{/if}

			<div
				class = 'nav {link.meta.type}'
				class:active = {link.meta.title == $activeObject?.meta.title}
			>
				<h2> {link.meta.title}</h2>
			</div>
		{/each}
	</div>

</div>

<style lang="scss">

	#pill{
		position: absolute;
		background: rgba(black, .8);
		top: 0;
		left: 0;
		height: 28px;
		width: 200px;
		border-radius: 16px;
		box-shadow: 2px 4px 4px rgba(black, .2), inset -1px 2px 2px rgba(white, .25);
		z-index: -2;
		transition: .2s ease;

		&.hidden{
			display: none;
		}
	}

	#navbar{
		position: relative;
		width: 140px;
		height: calc(100vh - 50px);
		height: fit-content;
		padding: 18px;
		z-index: 3;

		margin: 6px;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		align-items: flex-end;

		//border: 2px solid white;
		//background: rgba(white, .8);
		//box-shadow: 10px 20px 40px rgba(#030025, .1);
	}

	h3{
		font-size: 10px;
	}

	#mast{
		margin-bottom: 20px;
		cursor: pointer;
		img{
			height: 20px;
		}
	}

	#nav{
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		.title{
			padding: 3px;
			h1{
				font-size: 14px;
				font-weight: 650;
				letter-spacing: -.3px;
				margin: 8px 0 0px 0;
				color: rgba(#030025, .8);
			}
		}
		.nav{
			width: fit-content;
			padding: 3px;
			padding-left: 8px;
			//border-right: 1.5px solid rgba(#030025, .25);
			transition: .2s ease;
			cursor: pointer;

			h2{
				font-size: 13px;
				font-weight: 500;
				letter-spacing: -.24px;
				margin: 0;
				color: rgba(#030025, .4);
				text-align: right;
				transition: .2s ease;
			}
			&.active{
				padding: 8px 0;
				//margin-right: 4px;
				h2{
					color: white;
					font-weight: 600;
				}

			}
			&:hover{
				h2{
					color: rgba(#030025, .8);
				}
			}

			&.header{
				padding: 0;
				margin-top: 12px;
				margin-bottom: 8px;
				border-left: none;
				h2{
					font-size: 14px;
					font-weight: 700;
				}
			}
		}
	}


	header {
		display: flex;
		justify-content: space-between;
		margin-top: 10px;
	}

	.corner {
		width: 3em;
		height: 3em;
	}

	.corner a {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.corner img {
		width: 2em;
		height: 2em;
		object-fit: contain;
	}

	nav {
		display: flex;
		justify-content: center;
		--background: rgba(255, 255, 255, 0.7);
	}

	path {
		fill: var(--background);
	}

	ul {
		position: relative;
		padding: 0 24px;
		margin: 0;
		height: 40px;
		display: flex;
		justify-content: center;
		align-items: center;
		list-style: none;
		background: var(--background);
		background-size: contain;
		box-shadow: 0 15px 30px rgba(#030025, 0.12);
		border-radius: 40px;
	}

	li {
		position: relative;
		height: 100%;
	}

	li[aria-current='page']::before {
		--size: 6px;
		content: '';
		width: 0;
		height: 0;
		position: absolute;
		top: 0;
		left: calc(50% - var(--size));
		border: var(--size) solid transparent;
		border-top: var(--size) solid var(--color-theme-1);
	}

	nav a {
		display: flex;
		height: 100%;
		align-items: center;
		padding: 0 0.5rem;
		color: var(--color-text);
		font-weight: 700;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		text-decoration: none;
		transition: color 0.2s linear;
	}

	a:hover {
		color: var(--color-theme-1);
	}


	@media screen and (min-width: 1440px){


	}


</style>
