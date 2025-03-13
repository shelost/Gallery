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

	let Scroll, Bar, App, Flex;
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

				} else {
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
			const parallax = 0.1 // Controls separation between scroll speeds
			pieces.forEach((piece, index) => {
				const scrollSpeed = -.2 - (index * parallax) // Each piece scrolls progressively faster
				piece.style.top = document.documentElement.scrollTop * scrollSpeed + 200 + 'px'
			})
			let flex = document.querySelector('#flex')
			if (flex) {
				const flexRect = flex.getBoundingClientRect();
				const viewportHeight = window.innerHeight;
				const flexVisibleRatio = (viewportHeight - flexRect.top) / viewportHeight;
				const scale = Math.min(1, 0.8 + (0.2 * Math.max(0, flexVisibleRatio)));

				// Only apply transformations when not fully visible or scrolling back up
				if (flexVisibleRatio < 1) {
					// Calculate rotation angle from 45 degrees to 0 degrees based on visibility
					const rotateX = 30 * (1 - Math.max(0, flexVisibleRatio));
					// Add slight skew that reduces as the element becomes more visible
					const skewY = 10 * (1 - Math.max(0, flexVisibleRatio));

					// skewY(${skewY}deg

					flex.style.transform = `scale(${scale}) rotate3d(5, 2, -1, ${rotateX}deg) perspective(800px)`;
					flex.style.transformOrigin = 'center top';
					flex.style.perspective = '1000px';
				} else {
					// Reset transforms when fully visible
					flex.style.transform = '';
					flex.style.transformOrigin = 'center top';
					flex.style.perspective = 'none';
				}
			}
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
<section id = 'app' bind:this={App}>



	<section class = 'splash'>


		<img src = 'bidam.png' id = 'bidam' class = 'piece' alt = 'Logo'
			in:fly={{y: 100, duration: 400, delay: 300}}>
		<img src = 'heewon9.png' id = 'chunchu' class = 'piece' alt = 'Logo'>

		<video id = 'video' class = 'piece' alt = 'Logo' autoplay muted playsinline>
			<source src = 'bidam.mp4' type = 'video/mp4'>
		</video>

		<div id = 'card' class = 'piece'>
			<h2> Total Earned </h2>
			<NumberFlow
				value={val}
				format={{ trailingZeroDisplay: 'stripIfInteger' }}
				plugins={[continuous]}
				class='number'
				transformTiming={{
					// Used for layout-related transforms:
					duration: 1800,
					easing: 'linear(0, 0.0012, 0.0048 0.97%, 0.0195 2.03%, 0.0446 3.19%, 0.0806 4.48%, 0.1581 6.77%, 0.3679 12.32%, 0.469 15.16%, 0.5199 16.71%, 0.5665, 0.6097, 0.6496 21.26%, 0.6876, 0.7222 24.42%, 0.7541 26.03%, 0.7833 27.68%, 0.8104 29.39%, 0.8352 31.16%, 0.8575 32.97%, 0.8779 34.87%, 0.897 36.93%, 0.9142 39.13%, 0.9292 41.42%, 0.9424 43.84%, 0.9539 46.42%, 0.9637 49.16%, 0.972 52.13%, 0.979 55.39%, 0.9888 62.39%, 0.995 71.16%, 0.9983 82.61%, 0.9997 100%)'
				}}
			/>
		</div>

		<div class = 'screen'>
			<img src = 'smiley.svg' id = 'logo' alt = 'Logo'
				in:fly={{y: 100, duration: 400, delay: 100}}>

			<img src = 'heewon9.png' id = 'pfp' alt = 'Logo'
				in:fly={{y: 100, duration: 400, delay: 150}}>
			<img src = 'ahnheewon3.png' id = 'ahw' alt = 'Logo'
				in:fly={{y: 100, duration: 400, delay: 150}}>
			<div class = 'expo'>
				<h1> Creating Designs and Websites </h1>
				<div class = 'status' in:fly={{y: 100, duration: 400, delay: 200}}>
					<div class = 'dot'></div>
					<h2>
						Building...
					</h2>
				</div>
				<p in:fly={{y: 100, duration: 400, delay: 250}}>
					Hi! I'm a Design Engineer who's exploring ways to build more creative web apps.
				</p>
				<p in:fly={{y: 100, duration: 400, delay: 300}}>
					I also work for <a href = 'https://stan.store'>startups</a>, draw <a href = ''>comics</a>, and write <a href = ''>essays</a>.
				</p>
				<p in:fly={{y: 100, duration: 400, delay: 350}}>
					Let's work together! You can reach me at <a href = 'mailto:h@ahnheewon.com'>h@ahnheewon.com</a>.
				</p>

			</div>

		</div>

		<button id = 'cta' on:click = { () => {document.documentElement.scrollTo({top: Flex.getBoundingClientRect().top, behavior: 'smooth'})}}>
			<h2> View Projects </h2>
		</button>

		<div id = 'search'>
			<input placeholder = 'Search...'>
		</div>

	</section>


	<div id = 'flex' bind:this={Flex}>

		<div id = 'top'>
			<h2> My Projects </h2>
		</div>

		<div id = 'sidebar'>
			{#if $activeObject}
				<div class = 'info'>
					{#if $activeObject.meta.card}
							<img src = 'card/{$activeObject.meta.card}.png' alt = 'card' class = 'card'>
						{/if}
					<div class = 'title'>
						<h1> {$activeObject.meta.title} </h1>
						{#each $activeObject.meta.tags as tag, j}
							<div class = 'tag'>
								{#if tagIcon(tag)}
									<img src = 'icon/{tagIcon(tag)}.svg' class = 'icon' alt = 'icon'>
								{/if}
								<h2> {titleCase(tag)} </h2>
							</div>
						{/each}
					</div>
					<h2> {$activeObject.meta.description} </h2>
					<div class = 'type'>
						<h3> {$activeObject.meta.type} </h3>
					</div>
					<p> {$activeObject.meta.blurb} </p>
					<div class = 'tags'>
						{#each $activeObject.meta.categories as cat, j}
							<div class = 'tag'>
								{#if tagIcon(cat)}
									<img src = 'icon/{tagIcon(cat)}.svg' class = 'icon' alt = 'icon'>
								{/if}
								<h2> {titleCase(cat)} </h2>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

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
						<img src = 'bento/{link.meta.preview}.svg' class = 'banner' alt = 'banner'>
						<div class = 'gradient'></div>
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
		</div>
	</div>

	<div id = 'scroll' bind:this={Scroll}>
		<div id = 'bar' bind:this={Bar}></div>
	</div>
</section>

<section id = 'footer'>
	<h3>
		Copyright 2025 ahnheewon. All rights reserved.
	</h3>
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
		//width: clamp(50vw, 1200px, 99vw);
		width: 100%;
		margin: auto;
	}

	#flex{
		position: relative;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: space-between;
		width: 100%;
		margin: auto;
		gap: 36px;

		//border: 3px solid rgba(white, .25);
		//background: rgba(white, .8);
		//box-shadow: -20px 10px 100px rgba(#030025, .15);
		border-radius: 8px;
		transition: .1s ease;

		#top{
			position: absolute;
			top: 0;
			left: 0;
			height: 60px;
			width: 100%;
			background: white;
			display: none;
		}
	}

	#navbar{
		position: sticky;
		top: 6px;
		height: 100vh;

		display: flex;
	}


	#scroll{
		position: sticky;
		top: 0px;
		width: 8px;
		height: calc(100vh - 24px);
		margin: 4px;
		background: rgba(#030025, .3);
		background: rgba(#030025, .15);
		border-radius: 20px;
		display: block;
		overflow: hidden;

		display: none;

		#bar{
			position: absolute;
			top: 0;
			left: 0;
			width: 8px;
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

		.info{
			transition: .2s ease;
		}

		.card{
			width: 100%;
		}

		#title{
			font-size: 20px;
			font-weight: 650;
			line-height: 105%;
			margin-bottom: 12px;
		}

		p{
			font-size: 12px;
			letter-spacing: -.2px;
			text-wrap: wrap;
			line-height: 120%;
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

		width: 950px;

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

		width: 160px;
		border-radius: 8px;
		padding: 10px;
		z-index: -1;
		margin: 10px 0 0 0px;
		display: none;
		h1{
			font-size: 20px;
			font-weight: 750;
			letter-spacing: -.5px;
			margin: 0;
			text-align: left;
		}
	}

	.sec{
		position: relative;
		border-radius: 8px;
		transition: .2s ease;
		//margin: 20px 40px 0 10px;
		//margin: 20px auto;
		display: flex;
		flex-direction: column;
		gap: 40px;
		justify-content: left;
		transition: .2s ease;

		background: rgba(white, .9);
		box-shadow: -30px 30px 80px rgba(black, .12);
		margin-top: 24px;
		//padding-bottom: 40px;


		.banner{
			border-radius: 0px;
			width: calc(100% - 80px);
			//width: 100%;
			margin: 0px auto 30px auto;
			border-radius: 16px;
			transition: .2s ease;
			filter: drop-shadow(-20px 30px 20px rgba(#030025, .15));
		}

		.gradient{
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 240px;
			border-radius: 8px;
			background: linear-gradient(to bottom, rgba(white, 0), rgba(white, 1) 80%);
		}


		hgroup{
			position: sticky;
			align-self: flex-start;
			z-index: 3;

			display: flex;
			align-items: center;
			gap: 12px;
			width: 100%;
			top: -4px;

			flex-shrink: 0;
			overflow: hidden;
			padding: 16px 0 12px 0;

			border-radius: 6px;
			background: rgba(white, 1);
			//box-shadow: 0 4px 24px rgba(black, .1);
			transition: .2s ease;


			.header{
				width: 100%;
				height: 100%;
				display: flex;
				align-items: center;
				gap: 6px;
				padding-left: 14px;

				img{
					width: 100%;
					border-radius: 4px;
					margin-bottom: 18px;
				}

				.card{
					width: 36px;
					height: 36px;
					background: red;
					border-radius: 6px;
					margin: 0;
					margin-right: 6px;
				}

				.title{
					display: flex;
					align-items: center;
					gap: 12px;
					h2{
						margin: 0;
					}

				}

				.tags{
					display: none;
				}

				h1{
					font-size: 18px;
					font-weight: 600;
					line-height: 100%;
					letter-spacing: -.5px;
					text-align: left;
					margin: 0;
					color: rgba(#030025, .9);
				}

				h2{
					font-size: 18px;
					font-weight: 550;
					line-height: 100%;
					letter-spacing: -.5px;
					text-align: left;
					margin: 0;
					color: rgba(#030025, .4);
				}

				h3{
					display: none;
				}

				p{
					font-size: 12px;
					font-weight: 450;
					letter-spacing: -.3px;
					margin: 0px 0;
					line-height: 140%;
					color: rgba(#030025, .6);
					display: none;
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

	.tags{
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 0px 0;
		.tag{
			display: flex;
			align-items: center;
			gap: 6px;
			background: white;
			padding: 6px 10px;
			border-radius: 16px;
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


	.splash{
		height: 90vh;
		max-height: 900px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		position: relative;
		padding: 0px;

		.piece{
			width: 300px;
			position: absolute;
			top: 50px;
			border-radius: 8px;
			z-index: 1;
			filter: drop-shadow(-10px 20px 30px rgba(#030025, .15));
			transition: .2s ease;
			display: none;

			&:hover{
				transform: scale(1.02);
			}
		}

		#bidam{
			right: calc(50% - 600px);
			width: 350px;
		}

		#card{
			left: calc(50% - 500px);
			margin-top: -100px;

			background: white;
			padding: 24px;
			height: fit-content;
			width: 200px;
			border-radius: 8px;
		}

		#video{
			right: calc(50% - 600px);
			margin-top: -150px;
			mix-blend-mode: multiply;
			filter: none;
			z-index: -2;
		}

		#chunchu{
			width: 250px;
			left: calc(50% - 600px);
			margin-top: 100px;
		}

		#cta{
			margin-top: 32px;
			border-radius: 24px;
			padding: 11px 18px 12px 18px;
			h2{
				font-size: 15px;
				font-weight: 550;
				letter-spacing: -.15px;
			}
		}

		#logo{
			height: 140px;
			border-radius: 50px;
			margin-bottom: -20px;
			display: none;
		}

		#ahw{
			height: 100px;
		}

		.screen{
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: flex-start;

			background-image: none;
			background-size: cover;
			background-position: center;
			background-repeat: no-repeat;

			border-radius: 16px;
			padding: 24px;

			overflow: hidden;

			#pfp{
				height: 180px;
				border-radius: 200px;
				margin-bottom: 20px;
				box-shadow: -10px 10px 40px rgba(black, .25);
				display: none;
			}

			.expo{
				/*
				background: white;
				padding: 24px;
				border-radius: 24px;
				border: 8px solid white;
				box-shadow: -10px 20px 60px rgba(#030025, .25);
*/
				h1{
					font-size: 60px;
					font-weight: 800;
					letter-spacing: -1.8px;
					margin: 0;
					display: none;
				}
				h2{
					font-size: 15px;
					font-weight: 650;
					letter-spacing: -.5px;
					text-align: center;
					color: rgba(#030025, .85);
				}

				.status{
					background: rgba(rgb(24, 220, 24), .1);
					padding: 8px 10px;
					border-radius: 8px;
					display: flex;
					align-items: center;
					gap: 8px;
					width: fit-content;
					margin: 16px auto 32px auto;
					.dot{
						width: 10px;
						height: 10px;
						border-radius: 8px;
						background: rgb(0, 212, 0);
						transition: .1s ease;
						animation: flicker .7s infinite alternate-reverse;

					}
				}

				p{
					font-size: 14px;
					font-weight: 500;
					letter-spacing: -.4px;
					text-align: center;
					margin-top: 16px;
					line-height: 120%;
					max-width: 360px;
				}
			}
		}
	}

	#footer{
		margin: auto;
		width: 100%;
		padding: 160px 0 80px 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;

		h3{
			font-size: 14px;
			font-weight: 500;
			letter-spacing: -.4px;
			color: rgba(#030025, .6);
		}
	}

	@keyframes flicker{
		from{
			opacity: .6;
			transform: scale(.6);
		}
		to{
			opacity: 1;
			transform: scale(1);
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
