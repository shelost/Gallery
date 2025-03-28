<script>

	import Navbar from './Navbar.svelte';
	import { dev } from '$app/environment';
	import { onMount } from 'svelte'
	import { themeColor } from '$lib/store'
	import { writable } from 'svelte/store'
	import { fade, fly } from 'svelte/transition'
	import { loading, openDrawer } from '$lib/store'
	import { injectAnalytics } from '@vercel/analytics/sveltekit'
	import '../app.css';

	injectAnalytics({ mode: dev ? 'development' : 'production' });

	let { children } = $props();

	let mouseX = -1000, mouseY = -1000; // Initial off-screen position
    let intensity = .35; // Control the effect strength
    let radius = 300; // Control the effect radius


	themeColor.set('FAFBFD')


	let Bar, Scroll
	let loadingProgress = writable(0);
	let logoMask;
	let percentageText;

	setTimeout(() => {
		loading.set(false)
	}, 100);

    onMount(() => {
		// Simulate realistic loading with staggered progress
		const loadSteps = [
			{progress: 15, delay: 100},  // Initial quick progress
			{progress: 60, delay: 300},  // Processing phase
			{progress: 85, delay: 300},  // Nearly complete
			{progress: 100, delay: 100}  // Final completion
		];

		let currentStep = 0;

		themeColor.subscribe((color) => {
			if (typeof document !== 'undefined') {
				//document.documentElement.style.backgroundColor = '#' + color;
			}
		});

		function updateLoading() {
			if (currentStep >= loadSteps.length) {
				setTimeout(() => {
					loading.set(false); // Set loading to false after reaching 100%
				}, 300); // Small delay to let the user see 100% before hiding
				return;
			}

			const step = loadSteps[currentStep];
			let currentProgress = $loadingProgress;

			const interval = setInterval(() => {
				if (currentProgress < step.progress) {
					currentProgress++;
					loadingProgress.set(currentProgress);

					if (logoMask) {
						// Update the mask height from bottom to top
						logoMask.style.height = `${currentProgress}%`;
						logoMask.style.bottom = '0'; // Ensure it fills from bottom
					}

					if (percentageText) {
						percentageText.textContent = `${currentProgress}%`;
					}
				} else {
					clearInterval(interval);
					currentStep++;
					setTimeout(updateLoading, step.delay);
				}
			}, 20);
		}

		// Start the loading animation
		updateLoading();

		themeColor.subscribe((color) => {
			if (typeof document !== 'undefined') {
				//document.documentElement.style.backgroundColor = '#' + color;
			}
		});


        let W = window.innerWidth * 2;
        let H = window.innerHeight * 2;

        let canvas = document.getElementById("canvas");
        let ctx = canvas.getContext("2d");

        canvas.width = W;
        canvas.height = H;

        let dotSpacing = 50;
        let dotSize = 4;
        let dots = [];

        // Generate the grid of dots
        for (let i = 0; i < W; i += dotSpacing) {
            for (let j = 0; j < H; j += dotSpacing) {
                dots.push({ x: i, y: j });
            }
        }

        // Track mouse position
        window.addEventListener("mousemove", (event) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = (event.clientX - rect.left) * 2; // Scale for high-res canvas
            mouseY = (event.clientY - rect.top) * 2;
            draw();
        });

        function draw() {
            ctx.clearRect(0, 0, W, H);

            dots.forEach(dot => {
                let dx = dot.x - mouseX;
                let dy = dot.y - mouseY;
                let distance = Math.sqrt(dx * dx + dy * dy);

                // Normalize darkness: closer dots are darker
                let alpha = Math.max(0.25, 1 - (distance / radius)) * intensity;

                ctx.beginPath();
                ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        draw();

		function updateScroll(){
			let scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
			let scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
			let percent = (scrollTop / scrollHeight);

			if (Bar && Scroll){
				Bar.style.height = Scroll.getBoundingClientRect().height * percent + 'px'
			}
		}

		window.addEventListener("scroll", updateScroll);
		updateScroll(); // Initialize on load
    });

</script>


<svelte:head>
	<title>Heewon</title>
	<meta name="description" content="Heewon's Portfolio" />
	<link rel="icon" href="favicon.png" />
</svelte:head>


<div class="app">


	<canvas id = 'canvas'>
	</canvas>

	<main>
		{@render children()}
	</main>

	<div id = 'navbar'>
		<Navbar />
		<div id = 'scroll' bind:this={Scroll}>
			<div id = 'bar' bind:this={Bar}></div>
		</div>
	</div>

	{#if $openDrawer}
	<div id = 'dark' transition:fade={{duration: 200}} on:click={()=>{openDrawer.set(false)}}></div>
	{/if}

</div>




<style lang="scss">


	#dark{
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(black, .7);
		z-index: 5;
		transition: .2s ease;
	}



	#loading{
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: white;
		z-index: 100;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		img{
			height: 100px;
		}
	}

	#scroll{
		position: fixed;
		top: 10px;
		right: 10px;


		width: 12px;
		height: calc(100vh - 28px);
		//height: 500px;
		margin: 12px;
		//margin-right: 48px;
		background: rgba(#030025, .3);
		background: white;
		border-radius: 5px;
		//border: 1px solid rgba(white, .2);
		box-shadow: 20px 8px 32px rgba(black, .5);
		z-index: 2;
		overflow: hidden;

		#bar{
			position: absolute;
			top: 0;
			left: 0;
			width: 12px;
			height: 36px;
			background: rgba(#030025, 1);
			border-radius: 5px;
			transition: .1s ease;

			box-shadow: 20px 8px 32px rgba(black, .5), inset 3px 0px 3px rgba(white, .4), inset -2px 0px 2px rgba(white, .9);

			&::after{
				content: '';
				position: absolute;
				bottom: 3px;
				left: 2.25px;
				background: white;
				width: 6px;
				height: 6px;
				border-radius: 4px;
			}
		}
	}

	#navbar{
		position: sticky;
		top: 0px;
		height: 100vh;
		//margin-top: 80vh;
		display: none;
	}

	#canvas{
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: -4;
		display: none;
	}

	.app {
		display: flex;
		position: relative;
		justify-content: flex-start;
		align-items: flex-start;
		width: clamp(400px, 100%, 1600px);
		margin: auto;

		/*
		height: calc(100vh - 50px);
		width: calc(100vw - 50px);
		box-shadow: -10px 20px 80px rgba(black, .25);
		position: sticky;
		top: 20px;
		//margin: 20px;
		border-radius: 10px;
		//border: 1px solid black;
		overflow-y: scroll;
		scroll-snap-type: y mandatory;
		*/
	}



	main {
		flex: 1;
		width: 100%;
		/*
		scroll-snap-align: start;
		margin-top: 200px;
		scroll-snap-align: end;
		margin-bottom: 100px;
		*/
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}



	@media screen and (max-width: 768px){

		.app{
			overflow-x: hidden;
			width: 100vw;
		}

		#navbar{
			display: none;
		}

		main{
			width: 100vw;
			padding: 0;
		}

	}

</style>
