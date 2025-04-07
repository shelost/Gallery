<script>
	import { flip } from 'svelte/animate';
	import { cubicInOut } from 'svelte/easing';
    import { fade } from 'svelte/transition';
	import { tick } from 'svelte';

	// --- Config ---
	const FLIP_DURATION = 600; // Slightly faster, adjust as needed

	// --- Sample Data ---
	let items = [
		// ... (keep your sample data the same)
        { id: 'a1', title: 'Velocity', description: 'Measure team speed and predict delivery.', color: 'hsl(210, 80%, 60%)' },
		{ id: 'b2', title: 'Cycle Time', description: 'Optimize workflow efficiency.', color: 'hsl(160, 70%, 55%)' },
		{ id: 'c3', title: 'Burndown', description: 'Track progress towards sprint goals.', color: 'hsl(30, 90%, 60%)' },
		{ id: 'd4', title: 'Lead Time', description: 'From commit to production.', color: 'hsl(280, 60%, 65%)' },
		{ id: 'e5', title: 'Deployment', description: 'Frequency and stability of releases.', color: 'hsl(0, 75%, 60%)' },
		{ id: 'f6', title: 'Throughput', description: 'Units of work completed over time.', color: 'hsl(50, 85%, 58%)' },
		{ id: 'g7', title: 'Bugs Found', description: 'Track quality trends.', color: 'hsl(340, 70%, 62%)' },
		{ id: 'h8', title: 'Code Churn', description: 'Identify refactoring needs.', color: 'hsl(240, 50%, 70%)' }
	];

	// --- State ---
	let viewMode = 'grid'; // 'grid' or 'carousel'
	let selectedItemId = null;
	let carouselWrapperEl;
	let isTransitioning = false; // Prevent clicks during animation

	// --- Functions ---
	async function selectItem(id) {
		// Prevent triggering a new animation while one is running
		if (viewMode === 'grid' && !isTransitioning) {
            isTransitioning = true;
			selectedItemId = id;
			viewMode = 'carousel'; // Trigger the layout change

			// Wait for Svelte to calculate the new layout in the DOM
			await tick();

			// Instantly set the scroll position BEFORE FLIP renders the transition.
			// FLIP will then animate the element smoothly TO this already-scrolled position.
			const selectedElement = carouselWrapperEl?.querySelector(`[data-id="${id}"]`);
			if (selectedElement) {
				selectedElement.scrollIntoView({
					behavior: 'auto', // IMPORTANT: No smooth scroll here! Let FLIP handle the visual motion.
					block: 'nearest',
					inline: 'center'
				});
			}
            // Allow clicks again after the FLIP animation completes
            setTimeout(() => { isTransitioning = false; }, FLIP_DURATION);
		}
	}

	function deselect() {
		if (viewMode === 'carousel' && !isTransitioning) {
            isTransitioning = true;
            // Let the viewMode change back to 'grid'. FLIP will animate
            // items from their current carousel positions back to their grid spots.
			viewMode = 'grid';
            // No need to manually scroll back here.
            setTimeout(() => {
                selectedItemId = null; // Clear selection after animation
                isTransitioning = false;
            }, FLIP_DURATION);
		}
	}

	function handleBackdropClick(event) {
        // Only deselect if clicking the actual backdrop, not the scrollbar area or cards
		if (event.target === event.currentTarget) {
			deselect();
		}
	}

    function handleKeydown(event) {
        if (event.key === 'Escape' && viewMode === 'carousel') {
            deselect();
        }
    }

</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Add transition classes to this container -->
<div
	class="app-container"
	class:grid-mode={viewMode === 'grid'}
	class:carousel-mode={viewMode === 'carousel'}
	on:click={handleBackdropClick}
    style="--flip-duration: {FLIP_DURATION}ms"
