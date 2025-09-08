<script>
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	// Pre-defined, high-quality human silhouette profiles (100 points each)
	// Inspired by SVG path data for recognizability and clean outlines.
	const profileData = [
		// Shape 1: Heart
		[
			{"x":200,"y":210},{"x":215,"y":208},{"x":229,"y":203},{"x":243,"y":195},{"x":256,"y":184},
			{"x":268,"y":171},{"x":279,"y":156},{"x":288,"y":140},{"x":295,"y":122},{"x":300,"y":104},
			{"x":302,"y":85},{"x":300,"y":66},{"x":295,"y":49},{"x":287,"y":33},{"x":275,"y":21},
			{"x":260,"y":14},{"x":243,"y":13},{"x":225,"y":19},{"x":207,"y":31},{"x":189,"y":49},
			{"x":172,"y":69},{"x":156,"y":92},{"x":144,"y":117},{"x":135,"y":142},{"x":131,"y":169},
			{"x":131,"y":195},{"x":135,"y":221},{"x":144,"y":246},{"x":156,"y":269},{"x":171,"y":289},
			{"x":189,"y":306},{"x":207,"y":319},{"x":225,"y":327},{"x":243,"y":331},{"x":260,"y":329},
			{"x":275,"y":322},{"x":287,"y":310},{"x":295,"y":295},{"x":300,"y":277},{"x":302,"y":258},
			{"x":300,"y":239},{"x":295,"y":221},{"x":288,"y":204},{"x":279,"y":189},{"x":268,"y":176},
			{"x":256,"y":164},{"x":243,"y":155},{"x":229,"y":149},{"x":215,"y":146},{"x":200,"y":147},
			{"x":185,"y":146},{"x":171,"y":149},{"x":157,"y":155},{"x":144,"y":164},{"x":132,"y":176},
			{"x":121,"y":189},{"x":112,"y":204},{"x":105,"y":221},{"x":100,"y":239},{"x":98,"y":258},
			{"x":100,"y":277},{"x":105,"y":295},{"x":113,"y":310},{"x":125,"y":322},{"x":140,"y":329},
			{"x":157,"y":331},{"x":175,"y":327},{"x":193,"y":319},{"x":211,"y":306},{"x":229,"y":289},
			{"x":244,"y":269},{"x":256,"y":246},{"x":265,"y":221},{"x":269,"y":195},{"x":269,"y":169},
			{"x":265,"y":142},{"x":256,"y":117},{"x":244,"y":92},{"x":228,"y":69},{"x":211,"y":49},
			{"x":193,"y":31},{"x":175,"y":19},{"x":157,"y":13},{"x":140,"y":14},{"x":125,"y":21},
			{"x":113,"y":33},{"x":105,"y":49},{"x":100,"y":66},{"x":98,"y":85},{"x":100,"y":104},
			{"x":105,"y":122},{"x":112,"y":140},{"x":121,"y":156},{"x":132,"y":171},{"x":144,"y":184},
			{"x":157,"y":195},{"x":171,"y":203},{"x":185,"y":208},{"x":200,"y":210}
		],
		// Shape 2: Star
		[
			{"x":200,"y":20},{"x":204,"y":31},{"x":209,"y":42},{"x":213,"y":54},{"x":218,"y":65},{"x":222,"y":76},{"x":227,"y":87},{"x":231,"y":99},{"x":236,"y":110},{"x":240,"y":121},{"x":295,"y":121},{"x":350,"y":121},{"x":341,"y":130},{"x":331,"y":138},{"x":322,"y":147},{"x":313,"y":156},{"x":304,"y":164},{"x":295,"y":173},{"x":286,"y":182},{"x":277,"y":190},{"x":268,"y":199},{"x":259,"y":208},{"x":268,"y":223},{"x":277,"y":238},{"x":286,"y":253},{"x":295,"y":268},{"x":304,"y":283},{"x":286,"y":288},{"x":268,"y":293},{"x":251,"y":298},{"x":233,"y":303},{"x":215,"y":308},{"x":198,"y":303},{"x":180,"y":298},{"x":163,"y":293},{"x":145,"y":288},{"x":127,"y":283},{"x":136,"y":268},{"x":145,"y":253},{"x":154,"y":238},{"x":163,"y":223},{"x":172,"y":208},{"x":181,"y":199},{"x":190,"y":190},{"x":199,"y":182},{"x":208,"y":173},{"x":217,"y":164},{"x":226,"y":156},{"x":235,"y":147},{"x":244,"y":138},{"x":253,"y":130},{"x":244,"y":121},{"x":189,"y":121},{"x":134,"y":121},{"x":125,"y":110},{"x":119,"y":99},{"x":114,"y":87},{"x":109,"y":76},{"x":105,"y":65},{"x":100,"y":54},{"x":96,"y":42},{"x":91,"y":31},{"x":87,"y":20},{"x":105,"y":20},{"x":124,"y":20},{"x":142,"y":20},{"x":161,"y":20},{"x":180,"y":20},{"x":147,"y":42},{"x":114,"y":65},{"x":81,"y":87},{"x":48,"y":110},{"x":15,"y":132},{"x":48,"y":154},{"x":81,"y":177},{"x":114,"y":199},{"x":147,"y":221},{"x":180,"y":244},{"x":213,"y":221},{"x":246,"y":199},{"x":279,"y":177},{"x":312,"y":154},{"x":345,"y":132},{"x":312,"y":110},{"x":279,"y":87},{"x":246,"y":65},{"x":213,"y":42},{"x":180,"y":20}
		],
		// Shape 3: Swirl
		[
			{"x":200,"y":200},{"x":202,"y":205},{"x":203,"y":210},{"x":202,"y":215},{"x":200,"y":220},{"x":196,"y":224},{"x":191,"y":228},{"x":185,"y":230},{"x":179,"y":232},{"x":172,"y":232},{"x":165,"y":231},{"x":158,"y":228},{"x":151,"y":224},{"x":145,"y":219},{"x":139,"y":213},{"x":134,"y":206},{"x":130,"y":198},{"x":128,"y":190},{"x":127,"y":182},{"x":127,"y":173},{"x":129,"y":165},{"x":133,"y":157},{"x":138,"y":150},{"x":144,"y":143},{"x":152,"y":137},{"x":160,"y":132},{"x":169,"y":128},{"x":178,"y":126},{"x":187,"y":125},{"x":197,"y":125},{"x":207,"y":127},{"x":216,"y":131},{"x":225,"y":136},{"x":234,"y":143},{"x":242,"y":151},{"x":249,"y":160},{"x":255,"y":169},{"x":260,"y":179},{"x":264,"y":189},{"x":267,"y":200},{"x":268,"y":210},{"x":267,"y":221},{"x":265,"y":231},{"x":261,"y":241},{"x":256,"y":251},{"x":249,"y":260},{"x":241,"y":268},{"x":232,"y":275},{"x":222,"y":281},{"x":212,"y":285},{"x":201,"y":288},{"x":190,"y":289},{"x":179,"y":289},{"x":168,"y":287},{"x":157,"y":284},{"x":146,"y":279},{"x":136,"y":273},{"x":126,"y":265},{"x":117,"y":257},{"x":108,"y":247},{"x":101,"y":236},{"x":95,"y":225},{"x":90,"y":214},{"x":86,"y":202},{"x":84,"y":190},{"x":84,"y":178},{"x":85,"y":166},{"x":88,"y":154},{"x":93,"y":143},{"x":99,"y":132},{"x":107,"y":122},{"x":116,"y":113},{"x":126,"y":105},{"x":137,"y":98},{"x":148,"y":93},{"x":160,"y":89},{"x":172,"y":87},{"x":184,"y":86},{"x":197,"y":87},{"x":209,"y":90},{"x":221,"y":95},{"x":232,"y":101},{"x":243,"y":109},{"x":253,"y":118},{"x":262,"y":128},{"x":270,"y":139},{"x":277,"y":151},{"x":283,"y":163},{"x":288,"y":176},{"x":291,"y":189},{"x":292,"y":202},{"x":292,"y":215},{"x":291,"y":228},{"x":288,"y":241}
		]
	];

	// Dot class for individual dots
	class Dot {
		constructor(x, y, index) {
			this.currentX = x;
			this.currentY = y;
			this.targetX = x;
			this.targetY = y;
			this.index = index;
			this.radius = 2.5;
			this.animationProgress = 1;
			this.transitionDuration = 1500; // Uniform 1.5 second transition
			this.transitionStartTime = 0;
		}

		setTarget(x, y) {
			this.targetX = x;
			this.targetY = y;
			this.animationProgress = 0;
			this.transitionStartTime = Date.now();
		}

		update() {
			if (this.animationProgress < 1) {
				const elapsed = Date.now() - this.transitionStartTime;
				this.animationProgress = Math.min(1, elapsed / this.transitionDuration);
				
				// Cubic easing out
				const progress = 1 - Math.pow(1 - this.animationProgress, 3);
				
				this.currentX = this.currentX + (this.targetX - this.currentX) * progress * 0.1;
				this.currentY = this.currentY + (this.targetY - this.currentY) * progress * 0.1;
			}
		}

		draw(ctx) {
			ctx.beginPath();
			ctx.arc(this.currentX, this.currentY, this.radius, 0, Math.PI * 2);
			ctx.fillStyle = '#FF6B47';
            ctx.fillStyle = 'white';
			ctx.fill();
			
			// Add subtle glow
			ctx.shadowBlur = 24;
			ctx.shadowColor = 'rgba(255, 107, 71, 0.4)';
			ctx.fill();
			ctx.shadowBlur = 0;
		}
	}

	// Animation state
	let canvas;
	let ctx;
	let animationId;
	let dots = [];
	let currentProfileIndex = 0;
	let profileChangeTimer = 0;
	const profileChangeDuration = 2000; // Change profile every 2 seconds
	let profiles = []; // This will hold the scaled profiles

	function initializeDots() {
		dots = [];
		if (profiles.length === 0) return;
		const initialProfile = profiles[0];
		
		for (let i = 0; i < 100; i++) {
			const point = initialProfile[i] || { x: 200, y: 200 };
			const dot = new Dot(point.x, point.y, i);
			dots.push(dot);
		}
	}

	function changeProfile() {
		currentProfileIndex = (currentProfileIndex + 1) % profiles.length;
		const newProfile = profiles[currentProfileIndex];

		// Set new targets for all dots simultaneously
		dots.forEach((dot, index) => {
			const point = newProfile[index] || { x: 200, y: 200 };
			dot.setTarget(point.x, point.y);
		});

		profileChangeTimer = 0;
	}

	function drawConnectingLines(ctx) {
		if (dots.length < 2) return;
		
		ctx.beginPath();
		ctx.moveTo(dots[0].currentX, dots[0].currentY);
		
		for (let i = 1; i < dots.length; i++) {
			ctx.lineTo(dots[i].currentX, dots[i].currentY);
		}
		
		// Connect back to first dot to close the shape
		ctx.lineTo(dots[0].currentX, dots[0].currentY);
		
		ctx.strokeStyle = 'rgba(255, 107, 71, 0.3)';
        ctx.strokeStyle = 'white';
		ctx.lineWidth = 5;
        ctx.globalAlpha = 0.2;
		ctx.stroke();
        ctx.globalAlpha = 1;
	}

	function animate() {
		if (!canvas || !ctx) return;

		// Clear canvas with subtle gradient background
		const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
		gradient.addColorStop(0, '#f8f9fa');
		gradient.addColorStop(1, '#e9ecef');
		ctx.fillStyle = gradient;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Update profile change timer
		profileChangeTimer += 16; // Assuming ~60fps
		if (profileChangeTimer >= profileChangeDuration) {
			changeProfile();
		}

		// Update and draw connecting lines first (behind dots)
		drawConnectingLines(ctx);
		
		// Update and draw dots
		dots.forEach(dot => {
			dot.update();
			dot.draw(ctx);
		});

		animationId = requestAnimationFrame(animate);
	}

	function resizeCanvas() {
		if (!canvas || !ctx) return;
		
		const scaleFactor = 2; // For high-DPI rendering
		const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;

		// Set display size via CSS
		canvas.style.width = `${size}px`;
		canvas.style.height = `${size}px`;
		
		// Set actual canvas resolution (backing store)
		canvas.width = size * scaleFactor;
		canvas.height = size * scaleFactor;
		
		// Scale the context to match the display size
		ctx.scale(scaleFactor, scaleFactor);

		// Recalculate scaled profiles based on the new size
		const profileScale = size / 400; // Original profiles are in a 400x400 box
		profiles = JSON.parse(JSON.stringify(profileData)).map(profile =>
			profile.map(point => ({
				x: (point.x - 200) * profileScale + (size / 2),
				y: (point.y - 200) * profileScale + (size / 2)
			}))
		);
		
		// Reinitialize dots with new scaled coordinates
		initializeDots();
	}

	onMount(() => {
		ctx = canvas.getContext('2d');
		
		// Initial setup
		resizeCanvas();
		initializeDots();
		
		// Start animation
		animate();
		
		// Handle window resize
		const handleResize = () => {
			resizeCanvas();
		};
		
		window.addEventListener('resize', handleResize);
		
		// Cleanup
		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

<svelte:head>
    <title>Dots</title>
    <link rel="icon" href="orange-gradient.png" />
</svelte:head>

<div class="container">
	<canvas bind:this={canvas}></canvas>
</div>

<style lang="scss">
	:global(body) {
		margin: 0;
		padding: 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: white;
	}

	.container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		width: 100vw;
		height: 100vh;
		position: relative;
        background: linear-gradient(160deg, #ffa42d 0%, #ff9436 100%);
	}

	canvas {
		display: block;
	}
</style>