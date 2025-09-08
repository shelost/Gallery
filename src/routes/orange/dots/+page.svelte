<script>
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	// Pre-defined, high-quality human silhouette profiles (100 points each)
	// Inspired by SVG path data for recognizability and clean outlines.
	const profileData = [
		// Profile 1: Male Side Profile
		[
			{"x":186,"y":331},{"x":156,"y":331},{"x":144,"y":326},{"x":137,"y":316},{"x":133,"y":303},
			{"x":131,"y":287},{"x":131,"y":274},{"x":133,"y":264},{"x":135,"y":256},{"x":144,"y":249},
			{"x":155,"y":249},{"x":160,"y":251},{"x":164,"y":258},{"x":164,"y":267},{"x":164,"y":274},
			{"x":162,"y":280},{"x":159,"y":284},{"x":156,"y":287},{"x":151,"y":289},{"x":148,"y":287},
			{"x":148,"y":278},{"x":151,"y":269},{"x":155,"y":262},{"x":160,"y":258},{"x":167,"y":251},
			{"x":174,"y":245},{"x":186,"y":238},{"x":197,"y":232},{"x":209,"y":225},{"x":221,"y":216},
			{"x":230,"y":206},{"x":239,"y":194},{"x":247,"y":181},{"x":254,"y":167},{"x":259,"y":151},
			{"x":262,"y":135},{"x":262,"y":118},{"x":259,"y":102},{"x":254,"y":87},{"x":247,"y":74},
			{"x":239,"y":63},{"x":230,"y":54},{"x":221,"y":48},{"x":211,"y":44},{"x":200,"y":44},
			{"x":189,"y":46},{"x":178,"y":52},{"x":169,"y":61},{"x":161,"y":72},{"x":154,"y":86},
			{"x":150,"y":100},{"x":148,"y":116},{"x":148,"y":132},{"x":150,"y":148},{"x":154,"y":162},
			{"x":160,"y":175},{"x":167,"y":186},{"x":175,"y":196},{"x":185,"y":204},{"x":195,"y":210},
			{"x":205,"y":214},{"x":216,"y":216},{"x":226,"y":216},{"x":236,"y":214},{"x":245,"y":210},
			{"x":253,"y":205},{"x":260,"y":199},{"x":266,"y":192},{"x":271,"y":184},{"x":275,"y":175},
      {"x":278,"y":165},{"x":280,"y":154},{"x":280,"y":142},{"x":278,"y":130},{"x":275,"y":119},
      {"x":271,"y":109},{"x":266,"y":100},{"x":260,"y":92},{"x":253,"y":85},{"x":245,"y":80},
      {"x":236,"y":76},{"x":226,"y":74},{"x":216,"y":74},{"x":205,"y":76},{"x":195,"y":80},
      {"x":185,"y":85},{"x":175,"y":92},{"x":167,"y":100},{"x":160,"y":109},{"x":154,"y":119},
      {"x":150,"y":130},{"x":148,"y":142},{"x":148,"y":154},{"x":150,"y":165},{"x":186,"y":229},
      {"x":197,"y":238},{"x":209,"y":249},{"x":221,"y":262},{"x":230,"y":278},{"x":236,"y":296},
      {"x":236,"y":315},{"x":230,"y":326},{"x":219,"y":331},{"x":204,"y":331}
		],
		// Profile 2: Female with Bun
		[
			{"x":216,"y":335},{"x":192,"y":335},{"x":180,"y":329},{"x":172,"y":319},{"x":167,"y":307},
			{"x":165,"y":292},{"x":165,"y":279},{"x":167,"y":267},{"x":171,"y":257},{"x":178,"y":249},
			{"x":186,"y":246},{"x":192,"y":249},{"x":195,"y":256},{"x":195,"y":264},{"x":192,"y":271},
			{"x":189,"y":276},{"x":185,"y":280},{"x":180,"y":283},{"x":175,"y":284},{"x":172,"y":282},
			{"x":172,"y":273},{"x":175,"y":264},{"x":180,"y":257},{"x":186,"y":251},{"x":194,"y":245},
			{"x":202,"y":239},{"x":212,"y":233},{"x":222,"y":227},{"x":232,"y":220},{"x":241,"y":211},
			{"x":249,"y":201},{"x":256,"y":189},{"x":262,"y":175},{"x":266,"y":160},{"x":268,"y":145},
			{"x":268,"y":129},{"x":266,"y":113},{"x":262,"y":98},{"x":256,"y":85},{"x":249,"y":74},
			{"x":241,"y":65},{"x":232,"y":58},{"x":222,"y":53},{"x":212,"y":50},{"x":201,"y":49},
			{"x":189,"y":52},{"x":178,"y":58},{"x":168,"y":66},{"x":159,"y":77},{"x":152,"y":90},
			{"x":148,"y":104},{"x":146,"y":119},{"x":146,"y":135},{"x":148,"y":150},{"x":152,"y":164},
			{"x":158,"y":177},{"x":165,"y":188},{"x":145,"y":101},{"x":134,"y":93},{"x":124,"y":87},
			{"x":115,"y":85},{"x":107,"y":87},{"x":99,"y":93},{"x":92,"y":101},{"x":88,"y":110},
			{"x":86,"y":120},{"x":88,"y":130},{"x":92,"y":139},{"x":99,"y":147},{"x":107,"y":153},
      {"x":115,"y":155},{"x":124,"y":153},{"x":134,"y":147},{"x":145,"y":139},{"x":189,"y":198},
      {"x":201,"y":204},{"x":212,"y":209},{"x":222,"y":212},{"x":232,"y":212},{"x":241,"y":209},
      {"x":249,"y":204},{"x":256,"y":198},{"x":262,"y":190},{"x":266,"y":181},{"x":268,"y":171},
      {"x":268,"y":160},{"x":266,"y":149},{"x":262,"y":139},{"x":256,"y":130},{"x":249,"y":122},
      {"x":241,"y":115},{"x":232,"y":110},{"x":222,"y":107},{"x":212,"y":107},{"x":201,"y":110},
      {"x":189,"y":115},{"x":178,"y":122},{"x":168,"y":130},{"x":159,"y":139},{"x":152,"y":149},
      {"x":239,"y":230},{"x":241,"y":246},{"x":241,"y":264},{"x":239,"y":282},{"x":235,"y":300},
      {"x":228,"y":317},{"x":222,"y":326}
		],
		// Profile 3: Person with Hat
		[
			{"x":200,"y":340},{"x":170,"y":340},{"x":160,"y":336},{"x":152,"y":328},{"x":148,"y":318},
			{"x":146,"y":306},{"x":146,"y":293},{"x":148,"y":282},{"x":152,"y":272},{"x":158,"y":265},
			{"x":166,"y":260},{"x":174,"y":258},{"x":182,"y":260},{"x":188,"y":265},{"x":188,"y":274},
			{"x":186,"y":280},{"x":183,"y":284},{"x":179,"y":288},{"x":174,"y":290},{"x":170,"y":288},
			{"x":170,"y":279},{"x":174,"y":270},{"x":179,"y":263},{"x":186,"y":257},{"x":194,"y":251},
			{"x":202,"y":245},{"x":212,"y":239},{"x":222,"y":233},{"x":232,"y":227},{"x":242,"y":220},
			{"x":251,"y":211},{"x":259,"y":201},{"x":266,"y":189},{"x":271,"y":175},{"x":275,"y":160},
			{"x":277,"y":145},{"x":277,"y":129},{"x":275,"y":113},{"x":271,"y":98},{"x":266,"y":85},
			{"x":259,"y":74},{"x":251,"y":65},{"x":242,"y":58},{"x":232,"y":53},{"x":222,"y":50},
			{"x":212,"y":49},{"x":200,"y":50},{"x":188,"y":53},{"x":178,"y":58},{"x":168,"y":65},
			{"x":160,"y":74},{"x":153,"y":85},{"x":148,"y":98},{"x":145,"y":113},{"x":143,"y":129},
			{"x":143,"y":145},{"x":145,"y":160},{"x":148,"y":175},{"x":153,"y":189},{"x":160,"y":201},
			{"x":168,"y":211},{"x":178,"y":220},{"x":188,"y":227},{"x":200,"y":231},{"x":212,"y":233},
			{"x":225,"y":231},{"x":238,"y":227},{"x":248,"y":220},{"x":258,"y":211},{"x":266,"y":201},
      {"x":273,"y":189},{"x":278,"y":175},{"x":281,"y":160},{"x":281,"y":145},{"x":278,"y":129},
      {"x":273,"y":113},{"x":266,"y":98},{"x":258,"y":85},{"x":248,"y":74},{"x":238,"y":65},
      {"x":225,"y":58},{"x":212,"y":53},{"x":200,"y":50},{"x":188,"y":53},{"x":178,"y":58},
      {"x":168,"y":65},{"x":160,"y":74},{"x":153,"y":85},{"x":148,"y":98},{"x":145,"y":113},
      {"x":138,"y":95},{"x":125,"y":93},{"x":112,"y":95},{"x":100,"y":100},{"x":300,"y":100},
      {"x":288,"y":95},{"x":275,"y":93},{"x":262,"y":95},{"x":250,"y":100}
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
	<title>Animated Human Silhouettes</title>
</svelte:head>

<div class="container">
	<canvas bind:this={canvas}></canvas>
	<div class="info">
	</div>
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
	}

	.info {
		position: absolute;
		bottom: 40px;
		text-align: center;
		color: white;
		
		p {
			margin: 0 0 8px 0;
			font-size: 18px;
			font-weight: 500;
			text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		}
		
		small {
			font-size: 14px;
			opacity: 0.8;
			text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
		}
	}

	@media (max-width: 768px) {
		.info {
			bottom: 20px;
			
			p {
				font-size: 16px;
			}
			
			small {
				font-size: 12px;
			}
		}
	}
</style>