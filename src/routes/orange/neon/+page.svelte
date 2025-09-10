<script>
	import { onMount } from 'svelte';

	let canvas;
	let ctx;
	let animationId;

	// --- Shape Definitions ---
	const animations = {
		walk: [
			{
				name: 'Walk1',
				map: ['  ##  ', '  ##  ', '  ##  ', ' # ## ', '#  ## ', '   ## ', '  #  #', ' #  # ']
			},
			{
				name: 'Walk2',
				map: ['  ##  ', '  ##  ', '  ##  ', ' ## # ', ' ##  #', ' ##   ', '#  #  ', ' #  # ']
			}
		],
		run: [
			{
				name: 'Run1',
				map: ['  ##  ', ' ##   ', '# #   ', '  # # ', '   ## ', '  # # ', ' #  # ', '#    #']
			},
			{
				name: 'Run2',
				map: ['  ##  ', '   ## ', '   # #', ' # #  ', ' ##   ', ' # #  ', '  #  #', ' #   #']
			}
		],
		jump: [
			{
				name: 'Crouch',
				map: ['      ', '      ', '  ##  ', '  ##  ', '# ## #', ' ## ##', '#     ', ' #   # ']
			},
			{
				name: 'Jump',
				map: ['# ## #', '# ## #', '  ##  ', '  ##  ', '  ##  ', ' #  # ', '#    #', ' #  # ']
			}
		],
		walk_large: [
			{
				name: 'WalkLarge1',
				map: [
					'   ####   ',
					'   ####   ',
					'   ####   ',
					'    ##    ',
					'  # ## #  ',
					' ## ## ## ',
					' #  ##  # ',
					'    ##    ',
					'   #  #   ',
					'  #    #  ',
					' #      # ',
					' #      # '
				]
			},
			{
				name: 'WalkLarge2',
				map: [
					'   ####   ',
					'   ####   ',
					'   ####   ',
					'    ##    ',
					'  # ## #  ',
					' ## ## ## ',
					' #  ##  # ',
					'    ##    ',
					'   #  #   ',
					'  #    #  ',
					'  #    #  ',
					'   #  #   '
				]
			}
		],
		wave: [
			{
				name: 'Wave1',
				map: ['  ##  ', '  ##  ', '  ##  ', '  ## #', '  # ##', ' #  # ', '#   # ', '  ##  ']
			},
			{
				name: 'Wave2',
				map: [' ## ##', '# # ##', '  # ##', '  ### ', '   #  ', '  # # ', ' #   #', ' #   #']
			}
		],
		dance: [
			{
				name: 'Dance1',
				map: [' # ## ', '# # ##', '  # ##', '  ### ', ' # #  ', '#  # #', '  ##  ', ' #  # ']
			},
			{
				name: 'Dance2',
				map: [' ## # ', '## # #', '## #  ', ' ###  ', '  # # ', '# #  #', '  ##  ', ' #  # ']
			}
		],
		jump_large: [
			{
				name: 'JumpLarge1',
				map: [
					'          ',
					'          ',
					'   ####   ',
					'   ####   ',
					'   ####   ',
					'  # ## #  ',
					' ##    ## ',
					' #      # ',
					' #      # ',
					'  ##  ##  '
				]
			},
			{
				name: 'JumpLarge2',
				map: [
					'   ####   ',
					'   ####   ',
					'  # ## #  ',
					' ## ## ## ',
					'    ##    ',
					'    ##    ',
					'   #  #   ',
					'  #    #  ',
					' #      # ',
					'#        #'
				]
			}
		],
		stretch: [
			{
				name: 'Stretch1',
				map: ['  ##  ', '  ##  ', '  ##  ', ' #  # ', '#    #', ' #  # ', '  ##  ']
			},
			{
				name: 'Stretch2',
				map: ['# ## #', '# ## #', '  ##  ', '  ##  ', '  ##  ', '  ##  ', ' #  # ']
			}
		],
		look: [
			{
				name: 'Look1',
				map: [' ##   ', ' ##   ', ' ##   ', ' ## # ', ' ## ##', ' # #  ', '   #  ']
			},
			{
				name: 'Look2',
				map: ['   ## ', '   ## ', '   ## ', ' # ## ', '## ## ', '  # # ', '  #   ']
			}
		],
		shuffle: [
			{
				name: 'Shuffle1',
				map: ['  ##  ', '  ##  ', '  ##  ', ' ##   ', '##    ', ' # #  ', '  # # ']
			},
			{
				name: 'Shuffle2',
				map: ['  ##  ', '  ##  ', '  ##  ', '   ## ', '    ##', '  # # ', ' # #  ']
			}
		],
		think: [
			{
				name: 'Think1',
				map: ['  ##  ', '  ##  ', '  ##  ', '  ##  ', ' ##   ', '# # # ', '  # # ', '  #   ']
			},
			{
				name: 'Think2',
				map: ['  ##  ', '  ##  ', '  ##  ', '   ## ', '  # # ', ' #  # ', '    # ', '   #  ']
			}
		]
	};

	// --- Text Definition ---
	const orangeTextMap = [
		'  ######    #######      ##     ###   ##    ######   ########',
		' ########   ########    ####    ###   ##   ########  ########',
		'##      ##  ##   ###   ##  ##   ####  ##  ##         ##      ',
		'##      ##  ########  ##    ##  ## ## ##  ##   ###   ######  ',
		'##      ##  #######   ########  ##  ####  ##   ####  ######  ',
        '##      ##  ##    ##  ########  ##  ####  ##     ##  ##      ',
		' ########   ##    ##  ##    ##  ##   ###   ########  ########',
		'  ######    ##    ##  ##    ##  ##    ##    ######   ########',
	];

	// --- Grid Configuration ---
	const circleSize = 12; // 12px width
	const circleSpacing = 4; // 4px apart
	const cellSize = circleSize + circleSpacing;
	let grid = [];
	let cols, rows;

	// --- Animation State ---
	let sprites = [];
	let frameCount = 0;
	const animationSpeed = 15; // Renamed from 'speed' for clarity
	let moveFrameCount = 0;
	const moveSpeed = 2; // Move every 2 animation frames. This is adjustable.

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

		// Cleanup
		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
			window.removeEventListener('resize', handleResize);
		};
	});

	function initializeAnimation() {
		if (!canvas) return;
		cols = Math.floor(canvas.width / cellSize);
		rows = Math.floor(canvas.height / cellSize)+1;
		grid = Array(rows)
			.fill()
			.map(() => Array(cols).fill(null));

		// --- Create Sprites with even horizontal spacing and random vertical start ---
		sprites = [];
		const numSprites = 11; // Reduced to give more space for larger sprites
		const horizontalSpacing = Math.floor(cols / numSprites);
		const animationKeys = Object.keys(animations);

		for (let i = 0; i < numSprites; i++) {
			const animationName = animationKeys[i % animationKeys.length];
			const initialFrame = animations[animationName][0];
			const shapeHeight = initialFrame.map.length;

			sprites.push({
				x: Math.floor(horizontalSpacing * (i + 0.5) - initialFrame.map[0].length / 2),
				y: Math.floor(Math.random() * (rows + shapeHeight)) - shapeHeight,
				animation: animationName,
				currentFrame: 0
			});
		}
	}

	function animate() {
		if (!ctx || !canvas) return;

		// Clear canvas
		ctx.fillStyle = '#FB713B'; // Light grey background
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Update sprite frames
		frameCount++;
		if (frameCount >= animationSpeed) {
			frameCount = 0;
			sprites.forEach(sprite => {
				const animationFrames = animations[sprite.animation];
				sprite.currentFrame = (sprite.currentFrame + 1) % animationFrames.length;
			});

			// Handle vertical movement after each animation "step"
			moveFrameCount++;
			if (moveFrameCount >= moveSpeed) {
				moveFrameCount = 0;
				sprites.forEach(sprite => {
					sprite.y++; // Move down by one grid cell
					const animationFrames = animations[sprite.animation];
					const currentShape = animationFrames[sprite.currentFrame];
					const shapeHeight = currentShape.map.length;
					if (sprite.y > rows) {
						sprite.y = -shapeHeight;
					}
				});
			}
		}

		// Draw the grid
		draw();

		animationId = requestAnimationFrame(animate);
	}

	function draw() {
		if (!grid.length) return;
		const foregroundColor = '#FFEA4A'; // A nice blue
		const gridColor = '#FF8A5E'; // Lighter grey for grid
		const textColor = '#FFFFFF';

		// 1. Draw background grid
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const x = c * cellSize + cellSize / 2;
				const y = r * cellSize + cellSize / 2;

				ctx.beginPath();
				ctx.arc(x, y, circleSize / 2, 0, Math.PI * 2);
				ctx.fillStyle = gridColor;
				ctx.fill();
			}
		}

		// 2. Draw sprites
		sprites.forEach(sprite => {
			const animationFrames = animations[sprite.animation];
			const shape = animationFrames[sprite.currentFrame];
			const shapeWidth = shape.map[0].length;
			const shapeHeight = shape.map.length;

			for (let r = 0; r < shapeHeight; r++) {
				for (let c = 0; c < shapeWidth; c++) {
					if (shape.map[r][c] === '#') {
						const gridX = sprite.x + c;
						const gridY = sprite.y + r;

						if (gridX < cols && gridY < rows) {
							const x = gridX * cellSize + cellSize / 2;
							const y = gridY * cellSize + cellSize / 2;

							ctx.beginPath();
							ctx.arc(x, y, circleSize / 2, 0, Math.PI * 2);
							ctx.fillStyle = foregroundColor;
							ctx.fill();
						}
					}
				}
			}
		});

		// 3. Draw text, overwriting grid and sprites where necessary
		const textWidth = orangeTextMap[0].length;
		const textHeight = orangeTextMap.length;
		const textStartX = Math.floor(cols / 2 - textWidth / 2);
		const textStartY = Math.floor(rows / 2 - textHeight / 2);

		for (let r = 0; r < textHeight; r++) {
			for (let c = 0; c < textWidth; c++) {
				if (orangeTextMap[r][c] === '#') {
					const gridX = textStartX + c;
					const gridY = textStartY + r;

					if (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
						const x = gridX * cellSize + cellSize / 2;
						const y = gridY * cellSize + cellSize / 2;

						ctx.beginPath();
						ctx.arc(x, y, circleSize / 2, 0, Math.PI * 2);
						ctx.fillStyle = textColor;
						ctx.fill();
					}
				}
			}
		}
	}

	function resizeCanvas() {
		if (!canvas) return;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		initializeAnimation();
	}
</script>

<svelte:head>
    <title>Neon</title>
    <link rel="icon" href="/orange-gradient.png" />
</svelte:head>
<canvas bind:this={canvas}></canvas>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		background-color: #111;
	}

	canvas {
		display: block;
		width: 100vw;
		height: 100vh;
        background-image: linear-gradient(160deg, #ff6f00 0%, #ff5100 100%);
	}
</style>
