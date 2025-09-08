 <script>
	import { onMount } from 'svelte';

	// Color profiles definition
	const colorProfiles = [
		{
			name: 'orange',
			background: ['#FFA500', '#FF7F50'],
			planet: '#FF8C00',
			planetHighlight: '#FFB84D',
			circles: [
				'rgba(255, 140, 0, 0.9)',   // Ring 1 - Dark orange
				'rgba(255, 165, 0, 0.78)',  // Ring 2 - Orange  
				'rgba(255, 185, 50, 0.66)', // Ring 3 - Light orange
				'rgba(255, 200, 100, 0.54)', // Ring 4 - Very light orange
				'rgba(255, 220, 150, 0.42)'  // Ring 5 - Pale orange
			],
			splashTitle: '#D2691E',
			splashButton: 'rgba(255, 140, 0, 1)'  // Same as ring 1 circle color
		},
		{
			name: 'blue',
			background: ['#1E90FF', '#4169E1'],
			planet: '#0066CC',
			planetHighlight: '#3399FF',
			circles: [
				'rgba(30, 144, 255, 0.9)',   // Ring 1 - Dodger blue
				'rgba(65, 105, 225, 0.78)',  // Ring 2 - Royal blue
				'rgba(100, 149, 237, 0.66)', // Ring 3 - Cornflower blue
				'rgba(135, 206, 250, 0.54)', // Ring 4 - Light sky blue
				'rgba(173, 216, 230, 0.42)'  // Ring 5 - Light blue
			],
			splashTitle: '#003d82',
			splashButton: 'rgba(30, 144, 255, 1)'  // Same as ring 1 circle color
		},
		{
			name: 'purple',
			background: ['#8A2BE2', '#9932CC'],
			planet: '#6A1B9A',
			planetHighlight: '#AB47BC',
			circles: [
				'rgba(138, 43, 226, 0.9)',   // Ring 1 - Blue violet
				'rgba(153, 50, 204, 0.78)',  // Ring 2 - Dark orchid
				'rgba(186, 85, 211, 0.66)',  // Ring 3 - Medium orchid
				'rgba(221, 160, 221, 0.54)', // Ring 4 - Plum
				'rgba(238, 130, 238, 0.42)'  // Ring 5 - Violet
			],
			splashTitle: '#4A148C',
			splashButton: 'rgba(138, 43, 226, 1)'  // Same as ring 1 circle color
		},
		{
			name: 'green',
			background: ['#32CD32', '#228B22'],
			planet: '#2E7D32',
			planetHighlight: '#66BB6A',
			circles: [
				'rgba(50, 205, 50, 0.9)',    // Ring 1 - Lime green
				'rgba(34, 139, 34, 0.78)',   // Ring 2 - Forest green
				'rgba(60, 179, 113, 0.66)',  // Ring 3 - Medium sea green
				'rgba(144, 238, 144, 0.54)', // Ring 4 - Light green
				'rgba(152, 251, 152, 0.42)'  // Ring 5 - Pale green
			],
			splashTitle: '#1B5E20',
			splashButton: 'rgba(50, 205, 50, 1)'  // Same as ring 1 circle color
		},
		{
			name: 'pink',
			background: ['#FF69B4', '#FF1493'],
			planet: '#E91E63',
			planetHighlight: '#F48FB1',
			circles: [
				'rgba(255, 105, 180, 0.9)',  // Ring 1 - Hot pink
				'rgba(255, 20, 147, 0.78)',  // Ring 2 - Deep pink
				'rgba(255, 182, 193, 0.66)', // Ring 3 - Light pink
				'rgba(255, 192, 203, 0.54)', // Ring 4 - Pink
				'rgba(255, 228, 225, 0.42)'  // Ring 5 - Misty rose
			],
			splashTitle: '#AD1457',
			splashButton: 'rgba(255, 105, 180, 1)'  // Same as ring 1 circle color
		}
	];

	// Current color profile state
	let currentColorIndex = 0;
	let previousProfile = null;
	let transitionProgress = 1; // 0 = previous, 1 = current
	let transitionStartTime = 0;
	const transitionDuration = 600; // 600ms to match CSS transitions
	
	$: currentProfile = colorProfiles[currentColorIndex];
	let interpolatedProfile = colorProfiles[0];
	
	// Update body background when colors change
	$: if (typeof document !== 'undefined' && interpolatedProfile) {
		document.body.style.background = `linear-gradient(145deg, ${interpolatedProfile.background[0]}, ${interpolatedProfile.background[1]})`;
	}
	
	// Function to interpolate between colors
	function interpolateColor(color1, color2, progress) {
		if (!color1 || !color2) return color2 || color1;
		
		// Handle rgba colors
		if (color1.startsWith('rgba') && color2.startsWith('rgba')) {
			const rgba1 = color1.match(/rgba\(([^)]+)\)/)[1].split(',').map(n => parseFloat(n.trim()));
			const rgba2 = color2.match(/rgba\(([^)]+)\)/)[1].split(',').map(n => parseFloat(n.trim()));
			
			const r = Math.round(rgba1[0] + (rgba2[0] - rgba1[0]) * progress);
			const g = Math.round(rgba1[1] + (rgba2[1] - rgba1[1]) * progress);
			const b = Math.round(rgba1[2] + (rgba2[2] - rgba1[2]) * progress);
			const a = rgba1[3] + (rgba2[3] - rgba1[3]) * progress;
			
			return `rgba(${r}, ${g}, ${b}, ${a})`;
		}
		
		// Handle hex colors
		const hex1 = color1.replace('#', '');
		const hex2 = color2.replace('#', '');
		
		const r1 = parseInt(hex1.substr(0, 2), 16);
		const g1 = parseInt(hex1.substr(2, 2), 16);
		const b1 = parseInt(hex1.substr(4, 2), 16);
		
		const r2 = parseInt(hex2.substr(0, 2), 16);
		const g2 = parseInt(hex2.substr(2, 2), 16);
		const b2 = parseInt(hex2.substr(4, 2), 16);
		
		const r = Math.round(r1 + (r2 - r1) * progress);
		const g = Math.round(g1 + (g2 - g1) * progress);
		const b = Math.round(b1 + (b2 - b1) * progress);
		
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	}
	
	// Get interpolated colors for smooth transitions
	function getInterpolatedProfile() {
		if (!previousProfile || transitionProgress >= 1) {
			return currentProfile;
		}
		
		return {
			...currentProfile,
			planet: interpolateColor(previousProfile.planet, currentProfile.planet, transitionProgress),
			planetHighlight: interpolateColor(previousProfile.planetHighlight, currentProfile.planetHighlight, transitionProgress),
			splashTitle: interpolateColor(previousProfile.splashTitle, currentProfile.splashTitle, transitionProgress),
			splashButton: interpolateColor(previousProfile.splashButton, currentProfile.splashButton, transitionProgress),
			background: [
				interpolateColor(previousProfile.background[0], currentProfile.background[0], transitionProgress),
				interpolateColor(previousProfile.background[1], currentProfile.background[1], transitionProgress)
			],
			circles: currentProfile.circles.map((color, i) => 
				interpolateColor(previousProfile.circles[i], color, transitionProgress)
			)
		};
	}

	let canvas;
	let ctx;
	let animationId;

	// Central planet class
	class Planet {
		constructor(x, y, radius) {
			this.x = x;
			this.y = y;
			this.radius = radius;
		}

		draw() {
			const profile = getInterpolatedProfile();
			
			// Create neumorphic effect with multiple shadow layers
			ctx.save();
			
			// Outer shadow (darker)
			ctx.shadowOffsetX = 24;
			ctx.shadowOffsetY = 24;
			ctx.shadowBlur = 72;
			ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
			
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
			ctx.fillStyle = profile.planet;
			ctx.fill();
			
			// Inner highlight
			ctx.shadowOffsetX = -24;
			ctx.shadowOffsetY = -24;
			ctx.shadowBlur = 72;
			ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
			
			ctx.beginPath();
			ctx.arc(this.x , this.y, this.radius - 10, 0, Math.PI * 2);
			ctx.fillStyle = profile.planetHighlight;
			ctx.fill();
			
			ctx.restore();
		}

		updatePosition(newX, newY) {
			this.x = newX;
			this.y = newY;
		}
	}

	// Orbiting circle class
	class OrbitingCircle {
		constructor(centerX, centerY, orbitRadius, ringLevel, initialAngle = 0, planetRadius = 300) {
			this.centerX = centerX;
			this.centerY = centerY;
			this.orbitRadius = orbitRadius;
			this.ringLevel = ringLevel;
			this.angle = initialAngle;
			// Scale circle size based on planet size (smaller planet = smaller circles)
			const baseSize = Math.max(8, planetRadius * 0.05); // Minimum 8px, scales with planet
			this.radius = baseSize + (6 - ringLevel) * (baseSize * 0.15); // Larger circles for inner rings
			this.speed = 0.001 + (6 - ringLevel) * 0.001; // Inner rings move faster
			this.color = this.getColorForRing(ringLevel);
		}

		getColorForRing(ring) {
			const profile = getInterpolatedProfile();
			return profile.circles[ring - 1];
		}

		update() {
			this.angle += this.speed;
			if (this.angle > Math.PI * 2) {
				this.angle -= Math.PI * 2;
			}
		}

		draw() {
			const x = this.centerX + Math.cos(this.angle) * this.orbitRadius;
			const y = this.centerY + Math.sin(this.angle) * this.orbitRadius;

			ctx.save();
			
			// Outer shadow
			ctx.shadowOffsetX = 12;
			ctx.shadowOffsetY = 12;
			ctx.shadowBlur = 24;
			ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
			
			ctx.beginPath();
			ctx.arc(x, y, this.radius, 0, Math.PI * 2);
			ctx.fillStyle = this.getColorForRing(this.ringLevel);
			ctx.fill();
			
			// Inner highlight
			ctx.shadowOffsetX = -8;
			ctx.shadowOffsetY = -8;
			ctx.shadowBlur = 18;
			ctx.shadowColor = 'rgba(255, 255, 255, 0.15)';
			
			ctx.beginPath();
			ctx.arc(x - 1, y - 1, this.radius - 2, 0, Math.PI * 2);
			ctx.fillStyle = this.getColorForRing(this.ringLevel);
			ctx.fill();
			
			ctx.restore();
		}

		updateCenter(newCenterX, newCenterY) {
			this.centerX = newCenterX;
			this.centerY = newCenterY;
		}
	}

	// Animation state
	let planet;
	let orbitingCircles = [];

	function calculatePlanetRadius() {
		if (!canvas) return 300; // Default radius
		
		let planetDiameter = 600; // Default diameter (600px)
		
		// On mobile screens (<800px width), limit to 70% of screen height
		if (canvas.width < 800) {
			planetDiameter = Math.min(600, canvas.height * 0.7);
		}
		
		return planetDiameter / 2; // Return radius
	}

	function initializeAnimation() {
		if (!canvas || !ctx) return;

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const planetRadius = calculatePlanetRadius();

		// Create central planet with responsive size
		planet = new Planet(centerX, centerY, planetRadius);

		// Create orbiting circles in 5 rings
		orbitingCircles = [];
		const baseOrbitRadius = planetRadius + 80; // Start just outside the planet
		const ringSpacing = Math.max(60, planetRadius * 0.2); // Scale ring spacing with planet size
		const circlesPerRing = 8;

		for (let ring = 1; ring <= 5; ring++) {
			const orbitRadius = baseOrbitRadius + (ring - 1) * ringSpacing;
			
			for (let i = 0; i < circlesPerRing; i++) {
				const initialAngle = (i / circlesPerRing) * Math.PI * 2;
				// Add slight randomness to initial positions
				const angleOffset = (Math.random() - 0.5) * 0.5;
				
				const circle = new OrbitingCircle(
					centerX,
					centerY,
					orbitRadius,
					ring,
					initialAngle + angleOffset,
					planetRadius
				);
				orbitingCircles.push(circle);
			}
		}
	}

	function animate() {
		if (!canvas || !ctx) return;

		// Update transition progress
		if (transitionProgress < 1) {
			const elapsed = Date.now() - transitionStartTime;
			transitionProgress = Math.min(1, elapsed / transitionDuration);
		}

		interpolatedProfile = getInterpolatedProfile();
		const profile = interpolatedProfile;

		// Clear canvas with gradient background
		const gradient = ctx.createRadialGradient(
			canvas.width / 2, canvas.height / 2, 0,
			canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
		);
		gradient.addColorStop(0, profile.background[0]);
		gradient.addColorStop(1, profile.background[1]);
		
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw central planet
		if (planet) {
			planet.draw();
		}

		// Update and draw orbiting circles
		orbitingCircles.forEach(circle => {
			circle.update();
			circle.draw();
		});

		animationId = requestAnimationFrame(animate);
	}

	function resizeCanvas() {
		if (!canvas) return;
		
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		
		// Reinitialize the entire animation with new dimensions
		// This ensures planet size and orbit radii are recalculated
		initializeAnimation();
	}

	// Handle spacebar key press to cycle colors
	function handleKeydown(event) {
		if (event.code === 'Space') {
			event.preventDefault(); // Prevent page scroll
			
			// Start transition
			previousProfile = currentProfile;
			currentColorIndex = (currentColorIndex + 1) % colorProfiles.length;
			transitionProgress = 0;
			transitionStartTime = Date.now();
		}
	}

	onMount(() => {
		ctx = canvas.getContext('2d');
		
		// Initial setup
		resizeCanvas();
		initializeAnimation();
		
		// Start animation
		animate();
		
		// Handle window resize
		const handleResize = () => {
			resizeCanvas();
		};
		
		window.addEventListener('resize', handleResize);
		window.addEventListener('keydown', handleKeydown);
		
		// Cleanup
		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<svelte:head>
	<style>
		:root {
			--bg-start: {interpolatedProfile.background[0]};
			--bg-end: {interpolatedProfile.background[1]};
			--title-color: {interpolatedProfile.splashTitle};
			--button-color: {interpolatedProfile.splashButton};
		}
	</style>
</svelte:head>

<canvas bind:this={canvas}></canvas>
<div class='splash'>
    <div class = 'mast'>
        <h1 style="color: {interpolatedProfile.splashTitle}"> Discover More </h1>
        <button style="background-color: {interpolatedProfile.splashButton}">
            <h2> Start Simulation </h2>
        </button>
    </div>
</div>

<style lang="scss">
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		/* Background transition is now handled by JS interpolation */
	}

	:global(:root) {
		transition: all 0.6s ease-in-out;
	}
	
	canvas {
		display: block;
		width: 100vw;
		height: 100vh;
		cursor: pointer;
	}
    .splash {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        font-family: "Geist", "Inter", sans-serif;

        .mast {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: white;
            z-index: 10;
            h1 {
                font-size: 48px;
                font-weight: 700;
                letter-spacing: -2.5px;
                margin-bottom: 18px;
                /* Color transition is now handled by JS interpolation */
            }
            button {
                border: none;
                padding: 14px 28px;
                border-radius: 24px;
                box-shadow: -4px 12px 24px 0 rgba(0, 0, 0, 0.1);
                /* Background color transition is handled by JS; other transitions are for hover/active states */
                transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
                cursor: pointer;
                h2 {
                    font-family: "Geist", "Inter", sans-serif;
                    font-weight: 600;
                    letter-spacing: -0.1px;
                    color: white !important;
                    margin: 0;
                    transition: inherit;
                }
                &:hover {
                    transform: translateY(-2px);
                    opacity: 0.9;
                    box-shadow: -4px 14px 28px 0 rgba(0, 0, 0, 0.2);
                }
                &:active {
                    transform: translateY(0px);
                    transition: transform 0.1s ease;
                }
            }
        }
    }
</style>