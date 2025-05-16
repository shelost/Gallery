<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { formatDate } from '$lib/utils';
	import { fly, scale, fade } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';

	// Properly receive the data from the load function
	export let data;

	let blog = data.posts.filter(post => post.meta?.type == 'blog');
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
	<div class="text-column" in:fade={{duration: 200}} out:fade={{duration: 100}}>
		<div class = 'header'>
			<h1 in:fly={{y: 100, duration: 200}} out:fade={{duration: 50}}>
				Comics
			</h1>
			<h2 in:fly={{y: 100, duration: 200, delay: 100}} out:fade={{duration: 50}}>
				Comics I've made.
			</h2>
		</div>


		{#if data.posts && data.posts.length > 0}
			<div class="posts">
				{#each data.posts as post, i (post.slug)}
					{#if visible}
						<div class="post"
							on:click={() => navigateToBlogPost(post.slug)}
							in:fly={{y: 100, duration: 300, delay: 100 + (25 * i)}}
							out:fade={{duration: 150}}
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
		max-width: 800px;
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

		background: white;
		box-shadow: -8px 24px 32px rgba(#030025, 0.12), inset -2px -4px 8px rgba(#030025, 0.03);

		&:hover {
			//background-color: rgba(0, 0, 0, 0.03);
		}

		hgroup{
			.title{
				display: flex;
				justify-content: flex-start;
				align-items: center;
				gap: 8px;
				margin-bottom: 6px;
				h2{
					font-size: 18px;
					font-weight: 600;
					letter-spacing: -.6px;
				}
				h3{
					color: rgba(black, .3);
					margin-bottom: 4px;
					display: none;
				}
			}
			p{
				font-family: 'DM Sans', 'Inter', sans-serif;
				font-size: 14px;
				font-weight: 500;
				letter-spacing: -0.4px;
				line-height: 120%;
				color: rgba(#030025, .4);
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
