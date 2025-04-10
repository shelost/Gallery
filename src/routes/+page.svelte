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

	setTimeout(() => {
		val = 17945
	}, 400);



	// Functions

	function throttle(func, limit) {
		let inThrottle;
		return function() {
			const args = arguments;
			const context = this;
			if (!inThrottle) {
				func.apply(context, args);
				inThrottle = true;
				setTimeout(() => inThrottle = false, limit);
			}
		};
	}

	function updateReflections(lightX, lightY) {
		// Update reflections based on light position
		// Only do this calculation for visible elements to save CPU
		const reflections = document.querySelectorAll('.sec');

		// Create a lightweight version for mobile devices
		const isMobile = window.innerWidth <= 800;
		if (isMobile) {
			// On mobile just add a static reflection effect for better performance
			reflections.forEach(reflection => {
				const reflectionElement = reflection.querySelector('.light-reflection');
				if (!reflectionElement) return;

				reflectionElement.style.background = `linear-gradient(
					125deg,
					rgba(255, 255, 255, 0.2) 0%,
					rgba(255, 255, 255, 0.05) 30%,
					rgba(255, 255, 255, 0) 60%)`;
				reflectionElement.style.opacity = "0.2";
			});
			return;
		}

		// For desktop, calculate more detailed reflections
		const viewportHeight = window.innerHeight;

		// Get viewport dimensions once to avoid recalculating
		const maxDistance = Math.sqrt(window.innerWidth * window.innerWidth + viewportHeight * viewportHeight);

		reflections.forEach(reflection => {
			// Skip shadow calculation if section is far from viewport (performance optimization)
			const rect = reflection.getBoundingClientRect();
			if (rect.bottom < -200 || rect.top > viewportHeight + 200) {
				return;
			}

			const reflectionCenterX = rect.left + rect.width / 2;
			const reflectionCenterY = rect.top + rect.height / 2;

			// Calculate angle from light to reflection
			const dx = lightX - reflectionCenterX;
			const dy = lightY - reflectionCenterY;
			const angle = Math.atan2(dy, dx) * (180 / Math.PI);

			// Calculate distance to light (for intensity)
			const distanceToLight = Math.sqrt(dx * dx + dy * dy);
			const normalizedDistance = Math.min(distanceToLight / maxDistance, 1);

			// Intensity based on distance - brighter when closer to light
			const reflectionIntensity = Math.max(0.2, 0.4 - normalizedDistance * 0.3);

			// Set the gradient angle based on light position
			// This makes the reflection appear to come from the light source
			const gradientAngle = (angle + 180) % 360;

			// Apply the reflection gradient
			const reflectionElement = reflection.querySelector('.light-reflection');
			if (!reflectionElement) return;

			// Use CSS variables for better performance by reducing style recalculation
			reflectionElement.style.setProperty('--reflection-angle', `${gradientAngle}deg`);
			reflectionElement.style.setProperty('--reflection-intensity-primary', reflectionIntensity.toString());
			reflectionElement.style.setProperty('--reflection-intensity-secondary', (reflectionIntensity * 0.3).toString());
			reflectionElement.style.setProperty('--reflection-opacity', (0.25 - normalizedDistance * 0.15).toString());
		});
	}

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
					top: rect.top
				};
			}
		}

		// For better performance, remove some of the checks that aren't needed
		// and combine operations where possible
		const applyViewChange = () => {
			// Set the new view
			view.set(v);

			// Apply staggered animations
			requestAnimationFrame(() => {
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
		};

		// Check if View Transitions API is supported - simpler check
		if ('startViewTransition' in document) {
			document.startViewTransition(applyViewChange);
		} else {
			applyViewChange();
		}

		// Play the click sound if available
		if (Click) {
			Click.currentTime = 0;
			Click.play().catch(() => {
				// Silently handle playback failures (common in some browsers)
			});
		}
	}

	function updateActiveSection() {
		// Update Active
		let closest = null;
		let object = null
		let minDistance = Infinity;

		// Calculate light position relative to scroll with a dynamic component
		const scrollY = document.documentElement.scrollTop || document.body.scrollTop;
		const viewportHeight = window.innerHeight;
		const viewportWidth = window.innerWidth;

		// Find the #page element to use its width for light positioning
		const pageElement = document.getElementById('page') || document.getElementById('sections');

		// Get the actual content bounds to position light properly
		let pageLeft = 0;
		let pageWidth = viewportWidth * 0.8;
		let pageTop = 0;

		if (pageElement) {
			const rect = pageElement.getBoundingClientRect();
			pageLeft = rect.left;
			pageWidth = rect.width;
			pageTop = rect.top + window.scrollY; // Account for scrolled position
		}

		// Responsive offset scaled to page width
		const lightXOffset = Math.min(100, pageWidth * 0.08);

		// Parallax effect for light source - moves slower than scroll for a nice effect
		// Light stays positioned relative to the content area, not the viewport
		const lightX = pageLeft + pageWidth - lightXOffset - (scrollY * 0.02);

		// Light moves down slightly as user scrolls, but stays within reasonable bounds
		// This creates a subtle sun-like movement
		const lightParallaxY = Math.min(viewportHeight * 0.3, scrollY * 0.15);
		const lightY = 100 + lightParallaxY;

		// Update CSS variables for the light position
		document.documentElement.style.setProperty('--light-x', `${lightX}px`);
		document.documentElement.style.setProperty('--light-y', `${lightY}px`);

		// Update reflections based on light position - check if we need to run this operation
		// Create or update reflections less frequently than shadow calculations for better performance
		// Only run this on desktop devices for better mobile performance
		if (sections && window.innerWidth > 800) {
			// Run this less frequently - once every 200ms is enough for reflection effects
			throttle(function() {
				sections.forEach(section => {
					// Skip if section is far from viewport (performance optimization)
					const rect = section.getBoundingClientRect();
					if (rect.bottom < -200 || rect.top > viewportHeight + 200) {
						return;
					}

					// Only create the reflection element if it doesn't exist
					if (!section.querySelector('.light-reflection')) {
						const reflectionDiv = document.createElement('div');
						reflectionDiv.className = 'light-reflection';
						section.appendChild(reflectionDiv);
					}
				});

				// Call the reflection update with a longer throttle time
				updateReflections(lightX, lightY);
			}, 200)();
		}



		function updateShadows(){}

		// Execute the throttled shadow update
		updateShadows();

		// Use all sections for non-shadow calculations at a reduced frequency
		// We don't need to update active section on every scroll event
		if (sections) {
			throttle(() => {
				sections.forEach((sec, index) => {
					const rect = sec.getBoundingClientRect();
					const distance = Math.abs(rect.top + window.innerHeight * .25);

					if (distance < minDistance) {
						minDistance = distance;
						closest = sec;
						object = data.posts[index];
					}
				});

				// Reactivity - only update if the value changes to prevent unnecessary re-renders
				if (closest !== $activeElem) {
					activeElem.set(closest);
				}

				if (object !== $activeObject) {
					activeObject.set(object);

					// Only update the theme color if there's a new active object
					if ($activeObject && $activeObject.meta.color){
						themeColor.set(object.meta.color)
					}
					else{
						themeColor.set('f3f4f7')
					}
				}

				if (document.documentElement.scrollTop < window.innerHeight*.5){
					themeColor.set('f3f4f7')
					activeObject.set(null)
				}
			}, 80)(); // Update active section at most 12.5 times per second - smooth enough for UI changes
		}

		// Scrollbar - update less frequently
		throttle(() => {
			let scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
			let scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
			let percent = (scrollTop / scrollHeight);

			if (Bar && Scroll){
				Bar.style.height = Scroll.getBoundingClientRect().height * percent + 'px'
			}
		}, 100)();

		// Parallax - only run on desktop for better performance
		if (window.innerWidth > 800) {
			throttle(() => {
				let pieces = document.querySelectorAll('.piece')
				const parallax = 0.1 // Controls separation between scroll speeds
				pieces.forEach((piece, index) => {
					const scrollSpeed = -.2 - (index * parallax) // Each piece scrolls progressively faster
					piece.style.top = document.documentElement.scrollTop * scrollSpeed + 200 + 'px'
				})
			}, 100)();
		}
	}



	// Mounted

	onMount(() => {
		// Initialize elements right away
		initElems();

		// Use requestAnimationFrame for smoother animations
		// This better coordinates with the browser's rendering cycle
		requestAnimationFrame(() => {
			updateActiveSection();
		});

		loading.subscribe(v => {
			if (!v) {
				// Use setTimeout with a short delay to ensure DOM is ready
				setTimeout(() => {
					changeView(1);
					setAnimationIndexes();

					// Get pill position
					const elem = Class('v3')[0];
					if (!elem) return;

					const container = Id('view')?.getBoundingClientRect();
					if (!container) return;

					const rect = elem.getBoundingClientRect();

					// Update pill position with batched style changes
					// This reduces layout thrashing
					if (Pill) {
						Object.assign(Pill.style, {
							position: 'fixed',
							top: `${rect.top - container.top - 3}px`,
							left: `${rect.left - container.left - 3}px`,
							width: `${rect.width}px`,
							height: `${rect.height}px`
						});
					}
				}, 500);
			}
		});

		view.subscribe(v => {
			const elem = Class(`v${v}`)[0];

			if (!elem || !Pill) {
				return;
			}

			const container = Id('view')?.getBoundingClientRect();
			if (!container) return;

			const rect = elem.getBoundingClientRect();

			// Batch style changes to improve performance
			// Check if View Transitions API is supported
			if ('startViewTransition' in document) {
				document.startViewTransition(() => {
					Object.assign(Pill.style, {
						position: 'fixed',
						top: `${rect.top - container.top - 3}px`,
						left: `${rect.left - container.left - 3}px`,
						width: `${rect.width}px`,
						height: `${rect.height}px`
					});
				});
			} else {
				Object.assign(Pill.style, {
					position: 'fixed',
					top: `${rect.top - container.top - 3}px`,
					left: `${rect.left - container.left - 3}px`,
					width: `${rect.width}px`,
					height: `${rect.height}px`
				});
			}
		});

		// Use passive flag to improve scroll performance
		window.addEventListener("scroll", updateActiveSection, { passive: true });

		function initElems() {
			sections = document.querySelectorAll(".sec");
			previews = document.querySelectorAll(".preview");
		}

		// Use a more efficient way to set up initial state
		// Combining multiple setTimeout calls into a single Promise chain
		Promise.resolve()
			.then(() => {
				splash.set(true);
				updateActiveSection();
			})
			.then(() => new Promise(resolve => setTimeout(resolve, 200)))
			.then(() => {
				initElems();
				updateActiveSection();
			})
			.then(() => new Promise(resolve => setTimeout(resolve, 4600)))
			.then(() => {
				initElems();
				updateActiveSection();
			});

		return () => window.removeEventListener("scroll", updateActiveSection);
	});

</script>

<svelte:head>


	<!-- Resource hints for performance -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

	<!-- Preload critical assets -->
	<link rel="preload" href="ahnheewon3.png" as="image" />

	<!-- Use font-display: swap to improve font loading performance -->
	<style>
		@font-face {
			font-family: 'Inter';
			font-style: normal;
			font-weight: 400;
			font-display: swap;
			/* Font URLs would be here */
		}
	</style>

	<!-- Prevent layout shift by defining image dimensions -->
	<style>
		img, video {
			aspect-ratio: attr(width) / attr(height);
		}
	</style>
</svelte:head>


{#if !$loading}
<section id = 'app' bind:this={App} class:offset={$openDrawer}>

	<section class = 'splash'>

		<img src="bidam.png" id="bidam" class="piece" alt="Logo" width="350" height="197" loading="lazy"
			in:fly={{y: 100, duration: 400, delay: 300}} />
		<img src="heewon9.png" id="chunchu" class="piece" alt="Logo" width="250" height="141" loading="lazy" />

		<video id="video" class="piece" alt="Logo" width="350" height="197" autoplay muted playsinline preload="metadata">
			<source src="bidam.mp4" type="video/mp4">
		</video>

		<div id = 'card' class = 'piece'>
			<h2> Total Earned </h2>
			<!-- Temporary replacement for NumberFlow -->
			<span class="number">{val.toLocaleString()}</span>
		</div>

		<div class = 'screen'>
			<img src="smiley.svg" id="logo" alt="Logo" width="140" height="140" loading="eager"
				in:fly={{y: 100, duration: 600, delay: 100}} />

			<img src="heewon9.png" id="pfp" alt="Logo" width="100" height="100" loading="lazy"
				in:fly={{y: 100, duration: 600, delay: 100}} />
			<img src="ahnheewon3.png" id="ahw" alt="Logo" width="200" height="67" fetchpriority="high"
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
				<!--
				<p in:fly={{y: 100, duration: 600, delay: 350}}>
					I also work for <a href = 'https://stan.store'>startups</a>, draw <a href = 'https://www.instagram.com/_heewonahn'>comics</a>, and write <a href = 'https://www.instagram.com/ahnheewon_comics'>essays</a>.
				</p>
				-->
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

								<button class = 'button' on:click={() => {
									expandedPost.set(link)
									openDrawer.set(true)
								}}>
									<h2> View Project </h2>
								</button>
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
	<div id = 'overlay' transition:fade={{duration: 200}} on:click = {() => {openDrawer.set(false)}}>
		<div id = 'drawer' bind:this={Drawer} transition:fly={{y: 500, duration: 300, easing: quintOut}}>
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
	</div>
{/if}



<div id = 'view' in:fly={{y: 100, duration: 500, delay: 600}} on:load = {() => {changeView(1)}}>

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

	:root {
		/* Light source properties */
		--light-x: 100vw; /* Start position of light (top right corner) */
		--light-y: 0;
		--shadow-color: rgba(3, 0, 37, 0.1); /* Reduced opacity */
		--shadow-color-intense: rgba(3, 0, 37, 0.18); /* Reduced opacity */
		--shadow-transition-duration: 0.3s;
		--filter-transition-duration: 0.3s;
		--reflection-opacity: 0.4; /* Default reflection opacity */
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

	/* Light reflection animation - only plays on hover */
	@keyframes reflectionMove {
		0% {
			background-position: 120% 0%;
		}
		100% {
			background-position: -20% 100%;
		}
	}

	/* Only apply float animation on desktop for better performance */
	@media (min-width: 800px) {
		.sec {
			animation: float 6s ease-in-out infinite;
			animation-play-state: paused; /* Only animate on hover for better performance */

			&:hover {
				animation-play-state: running;
			}
		}
	}

	/* Add optimized mobile styles */
	@media (max-width: 800px) {
		.sec {
			/* Disable animations on mobile for better performance */
			animation: none;

			&::after {
				animation: none;
				background: linear-gradient(
					125deg,
					rgba(255, 255, 255, 0.15) 0%,
					rgba(255, 255, 255, 0.05) 30%,
					rgba(255, 255, 255, 0) 60%
				);
				opacity: 0.2;
			}
		}

		.light-reflection {
			/* Simpler reflection for mobile */
			background: linear-gradient(
				125deg,
				rgba(255, 255, 255, 0.2) 0%,
				rgba(255, 255, 255, 0.05) 30%,
				rgba(255, 255, 255, 0) 60%
			) !important; /* Override any dynamic styles */
			opacity: 0.2 !important;
			transition: none;
		}
	}

	.light-reflection {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		/* Use CSS variables for better performance */
		--reflection-angle: 125deg;
		--reflection-intensity-primary: 0.3;
		--reflection-intensity-secondary: 0.1;
		--reflection-opacity: 0.3;

		background: linear-gradient(
			var(--reflection-angle),
			rgba(255, 255, 255, var(--reflection-intensity-primary)) 0%,
			rgba(255, 255, 255, var(--reflection-intensity-secondary)) 30%,
			rgba(255, 255, 255, 0) 60%
		);
		background-size: 200% 200%;
		opacity: var(--reflection-opacity);
		border-radius: inherit;
		pointer-events: none;
		z-index: 10; /* Place above other content but below interactive elements */
		transition: opacity 0.5s ease;
		/* Removed background transition for better performance */
	}

	.sec {
		view-transition-name: section-card;
		transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
			           opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1),
			           filter 0.3s cubic-bezier(0.22, 1, 0.36, 1),
			           background 0.3s ease;
		will-change: transform, filter;
		position: relative;
		overflow: hidden;

		filter: drop-shadow(-10px 10px 20px rgba(#030025, .1));
		/* Animation is now handled by the media query for better performance */
		animation-delay: calc(var(--index, 0) * 0.5s);

		/* Add a subtle glass-like reflection overlay - keep this as a static fallback */
		&::after {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: linear-gradient(
				125deg,
				rgba(255, 255, 255, 0.2) 0%,
				rgba(255, 255, 255, 0.05) 30%,
				rgba(255, 255, 255, 0) 60%
			);
			background-size: 200% 200%;
			opacity: 0.2; /* Lower opacity for static effect since we have dynamic one */
			border-radius: inherit;
			pointer-events: none;
			z-index: 3;
			/* Animation is now handled by the media query for better performance */
			animation: reflectionMove 8s ease-in-out infinite;
			animation-play-state: paused;
		}

		&:hover {
			transform: translateY(-4px);
			//filter: drop-shadow(-15px 15px 40px var(--shadow-color-intense));

			&::after {
				opacity: 0.3; /* Increase reflection on hover */
				animation-play-state: running; /* Resume animation on hover */
			}

			.light-reflection {
				--reflection-opacity: 0.4; /* Brighten dynamic reflection on hover */
			}
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
		transition: .2s ease;
	}

	.x{
		cursor: pointer;
	}

	#overlay{
		position: fixed;
		top: 0;
		right: 0;
		width: 100%;
		height: 100%;
		transition: 0.2s ease;

		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(black, .5);
	}

	#drawer{
		padding: 40px;
		width: clamp(25%, 640px, 100%);
		height: 600px;
		border-radius: 18px;



		box-shadow: -12px 48px 100px rgba(black, .5), -8px 12px 18px rgba(black, .1), inset -4px -4px 4px rgba(#030025, .1);
		//border: 2px solid white;

		overflow-y: scroll;
		overflow-x: hidden;
		z-index: 10;
		background: rgba(white, 9);
		backdrop-filter: blur(10px);

		text-align: left;

		h1{
			text-align: left;
		}

		::-webkit-scrollbar{
			width: 4px !important;
		}

		::-webkit-scrollbar-track{
			background: rgba(black, .2);
			border-radius: 4px;
			width: 4px !important;
		}

		::-webkit-scrollbar-thumb{
			background: rgba(black, .2);
			border-radius: 4px;
			width: 4px !important;
		}

		.prose{
			width: 100%;
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
		display: none;
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
		bottom: 12px;
		left: calc(50% - 135px);
		background: rgba(white, .9);
		border: 3px solid rgba(white, .5);
		width: 250px;
		height: 72px;
		border-radius: 40px;
		box-shadow: -8px 36px 60px rgba(black, .9);
		padding: 8px;
		gap: 8px;
		z-index: 4;
		backdrop-filter: blur(20px);


		display: none;
		flex-direction: row;
		align-items: center;
		justify-content: center;


		background: rgba(#030025, .75);
		border: 3px solid rgba(white, .1);


		#pill{
			position: fixed;
			top: 0;
			left: 0;
			width: 0;
			height: 0;
			background: rgba(white, .9);
			border-radius: 24px;
			box-shadow: -8px 16px 24px rgba(#030025, .5), inset -2px -4px 6px rgba(black, .2);
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
				filter: drop-shadow(0px 4px 12px rgba(black, 0.25));
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
					color: black;
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

			#navbar{
				display: none;
			}

			#sections{
				width: clamp(300px, 100%, 1400px);


				.sec{
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
						//max-height: 500px;
						//overflow: hidden;
						border-radius: 12px;
					}

					hgroup {
						width: 240px;
						max-width: 240px;
						padding: 0;
						background: none;
						.header{
							flex-direction: column;
							background: none;
							padding: 0;
							width: 100%;
							.info{
								width: 230px;
							}
						}
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

					.preview{
						display: none;
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

							display: flex;
							flex-direction: column;
							align-items: flex-start;
							justify-content: flex-start;

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
				gap: 12px 24px;
				flex: 1;

				@media (min-width: 1024px) {
					grid-template-columns: repeat(6, 1fr);
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
					grid-column: span 2;


					width: 100%;
					border-radius: 12px;
					border: none;
					background: none;
					aspect-ratio: 7/10;
					padding: 12px 16px 0px 16px;
					box-sizing: border-box;
					overflow: hidden;
					gap: 12px;

					transition: .1s ease;

					/* Add CSS variable for pseudo-element opacity control */
					--before-opacity: 0.5;

					transform-origin: center;
					animation: gridFadeIn 0.2s forwards;
					animation-delay: calc(var(--index, 0) * 0.05s);

					// Replace box-shadow with filter
					filter: drop-shadow(-15px 15px 15px var(--shadow-color));
					position: relative;

					&.r5{
						//grid-column: span 3;
					}


					// Keep the reflection effect with dynamic opacity
					&::before {
						content: '';
						position: absolute;
						top: 0;
						left: 0;
						right: 0;
						bottom: 0;
						background: linear-gradient(to bottom,
							rgba(255, 255, 255, 0.5) 0%,
							rgba(255, 255, 255, 0.5) 100%);
						border-radius: 16px;
						z-index: 0;
						pointer-events: none;
						opacity: var(--before-opacity, 0.5);
						transition: all var(--shadow-transition-duration) ease;
					}

					// Update hover styles for filter-based approach
					&:hover {
						transform: translateY(-4px);
						filter: drop-shadow(-20px 20px 30px var(--shadow-color-intense));
						--before-opacity: 0.7;
						animation-play-state: paused;

						/* Enhanced reflection when hovered */
						&::after {
							background-position: 0% 100%;
							transition: background-position 1.2s ease-out;
						}
					}

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
						position: relative;
						z-index: 2;
					}

					.prose-preview{
						width: 100%;
						padding: 0 8px;
						box-sizing: border-box;
						position: relative;
						z-index: 5; /* Ensure text is above reflections */
						//display

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
						z-index: 5; /* Keep above reflections */

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
								font-size: 26px;
								font-weight: 600;
								margin-bottom: 8px;
							}
							h2{
								font-size: 20px;
								font-weight: 500;
								letter-spacing: -.48px;
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
						border-radius: 12px;
						overflow: hidden;
						padding: 0;
						z-index: 2;
						position: relative;

						.content{
							width: 100%;
							aspect-ratio: 8/10;

							padding: 12px;
							box-sizing: border-box;

							box-shadow: inset 4px -8px 12px rgba(#030025, 0.03);
						}

						.video{
							width: 100%;
							height: auto;
							//max-width: 100%;
							filter: drop-shadow(-10px 20px 30px rgba(#030025, .2));
						}
						.banner{
							width: 100%;
							max-width: 800px;
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
		width: 100%;
		box-sizing: border-box;
		//border-radius: 8px;
		padding: 10px;
		z-index: -1;
		margin: 100px 20px 0px 0;

		h1{
			font-size: 44px;
			font-weight: 700;
			letter-spacing: -.75px;
			margin: 0;
			text-align: center;
			color:#030025;
		}
	}

	.sec{
		width: clamp(300px, 100%, 850px);
		margin: 40px auto;
		background: none !important;
		padding: 30px 10px 30px 30px;
		//box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
		border-radius: 16px;
		gap: 20px;
		transform-origin: top center;
		opacity: 0;
		overflow: visible !important;
		animation: previewFadeIn 0.6s forwards;
		animation-delay: calc(var(--index, 0) * 0.1s);

		display: flex;
		flex-direction: row;
		align-items: flex-start;
		justify-content: center;


		background: rgba(white, .9);
		margin-top: 24px;
		transition: .2s ease;
		overflow: visible !important;

		border-radius: 10px;

		filter: drop-shadow(-18px 24px 16px rgba(#030025, .1));

		.prose{
			max-height: 600px;
			overflow-y: hidden;
		}

		&.game{
			.preview{
				padding: 0;
			}
			.video{
				margin: 0 !important;
			}
			.banner{
				display: none;
			}
		}

		.preview{
			display: flex;
			flex-wrap: wrap;
			flex: 1;
			//flex-direction: row-reverse;
			align-items: flex-start;
			justify-content: center;
			gap: 20px;
			width: 100%;
			overflow: visible;
			//padding: 0 28px;
			box-sizing: border-box;
			position: relative;
			//box-shadow: inset -2px -4px 8px rgba(black, 0.08);

			.background{
				position: absolute;
				background: #e0e0e0;
				top: 0;
				left: 0;
				width: 100%;
				height: 10000px;
				transition: .2s ease;
				z-index: -1;
				display: none;
			}
			.content{
				.video{
					width: 100%;
					height: auto;
					margin: 24px 0;
					border-radius: 8px;
					transition: .2s ease;
					filter: drop-shadow(-20px 30px 20px rgba(#030025, .1));
				}

				.banner{
					border-radius: 0px;
					width: 100%;
					//max-width: 800px;
					margin: 24px auto 24px auto;
					border-radius: 16px;
					transition: .2s ease;

					filter: drop-shadow(-12px 24px 36px rgba(#030025, .08));
				}
			}
		}

		.info{
			width: calc(100% + 40px);
			flex: 1;
			padding: 18px;
			text-align: left;
			background: rgba(white, .9);
			align-self: stretch;
			box-sizing: border-box;

			border-radius: 16px;
			backdrop-filter: blur(10px);
			// /border: 2px solid rgba(white, .5);
			z-index: 2;

			box-shadow: inset -2px -2px 8px rgba(black, 0.03);

			&::before{
				content: 'Info';
				font-size: 14px;
				font-weight: 600;
				font-family: DM Sans, sans-serif;
				color: rgba(#030025, .25);
				transform: translateY(-12px);
			}

			button{
				margin-top: 24px;
			}

			p{
				font-family: Newsreader, sans-serif;
				font-size: 18px !important;
				font-weight: 550;
				color: rgba(#030025, .75);
				line-height: 115%;
				letter-spacing: -.3px;
			}

			.tags{
				margin-top: 20px;
			}
		}

		.gradient{
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 100px;
			border-radius: 10px;
			//background: linear-gradient(to bottom, rgba(white, 0), rgba(white, 1) 80%);
		}

		hgroup{
			//position: sticky;
			align-self: flex-start;
			z-index: 3;


			display: flex;
			align-items: flex-start;
			gap: 12px;
			width: 100%;
			top: 0px;

			flex-shrink: 0;
			padding: 8px 0 8px 0;

			border-radius: 10px 10px 0 0;
			background: rgba(white, 1);

			transition: .2s ease;


			.header{
				width: 100%;
				height: 100%;
				display: flex;
				align-items: flex-start;
				gap: 24px;

				.mast{
					h1{
						//font-family: Newsreader, sans-serif;
						font-size: 26px;
						font-weight: 650;
						line-height: 100%;
						letter-spacing: -.7px;
						text-align: left;
						margin: 8px 0;
						color: rgba(#030025, .9);
					}

					h2{
						font-size: 20px;
						font-weight: 550;
						line-height: 100%;
						letter-spacing: -.7px;
						text-align: left;
						margin-bottom: -1px;
						color:rgb(218, 155, 155);
					}
				}




				img{
					width: 100%;
					border-radius: 4px;
					margin-bottom: 18px;
					display: none;
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
				.type{
					display: none;
					h3{
						font-size: 14px;
						font-weight: 500;
						letter-spacing: -.2px;
					}
					//display: none;
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
					opacity: 0;
					transition: .1s ease;
					cursor: pointer;

					&:hover{
						background: rgba(black, .05);
						opacity: 0;
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
			background:rgb(255, 255, 255);
			//border: 1.5px solid rgb(240, 243, 249);
			padding: 4px 10px 6px 10px;
			border-radius: 12px;
			box-shadow: -2px 6px 12px rgba(#030025, .1), inset -2px -3px 4px rgba(#030025, .06);
			transition: .2s ease;
			cursor: pointer;

			.icon{
				height: 14px;
				margin: 0;
				border-radius: 0;
				display: block;
			}
			h3{
				display: block;
				font-size: 12px;
				font-weight: 700;
				letter-spacing: -.32px;
				color: rgba(#030025, .8);
				margin: 0;
				padding: 0;
				background: none;


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

		#logo{
			height: 160px;
			margin-top: 20px;
			margin-bottom: -32px;
		}

		#ahw{
			height: 120px;
			width: auto;
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
		/* Optimize for mobile - reduce animations and effects */

		#view{
			display: none;
		}
		.sec {
			transition: transform 0.2s ease, opacity 0.2s ease;
			will-change: none; /* Remove will-change to save GPU memory on mobile */
			filter: drop-shadow(0 5px 10px rgba(3, 0, 37, 0.1)) !important; /* Simpler shadow */
			background: none !important; /* No dynamic gradient on mobile */
		}

		/* Remove GPU-intensive animations on mobile */
		.sec::after,
		.light-reflection {
			display: none !important;
		}

		/* Simplify transitions */
		::view-transition-old(root),
		::view-transition-new(root) {
			animation-duration: 0.3s;
		}

		::-webkit-scrollbar{
			width: 0 !important;
		}

		#app{
			width: 98vw;
			overflow-x: hidden;
		}

		#page{
			width: 98vw;
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
					width: 100vw;
					margin: 0;
					overflow-x: hidden;
					box-sizing: border-box;
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: flex-start;
					gap: 24px;

					.head{
						padding: 8px 24px;
						box-sizing: border-box;
					}

					hgroup{
						width: 100%;
						max-width: 100%;
						box-sizing: border-box;
					}

					.sec{
						width: 90%;
						box-sizing: border-box;
						gap: 12px;
						.info{
							width: 100%;
							margin-bottom: 12px;
						}
					}
					.preview{
						padding: 18px;
						box-sizing: border-box;

						.banner{
							padding: 0;
							margin: 0 auto;
						}
					}
					.content{
						flex: 1;
						padding: 0;
						margin: 0;
					}
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
					gap: 24px;

					.head{
						padding: 8px 24px;
						box-sizing: border-box;
					}

					.sec{
						width: 90%;
						box-sizing: border-box;
						gap: 12px;
						.info{
							width: 100%;
							margin-bottom: 12px;
						}
					}

					.content{
						flex: 1;
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

	/* Content-visibility optimization for off-screen content */
	@media (min-width: 801px) {
		.sec {
			content-visibility: auto;
			contain-intrinsic-size: 0 500px; /* Approximate height to prevent layout shift */
		}
	}

</style>

