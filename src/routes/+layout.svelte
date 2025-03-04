<script>
	import Header from './Header.svelte';
	import Navbar from './Navbar.svelte';
	import { onMount } from 'svelte'
	import { themeColor } from '$lib/store'
	import '../app.css';

	let { children } = $props();

	let mouseX = -1000, mouseY = -1000; // Initial off-screen position
    let intensity = .2; // Control the effect strength
    let radius = 300; // Control the effect radius

    onMount(() => {

		if (document){
			//document.documentElement.style.backgroundColor = '#' + $themeColor
		}

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

        draw(); // Initial draw
    });

</script>

<div class="app">

	<canvas id = 'canvas'>
	</canvas>

	<main>
		{@render children()}
	</main>

	<div id = 'navbar'>
		<Navbar />
	</div>


</div>

<style lang="scss">

	#navbar{
		position: sticky;
		top: 10px;
		right: 10px;
		//border: 1px solid red;
	}

	#canvas{
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: -4;
	}

	.app {
		display: flex;
		position: relative;
		justify-content: flex-start;
		align-items: flex-start;
		width: 100%;
		max-width: 1600px;
		margin: auto;

		//height: calc(100vh - 24px);
		//box-shadow: 0 10px 40px rgba(black, .1);
	}

	main {
		//flex: 1;
		display: flex;
		flex-direction: column;

		width: calc(100%);
		padding-bottom: 120px;
		//padding: 48px;

		//margin: 0 auto;
		box-sizing: border-box;
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

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}

	@media screen and (max-width: 768px){

		.app{
			overflow-x: hidden;
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
