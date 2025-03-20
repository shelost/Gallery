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
	import "material-icons/iconfont/material-icons.css";

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
					Pill.style.left = rect.left - nav.left - left + 4 + 'px'
					Pill.style.height = rect.height + 'px'
				}
			}
		}

		window.addEventListener('scroll', updateScroll)
		updateScroll()
	})

</script>

<div id = 'navbar'>

	<div id = 'mast' on:click={()=> {goto('/')}}>
		<img src = 'ahnheewon3.png' alt = 'Logo'>
	</div>

	<div id = 'pill' bind:this={Pill}></div>

	<div id = 'nav'>
		{#each $Posts as link, i}
			{#if i == 0 || i > 0 && link.meta.type != $Posts[i-1].meta.type }
				<div class = 'header'>
					<h1> {titleCase(link.meta.type)} </h1>
				</div>
			{/if}

			<div
				class = 'nav {link.meta.type}'
				class:active = {link.meta.title == $activeObject?.meta.title}
			>

				{#if link.meta.card}
					<img class = 'card' src = 'card/{link.meta.card}.png' alt = 'Thumbnail'>
				{/if}

				<div class = 'expo'>
					<div class = 'title'>
						<h2> {link.meta.title}</h2>
						{#if link.meta.tags}
							{#if link.meta.tags.includes('company')}
								<span class = 'material-icons' style='color: #6355FF'>business</span>
							{/if}
							{#if link.meta.tags.includes('university')}
								<span class = 'material-icons' style='color: #6355FF'>school</span>
							{/if}
						{/if}
					</div>

					<h3> {link.meta.description}</h3>
				</div>

			</div>
		{/each}
	</div>

</div>

<style lang="scss">

	#pill{
		position: absolute;
		background: rgba(#030025, .08);
		top: 0;
		left: 0;
		height: 28px;
		width: 220px;
		border-radius: 8px;
		//box-shadow: 2px 4px 4px rgba(black, .2), inset -1px 2px 2px rgba(white, .25);
		z-index: -2;
		transition: .2s ease;

		&.hidden{
			display: none;
		}
	}

	#navbar{
		position: relative;
		width: 240px;
		height: calc(100vh - 50px);
		//height: fit-content;
		padding: 18px;
		z-index: 3;

		margin: 6px;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;

		overflow-y: scroll;
		//border: 2px solid white;
		background: rgba(white, .8);
		//box-shadow: -10px 20px 40px rgba(#030025, .08);
	}

	#mast{
		margin-bottom: 20px;
		display: none;
		cursor: pointer;
		img{
			height: 20px;
		}
	}

	#nav{
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		.header{
			padding: 3px;
			//display: none;
			h1{
				font-size: 14px;
				font-weight: 650;
				letter-spacing: -.36px;
				margin: 8px 0 2px 0;
				color: rgba(#030025, .8);
			}
		}
		.nav{
			width: 100%;
			padding: 8px 8px;
			border-radius: 6px;
			//border-right: 1.5px solid rgba(#030025, .25);
			transition: .2s ease;
			cursor: pointer;

			display: flex;
			align-items: flex-start;
			justify-content: left;
			gap: 10px;

			.card{
				width: 30px;
				height: auto;
				flex-shrink: 0 !important;
				border-radius: 6px;
			}

			.expo{
				flex: 1;
			}

			.title{
				display: flex;
				align-items: center;
				gap: 6px;
				margin-bottom: 4px;
				span{
					font-size: 16px;
					margin-bottom: 1px;
				}

			}

			h2{
				font-size: 13px;
				font-weight: 600;
				letter-spacing: -.3px;
				margin: 0;
				margin-bottom: -2px;

				color: rgba(#030025, .8);
				transition: .2s ease;
				white-space: nowrap;
			}
			h3{
				font-size: 12px;
				font-weight: 400;
				letter-spacing: -.3px;
				margin: 0;
				//margin-left: 4px;
				color: rgba(#030025, .25);
				transition: .2s ease;
				white-space: nowrap;
				padding: 0;
				background: none;
				//display: none;
			}
			&.active{
				//padding: 8px 0;
				//margin-right: 4px;
				//background: white;
				h2{
					//color: white;
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
