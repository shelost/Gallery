<script>
	import { page } from '$app/state';
	import logo from '$lib/images/svelte-logo.svg';
	import github from '$lib/images/github.svg';
	import { goto } from '$app/navigation';
	import * as Config from '$lib/config.ts'
	import { Posts } from '$lib/store'

	export let data


</script>

<div id = 'navbar'>

	<div id = 'mast' on:click={()=> {goto('/')}}>
		<img src = 'ahnheewon3.png' alt = 'Logo'>
	</div>

	<div id = 'nav'>
		{#each $Posts as link, i}
			<div
				class = 'nav {link.meta.type}'
				on:click = {() => {goto('/' + link.slug)}}
			>
				<h2> {link.meta.title}</h2>
			</div>
		{/each}
	</div>

</div>

<style lang="scss">

	#navbar{
		min-width: 140px;
		height: calc(100vh - 52px);
		border-radius: 6px;
		padding: 16px;
		z-index: 3;

		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	h3{
		font-size: 10px;
	}

	#mast{
		//padding: 4px;
		margin-bottom: 32px;
		cursor: pointer;
		img{
			height: 20px;
		}
	}

	#nav{

		.nav{
			padding: 4px;
			//margin: 3px 0;
			//padding-right: 8px;
			//border-right: 1px solid rgba(black, .2);
			cursor: pointer;
			h2{
				font-size: 13px;
				font-weight: 500;
				letter-spacing: -.24px;
				margin: 0;
				color: rgba(#030025, .6);
				text-align: right;
				transition: .2s ease;
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
