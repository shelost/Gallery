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
		slide
	} from 'svelte/transition';

	// Variables

	export let data

	let Scroll, Bar, App, Flex, Pill, Drawer;
	let sections, previews
	let splash = writable(false)
	let view = writable(3)
	let val = 0

	let Click;

	themeColor.set('f3f4f7')

	setTimeout(() => {
		val = 17945
	}, 400);



	// Functions

	function setAnimationIndexes() {
		// Set animation indexes for staggered animations
		const sections = document.querySelectorAll('.sec');
		sections.forEach((section, index) => {
			section.style.setProperty('--index', index);
		});
	}

	function changeView(v){
		// Don't transition if we're already on this view
		if ($view === v) return;

		// Store the current active object and its position before view change
		const currentObject = $activeObject;
		let currentPosition = null;

		if (currentObject) {
			const elem = document.getElementById(currentObject.meta.title);
			if (elem) {
				const rect = elem.getBoundingClientRect();
				currentPosition = {
					id: currentObject.meta.title,
					top: rect.top,
					viewportHeight: window.innerHeight
				};
			}
		}

		// Check if View Transitions API is supported
		if ('startViewTransition' in document) {
			document.startViewTransition(async () => {
				// Set the new view
				view.set(v);
				await Promise.resolve();

				// Apply staggered animations
				setAnimationIndexes();

				// After view changes, scroll to keep current project visible if we had one
				if (currentPosition) {
					setTimeout(() => {
						const targetElem = document.getElementById(currentPosition.id);
						if (targetElem) {
							// Calculate how to position the element similarly in the viewport
							const newRect = targetElem.getBoundingClientRect();
							const scrollAdjustment = newRect.top - currentPosition.top;

							// Smooth scroll to the adjusted position
							window.scrollBy({
								top: scrollAdjustment,
								behavior: 'smooth'
							});
						}
					}, 100);
				}
			});
		} else {
			// Fallback for browsers that don't support View Transitions
			view.set(v);
			setAnimationIndexes();

			if (currentPosition) {
				setTimeout(() => {
					const targetElem = document.getElementById(currentPosition.id);
					if (targetElem) {
						const newRect = targetElem.getBoundingClientRect();
						const scrollAdjustment = newRect.top - currentPosition.top;

						window.scrollBy({
							top: scrollAdjustment,
							behavior: 'smooth'
						});
					}
				}, 100);
			}
		}

		Click.currentTime = 0;
		Click.play();
	}

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

			if (distance < minDistance) {
				minDistance = distance;
				closest = sec;
				object = data.posts[index];
			}
		});

		// Auto-scroll for preview sections
		//const previews = document.querySelectorAll('.preview');
		/*
		previews.forEach(preview => {
			// Only set up scrolling if it has content that can be scrolled
			if (preview.scrollHeight > preview.clientHeight) {
				// Check if we already set up scrolling for this preview
				if (!preview.hasAttribute('data-auto-scroll-setup')) {
					// Clone the content for seamless looping
					const content = preview.innerHTML;
					//preview.innerHTML = content + content;
					preview.insertAdjacentHTML('beforeend', content);

					// Set up the scrolling animation
					let scrollPos = 0;
					const scrollSpeed = 1; // pixels per frame

					function autoScroll() {
						scrollPos += scrollSpeed;

						// Reset when we've scrolled through the first copy of content
						if (scrollPos >= preview.scrollHeight / 2 - 10) {
							scrollPos = 0;
							preview.scrollTop = 0;
						}

						preview.scrollTop = scrollPos;
						requestAnimationFrame(autoScroll);
					}

					// Start the animation
					requestAnimationFrame(autoScroll);

					// Mark this preview as having scroll set up
					preview.setAttribute('data-auto-scroll-setup', 'true');
				}
			}
		});
		*/


		// Reactivity
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

		// Scrollbar
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
		/*
		if (flex) {
			const flexRect = flex.getBoundingClientRect();
			const viewportHeight = window.innerHeight;
			const flexVisibleRatio = (viewportHeight - flexRect.top) / viewportHeight;
			const scale = Math.min(1, 0.8 + (0.2 * Math.max(0, flexVisibleRatio)));

			// Only apply transformations when not fully visible or scrolling back up
			if (flexVisibleRatio < 1 && window.innerWidth > 800) {
				const rotateX = 30 * (1 - Math.max(0, flexVisibleRatio));
				const skewY = 10 * (1 - Math.max(0, flexVisibleRatio));

				//flex.style.transform = `scale(${scale}) rotate3d(5, 2, -1, ${rotateX}deg) perspective(800px)`;
				flex.style.transform = `scale(${scale})`;
				flex.style.transformOrigin = 'center top';
				flex.style.perspective = '1000px';
			} else {
				// Reset transforms when fully visible
				flex.style.transform = '';
				flex.style.transformOrigin = 'center top';
				flex.style.perspective = 'none';
			}
		}
		*/
	}



	// Mounted

	onMount(() => {
		initElems()

		loading.subscribe(v => {
			setTimeout(() => {
				changeView(3)
				setAnimationIndexes();

				let elem = Class('v3')[0]
				let container = Id('view').getBoundingClientRect()
				let rect = elem.getBoundingClientRect()

				Pill.style.position = 'fixed'
				Pill.style.top = rect.top - container.top - 3 + 'px'
				Pill.style.left = rect.left - container.left - 3 + 'px'
				Pill.style.width = rect.width + 'px'
				Pill.style.height = rect.height + 'px'

			}, 500);
		})

		view.subscribe(v => {
			let elem = Class(`v${v}`)[0]

			if (!elem){
				console.log(Class('view'))
				return
			}

			let container = Id('view').getBoundingClientRect()
			let rect = elem.getBoundingClientRect()

			// Use View Transitions API for the pill animation if available
			if ('startViewTransition' in document) {
				document.startViewTransition(() => {
					Pill.style.position = 'fixed'
					Pill.style.top = rect.top - container.top - 3 + 'px'
					Pill.style.left = rect.left - container.left - 3 + 'px'
					Pill.style.width = rect.width + 'px'
					Pill.style.height = rect.height + 'px'
				});
			} else {
				Pill.style.position = 'fixed'
				Pill.style.top = rect.top - container.top - 3 + 'px'
				Pill.style.left = rect.left - container.left - 3 + 'px'
				Pill.style.width = rect.width + 'px'
				Pill.style.height = rect.height + 'px'
			}
		})

		window.addEventListener("scroll", updateActiveSection);
		updateActiveSection(); // Initialize on load

		function initElems(){
			sections = document.querySelectorAll(".sec");
			previews = document.querySelectorAll(".preview");
		}

		for (let i=0; i<Class('banner').length; i++){
			let div = Class('banner')[i]
			let rect = div.getBoundingClientRect()
			let mid = window.innerHeight/2
		}

		setTimeout(() => {
			splash.set(true)
			updateActiveSection()
		}, 200);
		setTimeout(() => {
			initElems()
			updateActiveSection()
		}, 400);
		setTimeout(() => {
			initElems()
			updateActiveSection()
		}, 5000);

		return () => window.removeEventListener("scroll", updateActiveSection);
	});

