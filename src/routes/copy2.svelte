<script>
	import Counter from './Counter.svelte';
	import Navbar from './Navbar.svelte';
	import welcome from '$lib/images/svelte-welcome.webp';
	import welcomeFallback from '$lib/images/svelte-welcome.png';
	import * as Config from '$lib/config.ts'
	import { activeElem, activeObject, themeColor } from '$lib/store'
    import { goto } from '$app/navigation';
	import { titleCase, tagIcon, Class, Id } from '$lib/utils'
	import { onMount } from 'svelte'
	import NumberFlow, { continuous } from '@number-flow/svelte'
	import {
		blur,
		crossfade,
		draw,
		fade,
		fly,
		scale,
		slide
	} from 'svelte/transition';


	export let data

	let Scroll, Bar;
	let splash = false

	themeColor.set('f3f4f7')
	//themeColor.set('ffffff')

	//themeColor.set('e0e0e0')

	let view = 1
	let val = 0

	setTimeout(() => {
		val = 17945
	}, 400);

	onMount(() => {
		let sections = document.querySelectorAll(".sec");

		function updateActiveSection() {

			// Update Active
			let closest = null;
			let object = null
			let minDistance = Infinity;


			sections.forEach((sec, index) => {
				const rect = sec.getBoundingClientRect();
				const distance = Math.abs(rect.top + window.innerHeight * .25);
				const dist2 = rect.top;
				let height = rect.bottom - rect.top;

				const inView = rect.top - 200 < window.innerHeight && rect.top + height > 0;
				const hgroup = document.querySelectorAll('hgroup')[index];

				if (inView) {
					// Animation intensity control (adjust this value to control overall animation strength)
					const intensityFactor = 0.8; // 0 = no animation, 1 = full animation

					// Handle hgroup normally - keep it readable
					hgroup.style.position = 'sticky';
					hgroup.style.top = '0px';
					hgroup.style.transform = '';

					// Get banner element
					const banner = sec.querySelector('.banner');
					if (banner) {
						// Calculate scroll position relative to viewport
						const scrollProgress = rect.top / window.innerHeight;

						// Each section gets a unique rotation pattern based on its index
						const sectionIndex = Array.from(sections).indexOf(sec);
						const patternOffset = sectionIndex * Math.PI / 2; // Creates different starting points

						// Different animation patterns for each section
						const patterns = {
							rotateX: Math.sin(scrollProgress + patternOffset) * 15 * intensityFactor,
							rotateY: Math.cos(scrollProgress + patternOffset) * 20 * intensityFactor,
							translateZ: (Math.sin(scrollProgress * 2 + patternOffset) * 50) * intensityFactor,
							scale: 0.9 + (Math.cos(scrollProgress + patternOffset) * 0.1) * intensityFactor
						};

						// Additional unique movements based on section index
						const uniqueEffects = {
							0: `rotateZ(${Math.sin(scrollProgress) * 5 * intensityFactor}deg)`,
							1: `skewY(${Math.cos(scrollProgress) * 3 * intensityFactor}deg)`,
							2: `translateX(${Math.sin(scrollProgress) * 20 * intensityFactor}px)`,
							3: `scale(${1 + Math.sin(scrollProgress) * 0.05 * intensityFactor})`
						};

						// Apply transforms with smooth transitions
						banner.style.transform = `
							perspective(1200px)
							rotateX(${patterns.rotateX}deg)
							rotateY(${patterns.rotateY}deg)
							translateZ(${patterns.translateZ}px)
							scale(${patterns.scale})
							${uniqueEffects[sectionIndex % 4] || ''}
						`;

						banner.style.transformOrigin = 'center center';
						banner.style.transformStyle = 'preserve-3d';
						banner.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

						// Depth and focus effects
						const depthFactor = Math.max(0.85, 1 - Math.abs(scrollProgress * 0.2) * intensityFactor);
						banner.style.opacity = depthFactor;
						banner.style.filter = `blur(${Math.abs(scrollProgress) * 2 * intensityFactor}px)`;
					}

				} else {
					// Reset styles when not in view
					hgroup.style.position = 'relative';
					hgroup.style.transform = '';

					const banner = sec.querySelector('.banner');
					if (banner) {
						banner.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)';
						banner.style.opacity = '1';
						banner.style.filter = 'blur(0px)';
					}
				}

				if (distance < minDistance) {
					minDistance = distance;
					closest = sec;
					object = data.posts[index];
				}
			});

			activeElem.set(closest);
			activeObject.set(object)


			if ($activeObject && $activeObject.meta.color){
				themeColor.set(object.meta.color)
			}
			else{
				themeColor.set('f3f4f7')
				themeColor.set('ffffff')
			}
			if (document.documentElement.scrollTop < window.innerHeight*.5){
				themeColor.set('f3f4f7')
				themeColor.set('ffffff')
				activeObject.set(null)
			}

			let scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
			let scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
			let percent = (scrollTop / scrollHeight);

			if (Bar && Scroll){
				Bar.style.height = Scroll.getBoundingClientRect().height * percent + 'px'
			}

			// Parallax

			let pieces = document.querySelectorAll('.piece')
			pieces.forEach((piece, index) => {
				piece.style.top = document.documentElement.scrollTop * -.25 + 200 + 'px'
			})
		}


		window.addEventListener("scroll", updateActiveSection);
		updateActiveSection(); // Initialize on load

		for (let i=0; i<Class('banner').length; i++){
			let div = Class('banner')[i]
			let rect = div.getBoundingClientRect()
			let mid = window.innerHeight/2
		}

		setTimeout(() => {
			splash = true

			updateActiveSection()
		}, 20);
		setTimeout(() => {
			sections = document.querySelectorAll(".sec");
			updateActiveSection()
		}, 100);

		return () => window.removeEventListener("scroll", updateActiveSection);

	});


