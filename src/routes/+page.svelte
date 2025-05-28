<script>
	import Counter from './Counter.svelte';
	import Navbar from './Navbar.svelte';
	import welcome from '$lib/images/svelte-welcome.webp';
	import welcomeFallback from '$lib/images/svelte-welcome.png';
	import * as Config from '$lib/config.ts'
	import { activeElem, activeObject, themeColor, loading, openDrawer, expandedPost } from '$lib/store'
    import { goto } from '$app/navigation';
	import { titleCase, tagIcon, Class, Id } from '$lib/utils'
	import { onMount } from 'svelte'
	import { writable } from 'svelte/store'
	import NumberFlow, { continuous } from '@number-flow/svelte'
	import {
		blur,
		crossfade,
		draw,
		fade,
		fly,
		scale,
		slide,
	} from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	// Variables

	export let data

	let Scroll, Bar, App, Flex, Pill, Drawer;
	let sections, previews
	let splash = writable(false)
	let view = writable(2)
	let val = 0

	let Click;

	themeColor.set('f3f4f7')

	function typeDisplay(str){
		switch(str){
			case 'comic':
				return {title: 'Comics', icon: 'comic', description: "I've been getting into drawing comics as a hobby."}
			case 'game':
				return {title: 'Games', icon: 'game', description: 'I sometimes make JavaScript <canvas> games.'}
			case 'design':
				return {title: 'Products', icon: 'design', description: 'I do Product Design work for startups.'}
			case 'gallery':
				return {title: 'Design', icon: 'gallery', description: "I've dabbled in graphic design."}
			default:
				return {title: titleCase(str), icon: str, description: 'Hello'}
		}
	}

</script>

<svelte:head>
	<!-- Resource hints for performance -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

	<!-- Preload critical assets -->
	<link rel="preload" href="ahnheewon3.png" as="image" />

</svelte:head>



