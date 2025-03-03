<script>
	import Counter from './Counter.svelte';
	import welcome from '$lib/images/svelte-welcome.webp';
	import welcomeFallback from '$lib/images/svelte-welcome.png';
	import * as Config from '$lib/config.ts'
    import { goto } from '$app/navigation';

	export let data

</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section id = 'page'>


	<section class = 'splash'>
		<h1> Heewon </h1>
		<h2> Design Engineer (+ occasional artist) </h2>

		<div id = 'search'>
			<input placeholder = 'Search...'>
		</div>

	</section>


	{#each data.posts as link, i}
		<section class = 'sec r{link.meta.rating}'>

			<hgroup>
				<div class = 'header'>
					<h1> {link.meta.title} </h1>
					<h2> {link.meta.description} </h2>
					<h3> {link.meta.type} </h3>
					<p> {link.meta.blurb} </p>
				</div>

				<div class = 'top'>
					<button on:click = {() => {goto('/' + link.slug)}}>
						View
					</button>
					<div class = 'rating'>
						<h2> {link.meta.rating} </h2>
						<div class = 'bar'>
							<div class = 'fill'>
							</div>
						</div>
					</div>
				</div>

			</hgroup>

			{#if link.meta.preview}
				<div class = 'banner' style = 'background-image: url(bento/{link.meta.preview}.svg)'></div>
			{/if}


			<div class="prose preview prose-img">
				<svelte:component this={link.content} />
			</div>

		</section>
	{/each}


</section>

<style lang="scss">

	.rating{
		display: flex;
		align-items: center;
		gap: 12px;
		h2{
			font-size: 14px;
		}
		.bar{
			width: 100px;
			height: 6px;
			background: white;
			border-radius: 50px;
		}
	}

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



	.header{
		//position: sticky;
		//background: white;
		//padding: 18px;
		top: 0;
		z-index: 3;
	}

	.prose{
		height: 500px;
		overflow: hidden;
		border-radius: 8px;
		display: none;
	}

	.sec{
		padding: 0px 0;
		margin-top: 40px;
		border-radius: 16px;
		padding: 24px;
		//background: rgba(white, .1);
		//box-shadow: 6px 12px 40px rgba(black, .08), -4px -4px 8px rgba(white, .1);

		hgroup{

			h1{
				font-size: 32px;
				font-weight: 750;
				letter-spacing: -.7px;
				text-align: left;
				margin-bottom: 6px;
			}

			h2{
				font-size: 18px;
				font-weight: 600;
				color: rgba(#030025, .5);
				letter-spacing: -.4px;
				text-align: left;
				margin-bottom: 20px;
			}

			h3{
				display: none;
			}

			p{
				font-size: 14px;
				letter-spacing: -.3px;
				margin: 12px 0;
			}
		}

		.banner{
			width: 100%;
			aspect-ratio: 1;
			background-size: cover;
			border-radius: 10px;
			//display: none;
		}

		&.r3{
			.banner{
				aspect-ratio: 5/3;
			}
		}
		&.r2{
			.banner{
				aspect-ratio: 5/2;
			}
		}
	}

	.splash{
		height: 70vh;

		display: flex;
		flex-direction: column;
		justify-content: center;

		h1{
			font-size: 60px;
			font-weight: 800;
			letter-spacing: -1.8px;
			text-align: left;
		}

		h3{
			font-size: 16px;
			font-weight: 600;
			letter-spacing: -.5px;
			text-align: left;
			padding: 4px 8px;
			margin: 8px 0;
			background: white;
			border-radius: 8px;
			width: fit-content;
		}
	}




</style>
