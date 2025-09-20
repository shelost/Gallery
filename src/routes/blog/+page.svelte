<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { formatDate } from '$lib/utils';
	import { fly, scale, fade } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';

	// Properly receive the data from the load function
	export let data;

	console.log(data);

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
									
								</div>
								<p>{post.meta?.blurb}</p>
							</hgroup>
							<div class="content">
								<div class="prose prose-preview">
									<svelte:component this={post.content} />
								</div>
							</div>
							<h3>{formatDate(post.meta?.date)}</h3>
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
		color: black;
	}


	.text-column{
		padding: 100px 0;
		width: 100%;
		max-width: 600px;
		margin: auto;
	}

	.post{
		margin-bottom: 12px;
		padding: 20px;
		border-radius: 8px;
		transition: background-color 0.2s;
		cursor: pointer;

		&:hover {
			background: rgba(black, .03);
		}

		hgroup{
			.title{
				display: flex;
				justify-content: flex-start;
				align-items: flex-end;
				gap: 8px;
				margin-bottom: 12px;
				h2{
					font-family: "ivypresto-headline", 'Newsreader', sans-serif;
					font-family: "Hedvig Letters Serif", 'Newsreader', sans-serif;
					font-size: 20px;
					font-weight: 900;
					letter-spacing: 0px;
					color: rgba(black, 1);
				}
				
			}
		}
		p{
			font-family: "Hedvig Letters Serif", 'Newsreader', sans-serif;
			//font-family: 'DM Sans', 'Inter', sans-serif;
			font-size: 14px;
			font-weight: 100;
			letter-spacing: -.2px;
			line-height: 120%;
			color: rgba(black, .4);
		}
		h3{
			font-family: "ivypresto-headline", 'Newsreader', sans-serif;
			font-family: "Hedvig Letters Serif", 'Newsreader', sans-serif;
			font-size: 14px;
			font-weight: 600;
			letter-spacing: -.2px;
			color: rgba(black, 1);
			margin-top: 12px;
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
