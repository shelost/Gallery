<script lang="ts">
	import { writable } from 'svelte/store'
	import { tweened } from 'svelte/motion';
	import { activeImage, showPreview, showHeader, themeColor } from '$lib/store';
	import { formatDate } from '$lib/utils';
	import { onMount, onDestroy } from 'svelte'
	import { beforeNavigate } from '$app/navigation';
	import {
		blur,
		crossfade,
		draw,
		fade,
		fly,
		scale,
		slide
	} from 'svelte/transition';
	export let data;

	let headers = [];
	let activeId = '';
	let isNavigatingAway = false;
	let mainElement;

	showHeader.set(false)
	themeColor.set('FFFFFF')

	// Handle navigation away from this page
	beforeNavigate(() => {
		isNavigatingAway = true;
		// Immediately reset styles that might affect other pages
		document.body.style.overflow = '';
		showHeader.set(true);

		// Add a unique identifier to this element for easier cleanup
		if (mainElement) {
			mainElement.dataset.slugPage = 'true';
		}
	});

	onMount(()=> {
		document.body.style.overflow = 'hidden';

		// Restore scroll after animation
		setTimeout(() => {
			document.body.style.overflow = '';
		}, 500);

		const article = document.querySelector('.prose.preview');
        if (article) {
            headers = Array.from(article.querySelectorAll('h1, h2, h3')).map(header => ({
                id: header.id || header.textContent.toLowerCase().replace(/\s+/g, '-'), // Generate an ID if missing
                text: header.textContent,
                tag: header.tagName.toLowerCase()
            }));

            // Assign IDs to headers if they don't already have them
            headers.forEach(header => {
                const element = article.querySelector(`[id="${header.id}"]`);
                if (!element) {
                    article.querySelector(`h1,h2,h3:contains("${header.text}")`)?.setAttribute('id', header.id);
                }
            });
        }
		const observer = new IntersectionObserver(entries => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					activeId = entry.target.id;
				}
			});
		}, { rootMargin: '-50px 0px -80% 0px', threshold: 0.1 });

		headers.forEach(header => {
			const element = document.getElementById(header.id);
			if (element) observer.observe(element);
		});

	})

	onDestroy(() => {
		// Reset any global states when leaving the page
		showHeader.set(true)
		document.body.style.overflow = '';
	});

	function scrollToHeader(id) {
        const target = document.getElementById(id);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

	let Preview

    function closeModal(event) {
		// Only close the modal if the click was on the background (not the modal itself)

		console.log(event.target.id)
		if (event.target.id === 'pop' || event.target.id === 'modal') {
			showPreview.set(false)
		}else{
			//goto(`/${$selected.slug}`, {noScroll: true})
		}
	}

	//  in:fly={{y: 500, duration: 500}} out:fly={{y: 500, duration: 500}}

	//  style='background: #{data.meta.color}'

</script>

<svelte:head>
	<title>{data.meta.title}</title>
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.meta.title} />
</svelte:head>

