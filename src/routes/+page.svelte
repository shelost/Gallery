<script>
	import Counter from './Counter.svelte';
	import welcome from '$lib/images/svelte-welcome.webp';
	import welcomeFallback from '$lib/images/svelte-welcome.png';
	import * as Config from '$lib/config.ts'
	import { activeElem } from '$lib/store'
    import { goto } from '$app/navigation';
	import { titleCase, tagIcon } from '$lib/utils'
	import {onMount} from 'svelte'

	export let data

	onMount(() => {
		const sections = document.querySelectorAll(".sec");

		function updateActiveSection() {
			let closest = null;
			let minDistance = Infinity;

			sections.forEach(sec => {
				const rect = sec.getBoundingClientRect();
				const distance = Math.abs(rect.top - window.innerHeight * 0.2);

				if (distance < minDistance) {
					minDistance = distance;
					closest = sec;
				}
			});

			activeElem.set(closest);

			console.log($activeElem)
		}

		window.addEventListener("scroll", updateActiveSection);
		updateActiveSection(); // Initialize on load

		return () => window.removeEventListener("scroll", updateActiveSection);
	});

</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section id = 'page'>


	<section class = 'splash'>
		<img src = 'smiley.png' id = 'logo' alt = 'Logo'>
		<h1> Heewon </h1>
		<h2> Design Engineer (+ occasional artist) </h2>

		<div id = 'search'>
			<input placeholder = 'Search...'>
		</div>

	</section>


	{#each data.posts as link, i}

		<section id = '{link.meta.title}' class = 'sec r{link.meta.rating} {link.meta.type}'>

			<hgroup>
				<div class = 'header'>
					<div class = 'title'>
						<h1> {link.meta.title} </h1>
						{#each link.meta.tags as tag, j}
							<div class = 'tag'>
								{#if tagIcon(tag)}
									<img src = 'icon/{tagIcon(tag)}.svg' class = 'icon' alt = 'icon'>
								{/if}
								<h2> {titleCase(tag)} </h2>
							</div>
						{/each}
					</div>
					<h2> {link.meta.description} </h2>
					<h3> {link.meta.type} </h3>
					<p> {link.meta.blurb} </p>
					<div class = 'tags'>
						{#each link.meta.categories as cat, j}
							<div class = 'tag'>
								{#if tagIcon(cat)}
									<img src = 'icon/{tagIcon(cat)}.svg' class = 'icon' alt = 'icon'>
								{/if}
								<h2> {titleCase(cat)} </h2>
							</div>
						{/each}
					</div>
				</div>

				<div class = 'top'>
					<button on:click = {() => {goto('/' + link.slug)}}>
						<h2>
							View >
						</h2>
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

		hgroup{
			display: flex;
			justify-content: space-between;

			.header{

				.title{
					display: flex;
					align-items: center;
					gap: 12px;
					h2{
						margin: 0;
					}

				}

				h1{
					font-size: 32px;
					font-weight: 700;
					letter-spacing: -.7px;
					text-align: left;
					margin-bottom: 4px;
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
					font-weight: 450;
					letter-spacing: -.3px;
					margin: 12px 0;
				}

				.tags{
					display: flex;
					gap: 8px;
					margin: 20px 0;
					.tag{
						display: flex;
						gap: 6px;
						background: white;
						padding: 6px 8px;
						border-radius: 10px;
						box-shadow: 0 4px 12px rgba(black, .08);
						align-items: center;
						.icon{
							height: 14px;
						}
						h2{
							font-size: 14px;
							letter-spacing: -.25px;
							color: #030025;
							margin: 0;
						}
					}
				}
			}

		}

		.banner{
			width: 100%;
			aspect-ratio: 1;
			background-size: cover;
			border-radius: 10px;
			//display: none;
			background-color: rgba(white, .75);
		}

		&.r3{
			hgroup{
				.header{
					h1{
						font-size: 28px;
						font-weight: 700;
					}
					h2{
						font-size: 16px;
						font-weight: 550;
					}
				}
			}

			.banner{
				aspect-ratio: 5/3;
			}
		}
		&.r2{
			.banner{
				aspect-ratio: 5/2;
			}
		}

		&.game{
			display: flex;
			gap: 24px;
			justify-content: space-between;
			hgroup{
				display: block;
				//flex-direction: column;
			}
			.banner{
				width: 70%;
				flex-shrink: 0;
			}
			;
		}
	}

	.splash{
		height: 70vh;

		display: flex;
		flex-direction: column;
		justify-content: center;

		#logo{
			height: 100px;
			width: 100px;
			border-radius: 50px;
			margin-bottom: 20px;
		}

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

	@media screen and (max-width: 768px){

		#page{
			width: 100%;
		}

		.sec{
			padding: 24px;

			hgroup{
				display: block;
			}
		}
	}


</style>