<section id = 'app' bind:this={App} class:offset={$openDrawer}>

	<section class = 'splash' >

		<div class = 'screen'>

			<img src="heewon8.png" id="heewon" alt="Logo" width="200" height="67" fetchpriority="high"
				in:fly={{y: 50, duration: 600, delay: 0}} />
			<div class = 'expo'>

				<h1>
					<i>Hi!</i> I'm Heewon.
				</h1>
				<p>
					I have a lot of random interests.
				</p>
				<p>

				</p>
				<p >
					Let's work together! You can reach me at <a href = 'mailto:shelost.off@gmail.com'>shelost.off@gmail.com</a>.
				</p>

			</div>

		</div>

	</section>

	<div id = 'flex' bind:this={Flex} class = 'view{$view}'>

		<section id = 'page'>
			<section id = 'sections'>

			{#each data.posts as link, i}

				{#if i == 0 || i > 0 && link.meta.type != data.posts[i-1].meta.type }
					<div class = 'head'
					in:fly={{y: 100, duration: 300, delay: 20*i}}>
						<h1> {typeDisplay(link.meta.type).title} </h1>
						<p> {typeDisplay(link.meta.type).description} </p>
					</div>
				{/if}

				<section
					id = '{link.meta.title}'
					class = 'sec r{link.meta.rating} {link.meta.type}'
					in:fly={{y: 100, duration: 300, delay: 100*i}}
					on:click={() => {
						if (link.meta.url) {
							window.location = link.meta.url
						}else{
							goto('/' + link.slug)
						}
					}}
					>

					<hgroup class = 'hgroup'>

						<div class = 'left'>

							<div class = 'mast'>
								{#if link.meta.card}
									<img src="card/{link.meta.card}.png" alt="card" class="card" />
								{/if}

								<div class = 'title'>
									<h1> {link.meta.title} </h1>
									{#each link.meta.tags as tag, j}
										<div class = 'tag'>
											{#if tagIcon(tag)}
												<img src="icon/{tagIcon(tag)}.svg" class="icon" alt="icon" />
											{/if}
											<h3> {titleCase(tag)} </h3>
										</div>
									{/each}
								</div>

								<h2> {link.meta.description} </h2>
								<div class = 'type'>
									<h3> {link.meta.type} </h3>
								</div>
							</div>

							<div class = 'info'>
								<p> {link.meta.blurb} </p>
								<div class = 'tags'>
									{#each link.meta.categories as cat, j}
										<div class = 'tag'>
											{#if tagIcon(cat)}
												<img src="icon/{tagIcon(cat)}.svg" class="icon" alt="icon" />
											{/if}
											<h3> {titleCase(cat)} </h3>
										</div>
									{/each}
								</div>

								<button>
									<h2> View Project </h2>
								</button>
							</div>

						</div>

						<div class = 'right'>
							<img src="expand.svg" class="expand" alt="view" on:click={() => {
								expandedPost.set(link)
								openDrawer.set(true)
							}} />
							<div class = 'rating'>
								<h2> {link.meta.rating} </h2>
								<div class = 'bar'>
									<div class = 'fill'>
									</div>
								</div>
							</div>
						</div>

					</hgroup>

					<div class = 'preview'>

						<div class = 'background' style='background: #{link.meta.color}'></div>

						<div class = 'content'>
							{#if link.meta.video}
								<video class = 'video' autoplay muted playsinline loop>
									<source src = 'video/{link.meta.video}.mp4' type = 'video/mp4'>
								</video>
							{:else if link.meta.preview}
								<img src="bento/{link.meta.preview}.svg" class="banner" alt="banner" />
								<div class = 'gradient'></div>
							{:else}
								<div class="prose prose-preview">
									<svelte:component this={link.content} />
								</div>
							{/if}
						</div>
					</div>
				</section>


			{/each}
			</section>

		</section>
	</div>

	<div id = 'scroll' bind:this={Scroll}>
		<div id = 'bar' bind:this={Bar}></div>
	</div>

</section>


<style lang="scss">

	#app{
		color: white;
	}

	h1, h2, h3, h4, h5, h6, p{
		color: rgba(white, .75);
	}

	.splash{
		width: 1080px;
		max-width: 90%;
		margin: 80px auto;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;

		img{
			height: 180px;
			width: 180px;
			border-radius: 100px;
		}
		.screen{
			display: flex;
			align-items: center;
			justify-content: flex-start;
			gap: 40px;
			@media screen and (max-width: 800px) {
				flex-direction: column;
			}
		}
		.expo{
			h1{
				font-family: "ivypresto-headline", 'Newsreader', sans-serif;
				text-align: left;
				font-size: 60px;
				font-weight: 300;
				letter-spacing: 0px;
				margin-bottom: 24px;
			}
			p{
				color: rgba(white, .5);
				text-align: left;
				font-size: 15px;
				font-weight: 250;
				letter-spacing: .1px;
				margin: 12px 0;
			}
			@media screen and (max-width: 800px) {
				h1{
					text-align: center;
				}
				p{
					text-align: center;
				}
			}
		}
	}

	.head{
		grid-column: 1 / 4;
		width: 100%;
		margin: 80px 0 60px 0;
		h1{
			font-family: "ivypresto-headline", 'Newsreader', sans-serif;
			font-size: 48px;
			font-weight: 300;
			letter-spacing: .25px;
			text-align: left;
			margin-bottom: 12px;
		}
		p{
			font-family: "utopia-std-display", 'Newsreader', sans-serif;
			font-size: 18px;
			font-weight: 100;
			letter-spacing: 0px;
			color: rgba(white, .2);
			text-align: left;
		}
	}

	#sections{
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 40px 90px;
		width: 1080px;
		max-width: 90%;
		margin: 40px auto;
		padding-bottom: 100px;

		@media screen and (max-width: 800px) {
			display: flex;
			flex-direction: column;
			gap: 40px;
		}
	}

.sec{
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 24px;
	height: fit-content;
	cursor: pointer;

	background: #121223;
	background: rgba(white, .03);
	box-shadow: -24px 80px 60px rgba(black, .3);
	border-radius: 8px;
	padding: 10px 20px 20px 20px;

	max-height: 540px;
	transition: .2s ease;

	&:hover{
		background: rgba(white, .05);
		transform: translateY(-4px);
	}

	&#Stan{
		.title{
			h1{
				font-family: 'Plus Jakarta Sans', sans-serif;
				font-weight: 700;
				letter-spacing: -.5px;
			}
		}
	}

	&#Soteria{
		.title{
			h1{
				font-family: 'DM Serif Display', 'Newsreader', sans-serif;
				font-weight: 500;
				letter-spacing: -0px;
				text-transform: uppercase;
				transform: translateY(1px);
			}
		}
	}

	&#Wolf\ Financial {
		.title{
			h1{
				font-family: 'Poppins', sans-serif;
				font-weight: 600;
				letter-spacing: -.8px;
			}
		}
	}

	hgroup{
		display: flex;
		.left{
			margin: 0;
			padding: 0;
			.mast{
				.card{
					height: 64px;
					border-radius: 6px;
					margin-top: -18px;
					box-shadow: -6px 12px 24px rgba(black, .25);
				}
				.title{
					margin: 18px 0 8px 0;
					h1{
						font-family: "ivypresto-headline", 'Newsreader', sans-serif;
						font-size: 32px;
						font-weight: 500;
						letter-spacing: .3px;
						text-align: left;
					}

				}
				h2{
					font-family: "utopia-std-display", "ivypresto-headline", 'Newsreader', sans-serif;
					font-size: 18px;
					font-weight: 100;
					letter-spacing: 0px;
					color: rgba(white, .2);
					margin-bottom: 12px;
				}

				h3{
					display: none;
				}
			}

			.info{
				p{
					font-size: 13px;
					font-weight: 200;
					letter-spacing: .25px;
					margin: 12px 0;
					line-height: 125%;
					color: rgba(white, .4);
				}
				button{
					display: none;
					h2{
						display: block;
					}
				}
			}
		}
		.right{
			display: none;
			.expand{}
		}
	}


	.preview{
		display: flex;
		width: 100%;
		max-height: 100%;
		opacity: .95;

		overflow: hidden;
		-webkit-mask-image: -webkit-gradient(linear, 50% 50%, 52% 100%, from(rgba(black,1)), to(rgba(black,.2)));
		img{
			width: 100%;
			color: red;

		}
		video{
			width: 100%;
			border-radius: 6px;
		}
	}

	&.game{
		.preview{
			-webkit-mask-image: none;
		}
	}

}

.tags{
	display: none;
	gap: 10px;
	margin: 16px 0;
	.tag{
		display: flex;
		align-items: center;
		gap: 6px;
		background: rgba(white, .05);
		padding: 6px 10px;
		border-radius: 4px;
		img{
			height: 16px;
		}
		h3{
			font-family: "ivypresto-headline", 'Newsreader', sans-serif;
			font-size: 16px;
			font-weight: 300;
			letter-spacing: .3px;
		}

	}
}


</style>