</script>

<svelte:head>
	<title>Heewon</title>
	<meta name="description" content="Heewon's Portfolio" />
	<meta name="view-transition" content="same-origin" />
	<link rel="icon" href="favicon.png" />
</svelte:head>


{#if !$loading}
<section id = 'app' bind:this={App} class:offset={$openDrawer}>

	<section class = 'splash'>

		<img src="bidam.png" id="bidam" class="piece" alt="Logo"
			in:fly={{y: 100, duration: 400, delay: 300}} />
		<img src="heewon9.png" id="chunchu" class="piece" alt="Logo" />

		<video id = 'video' class = 'piece' alt = 'Logo' autoplay muted playsinline>
			<source src = 'bidam.mp4' type = 'video/mp4'>
		</video>

		<div id = 'card' class = 'piece'>
			<h2> Total Earned </h2>
			<!-- Temporary replacement for NumberFlow -->
			<span class="number">{val.toLocaleString()}</span>
		</div>

		<div class = 'screen'>
			<img src="smiley.svg" id="logo" alt="Logo"
				in:fly={{y: 100, duration: 600, delay: 100}} />

			<img src="heewon9.png" id="pfp" alt="Logo"
				in:fly={{y: 100, duration: 600, delay: 100}} />
			<img src="ahnheewon3.png" id="ahw" alt="Logo"
				in:fly={{y: 100, duration: 600, delay: 100}} />
			<div class = 'expo'>
				<div class = 'tagline'
				in:fly={{y: 100, duration: 600, delay: 200}}
				>
				<!--
					<h1> Design </h1>
					<img src="arrow.svg" alt="arrow" />
					<h1> Code </h1>
					-->
					<h1> Design to Code </h1>
				</div>

				<div class = 'status' in:fly={{y: 100, duration: 600, delay: 250}}>
					<div class = 'dot'></div>
					<h2>
						Building...
					</h2>
				</div>
				<h2 in:fly={{y: 100, duration: 600, delay: 300}}>
					Web Design Studio
				</h2>
				<p in:fly={{y: 100, duration: 600, delay: 350}}>
					I also work for <a href = 'https://stan.store'>startups</a>, draw <a href = 'https://www.instagram.com/_heewonahn'>comics</a>, and write <a href = 'https://www.instagram.com/ahnheewon_comics'>essays</a>.
				</p>
				<p in:fly={{y: 100, duration: 600, delay: 400}}>
					Let's work together! You can reach me at <a href = 'mailto:h@ahnheewon.com'>h@ahnheewon.com</a>.
				</p>


			</div>

		</div>

		<button id = 'cta'
			in:fly={{y: 100, duration: 400, delay: 450}}
			on:click = { () => {document.documentElement.scrollTo({top: Flex.getBoundingClientRect().top, behavior: 'smooth'})}}>
			<h2> View Projects </h2>
		</button>

		<div id = 'search'>
			<input placeholder = 'Search...'>
		</div>

	</section>

	<div id = 'flex' bind:this={Flex} class = 'view{$view}'>

		<div id = 'top'>
			<h2> My Projects </h2>
		</div>

		<div id = 'navbar'>
			<Navbar />
		</div>

		<section id = 'page'>
			<section id = 'sections'>

			{#each data.posts as link, i}

			{#if $splash}

				{#if i == 0 || i > 0 && link.meta.type != data.posts[i-1].meta.type }
					<div class = 'head'
					in:fly={{y: 100, duration: 300, delay: 20*i}}>
						<h1> {titleCase(link.meta.type)} </h1>
					</div>
				{/if}

				<section
					id = '{link.meta.title}'
					class = 'sec r{link.meta.rating} {link.meta.type}'
					in:fly={{y: 100, duration: 300, delay: 100*i}}
					>

					<hgroup class = 'hgroup'>

						<div class = 'header'>


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
							</div>

						</div>

						<div class = 'top'>
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
							{/if}
							{#if link.meta.preview}
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

				{/if}

			{/each}
			</section>

			<div id = 'sidebar'>
				{#if $activeObject}
					<div class = 'info'>
						{#if $activeObject.meta.card}
							<img src="card/{$activeObject.meta.card}.png" alt="card" class="card" />
						{/if}
						<div class = 'title'>
							<h1> {$activeObject.meta.title} </h1>
							{#each $activeObject.meta.tags as tag, j}
								<div class = 'tag'>
									{#if tagIcon(tag)}
										<img src="icon/{tagIcon(tag)}.svg" class="icon" alt="icon" />
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
										<img src="icon/{tagIcon(cat)}.svg" class="icon" alt="icon" />
									{/if}
									<h2> {titleCase(cat)} </h2>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</section>
	</div>

	<div id = 'scroll' bind:this={Scroll}>
		<div id = 'bar' bind:this={Bar}></div>
	</div>

	<section id = 'footer'>
		<h3>
			Copyright 2025 ahnheewon. All rights reserved.
		</h3>
	</section>
</section>




{#if $openDrawer}
	<div id = 'drawer' bind:this={Drawer} transition:fly={{x: 500, duration: 400}}>
		<div class = 'drawer-top'>

			<div class = 'x' on:click = {() => {openDrawer.set(false)}}>
				<p> close </p>
			</div>

		</div>

		<h1> {$expandedPost.meta.title} </h1>

		<div class="prose">
			<svelte:component this={$expandedPost.content} />
		</div>
	</div>
{/if}



<div id = 'view' in:fly={{y: 100, duration: 500, delay: 600}} on:load = {() => {changeView(3)}}>

	<audio bind:this={Click} src="audio/click-1.mp3"></audio>

	<div id = 'pill' bind:this={Pill}></div>
	<div class = 'view v2' class:active={$view == 2} on:click = {() => {changeView(2)}}>
		<img src="view-list.svg" class="view-icon" alt="view" />
		<h2>
			List
		</h2>
	</div>

	<div class = 'view v3' class:active={$view == 3} on:click = {() => {changeView(3)}}>
		<img src="view-grid.svg" class="view-icon" alt="view" />
		<h2>
			Grid
		</h2>
	</div>

	<div class = 'view v1' class:active={$view == 1} on:click = {() => {changeView(1)}}>
		<img src="view-sections.svg" class="view-icon" alt="view" />
		<h2>
			Preview
		</h2>
	</div>

</div>
{/if}




<style lang="scss">
	// Add View Transitions styles at the top of the style section
	::view-transition-old(root),
	::view-transition-new(root) {
		animation-duration: 0.5s;
	}

	// Floating animation for the "gentle butterfly" effect
	@keyframes float {
		0% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-5px);
		}
		100% {
			transform: translateY(0px);
		}
	}

	.sec {
		view-transition-name: section-card;
		transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
			           opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1),
			           box-shadow 0.5s cubic-bezier(0.22, 1, 0.36, 1),
			           background 0.3s ease,
			           width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
		will-change: transform, opacity, width, height;
		animation: float 6s ease-in-out infinite;
		animation-delay: calc(var(--index, 0) * 0.5s);

		&:hover {
			transform: translateY(-4px);
			box-shadow: -15px 15px 40px rgba(black, .12);
			animation-play-state: paused;
		}
	}

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
		background: white;
		transition: .2s ease;
	}

	.x{
		cursor: pointer;
	}

	#drawer{
		position: fixed;
		top: 0;
		right: 0;
		width: 600px;
		padding: 40px;
		height: calc(100vh - 80px);
		overflow-y: scroll;
		z-index: 10;
		background: rgba(white, 9);
		backdrop-filter: blur(10px);
		border-radius: 8px 0 0 8px;
		box-shadow: -8px 12px 48px rgba(black, .3);
		text-align: left;
		h1{
			text-align: left;
		}
	}



	#navbar{
		position: sticky;
		top: 6px;
		height: 100vh;
		display: flex;
	}


	#scroll{
		position: fixed;
		top: 10px;
		right: 10px;
		width: 8px;
		height: calc(100vh - 24px);
		margin: 4px;
		//background: rgba(#030025, .3);
		background: rgba(#030025, .15);
		border-radius: 20px;
		display: block;
		overflow: hidden;

		#bar{
			position: absolute;
			top: 0;
			left: 0;
			width: 8px;
			height: 36px;
			//background: black;
			border-radius: 20px;
			transition: .1s ease;

			&::after{
				content: '';
				position: absolute;
				bottom: 2px;
				left: 0px;
				background: black;
				width: 8px;
				height: 50px;
				border-radius: 4px;
			}
		}
	}

	#view{
		position: fixed;
		bottom: 16px;
		left: calc(50% - 135px);
		background: rgba(white, .9);
		border: 3px solid rgba(white, .5);
		width: 250px;
		height: 72px;
		border-radius: 40px;
		box-shadow: -8px 36px 60px rgba(black, .6);
		padding: 8px;
		gap: 8px;
		z-index: 4;
		backdrop-filter: blur(20px);
		display: flex;


		background: rgba(black, .7);
		border: 3px solid rgba(white, .1);


		#pill{
			position: fixed;
			top: 0;
			left: 0;
			width: 0;
			height: 0;
			background: rgba(white, .2);
			border-radius: 28px;
			box-shadow: -5px 10px 25px rgba(black, .5), inset 0 -2px 4px rgba(black, .05);
			z-index: -1;
			transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
		}

		.view{
			height: 100%;
			flex: 1;
			border-radius: 24px;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 3px;
			opacity: .4;
			transition: opacity 0.3s ease;
			cursor: pointer;

			img{
				height: 40px;
				filter: drop-shadow(0px 4px 12px rgba(black, 0.9));
				transition: transform 0.3s ease;
			}

			h2{
				font-size: 12px;
				font-weight: 500;
				letter-spacing: -.1px;
				color: white;
				transition: font-weight 0.3s ease;
			}

			&:hover{
				opacity: .6;

				img {
					transform: translateY(-2px);
				}
			}

			&.active{
				opacity: 1;
				h2{
					font-weight: 550;
				}

				img {
					transform: scale(1.05);
				}
			}
		}
	}

	#sidebar{
		width: 140px;
		height: calc(100vh - 52px);
		padding: 24px;
		position: fixed;

		overflow-x: hidden;
		top: 0;
		right: 0;
		display: none;

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
		display: none;
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




	#page{

	}

	#sections{
		flex: 1;
		margin: auto;
	}

	#flex{
		flex: 1;
		position: relative;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: space-between;
		width: 100%;
		margin: auto;
		gap: 36px;
		min-height: 100vh;
		transition: 0.3s cubic-bezier(0.22, 1, 0.36, 1);

		#top{
			position: absolute;
			top: 0;
			left: 0;
			height: 60px;
			width: 100%;
			background: white;
			display: none;
		}

		&.view1{
			#sections{
				.sec{
					width: clamp(300px, 90%, 1000px);
					margin: 60px auto;
					padding: 30px;
					box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
					border-radius: 16px;
					gap: 40px;
					transform-origin: top center;
					opacity: 0;
					animation: previewFadeIn 0.6s forwards;
					animation-delay: calc(var(--index, 0) * 0.1s);

					@keyframes previewFadeIn {
						from {
							opacity: 0;
							transform: translateY(30px);
						}
						to {
							opacity: 1;
							transform: translateY(0);
						}
					}

					.preview {
						max-height: 600px;
						overflow: hidden;
						border-radius: 12px;

						.content {
							transition: transform 0.4s ease;

							&:hover {
								transform: translateY(-10px);
							}
						}

						.video, .banner {
							filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.15));
							transition: transform 0.3s ease, filter 0.3s ease;

							&:hover {
								filter: drop-shadow(0 25px 50px rgba(0, 0, 0, 0.2));
							}
						}
					}

					hgroup {
						border-radius: 16px;
						background: white;
						padding: 20px;
						box-shadow: 0 15px 30px rgba(0, 0, 0, 0.05);
					}
				}
			}
		}

		&.view2{
			#navbar{
				display: none;
			}

			#sections{
				.sec{
					padding: 20px;
					margin-top: 20px;
					gap: 0;
					width: 800px;
					transform-origin: top center;
					opacity: 0;
					animation: fadeIn 0.4s forwards;
					animation-delay: calc(var(--index, 0) * 0.05s);

					@keyframes fadeIn {
						from {
							opacity: 0;
							transform: translateY(10px);
						}
						to {
							opacity: 1;
							transform: translateY(0);
						}
					}

					hgroup{
						display: flex;
						align-items: flex-start;
						width: 100%;
						padding: 0;
						border-radius: 0px;
						border: none;
						background: none;
						position: relative;
						.header{
							padding: 0;
							background: none;
							.card{
								border-radius: 4px;
							}
							.title{
								h1{
									font-size: 20px;
								}
							}
							h2{
								font-size: 18px;
								margin-bottom: .5px;
							}
						}
						.top{
							margin: 0;
							padding: 0 0px;
						}
						.tags{
							margin: 0;
						}
					}
					.preview{
						.banner{
							display: none;
						}

					}
				}
				.gradient{
					display: none;
				}

			}
		}

		&.view3{
			#navbar{
				display: none;
			}
			#sections{
				display: flex;
				flex-wrap: wrap;
				width: clamp(300px, 80%, 1200px);
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
				gap: 20px 60px;
				flex: 1;

				@media (min-width: 1024px) {
					grid-template-columns: 1fr 1fr 1fr;
				}

				.head{
					grid-column: 1 / -1;
					width: 100%;
					display: block;
					z-index: 3;
					padding: 0 0 18px 0;
					margin: 120px 0 40px 0;
					border-bottom: 4px solid rgba(#030025, .05);
					h1{
						display: block;
						color: black;
					}
				}

				.sec{
					width: 100%;
					box-shadow: none;
					border-radius: 16px;
					border: none;
					background: none;
					aspect-ratio: 7/10;
					padding: 8px;
					box-sizing: border-box;
					overflow: hidden;
					gap: 12px;


					transform-origin: center;
					animation: gridFadeIn 0.5s forwards;
					animation-delay: calc(var(--index, 0) * 0.05s);


					//box-shadow: inset -2px -4px 8px rgba(#030025, 0.03);
					filter: drop-shadow(0 20px 25px rgba(0, 0, 0, 0.1));


					@keyframes gridFadeIn {
						from {
							opacity: 0;
							transform: scale(0.95);
						}
						to {
							opacity: 1;
							transform: scale(1);
						}
					}

					.mast{
						padding: 0 0 24px 0;
					}



					.prose-preview{
						width: 100%;
						padding: 0 8px;
						box-sizing: border-box;

						:global(p){
							font-size: 12px;
							font-weight: 100;
							letter-spacing: -.2px;
							line-height: 140%;
						}
					}

					hgroup{
						position: relative;
						display: flex;
						align-items: flex-start;
						justify-content: flex-start;
						overflow: visible;
						gap: 12px;
						padding: 0;
						width: 100%;
						box-shadow: none;
						background: none;

						.card{
							width: 60px;
							height: auto;
							border-radius: 8px;
							margin-bottom: 8px;
							display: none;
						}
						.header{
							display: flex;
							flex-direction: column;
							align-items: flex-start;
							padding: 0;
							//gap: 8px;
							.title{
								margin-top: 8px;
							}
							h1{
								font-size: 28px;
								font-weight: 600;
								margin-bottom: 8px;
							}
							h2{
								font-size: 20px;
								font-weight: 500;
								letter-spacing: -.48px;
								opacity: .8;
							}
							.type{
								display: none;
							}
						}
						.top{
							margin: 0;
							.expand{
							}
						}
					}
					.preview{
						flex-direction: column;
						justify-content: flex-start;
						align-items: center;
						flex-wrap: nowrap;
						width: 100%;
						gap: 8px;
						//border: 2px solid rgba(white, .2);
						border-radius: 12px;
						overflow: hidden;
						padding: 0;



						// /box-shadow: 4px 8px 10px rgba(#030025, 0.05), inset -4px 8px 16px rgba(#030025, 0.05);

						z-index: 2;

						.content{
							width: 100%;
							aspect-ratio: 8/10;

							padding: 20px;
							box-sizing: border-box;
						}

						.video{
							width: 100%;
							height: auto;
							//max-width: 100%;
							filter: drop-shadow(-10px 20px 30px rgba(#030025, .2));
						}
						.banner{
							width: 100%;
							max-width: 400px;
							height: auto;
							margin: 0;

							filter: drop-shadow(-10px 30px 20px rgba(#030025, .2));
							//filter: none;
						}
					}
				}
				.prose{
				}
				.gradient{
					display: none;
				}
			}
		}
	}

	.head{
		width: 160px;
		//border-radius: 8px;
		padding: 10px;
		z-index: -1;
		margin: 80px 0 0px 0;

		h1{
			font-size: 40px;
			font-weight: 700;
			letter-spacing: -.75px;
			margin: 0;
			text-align: left;
		}
	}

	.sec{
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 40px;
		justify-content: left;

		background: rgba(white, .9);
		box-shadow: -10px 10px 30px rgba(black, .08);
		box-shadow: -20px 20px 60px rgba(black, .08);
		margin-top: 24px;
		width: 800px;
		transition: .2s ease;

		border-radius: 10px;

		.preview{
			display: flex;
			flex-wrap: wrap;
			//flex-direction: row-reverse;
			align-items: flex-start;
			justify-content: center;
			gap: 20px;
			width: 100%;
			padding: 0 40px;
			box-sizing: border-box;
			position: relative;
			.background{
				position: absolute;
				background: #e0e0e0;
				top: 0;
				left: 0;
				width: 100%;
				height: 10000px;
				transition: .2s ease;
				z-index: -1;
				//display: none;
			}
		}

		.info{
			width: 100%;
			flex: 1;
			padding: 18px;
			text-align: left;
			background: rgba(white, .9);

			border-radius: 10px;
			backdrop-filter: blur(10px);
			border: 2px solid white;
			z-index: 2;
			//filter: drop-shadow(-20px 30px 20px rgba(#030025, .1));
			//display: none;

			h1{
				font-size: 20px;
				font-weight: 600;
				letter-spacing: -.4px;
				margin: 0;
				color: rgba(#030025, .9);
				text-align: left;
				display: none;
			}

			h2, h3{
				display: none;
			}

			p{
				font-size: 12px;
				line-height: 130%;
				font-weight: 500;
				letter-spacing: -.2px;
				margin: 0;
				color: rgba(#030025, .6);
				display: block;
			}

			.tags{
				margin-top: 20px;
			}
		}

		.content{
			-webkit-mask-image: -webkit-gradient(linear, left 80%, left 95%, from(rgba(0,0,0,1)), to(rgba(0,0,0,0)));

			.video{
				width: 60%;
				height: auto;
				border-radius: 8px;
				transition: .2s ease;
				filter: drop-shadow(-20px 30px 20px rgba(#030025, .1));
			}

			.banner{
				border-radius: 0px;
				width: 100%;
				//max-width: 800px;
				margin: 0px auto 30px auto;
				border-radius: 16px;
				transition: .2s ease;
				filter: drop-shadow(-20px 30px 20px rgba(#030025, .1));
			}
		}



		.gradient{
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 100px;
			border-radius: 10px;
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
			top: 0px;

			flex-shrink: 0;
			overflow: hidden;
			padding: 8px 0 8px 0;

			border-radius: 10px 10px 0 0;
			background: rgba(white, 1);
			//border-bottom: 1px solid rgba(black, .1);
			//box-shadow: 0 4px 24px rgba(black, .05);
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
					height: 32px;
					width: auto;
					border-radius: 6px;
					margin: 0;
					margin-right: 6px;
					box-shadow: -6px 6px 12px rgba(black, .1);
				}

				.title{
					display: flex;
					align-items: center;
					//gap: 12px;
					h3{
						margin: 0;
						display: none;
					}
				}


				h1{
					font-size: 20px;
					font-weight: 550;
					line-height: 100%;
					letter-spacing: -.5px;
					text-align: left;
					margin: 0;
					color: rgba(#030025, .9);
				}

				h2{
					font-size: 20px;
					font-weight: 500;
					line-height: 100%;
					letter-spacing: -.5px;
					text-align: left;
					margin-bottom: -1px;
					color: rgba(#030025, .3);
				}

				.type{
					h3{
						font-size: 14px;
						font-weight: 500;
						letter-spacing: -.2px;
					}
					//display: none;
				}

				p{
					font-size: 12px;
					font-weight: 450;
					letter-spacing: -.3px;
					margin: 0px 0;
					line-height: 140%;
					color: rgba(#030025, .6);
				}
			}

			.top{
				flex-direction: column;

				gap: 8px;
				margin-right: 14px;

				.expand{
					height: 14px;
					padding: 8px;
					border-radius: 6px;
					opacity: .5;
					transition: .1s ease;
					cursor: pointer;

					&:hover{
						background: rgba(black, .05);
						opacity: 1;
					}
				}
			}
		}
	}


	.tags{
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 0px 0;
		.subtitle{
			width: 100%;
			margin: 20px 0 5px 0;
			font-size: 14px;
			font-weight: 600;
			letter-spacing: -.4px;
		}
		.tag{
			display: flex;
			align-items: center;
			gap: 6px;
			background: white;
			padding: 6px 8px;
			border-radius: 8px;
			box-shadow: -2px 6px 12px rgba(black, .2);
			transition: .2s ease;
			cursor: pointer;
			background: #030025;

			.icon{
				height: 14px;
				margin: 0;
				border-radius: 0;
			}
			h3{
				display: block;
				font-size: 12px;
				font-weight: 550;
				letter-spacing: -.1px;
				color: rgba(#030025, .6);
				margin: 0;
				padding: 0;
				background: none;

				color: white;
			}
			&:hover{
				box-shadow: 0 5px 12px rgba(black, .12);
				transform: translateY(-1px);
			}
		}
	}



	.splash{
		//height: 80vh;
		//max-height: 900px;
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
			margin-top: 24px;

		}

		#logo{
			height: 140px;
			border-radius: 50px;
			margin-bottom: -20px;
			display: none;
		}

		#ahw{
			height: 120px;
			margin: 80px 0 0px 0;

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


			#pfp{
				height: 100px;
				border-radius: 200px;
				margin-bottom: 20px;
				box-shadow: -10px 10px 40px rgba(black, .25);
				display: none;
			}

			.expo{
				width: 100%;


				.tagline{
					display: none;
					justify-content: center;
					align-items: center;
					gap: 8px;
					margin: 12px 0 36px 0;
					img{
						height: 80px;
					}
				}

				h1{
					font-size: 90px;
					font-weight: 800;
					letter-spacing: -5px;
					margin: 0;
					text-shadow: -10px 30px 40px rgba(#030025, .15);
					display: none;
				}
				h2{
					font-size: 28px;
					font-weight: 800;
					letter-spacing: -1px;
					text-align: center;
					color: rgba(#030025, .85);
					margin: 12px 0 28px 0;
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
					display: none;
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
					margin: 12px auto;
					line-height: 125%;
					max-width: 360px;
				}
			}
		}
	}










	#footer{
		margin: auto;
		width: 100%;
		padding: 160px 0 160px 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;

		h3{
			font-size: 14px;
			font-weight: 500;
			letter-spacing: -.36px;
			color: rgba(#030025, .7);

			background: rgba(#030025, .05);

			padding: 12px 18px;
			border-radius: 32px;
		}
	}





	// Animations
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



	// Mobile
	@media screen and (max-width: 800px){

		::-webkit-scrollbar{
			width: 0 !important;
		}

		#page{
			width: 100%;
			overflow-x: hidden;
		}

		#scroll{
			margin: 0;
			display: none;
		}

		#flex{
			#page{
				width: 100vw;
				#sections{
				}
				#sidebar{
					display: none;
				}
			}
			&.view3{
				#sections{
					width: 100vw;
					margin: 0;
					overflow-x: hidden;
					box-sizing: border-box;
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: flex-start;
					gap: 0px;

					.sec{
						width: 100%;
					}

				}
			}
		}


		#navbar{
			position: fixed;
			top: 0;
			right: 0;
			height: 100vh;
			width: 80vw;
			z-index: 100;
			background: white;
			border-radius: 8px 0 0 8px;

			display: flex;
			flex-direction: column;
			align-items: flex-end;
		}

		.splash{
			.screen{
				width: 100vw;
				padding: 0;
				margin: 0;
				#ahw{
					width: 90vw;
					height: auto;
				}
			}
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

	// Removed all :global() selectors as they're now in the global stylesheet

</style>
