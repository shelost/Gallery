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
	<title>Blog</title>
	<meta name="description" content="Blog posts by Heewon" />
</svelte:head>

{#if visible}
	<div class="text-column">

		<div class = 'header'>
			<h1>
				Blog
			</h1>
			<h2>
				My thoughts on history, tech, and more.
			</h2>
		</div>

		{#if data.posts && data.posts.length > 0}
			<div class="posts">
				{#each blog as post, i (post.slug)}
					{#if post.meta?.type == 'blog' && visible}
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
		max-width: 600px;
		margin: auto;
	}

	.post{
		margin-bottom: 12px;
		padding: 24px;
		border-radius: 8px;
		transition: background-color 0.2s;
		cursor: pointer;



		&:hover {
			background: rgba(white, .03);
		}

		hgroup{
			.title{
				display: flex;
				justify-content: flex-start;
				align-items: center;
				gap: 8px;
				margin-bottom: 12px;
				h2{
					font-family: "ivypresto-headline", 'Newsreader', sans-serif;
					font-size: 24px;
					font-weight: 400;
					letter-spacing: 0.5px;
					color: rgba(white, .8);
				}
				h3{
					font-size: 14px;
					font-weight: 300;
					letter-spacing: -.1px;
					color: rgba(white, .3);
					margin-bottom: 4px;
				}
			}
		}
		p{
			font-size: 14px;
			font-weight: 300;
			letter-spacing: -.1px;
			line-height: 130%;
			color: rgba(white, .4);
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