</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Heewon's Portfolio" />
	<link rel="icon" href="smiley.png" />
</svelte:head>

{#if splash}
<section id = 'app' in:fade={{duration: 100}}>

	<div id = 'top'> </div>
	<div id = 'sidebar'>

	</div>

	<div id = 'scroll' bind:this={Scroll}>
		<div id = 'bar' bind:this={Bar}></div>
	</div>

	<section class = 'splash'>
		<img src = 'smiley.svg' id = 'logo' alt = 'Logo'
			in:fly={{y: 100, duration: 400, delay: 100}}>
		<img src = 'ahnheewon3.png' id = 'ahw' alt = 'Logo'
			in:fly={{y: 100, duration: 400, delay: 150}}>
		<img src = 'bidam.png' id = 'bidam' class = 'piece' alt = 'Logo'
			in:fly={{y: 100, duration: 400, delay: 300}}>
		<img src = 'chunchu.png' id = 'chunchu' class = 'piece' alt = 'Logo'>

		<div id = 'card' class = 'piece'>
			<NumberFlow
				value={val}
				format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }}
				plugins={[continuous]}
				class='number'
				transformTiming={{
					// Used for layout-related transforms:
					duration: 1800,
					easing: 'linear(0, 0.0012, 0.0048 0.97%, 0.0195 2.03%, 0.0446 3.19%, 0.0806 4.48%, 0.1581 6.77%, 0.3679 12.32%, 0.469 15.16%, 0.5199 16.71%, 0.5665, 0.6097, 0.6496 21.26%, 0.6876, 0.7222 24.42%, 0.7541 26.03%, 0.7833 27.68%, 0.8104 29.39%, 0.8352 31.16%, 0.8575 32.97%, 0.8779 34.87%, 0.897 36.93%, 0.9142 39.13%, 0.9292 41.42%, 0.9424 43.84%, 0.9539 46.42%, 0.9637 49.16%, 0.972 52.13%, 0.979 55.39%, 0.9888 62.39%, 0.995 71.16%, 0.9983 82.61%, 0.9997 100%)'
				}}
			/>
		</div>

		<div class = 'expo'>
			<h1> Heewon </h1>
			<h2 in:fly={{y: 100, duration: 400, delay: 200}}>
				Designer + Webdev
			</h2>
			<p in:fly={{y: 100, duration: 400, delay: 250}}>
				Hi! I'm a designer / engineer focused on bringing more creative art to the web.
			</p>
			<p in:fly={{y: 100, duration: 400, delay: 300}}>
				I also draw comics & concept art
			</p>
		</div>

		<button id = 'cta'>
			<h2> View Projects </h2>
		</button>

		<div id = 'search'>
			<input placeholder = 'Search...'>
		</div>

	</section>


	<div id = 'flex'>
		<section id = 'page'>
			<section id = 'sections' class:list={view == 2}>

			{#each data.posts as link, i}

				{#if i == 0 || i > 0 && link.meta.type != data.posts[i-1].meta.type }
					<div class = 'head'>
						<h1> {titleCase(link.meta.type)} </h1>
					</div>
				{/if}


				<section
					id = '{link.meta.title}'
					class = 'sec r{link.meta.rating} {link.meta.type}'
					>

					<hgroup class = 'hgroup'>
						<div class = 'header'>
							{#if link.meta.card}
									<img src = 'card/{link.meta.card}.png' alt = 'card' class = 'card'>
								{/if}
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
							<div class = 'type'>
								<h3> {link.meta.type} </h3>
							</div>
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
						<!--
						<div class = 'banner' style = 'background-image: url(bento/{link.meta.preview}.svg)'></div>
						-->
						<img src = 'bento/{link.meta.preview}.svg' class = 'banner' alt = 'banner'>
					{/if}


					<div class="prose preview prose-img">
						<svelte:component this={link.content} />
					</div>

				</section>

			{/each}
			</section>


		</section>

		<div id = 'navbar'>
			<Navbar />
			<div id = 'scroll' bind:this={Scroll}>
				<div id = 'bar' bind:this={Bar}></div>
			</div>
		</div>
	</div>
</section>
{/if}

<style lang="scss">

	:global(number-flow-svelte) {
		--number-flow-char-height: 0.85em;
		font-size: 44px;
		font-weight: -4px;
		font-weight: 800;
		font-family: 'Inter', sans-serif;
	}

	#app{
		//display: flex;
		width: 100%;
		width: 99vw;
		margin: auto;
	}

	#flex{
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: space-between;
		width: 95%;
		margin: auto;
		//border: 3px solid rgba(white, .25);

		//background: rgba(white, .5);
		border-radius: 8px;
		//box-shadow: -20px 10px 100px rgba(#030025, .15);
		transition: .1s ease;
		//perspective: 800px;
	}

	#navbar{
		position: sticky;
		top: 6px;
		height: 100vh;
	}


	#scroll{
		position: sticky;
		top: 10px;
		width: 10px;
		height: calc(100vh - 24px);
		margin: 8px;
		margin-right: 12px;
		background: rgba(#030025, .3);
		background: white;
		border-radius: 20px;
		margin-top: 90vh;
		overflow: hidden;
		display: none;

		#bar{
			position: absolute;
			top: 0;
			left: 0;
			width: 10px;
			height: 36px;
			background: black;
			border-radius: 20px;
			transition: .1s ease;

			&::after{
				content: '';
				position: absolute;
				bottom: 2px;
				left: 1.5px;
				background: white;
				width: 5px;
				height: 5px;
				border-radius: 4px;
			}
		}
	}



	#sidebar{
		width: 140px;
		height: calc(100vh - 52px);
		padding: 24px;
		position: sticky;
		top: 0;
		display: none;

		p{
			font-size: 12px;
			text-wrap: wrap;
		}
	}

	.rating{
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 24px;
		h2{
			font-size: 14px;
		}
		.bar{
			width: 100px;
			height: 8px;
			background: black;
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
		display: none;
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

	#page{

	}

	#sections{
		flex: 1;
		margin: auto;

		&.list{
			.sec{
				padding: 12px;
				hgroup{
					display: flex;
					align-items: flex-start;
					width: 100%;
					.header{
						.title{
							h1{
								font-size: 22px;
							}
						}
					}
					.top{
						margin: 0;
						padding: 0 20px;
					}
					.tags{
						margin: 0;
					}
				}
			}
			.banner{
				display: none;
			}
		}
	}

	.head{
		position: sticky;
		top: 10px;
		width: 160px;
		border-radius: 8px;
		padding: 10px;
		z-index: -1;
		margin: 10px 0 0 0px;
		h1{
			font-size: 20px;
			font-weight: 750;
			letter-spacing: -.5px;
			margin: 0;
			text-align: left;
		}
	}

	.sec{
		padding: 0px 20px 0px 0px;
		border-radius: 8px;
		transition: .2s ease;
		margin: 20px 40px 0 10px;
		display: flex;
		flex-direction: row;
		gap: 24px;
		justify-content: left;
		transition: .2s ease;

		.banner{
			border-radius: 0px;
			width: calc(100% - 240px);
			//width: 75%;
			margin: 20px auto;
			border-radius: 16px;
			transition: .2s ease;

			/*
			background: rgba(white, .5);
			border: 1px solid rgba(white, .2);
			border-radius: 18px;
			padding: 24px;
			*/

			filter: drop-shadow(-10px 20px 30px rgba(black, .15));
		}

		hgroup{
			position: sticky;
			align-self: flex-start;

			width: 160px;
			z-index: 3;

			top: 72px;
			flex-shrink: 0;
			overflow: hidden;
			padding: 20px;
			border-radius: 8px;
			background: rgba(white, 1);
			transition: .2s ease;

			.header{
				width: 100%;
				height: 100%;

				.card{
					display: none;
				}
				img{
					width: 100%;
					border-radius: 4px;
					margin-bottom: 18px;
				}

				.title{
					align-items: center;
					gap: 12px;
					h2{
						margin: 0;
					}

				}

				h1{
					font-size: 24px;
					font-weight: 750;
					line-height: 100%;
					letter-spacing: -.7px;
					text-align: left;
					margin-bottom: 8px;
					color: rgba(#030025, .75);
				}

				h2{
					font-size: 14px;
					font-weight: 550;
					line-height: 120%;
					color: rgba(#030025, .4);
					letter-spacing: -.4px;
					text-align: left;
					margin-bottom: 20px;
				}

				h3{
					display: none;
				}

				p{
					font-size: 12px;
					font-weight: 450;
					letter-spacing: -.3px;
					margin: 12px 0;
					line-height: 140%;
					color: rgba(#030025, .6);
				}

				.tags{
					display: flex;
					flex-wrap: wrap;
					gap: 8px;
					margin: 20px 0;
					.tag{
						display: flex;
						align-items: center;
						gap: 6px;
						background: white;
						padding: 6px 8px;
						border-radius: 10px;
						box-shadow: 0 4px 12px rgba(black, .1);

						background:rgb(29, 26, 60);

						//border: 1px solid rgba(black, .1);

						transition: .2s ease;
						cursor: pointer;
						.icon{
							height: 14px;
							margin: 0;
							border-radius: 0;
						}
						h2{
							font-size: 12px;
							font-weight: 550;
							letter-spacing: -.1px;
							color: rgba(#030025, .6);
							margin: 0;
							padding: 0;

							color: white;
						}
						&:hover{
							box-shadow: 0 5px 12px rgba(black, .12);
							transform: translateY(-1px);
						}
					}
				}
			}

			.top{
				display: none;
				flex-direction: column;
				//align-items: flex-end;
				gap: 8px;

				margin-top: 48px;
			}

		}
	}

	.splash{
		height: 90vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		position: relative;
		padding: 0px;

		.piece{
			height: 400px;
			position: absolute;
			top: 50px;
			z-index: -2;
			filter: drop-shadow(-10px 20px 30px rgba(#030025, .15));
		}

		#bidam{
			right: 30px;
		}

		#card{
			left: 20px;
			background: white;
			padding: 40px;
			height: fit-content;
			width: 220px;
			border-radius: 8px;
		}

		#chunchu{
			right: 25px;
			display: none;
		}


		#logo{
			height: 150px;
			width: 160px;
			border-radius: 50px;
			margin-bottom: 0px;
			//display: none;
		}

		#ahw{
			height: 100px;
		}


		#cta{
			margin-top: 40px;
			border-radius: 18px;
			padding: 14px 20px;
			h2{
				font-size: 18px;
				font-weight: 600;
				letter-spacing: -.25px;
			}
		}

		.expo{

			h1{
				font-size: 60px;
				font-weight: 800;
				letter-spacing: -1.8px;
				margin: 0;
				display: none;
			}
			h2{
				font-size: 24px;
				font-weight: 600;
				letter-spacing: -.8px;
				margin: 8px 0 24px 0;
				text-align: center;
			}

			p{
				font-size: 16px;
				letter-spacing: -.36px;
				text-align: center;
				margin-top: 10px;
				line-height: 130%;
				max-width: 400px;
			}
		}


	}

	@media screen and (max-width: 768px){

		#page{
			width: 100%;
		}

		#scroll{
			margin: 0;
		}

		.sec{
			padding: 0px;
			display: inline;

			hgroup{
				display: block;
				position: sticky;
				top: 0;
				align-self: flex-start;
				width: 100%;
				padding: 16px;


				.header{
					h1{
						font-size: 18px;
						margin-bottom: 6px;
					}
					h2{
						font-size: 14px;
					}
				}

				.top{
					display: none;
				}
			}

			.banner{
				width: 102%;
				transform: translateX(-1%);
			}
		}
	}


</style>
