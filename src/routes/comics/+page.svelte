<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { formatDate } from '$lib/utils';
	import { fly, scale, fade } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';

	// Properly receive the data from the load function
	export let data;

	let posts = data.posts.filter(post => post.meta?.type == 'comic');
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
</script>

<svelte:head>
	<title>Comics</title>
	<meta name="description" content="Blog posts by Heewon" />
</svelte:head>

{#if visible}
	<div class="text-column">
		<div class = 'header'>
			<h1>
				Comics
			</h1>
			<h2>
				I've been exploring drawing comics as a hobby.
			</h2>
		</div>


		{#if data.posts && data.posts.length > 0}
			<div class="posts">
				{#each posts as post, i (post.slug)}
					{#if visible}
						<div class="post"
							on:click={() => navigateToBlogPost(post.slug)}
						>
							<hgroup>
								<div class = 'title'>
									<h2>{post.meta?.title}</h2>
									<h3>{formatDate(post.meta?.date)}</h3>
								</div>
								<p>{post.meta?.blurb}</p>
							</hgroup>
							<div class="content">
								<div class="prose prose-preview">
									<svelte:component this={post.content} />
								</div>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{:else}
			<p>No posts found.</p>
		{/if}
	</div>
{/if}


<style lang="scss">


	.text-column{
		padding: 100px 0;
		width: 100%;
		max-width: 1200px;
		margin: auto;
	}

	.posts{
		margin-top: 40px;
	}

	.post{
		margin-bottom: 12px;
		padding: 16px;
		border-radius: 8px;
		transition: background-color 0.2s;
		cursor: pointer;

		//background: white;
		//box-shadow: -8px 24px 32px rgba(#030025, 0.12), inset -2px -4px 8px rgba(#030025, 0.03);

		&:hover {
			//background-color: rgba(0, 0, 0, 0.03);
		}

		hgroup{
			color: rgba(white, .8);
			.title{
				display: flex;
				justify-content: flex-start;
				align-items: center;
				gap: 8px;
				margin-bottom: 12px;
				h2{
					font-family: 'Newsreader', sans-serif;
					font-size: 40px;
					font-weight: 600;
					letter-spacing: -.8px;
					color: rgba(white, .8);
				}
				h3{
					color: rgba(white, .3);
					margin-bottom: 4px;
					display: none;
				}
			}
			p{
				font-size: 14px;
				font-weight: 300;
				letter-spacing: -0.1px;
				color: rgba(white, .4);
			}
		}
		.content{
			//display: none;

			:global(.gallery){
				display: grid;
				grid-template-columns: repeat(5, 1fr) !important;
				gap: 16px;
			}

			.prose{
				:global(p){
					display: none;
				}
			}
		}
	}


</style>