{#if !isNavigatingAway}
<div id="bar">
	<h3> {data.slug} </h3>
</div>

<div
	class="main"
	bind:this={mainElement}
	in:fade={{duration: 200}}
	out:fade={{duration: 100, easing: (t) => t}}
	style="position: fixed; top: 0; left: 0; z-index: 10; margin: 0; padding: 0;"
	data-slug-page="true"
>

	<div class="sidebar left">
		<p class="blurb">
			{#if data.meta.blurb}
				{data.meta.blurb}
			{/if}
		</p>

		<div class="tags">
			{#each data.meta.categories as category}
				<div class="tag">
					<h3> {category} </h3>
				</div>
			{/each}
		</div>
	</div>

	<div class="container {data.meta.type} {data.meta.theme ? data.meta.theme : ''}">
		{#if data.meta.banner}
			<div id="banner">
				<div id="img" style='background-image: url("banner/{data.meta.banner}.png")'>
				</div>
				<div id="gradient"></div>
			</div>
		{/if}
		<article>
			<hgroup>
				{#if data.meta.series}
					<h3>{data.meta.series}</h3>
				{/if}
				<h1>{data.meta.title}</h1>

				<div class="profile">
					<a href="https://lh3.googleusercontent.com/drive-viewer/AITFw-xPEYrPxiy026fqjw7Rjxen5nkMMpx8rP8_gYRhj4f1kkcUhXKJyhTE55n1MXPaQz-cKjTs_EuXD7whMajZsdR0HAn29A=s2560?source=screenshot.guru"> <img src="https://lh3.googleusercontent.com/drive-viewer/AITFw-xPEYrPxiy026fqjw7Rjxen5nkMMpx8rP8_gYRhj4f1kkcUhXKJyhTE55n1MXPaQz-cKjTs_EuXD7whMajZsdR0HAn29A=s2560" /> </a>
					<h2> {data.meta.author} </h2>
				</div>

				<h2 class="date"> {formatDate(data.meta.date)}</h2>
			</hgroup>

			<div class="prose preview">
				<svelte:component this={data.content} />
			</div>
		</article>
	</div>

	<div class="sidebar right">
		<nav class='menu'>
			<h2>Table of Contents</h2>
			<ul>
				{#each headers as header}
					<li class={header.tag}>
						<a href="#" on:click|preventDefault={() => scrollToHeader(header.id)}>
							<p>
								{header.text}
							</p>
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</div>

	{#if $showPreview}
		{#if $activeImage}
			<div id="dark" transition:fade={{duration: 100}} ></div>
				<div id="pop" on:click={closeModal}>
					<div id="modal" bind:this={Preview} in:fade={{duration: 100}}>
						<img id="preview" src="/img/{$activeImage.url}.png" loading='lazy' alt="Image">
						<div class="content"> {$activeImage.caption} </div>
				</div>
			</div>

		{/if}
	{/if}
</div>
{/if}

<style lang="scss">

	#bar{
		background: white;
		position: fixed;
		top: 0;
		left: 0;
		height: 32px;
		width: 100vw;
		border-bottom: 1px solid rgba(black, 0.1);
		z-index: 20;
	}

	.sidebar{
		width: 180px;
		height: calc(100vh - 85px);
		height: 400px;
		border: 1.5px solid black;

		background: white;
		margin: 12px;
		border-radius: 8px;
		overflow-y: scroll;

		position: fixed;
		top: 0;

		&.left{
			left: 0;
		}

		&.right{
			right: 0;
		}
	}

	a{
		color: black;
		&:hover{
			//text-decoration: none;
		}
	}

	.blurb{
		font-size: 13px;
		font-weight: 500;
		line-height: 125%;
		letter-spacing: -0.4px;
	}

	.menu{
		color: black;
		h2{
			margin: 40px 0 20px 0;
		}
		ul{
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: 12px;

			li{
				padding: 4px 8px;
				border-radius: 8px;
				background: rgba(white, 0.4);
				opacity: 0.75;
				transition: 0.2s ease;

				p{
					color: rgba(black, 0.75);
					font-size: 13px;
					font-weight: 500;
					transition: 0.2s ease;
				}

				&.h2{
					margin-left: 8px;
				}

				&:hover{
					opacity: 1;
					background: rgba(white, 0.6);

					p{
						color: black;
					}

				}
			}
		}
	}

	.container {
		position: relative;
		width: calc(95% - 400px);

		height: calc(100vh - 40px);

		width: 100vw;
		height: 100vh;
		border-radius: 8px;
		overflow-x: hidden;
		overflow-y: scroll;
		padding: 0px;
		transition: all 0.5s ease;

		&.dark{
			background: rgba(black, 0.95);

			hgroup{
				color: #FFE4CE;
				h1{
					letter-spacing: 1px;
				}
			}
		}
	}

	.main {
		position: fixed !important;
		top: 0 !important;
		left: 0 !important;
		width: 100vw !important;
		height: 100vh !important;
		z-index: 10 !important;
		margin: 0 !important;
		padding: 0 !important;
		overflow-y: auto;
		background-color: white;
	}

	article {
		width: calc(95% - 400px);
		max-width: 1440px;
		height: calc(100vh - 40px);
		max-height: 1180px;

		max-inline-size: 98%;
		margin-inline: auto;
		padding: 60px 50px;
		border-radius: 12px;
		position: relative;
	}

	#banner{
		width: 100%;
		aspect-ratio: 3;
		position: absolute;
		top: 0;
		left: 0;
		display: none;
		#img{
			width: 100%;
			aspect-ratio: 3;
			background-size: cover;
			background-position: 50% 20%;
			position: absolute;
			background-color: #ffce00;
			top: 0;
			left: 0;
		}
		#gradient{
			width: 100%;
			aspect-ratio: 3;
			background-size: cover;
			background-image: linear-gradient(to top, white, rgba(white, 0.3), rgba(white,0) 25%);
			position: absolute;
			top: 0;
			left: 0;
		}
	}

	hgroup{
		width: 900px;
		color: rgba(black, 0.8);
		margin-bottom: 40px;

		h1{
			font-size: 52px;
			letter-spacing: -1.2px;
			line-height: 100%;
			max-inline-size: 100%;

			font-weight: 800;
		}
		h2{
			background: rgba(white, 0.8);
			color: black;
			margin-top: 8px;
			font-size: 14px;
			border-radius: 8px;
			width: fit-content;
			display: none;
		}

	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		color: black;
		gap: 6px;

		.tag{
			width: fit-content;
			background: white;
			padding: 5px 10px 6px 10px;
			border-radius: 8px;
			box-shadow: 0 5px 10px rgba(#030025, 0.1);
			border: 1.5px solid black;
			h3{
				color: black;
				font-size: 14px;
				margin: 0;
			}
		}
	}

	.profile{
		display: none;
	}

	img{
		height: 32px;
		border-radius: 50px;
		border: 1px solid rgba(0,0,0,0.2);
	}

	h2{
		font-size: 18px;
		font-weight: 600;
	}

	h3{
		font-size: 16px;
		font-weight: 600;
		color: rgba(0,0,0,0.3);
		margin-bottom: 5px;
	}

	#dark{
		position: fixed !important;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(black, 0.8);
        transition: 0.4s ease;
		z-index: 3;
	}

    #pop{
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 4;

		display: flex;
		justify-content: center;
		align-items: center;

		#modal{
			width: 720px;
			height: 720px;
			max-height: 85%;
			border-radius: 12px;
			transition: 0.2s ease;
			z-index: 4 !important;
			overflow: visible;
			transform: translateY(16px);

			#preview{
				width: 100%;
    			height: 100%;
				border-radius: 0px;
				overflow: hidden;
				border: none;
				margin: auto;
				object-fit: contain !important;
				filter: drop-shadow(0 15px 50px rgba(black, 0.5));
			}
        }
    }

	@media screen and (max-width: 1024px){
		.sidebar{
			display: none;
		}
		.main{
			padding: 0;
		}
		.container{
			width: calc(100vw);
			height: 100vh;
			background: white;
			border-radius: 0 !important;
		}

		article{
			width: 100vw;
			max-inline-size: 100%;
			padding: 16px;
			border-radius: 0 !important;
		}
	}

</style>
