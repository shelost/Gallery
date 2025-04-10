<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { formatDate } from '$lib/utils';
	import { fly, crossfade } from 'svelte/transition';

	const [send, receive] = crossfade({
		duration: 100,
		fallback: fly
	});

	// Properly receive the data from the load function
	export let data;

	onMount(() => {
		console.log('Blog page mounted');
	})

</script>

<svelte:head>
	<title>Blog - Heewon</title>
	<meta name="description" content="Blog posts by Heewon" />
</svelte:head>

<div class="text-column">
	<h1>Blog Posts</h1>

	{#if data.posts && data.posts.length > 0}
		<div class="posts">
			{#each data.posts as post}
				{#if post.meta?.type == 'blog'}

						<div class="post" on:click={() => {
							goto(`/${post.slug}`)
						}}>
							<hgroup>
								<h2>{post.meta?.title}</h2>
								<h3>{formatDate(post.meta?.date)}</h3>
								<p>{post.meta?.description}</p>
								<p>{post.meta?.blurb}</p>
							</hgroup>
							<div class = 'content'>
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

<style lang="scss">

	.text-column{
		padding: 100px 0;
		width: 100%;
		max-width: 600px;
		margin: auto;
	}

	.post{
		hgroup{
			h2{
				font-size: 24px;
				font-weight: 600;
				letter-spacing: -.6px;
			}
			h2 {
				margin-bottom: 8px;
			}
		}
		.content{
			display: none;
		}
	}

	h1{
		margin: 40px 0;
	}
	h2 {
		margin-bottom: 8px;
	}

	p{
		font-size: 14px;
		font-weight: 450;
		letter-spacing: -0.45px;
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
