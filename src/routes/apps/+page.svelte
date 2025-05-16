<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { formatDate } from '$lib/utils';
	import { fly, scale, fade } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';

	// Properly receive the data from the load function
	export let data;

	let blog = data.posts.filter(post => post.meta?.type == 'game');
	let visible = false;

	onMount(() => {
		console.log('Blog page mounted');
		// Delay setting visible to true to ensure DOM is ready
		setTimeout(() => {
			visible = true;
		}, 50);
	});

	onDestroy(() => {
		//console.log('Blog page destroyed');
		// Reset visible flag when leaving the page
		//visible = false;
	});

	function navigateToBlogPost(slug) {
		visible = false; // Hide all posts before navigating
		setTimeout(() => {
			goto(`/${slug}`);
		}, 100); // Small delay to allow animations to finish
	}

	let apps = [
		{
			title: '3D Phone Viewer',
			description: 'A 3D phone viewer',
			image: 'https://via.placeholder.com/150',
			link: '/phone'
		},
		{
			title: 'Daydream',
			description: 'AI-Enhanced Drawing',
			image: 'https://via.placeholder.com/150',
			link: 'https://dddream.vercel.app'
		}
	]
</script>

<svelte:head>
	<title> Game </title>
	<meta name="description" content="Blog posts by Heewon" />
</svelte:head>

{#if visible}
	<div class="text-column">

		<div class = 'header'>
			<h1>
				Apps
			</h1>
			<h2>
				I mainly create games with HTML Canvas.
			</h2>
		</div>


		<div class = 'posts'>

			{#each apps as post, i}
				<a href = {post.link}>
					<div class = 'post'>
						<hgroup>
							<div class = 'title'>
								<h2>{post.title}</h2>
							</div>
							<h4> {post.description} </h4>

							<button class = 'mini'>
								<h2> Play </h2>
							</button>
						</hgroup>
					</div>
				</a>
			{/each}
		</div>
	</div>
{/if}


<style lang="scss">


	.text-column{
		padding: 100px 0;
		width: 100%;
		max-width: 1000px;
		margin: auto;
	}

	.posts{
		width: 100%;
		display: grid;
		grid-template-columns: 1fr 1fr;
		column-gap: 60px;
		row-gap: 20px;
	}

	a{
		padding: 0;
		border: none;
		&:hover{
			background: none;
			border: none;
		}
	}

	.post{
		margin-bottom: 30px;
		padding: 20px;
		border-radius: 12px;
		transition: background-color 0.2s;
		cursor: pointer;
		height: fit-content;
		grid-columns: span 1;

		background: rgba(white, .05);
		box-shadow: -16px 32px 36px rgba(#030025, 0.03);

		&:hover {
			background: rgba(white, .08);
		}

		.mast{
			display: flex;
			align-items: flex-start;
			justify-content: flex-start;
			gap: 20px;
			margin-bottom: 24px;

			flex-direction: row-reverse;
		}


		.card-container{
			position: relative;
			inset: 0;
			overflow: hidden;
			flex-shrink: 0;
			border-radius: 12px;
			box-shadow: -8px 16px 24px rgba(#030025, 0.1), -2px 4px 12px rgba(#030025, 0.03);
			align-self: flex-start;
			height: 80px;

			&::after{
				content: '';
				position: absolute;
				inset: 0;
				width: 100%;
				height: 100%;
				top: 0;
				left: 0;
				z-index: 3 !important;
				//background: red;
				box-shadow: inset -4px -4px 8px rgba(#030025, 0.08), inset 2px 2px 4px rgba(white, 0.3);
			}
		}

		.card{
			height: 100%;
			width: auto;
			position: relative;
			margin: 0;
		}



		hgroup{
			flex: 1;
			.title{
				display: flex;
				justify-content: flex-start;
				align-items: center;
				gap: 8px;
				margin-bottom: 2px;
				h2{
					font-size: 24px;
					font-weight: 600;
					letter-spacing: -.6px;
					color: rgba(white, .8);
				}
			}
			h4{
				font-size: 18px;
				font-weight: 500;
				letter-spacing: -0.5px;
				line-height: 120%;
				color: rgba(white, .36);
			}
			p{
				display: none;
			}
			button{
				margin-top: 12px !important;
			}
		}

		.video{
			width: 100%;
			position: relative;
			border-radius: 8px;
			overflow: hidden;
			box-shadow: -16px 32px 60px rgba(#030025, 0.15);
			background: white;
			video{
				width: 100%;
				margin-bottom: -10px;
			}
			&::after{
				content: '';
				position: absolute;
				inset: 0;
				width: 100%;
				height: 100%;
				top: 0;
				left: 0;
				z-index: 3 !important;
				//background: red;
				box-shadow: inset -4px -4px 8px rgba(#030025, 0.03), inset 2px 2px 12px rgba(white, 0.25);
			}
		}

		.content{
			display: none;
		}
	}





	ul {
		list-style: none;
		padding: 0;
		margin: 20px 0;
	}

	li {
		margin-bottom: 30px;
		padding-bottom: 20px;
		border-bottom: 1px solid #eee;
	}
</style>