>
	<div
		class="cards-wrapper"
		class:grid-layout={viewMode === 'grid'}
		class:carousel-layout={viewMode === 'carousel'}
		bind:this={carouselWrapperEl}
	>
		{#each items as item (item.id)}
			<div
				class="card"
				class:card-grid={viewMode === 'grid'}
				class:card-carousel={viewMode === 'carousel'}
                class:is-selected={item.id === selectedItemId}
				style="--card-bg-color: {item.color};"
				animate:flip={{ duration: FLIP_DURATION, easing: cubicInOut }}
                on:click|stopPropagation={(e) => {
                    if (viewMode === 'grid') {
                        selectItem(item.id);
                    } else {
                        // Optional: If clicking a non-selected card in carousel, make it selected?
                        // selectItem(item.id); // Or do nothing
                    }
                }}
                role="button"
                tabindex="0"
                aria-label={`View details for ${item.title}`}
                data-id={item.id}
                on:keydown={(e) => e.key === 'Enter' && viewMode === 'grid' && selectItem(item.id)}
			>
				<div class="card-content">
                    <!-- Always render h2 -->
					<h2>{item.title}</h2>

                    <!-- Conditionally render and fade description -->
                    <!-- Use a key to force re-render/transition on item change in carousel -->
					{#if viewMode === 'carousel'}
                        {#key selectedItemId}
						    <p transition:fade={{ delay: FLIP_DURATION * 0.4, duration: FLIP_DURATION * 0.5 }}>
                                {item.description}
                            </p>
                        {/key}
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if viewMode === 'carousel'}
		<button
            class="close-button"
            on:click|stopPropagation={deselect}
            aria-label="Close carousel view"
            transition:fade={{duration: 200}}
        >
            ×
        </button>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
		background-color: #f4f5f7;
        overscroll-behavior: none;
        /* Prevent scrollbars during transition if possible */
        overflow: hidden;
	}

	.app-container {
		position: relative;
		min-height: 100vh;
        width: 100%;
        display: flex; /* Use flex for centering carousel */
        align-items: center;
        justify-content: center;
        background-color: transparent;
        /* Transition the backdrop fade */
        transition: background-color var(--flip-duration) ease-in-out;
        overflow: hidden; /* Prevent layout shifts from scrollbars appearing/disappearing */
	}

    /* --- View Mode Specific Container Styles --- */
    .app-container.grid-mode {
         background-color: #f4f5f7; /* Normal background */
    }

	.app-container.carousel-mode {
		position: fixed; /* Take over the viewport */
		inset: 0;
		background-color: rgba(0, 0, 0, 0.75); /* Backdrop */
		z-index: 1000;
        cursor: pointer;
	}

	/* --- Cards Wrapper --- */
	.cards-wrapper {
        box-sizing: border-box;
        width: 100%;
        height: 100%; /* Allow wrapper to take space */
        cursor: default;
        /* Remove transition from here, let FLIP handle children */
        padding: 0; /* Remove padding transition interference */
        display: flex; /* Use flex for both layouts for consistency */
        align-items: center;
        justify-content: center;
	}

	/* --- Grid Layout --- */
	.grid-layout {
        display: grid; /* Override flex */
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 24px;
        padding: 30px; /* Add padding back here */
        max-width: 1400px;
        width: 100%;
        height: auto; /* Grid height is content-based */
        overflow-y: auto; /* Allow grid scrolling if needed */
        align-items: start; /* Align items to top in grid */
	}

	/* --- Carousel Layout --- */
	.carousel-layout {
        /* Already display: flex, align-items: center, justify-content: center from wrapper */
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
		&::-webkit-scrollbar { display: none; }
		gap: clamp(20px, 4vw, 40px); /* Responsive gap */
        padding: 0 clamp(10px, 5vw, 50px); /* Responsive padding */
        width: 100%;
        max-height: 100vh; /* Limit height */
	}

	/* --- Card Base Styles --- */
	.card {
        /* Base styles applicable to both states */
		background-color: var(--card-bg-color, #eee);
		color: white;
		border-radius: 16px; /* Slightly larger radius */
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		display: flex;
        position: relative; /* Important for FLIP calculations */
		flex-direction: column;
		justify-content: center; /* Center content vertically */
        padding: 20px;
        box-sizing: border-box;
        text-align: center;
        /* CRITICAL: Let FLIP handle transform/opacity transitions between states */
        /* NO 'transition: transform ...' here */
        transition: box-shadow 0.3s ease; /* Allow subtle shadow transition on hover */
        will-change: transform, opacity; /* Hint browser */
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        flex-shrink: 0; /* Prevent shrinking in flex layouts */
        transform-origin: center center; /* Ensure scaling originates from the center */
	}

    /* --- Card in Grid View --- */
	.card-grid {
		aspect-ratio: 16 / 10; /* Adjust ratio if needed */
		cursor: pointer;
        min-height: 160px;
	}
    .card-grid:hover {
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        /* transform: translateY(-4px); NO transform hover */
    }
     .card-grid .card-content h2 {
        font-size: clamp(1.1rem, 1.5vw + 0.5rem, 1.4rem);
        margin: 0;
    }


	/* --- Card in Carousel View --- */
	.card-carousel {
		width: clamp(75vw, 600px, 85vw); /* Adjust size */
		height: clamp(70vh, 550px, 80vh);
        max-height: 600px; /* Hard max height */
		scroll-snap-align: center;
		cursor: default;
        padding: 30px 40px; /* More padding */
        /* Define the target visual state for non-selected items */
        opacity: 0.6;
        transform: scale(0.9);
        transition: opacity calc(var(--flip-duration) * 0.5) ease,
                    transform calc(var(--flip-duration) * 0.5) ease; /* Subtle transition for non-selected becoming selected */
	}

    /* Style for the SELECTED card in the carousel */
    .card-carousel.is-selected {
        opacity: 1;
        transform: scale(1);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25); /* Enhanced shadow */
    }

     /* Content styling within carousel cards */
    .card-carousel .card-content {
        overflow: hidden; /* Prevent text overflow during scale */
    }
    .card-carousel .card-content h2 {
        font-size: clamp(1.8rem, 2.5vw + 1rem, 2.8rem); /* Larger */
        margin-bottom: 20px;
        margin-top: 0;
    }
    .card-carousel .card-content p {
        font-size: clamp(1rem, 1.2vw + 0.5rem, 1.2rem); /* Slightly larger */
        opacity: 0.9;
        max-width: 90%;
        margin: 0 auto;
        line-height: 1.6;
    }

    /* Accessibility focus */
    .card:focus {
        outline: 3px solid dodgerblue;
        outline-offset: 4px;
        box-shadow: 0 0 0 6px rgba(30, 144, 255, 0.3); /* More visible focus */
    }
    .card:focus:not(:focus-visible) {
        outline: none; /* Remove outline for mouse clicks */
        box-shadow: none;
    }


    /* --- Close Button --- */
    .close-button {
        position: absolute; /* Relative to .app-container */
        top: 25px;
        right: 25px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: none;
        background-color: rgba(30, 30, 30, 0.7);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        color: white;
        font-size: 30px;
        font-weight: 300;
        line-height: 48px;
        text-align: center;
        cursor: pointer;
        z-index: 1010;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: background-color 0.2s ease, transform 0.2s ease;
    }
    .close-button:hover {
        background-color: rgba(0, 0, 0, 0.8);
        transform: scale(1.1);
    }
</style>