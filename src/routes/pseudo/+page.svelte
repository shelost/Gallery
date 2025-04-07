<script>
	import { fly, fade, scale, slide } from 'svelte/transition';
	import { quintOut, elasticOut, backOut } from 'svelte/easing';
	import { onMount } from 'svelte';

	// Import GSAP (assumes GSAP is installed)
	// If not installed, run: npm install gsap
	let gsap;

	// Dynamically import GSAP to avoid SSR issues
	onMount(async () => {
		const module = await import('gsap');
		gsap = module.gsap;

		// Initialize any GSAP animations here
		initializeAnimations();
	});

	function initializeAnimations() {
		if (gsap) {
			console.log('GSAP initialized');

			// Initialize card animation
			setTimeout(initCardAnimation, 100);

			// Add general animations for elements
			const buttons = document.querySelectorAll('.btn-primary, .btn-destructive');
			buttons.forEach(button => {
				button.addEventListener('mouseenter', () => {
					gsap.to(button, {
						scale: 1.05,
						duration: 0.3,
						ease: "back.out(1.5)"
					});
				});

				button.addEventListener('mouseleave', () => {
					gsap.to(button, {
						scale: 1,
						duration: 0.3,
						ease: "power2.out"
					});
				});
			});

			// Animate progress bars
			const progressBars = document.querySelectorAll('.progress-bar:not(.progress-indeterminate .progress-bar)');
			progressBars.forEach(bar => {
				const width = bar.style.width || '0%';
				bar.style.width = '0%';
				gsap.to(bar, {
					width: width,
					duration: 1,
					ease: "power2.out"
				});
			});
		}
	}

	// Card animation function
	function initCardAnimation() {
		if (typeof document !== 'undefined' && gsap) {
			const card = document.getElementById('animatedCard');
			if (!card) return;

			let bounds;
			let mouseX = 0;
			let mouseY = 0;

			function updateBounds() {
				bounds = card.getBoundingClientRect();
			}

			// Initial setup
			updateBounds();
			window.addEventListener('resize', updateBounds);

			function handleMouseMove(e) {
				mouseX = e.clientX;
				mouseY = e.clientY;

				// Calculate position relative to card center
				const cardCenterX = bounds.left + bounds.width / 2;
				const cardCenterY = bounds.top + bounds.height / 2;

				// Calculate rotation values
				const rotateY = -1 * ((mouseX - cardCenterX) / (bounds.width / 2)) * 5; // Max 5deg
				const rotateX = ((mouseY - cardCenterY) / (bounds.height / 2)) * 5; // Max 5deg

				// Calculate floating element position
				const floater = card.querySelector('.card-floating-element');
				if (floater) {
					// Inverse movement for a parallax effect
					const floaterX = ((mouseX - cardCenterX) / (bounds.width / 2)) * -20;
					const floaterY = ((mouseY - cardCenterY) / (bounds.height / 2)) * -20;

					gsap.to(floater, {
						x: floaterX,
						y: floaterY,
						duration: 0.8,
						ease: "power2.out"
					});
				}

				// Apply the rotation to the card
				gsap.to(card, {
					rotationY: rotateY,
					rotationX: rotateX,
					duration: 0.8,
					ease: "power2.out",
					transformPerspective: 1000,
					transformOrigin: "center"
				});
			}

			function handleMouseLeave() {
				// Reset the card rotation
				gsap.to(card, {
					rotationY: 0,
					rotationX: 0,
					duration: 0.8,
					ease: "elastic.out(1, 0.3)"
				});

				// Reset floating element
				const floater = card.querySelector('.card-floating-element');
				if (floater) {
					gsap.to(floater, {
						x: 0,
						y: 0,
						duration: 0.8,
						ease: "elastic.out(1, 0.3)"
					});
				}
			}

			card.addEventListener('mousemove', handleMouseMove);
			card.addEventListener('mouseleave', handleMouseLeave);

			// Slight animation on load
			gsap.fromTo(card,
				{ y: 20, opacity: 0 },
				{ y: 0, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }
			);
		}
	}

	// State for interactive components
	let isToggled = false;
	let dropdownOpen = false;
	let activeTab = 'analytics';
	let sliderValue = 50;
	let tooltipVisible = false;
	let modalOpen = false;
	let accordionOpen = [true, false];
	let progressValue = 75;
	let alertVisible = true;

	// For pagination
	let currentPage = 1;
	let totalPages = 5;

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}

	function selectDropdownItem(item) {
		console.log('Selected:', item);
		dropdownOpen = false; // Close dropdown on selection
	}

	function toggleAccordion(index) {
		accordionOpen[index] = !accordionOpen[index];
		accordionOpen = [...accordionOpen]; // Force update
	}

	function toggleModal() {
		modalOpen = !modalOpen;
	}

	function dismissAlert() {
		alertVisible = false;
	}

	function toggleTooltip(value) {
		tooltipVisible = value;
	}

	function changePage(page) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	function handleOutsideClick(node) {
		const handleClick = event => {
			if (node && !node.contains(event.target) && !event.defaultPrevented) {
				// Dispatch a custom event or call a function
				node.dispatchEvent(new CustomEvent('click_outside', node));
			}
		}

		document.addEventListener('click', handleClick, true);

		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		}
	}
</script>

<svelte:head>
	<title>Concept UI Showcase</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="showcase-container">
	<header class="showcase-header">
		<h1>Concept UI</h1>
		<p>Exploring a lively, pseudo-3D aesthetic for modern web apps.</p>
	</header>

	<main class="showcase-grid">
        <!-- Alert/Notification Section -->
        <section class="component-section">
            <h2>Alerts</h2>
            {#if alertVisible}
                <div class="alert alert-warning" transition:slide={{ duration: 300 }}>
                    <div class="alert-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    </div>
                    <div class="alert-content">
                        <h4>Warning</h4>
                        <p>Your account subscription will expire in 3 days. Please renew to avoid service interruption.</p>
                    </div>
                    <button class="alert-close" on:click={dismissAlert}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            {:else}
                <button class="btn btn-secondary" on:click={() => alertVisible = true}>Show Alert</button>
            {/if}

            <div class="component-group" style="margin-top: 15px;">
                <div class="alert alert-info">
                    <div class="alert-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </div>
                    <div class="alert-content">
                        <p>Updates were applied successfully.</p>
                    </div>
                </div>

                <div class="alert alert-success">
                    <div class="alert-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <div class="alert-content">
                        <p>Your profile has been updated.</p>
                    </div>
                </div>

                <div class="alert alert-error">
                    <div class="alert-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    </div>
                    <div class="alert-content">
                        <p>There was an error processing your request.</p>
                    </div>
                </div>
            </div>
        </section>

		<!-- Buttons Section -->
		<section class="component-section">
			<h2>Buttons</h2>
			<div class="component-group">
				<button class="btn btn-primary">Primary Action</button>
				<button class="btn btn-secondary">Secondary</button>
				<button class="btn btn-destructive">Destructive</button>
				<button class="btn btn-primary" disabled>Disabled</button>
			</div>
             <div class="component-group">
                 <button class="btn btn-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></button>
                <button class="btn btn-secondary btn-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></button>
                 <button class="btn btn-destructive btn-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
            </div>
		</section>

		<!-- Toggles Section -->
		<section class="component-section">
			<h2>Toggles</h2>
			<div class="component-group">
				<label class="toggle-switch">
					<input type="checkbox" bind:checked={isToggled}>
					<span class="slider"></span>
                    <span class="label-text">{isToggled ? 'Enabled' : 'Disabled'}</span>
				</label>
                <label class="toggle-switch toggle-switch-alt">
					<input type="checkbox">
					<span class="slider"></span>
                    <span class="label-text">Alt Style</span>
				</label>
			</div>
		</section>

		<!-- Dropdown Section -->
		<section class="component-section">
			<h2>Dropdown Menu</h2>
			<div class="component-group">
				<div class="dropdown-container" use:handleOutsideClick on:click_outside={() => dropdownOpen = false}>
					<button class="btn btn-secondary" on:click={toggleDropdown}>
						<span>Options</span>
                         <svg class:rotated={dropdownOpen} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
					</button>
					{#if dropdownOpen}
						<ul class="dropdown-menu" transition:fly={{ y: -10, duration: 250, easing: quintOut }}>
							<li on:click={() => selectDropdownItem('Profile')}>Profile</li>
							<li on:click={() => selectDropdownItem('Settings')}>Settings</li>
							<li class="separator"></li>
							<li on:click={() => selectDropdownItem('Logout')} class="destructive-item">Logout</li>
						</ul>
					{/if}
				</div>
			</div>
		</section>

		<!-- Tabs Section -->
		<section class="component-section">
			<h2>Tabs</h2>
			<div class="tabs-container">
				<div class="tab-list">
					<button
						class="tab-button"
						class:active={activeTab === 'analytics'}
						on:click={() => activeTab = 'analytics'}
					>
						Analytics
					</button>
					<button
						class="tab-button"
						class:active={activeTab === 'reports'}
						on:click={() => activeTab = 'reports'}
					>
						Reports
					</button>
					<button
						class="tab-button"
						class:active={activeTab === 'settings'}
						on:click={() => activeTab = 'settings'}
					>
						Settings
					</button>
				</div>
				<div class="tab-content">
					{#if activeTab === 'analytics'}
						<div class="tab-panel" transition:fade={{ duration: 300 }}>
							<h3>Analytics Overview</h3>
							<p>Displaying key metrics and data visualizations.</p>
                            <!-- Placeholder Chart -->
                            <div class="chart-placeholder">
                                <div class="bar" style="height: 60%;"></div>
                                <div class="bar" style="height: 80%;"></div>
                                <div class="bar" style="height: 45%;"></div>
                                <div class="bar" style="height: 70%;"></div>
                                <div class="bar" style="height: 90%;"></div>
                                 <div class="bar" style="height: 55%;"></div>
                            </div>
						</div>
					{:else if activeTab === 'reports'}
						<div class="tab-panel" transition:fade={{ duration: 300 }}>
							<h3>Generated Reports</h3>
							<p>List of available downloadable reports.</p>
                            <ul>
                                <li>Monthly Sales Report - Nov 2023</li>
                                <li>User Activity Log - Q3 2023</li>
                            </ul>
						</div>
					{:else if activeTab === 'settings'}
						<div class="tab-panel" transition:fade={{ duration: 300 }}>
							<h3>Application Settings</h3>
							<p>Configure your application preferences.</p>
                            <label class="setting-item">
                                <span>Notification Level:</span>
                                <select class="select-input">
                                    <option>All</option>
                                    <option>Important Only</option>
                                    <option>None</option>
                                </select>
                            </label>
						</div>
					{/if}
				</div>
			</div>
		</section>

        <!-- Input & Sliders -->
        <section class="component-section">
             <h2>Inputs & Sliders</h2>
            <div class="component-group vertical">
                 <input type="text" class="text-input" placeholder="Enter your name...">
                <div class="slider-container">
                     <label for="volume">Volume: {sliderValue}</label>
                    <input type="range" id="volume" class="slider-input" min="0" max="100" bind:value={sliderValue}>
                </div>
                 <select class="select-input">
                    <option disabled selected>Choose an option</option>
                    <option>Option Alpha</option>
                    <option>Option Beta</option>
                    <option>Option Gamma</option>
                </select>
            </div>
        </section>

         <!-- Card / Container -->
        <section class="component-section">
             <h2>Cards</h2>
            <div class="card">
                <h3>Information Card</h3>
                <p>This is a container element demonstrating the pseudo-3D effect applied to larger surfaces. It uses borders and shadows to create depth.</p>
                 <button class="btn btn-secondary" style="margin-top: 1rem;">Learn More</button>
            </div>
        </section>

		<!-- Badges Section -->
		<section class="component-section">
			<h2>Badges</h2>
			<div class="component-group">
				<span class="badge badge-primary">New</span>
				<span class="badge badge-success">Approved</span>
				<span class="badge badge-warning">Pending</span>
				<span class="badge badge-destructive">Rejected</span>
				<span class="badge badge-neutral">Neutral</span>
			</div>
            <div class="component-group" style="margin-top: 15px;">
                <span class="badge badge-outline-primary">New</span>
				<span class="badge badge-outline-success">Approved</span>
				<span class="badge badge-outline-warning">Pending</span>
				<span class="badge badge-outline-destructive">Rejected</span>
            </div>
		</section>

		<!-- Avatars Section -->
		<section class="component-section">
			<h2>Avatars</h2>
			<div class="component-group">
				<div class="avatar avatar-sm">
					<img src="https://i.pravatar.cc/100?img=1" alt="Avatar" />
				</div>
				<div class="avatar">
					<img src="https://i.pravatar.cc/100?img=2" alt="Avatar" />
				</div>
				<div class="avatar avatar-lg">
					<img src="https://i.pravatar.cc/100?img=3" alt="Avatar" />
				</div>
                <div class="avatar">
					<span>JD</span>
				</div>
                <div class="avatar avatar-lg avatar-success">
                    <span>AB</span>
                </div>
			</div>

            <div class="component-group" style="margin-top: 15px;">
                <div class="avatar-group">
                    <div class="avatar">
                        <img src="https://i.pravatar.cc/100?img=4" alt="Avatar" />
                    </div>
                    <div class="avatar">
                        <img src="https://i.pravatar.cc/100?img=5" alt="Avatar" />
                    </div>
                    <div class="avatar">
                        <img src="https://i.pravatar.cc/100?img=6" alt="Avatar" />
                    </div>
                    <div class="avatar">
                        <span>+3</span>
                    </div>
                </div>
            </div>
		</section>

		<!-- Modal Section -->
		<section class="component-section">
			<h2>Modal / Dialog</h2>
			<div class="component-group">
				<button class="btn btn-primary" on:click={toggleModal}>Open Modal</button>
			</div>

			{#if modalOpen}
				<div class="modal-overlay" transition:fade={{ duration: 200 }} on:click={toggleModal}>
					<div
                        class="modal"
                        transition:scale={{ duration: 300, start: 0.95, opacity: 0, easing: backOut }}
                        on:click|stopPropagation
                    >
						<div class="modal-header">
							<h3>Dialog Title</h3>
							<button class="modal-close" on:click={toggleModal}>
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
							</button>
						</div>
						<div class="modal-body">
							<p>This is a modal dialog with a pseudo-3D aesthetic. It lifts off the page with strong shadows and subtle border highlights to create depth.</p>
                            <p>Modals are perfect for focused interactions like confirmations, forms, or important notices.</p>
						</div>
						<div class="modal-footer">
							<button class="btn btn-secondary" on:click={toggleModal}>Cancel</button>
							<button class="btn btn-primary">Confirm</button>
						</div>
					</div>
				</div>
			{/if}
		</section>

		<!-- Accordion Section -->
		<section class="component-section">
			<h2>Accordion</h2>
			<div class="accordion">
				<div class="accordion-item">
					<button
                        class="accordion-header"
                        class:active={accordionOpen[0]}
                        on:click={() => toggleAccordion(0)}
                    >
						<span>What is the Concept UI?</span>
                        <svg
                            class:rotated={accordionOpen[0]}
                            xmlns="http://www.w3.org/2000/svg"
                            width="16" height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
					</button>
					{#if accordionOpen[0]}
						<div class="accordion-content" transition:slide={{ duration: 300 }}>
							<p>Concept UI is a playful, pseudo-3D user interface collection that uses CSS and subtle animations to create depth and tactility. It emphasizes physicality through careful use of borders, shadows, and lighting effects.</p>
                            <p>The design language draws inspiration from the "Superflat" aesthetic and modern flat design principles while adding dimensionality.</p>
						</div>
					{/if}
				</div>

				<div class="accordion-item">
					<button
                        class="accordion-header"
                        class:active={accordionOpen[1]}
                        on:click={() => toggleAccordion(1)}
                    >
						<span>How do I customize these components?</span>
                        <svg
                            class:rotated={accordionOpen[1]}
                            xmlns="http://www.w3.org/2000/svg"
                            width="16" height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
					</button>
					{#if accordionOpen[1]}
						<div class="accordion-content" transition:slide={{ duration: 300 }}>
							<p>You can customize these components by modifying the CSS variables at the top of the stylesheet. Change colors, border radius, shadow depths, and more to match your project's aesthetic.</p>
                            <p>The components are built with SCSS and can be easily adapted to your needs.</p>
						</div>
					{/if}
				</div>
			</div>
		</section>

		<!-- Tooltip Section -->
		<section class="component-section">
			<h2>Tooltips</h2>
			<div class="component-group">
				<div class="tooltip-container">
					<button
                        class="btn btn-secondary"
                        on:mouseenter={() => toggleTooltip(true)}
                        on:mouseleave={() => toggleTooltip(false)}
                    >
						Hover Me
					</button>
					{#if tooltipVisible}
						<div class="tooltip tooltip-top" transition:fade={{ duration: 150 }}>
							This is a tooltip with helpful information
                            <div class="tooltip-arrow"></div>
						</div>
					{/if}
				</div>

                <div class="tooltip-container">
                    <span class="text-with-tooltip">
                        Hover this text
                        <span class="tooltip tooltip-bottom">
                            Bottom tooltip example
                            <div class="tooltip-arrow"></div>
                        </span>
                    </span>
                </div>
			</div>
		</section>

		<!-- Progress Section -->
		<section class="component-section">
			<h2>Progress</h2>
			<div class="component-group vertical">
				<div class="progress">
					<div class="progress-bar" style="width: {progressValue}%"></div>
				</div>
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <span class="progress-label">Progress: {progressValue}%</span>
                    <div class="component-group">
                        <button class="btn btn-secondary btn-icon" on:click={() => progressValue = Math.max(0, progressValue - 10)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>
                        </button>
                        <button class="btn btn-primary btn-icon" on:click={() => progressValue = Math.min(100, progressValue + 10)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        </button>
                    </div>
                </div>

                <div class="progress progress-indeterminate">
                    <div class="progress-bar"></div>
                </div>
                <span class="progress-label">Indeterminate progress</span>
			</div>
		</section>

		<!-- Pagination Section -->
		<section class="component-section">
			<h2>Pagination</h2>
			<div class="component-group">
				<nav class="pagination">
					<button
                        class="pagination-item pagination-prev"
                        on:click={() => changePage(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        <span>Previous</span>
					</button>

					<div class="pagination-pages">
						{#each Array(totalPages) as _, i}
							<button
                                class="pagination-item"
                                class:active={currentPage === i + 1}
                                on:click={() => changePage(i + 1)}
                            >
								{i + 1}
							</button>
						{/each}
					</div>

					<button
                        class="pagination-item pagination-next"
                        on:click={() => changePage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        <span>Next</span>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
					</button>
				</nav>
			</div>
		</section>

         <!-- Animated Card -->
        <section class="component-section">
             <h2>Animated Card</h2>
            <div class="card animated-card" id="animatedCard">
                <div class="card-floating-element"></div>
                <h3>Animated Card</h3>
                <p>This card uses GSAP animations for enhanced interactivity. Move your mouse over it to see the 3D tilt and lighting effects that enhance the pseudo-3D aesthetic.</p>
                 <button class="btn btn-primary" style="margin-top: 1rem;">Learn More</button>
            </div>
        </section>

	</main>

    <footer class="showcase-footer">
        <p>Concept UI - Single File SvelteKit Showcase</p>
    </footer>
</div>

<style lang="scss">
	// --- Global Styles & Variables ---
	:root {
		--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";

		// Base Colors
		--bg-color: #f4f4f7; // Light grey background
		--element-bg: #ffffff; // White for elements
		--text-color: #1a1a1a; // Dark text
		--subtle-text: #6b7280; // Grey text
		--border-color-light: #e5e7eb; // Light border
		--border-color-dark: #d1d5db; // Slightly darker border for depth

		// Primary Action Colors
		--primary-bg: #3b82f6; // Blue
		--primary-bg-hover: #2563eb; // Darker blue
		--primary-bg-active: #1d4ed8; // Even darker blue
        --primary-bg-darker: #2563eb; /* Pre-calculated darker shade for border */
		--primary-text: #ffffff;
		--primary-shadow-color: rgba(59, 130, 246, 0.3);
        --primary-border-highlight: #60a5fa; // Lighter blue for top/left border

		// Secondary Action Colors
		--secondary-bg: var(--element-bg);
		--secondary-bg-hover: #f9fafb;
		--secondary-bg-active: #f3f4f6;
		--secondary-text: #374151;
		--secondary-shadow-color: rgba(0, 0, 0, 0.08);
        --secondary-border-highlight: #ffffff; // White/light grey for top/left

		// Destructive Action Colors
		--destructive-bg: #ef4444; // Red
		--destructive-bg-hover: #dc2626; // Darker red
		--destructive-bg-active: #b91c1c; // Even darker red
        --destructive-bg-darker: #dc2626; /* Pre-calculated darker shade for border */
		--destructive-text: #ffffff;
		--destructive-shadow-color: rgba(239, 68, 68, 0.3);
        --destructive-border-highlight: #f87171; // Lighter red

        // Success Colors
        --success-bg: #10b981; // Green
        --success-bg-hover: #059669; // Darker green
        --success-bg-active: #047857; // Even darker green
        --success-bg-darker: #059669; /* Pre-calculated darker shade for border */
        --success-text: #ffffff;
        --success-shadow-color: rgba(16, 185, 129, 0.3);
        --success-border-highlight: #34d399; // Lighter green

        // Warning Colors
        --warning-bg: #f59e0b; // Amber
        --warning-bg-hover: #d97706; // Darker amber
        --warning-bg-active: #b45309; // Even darker amber
        --warning-bg-darker: #d97706; /* Pre-calculated darker shade for border */
        --warning-text: #ffffff;
        --warning-shadow-color: rgba(245, 158, 11, 0.3);
        --warning-border-highlight: #fbbf24; // Lighter amber

        // Neutral Variations for UI Elements
        --neutral-50: #f9fafb;
        --neutral-100: #f3f4f6;
        --neutral-200: #e5e7eb;
        --neutral-300: #d1d5db;
        --neutral-400: #9ca3af;
        --neutral-500: #6b7280;
        --neutral-600: #4b5563;
        --neutral-700: #374151;
        --neutral-800: #1f2937;
        --neutral-900: #111827;

        // Other Variables
        --border-radius: 8px; // Slightly rounded corners
        --border-radius-sm: 4px; // Smaller radius
        --border-radius-lg: 12px; // Larger radius
        --border-radius-xl: 16px; // Extra large radius
        --border-radius-full: 9999px; // Fully rounded (for pills, avatars)

        --transition-speed: 0.15s;
        --transition-fast: 0.1s;
        --transition-medium: 0.2s;
        --transition-slow: 0.3s;
		--transition-timing: ease-in-out;
		--transition-bounce: cubic-bezier(0.68, -0.55, 0.27, 1.55);
		--transition-elastic: cubic-bezier(0.76, 0, 0.24, 1);

        // Pseudo-3D Effect Variables
        --shadow-depth-1: 1px; // y-offset for main shadow
        --shadow-depth-2: 3px; // y-offset for deeper shadow
        --shadow-depth-3: 6px; // y-offset for even deeper shadow
        --shadow-blur-1: 2px;
        --shadow-blur-2: 5px;
        --shadow-blur-3: 10px;
        --border-width: 1px; // Controls the bevel effect thickness
        --border-width-bold: 2px; // Bolder border for emphasis

        // Animation Specific
        --press-translate-y: 1px; // How much button moves down when pressed
        --hover-lift: -1px; // How much elements lift on hover
        --scale-hover: 1.02; // Scale factor for hover effects
        --rotation-hover: 1deg; // Slight rotation for playful interactions
	}

	// --- Base & Layout ---
	body {
		margin: 0;
		font-family: var(--font-sans);
		background-color: var(--bg-color);
		color: var(--text-color);
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	.showcase-container {
		max-width: 1000px;
		margin: 40px auto;
		padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 40px;
	}

	.showcase-header {
		text-align: center;
        border-bottom: 1px solid var(--border-color-light);
        padding-bottom: 20px;
		h1 {
			font-size: 2.5rem;
			font-weight: 700;
			margin-bottom: 0.5rem;
            color: var(--primary-bg);
            text-shadow: 0 1px 0 var(--primary-border-highlight),
                         0 2px 3px var(--primary-shadow-color);
		}
		p {
			font-size: 1.1rem;
			color: var(--subtle-text);
		}
	}

    .showcase-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 40px 30px; /* Row gap, Column gap */
    }

	.component-section {
        background: transparent;
        padding: 0;
        border: none;

		h2 {
			font-size: 1.5rem;
			font-weight: 600;
			margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--border-color-light);
            color: var(--text-color);
		}
	}

	.component-group {
		display: flex;
		flex-wrap: wrap;
		gap: 15px;
		align-items: center;

        &.vertical {
            flex-direction: column;
            align-items: stretch;
        }
	}

    .showcase-footer {
        margin-top: 40px;
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid var(--border-color-light);
        color: var(--subtle-text);
        font-size: 0.9rem;
    }

	// --- General Pseudo-3D Base Style ---
    // Base class applied via SCSS @extend
    .pseudo-3d-element {
        background-color: var(--element-bg);
        border-radius: var(--border-radius);
        border: var(--border-width) solid;
        // Default uses secondary/neutral border colors
        border-color: var(--secondary-border-highlight) var(--border-color-dark) var(--border-color-dark) var(--secondary-border-highlight);
        box-shadow:
            inset 0px 1px 1px rgba(255, 255, 255, 0.5), // Top inner highlight
            inset 0px -1px 1px rgba(0, 0, 0, 0.05), // Bottom inner shadow
            0 var(--shadow-depth-1) var(--shadow-blur-1) var(--secondary-shadow-color), // Main shadow
            0 var(--shadow-depth-2) var(--shadow-blur-2) rgba(0,0,0,0.05); // Deeper shadow
        transition:
            all var(--transition-speed) var(--transition-timing),
            transform var(--transition-medium) var(--transition-bounce),
            box-shadow var(--transition-medium) var(--transition-timing);
        position: relative;
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;

        // Light reflection effect
        &::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 40%;
            background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%);
            border-radius: var(--border-radius) var(--border-radius) 0 0;
            pointer-events: none;
        }
    }

    // Variant with more pronounced effect
    .pseudo-3d-elevated {
        @extend .pseudo-3d-element;
        box-shadow:
            inset 0px 1px 2px rgba(255, 255, 255, 0.7), // Stronger top inner highlight
            inset 0px -1px 2px rgba(0, 0, 0, 0.1), // Stronger bottom inner shadow
            0 var(--shadow-depth-2) var(--shadow-blur-2) rgba(0,0,0,0.1), // Medium shadow
            0 var(--shadow-depth-3) var(--shadow-blur-3) rgba(0,0,0,0.05); // Deeper shadow
        transform: translateY(var(--hover-lift));

        &:hover {
            transform: translateY(calc(var(--hover-lift) - 1px)) scale(var(--scale-hover));
            box-shadow:
                inset 0px 1px 2px rgba(255, 255, 255, 0.7),
                inset 0px -1px 2px rgba(0, 0, 0, 0.1),
                0 calc(var(--shadow-depth-2) + 2px) calc(var(--shadow-blur-2) + 2px) rgba(0,0,0,0.1),
                0 calc(var(--shadow-depth-3) + 3px) calc(var(--shadow-blur-3) + 4px) rgba(0,0,0,0.05);
        }
    }

    // Inset variant (looks pressed)
    .pseudo-3d-inset {
        @extend .pseudo-3d-element;
        border-color: var(--border-color-dark) var(--secondary-border-highlight) var(--secondary-border-highlight) var(--border-color-dark);
        box-shadow:
            inset 0 1px 3px rgba(0, 0, 0, 0.1),
            inset 0 1px 2px rgba(0, 0, 0, 0.05);
        transform: translateY(var(--press-translate-y));

        &::before {
            opacity: 0.5;
        }
    }

	// --- Button Styles ---
	.btn {
		@extend .pseudo-3d-element; // Inherit base 3D styles
		padding: 10px 18px;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		text-align: center;
		user-select: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;

		// Specific overrides for different button types
		&.btn-primary {
			background-color: var(--primary-bg);
			color: var(--primary-text);
            // Use pre-defined variables for borders
			border-color: var(--primary-border-highlight) var(--primary-bg-darker) var(--primary-bg-darker) var(--primary-border-highlight);
			box-shadow:
                inset 0px 1px 1px rgba(255, 255, 255, 0.3),
                0 var(--shadow-depth-1) var(--shadow-blur-1) var(--primary-shadow-color),
                0 var(--shadow-depth-2) var(--shadow-blur-2) rgba(0,0,0,0.1);

			&:hover:not(:disabled) {
				background-color: var(--primary-bg-hover);
                transform: translateY(-1px);
                 box-shadow:
                    inset 0px 1px 1px rgba(255, 255, 255, 0.3),
                    0 calc(var(--shadow-depth-1) + 2px) calc(var(--shadow-blur-1) + 2px) var(--primary-shadow-color),
                    0 calc(var(--shadow-depth-2) + 3px) calc(var(--shadow-blur-2) + 3px) rgba(0,0,0,0.15);
			}

			&:active:not(:disabled) {
				background-color: var(--primary-bg-active);
				transform: translateY(var(--press-translate-y));
				box-shadow: inset 0px 1px 2px rgba(0, 0, 0, 0.2);
                // Invert border highlight on press
                border-color: var(--primary-bg-darker) var(--primary-border-highlight) var(--primary-border-highlight) var(--primary-bg-darker);
			}
		}

		&.btn-secondary {
			background-color: var(--secondary-bg);
			color: var(--secondary-text);
            // Uses the default border from .pseudo-3d-element
            // border-color: var(--secondary-border-highlight) var(--border-color-dark) var(--border-color-dark) var(--secondary-border-highlight);
            box-shadow:
                inset 0px 1px 1px rgba(255, 255, 255, 0.5),
                0 var(--shadow-depth-1) var(--shadow-blur-1) var(--secondary-shadow-color),
                0 var(--shadow-depth-2) var(--shadow-blur-2) rgba(0,0,0,0.05);

			&:hover:not(:disabled) {
				background-color: var(--secondary-bg-hover);
                transform: translateY(-1px);
                box-shadow:
                    inset 0px 1px 1px rgba(255, 255, 255, 0.5),
                    0 calc(var(--shadow-depth-1) + 2px) calc(var(--shadow-blur-1) + 2px) var(--secondary-shadow-color),
                    0 calc(var(--shadow-depth-2) + 3px) calc(var(--shadow-blur-2) + 3px) rgba(0,0,0,0.1);
			}

			&:active:not(:disabled) {
				background-color: var(--secondary-bg-active);
				transform: translateY(var(--press-translate-y));
				box-shadow: inset 0px 1px 2px rgba(0, 0, 0, 0.15);
                border-color: var(--border-color-dark) var(--secondary-border-highlight) var(--secondary-border-highlight) var(--border-color-dark);
			}
		}

        &.btn-destructive {
            background-color: var(--destructive-bg);
			color: var(--destructive-text);
            // Use pre-defined variables for borders
			border-color: var(--destructive-border-highlight) var(--destructive-bg-darker) var(--destructive-bg-darker) var(--destructive-border-highlight);
			box-shadow:
                inset 0px 1px 1px rgba(255, 255, 255, 0.3),
                0 var(--shadow-depth-1) var(--shadow-blur-1) var(--destructive-shadow-color),
                0 var(--shadow-depth-2) var(--shadow-blur-2) rgba(0,0,0,0.1);

			&:hover:not(:disabled) {
				background-color: var(--destructive-bg-hover);
                transform: translateY(-1px);
                 box-shadow:
                    inset 0px 1px 1px rgba(255, 255, 255, 0.3),
                    0 calc(var(--shadow-depth-1) + 2px) calc(var(--shadow-blur-1) + 2px) var(--destructive-shadow-color),
                    0 calc(var(--shadow-depth-2) + 3px) calc(var(--shadow-blur-2) + 3px) rgba(0,0,0,0.15);
			}

			&:active:not(:disabled) {
				background-color: var(--destructive-bg-active);
				transform: translateY(var(--press-translate-y));
				box-shadow: inset 0px 1px 2px rgba(0, 0, 0, 0.2);
                border-color: var(--destructive-bg-darker) var(--destructive-border-highlight) var(--destructive-border-highlight) var(--destructive-bg-darker);
			}
        }

        &.btn-icon {
            padding: 8px;
        }

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
            background-color: #e5e7eb;
            color: var(--subtle-text);
            border-color: #d1d5db #e5e7eb #e5e7eb #d1d5db;
			box-shadow: inset 0px 1px 1px rgba(0, 0, 0, 0.05);
            transform: none;
		}
	}

	// --- Toggle Switch Styles ---
	.toggle-switch {
		display: inline-flex;
		align-items: center;
		cursor: pointer;
        position: relative;
        user-select: none;

		input {
			opacity: 0;
			width: 0;
			height: 0;
            position: absolute;
		}

        .label-text {
            margin-left: 10px;
            font-size: 0.9rem;
            color: var(--subtle-text);
            transition: color var(--transition-speed) var(--transition-timing);
        }

		.slider {
			position: relative;
			display: block;
			width: 48px;
			height: 26px;
			background-color: #d1d5db; // Off state track color
			border-radius: 13px; // Fully rounded ends
			transition: background-color var(--transition-speed) var(--transition-timing);
            border: var(--border-width) solid;
            border-color: var(--border-color-light) var(--border-color-dark) var(--border-color-dark) var(--border-color-light);
             box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);


			&::before {
				content: '';
				position: absolute;
				left: 2px;
				top: 2px;
				width: 20px;
				height: 20px;
				background-color: var(--element-bg);
				border-radius: 50%;
				transition: transform var(--transition-speed) var(--transition-timing), box-shadow var(--transition-speed) var(--transition-timing);
                border: var(--border-width) solid;
                border-color: var(--secondary-border-highlight) var(--border-color-dark) var(--border-color-dark) var(--secondary-border-highlight);
                box-shadow:
                    0 1px 2px rgba(0,0,0,0.2),
                    0 0 0 1px rgba(0,0,0,0.05);
			}
		}

		input:checked + .slider {
			background-color: var(--primary-bg);
            // Use pre-defined darker primary color for border
            border-color: var(--primary-border-highlight) var(--primary-bg-darker) var(--primary-bg-darker) var(--primary-border-highlight);

			&::before {
				transform: translateX(22px);
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
			}
		}

        input:checked ~ .label-text {
            color: var(--primary-bg);
            font-weight: 500;
        }

		input:focus-visible + .slider {
			outline: 2px solid var(--primary-bg);
			outline-offset: 2px;
		}

        &.toggle-switch-alt {
             .slider {
                 width: 44px;
                 height: 22px;
                 border-radius: var(--border-radius);
                 background-color: var(--element-bg);
                 border-color: var(--secondary-border-highlight) var(--border-color-dark) var(--border-color-dark) var(--secondary-border-highlight);
                 box-shadow: inset 0 1px 2px rgba(0,0,0,0.1), 0 1px 1px var(--secondary-shadow-color);

                &::before {
                    width: 16px;
                    height: 16px;
                    border-radius: calc(var(--border-radius) / 2);
                    left: 2px;
                    top: 2px;
                    background-color: #9ca3af;
                    border: none;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.25);
                }
             }

            input:checked + .slider {
                background-color: var(--primary-bg);
                border-color: var(--primary-border-highlight) var(--primary-bg-darker) var(--primary-bg-darker) var(--primary-border-highlight);
                box-shadow: inset 0 1px 2px rgba(0,0,0,0.15);

                &::before {
                    transform: translateX(22px);
                    background-color: var(--primary-text);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }
            }
        }
	}


	// --- Dropdown Menu Styles ---
	.dropdown-container {
		position: relative;
		display: inline-block;

        .btn svg {
            margin-left: 8px;
            transition: transform var(--transition-speed) var(--transition-timing);
            &.rotated {
                transform: rotate(180deg);
            }
        }
	}

	.dropdown-menu {
		@extend .pseudo-3d-element;
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		background-color: var(--element-bg);
		min-width: 180px;
		border-radius: var(--border-radius);
		padding: 8px 0;
		list-style: none;
		margin: 0;
		z-index: 10;
        overflow: hidden;

		li {
			padding: 10px 15px;
			font-size: 0.9rem;
			color: var(--text-color);
			cursor: pointer;
			transition: background-color var(--transition-speed) var(--transition-timing), color var(--transition-speed) var(--transition-timing);
            white-space: nowrap;

			&:hover {
				background-color: var(--primary-bg);
				color: var(--primary-text);
			}

            &.destructive-item {
                color: var(--destructive-bg);
                &:hover {
                    background-color: var(--destructive-bg);
                    color: var(--destructive-text);
                }
            }

            &.separator {
                height: 1px;
                background-color: var(--border-color-light);
                margin: 8px 0;
                padding: 0;
                cursor: default;
                 &:hover {
                    background-color: var(--border-color-light);
                }
            }
		}
	}

	// --- Tabs Styles ---
	.tabs-container {
        @extend .pseudo-3d-element;
        background-color: var(--element-bg);
        padding: 15px;
        display: flex;
        flex-direction: column;
	}

	.tab-list {
		display: flex;
		margin-bottom: 15px;
        border-bottom: 2px solid var(--border-color-light);
        position: relative;
        top: -2px;
	}

	.tab-button {
		padding: 10px 18px;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		background-color: transparent;
		border: none;
        border-bottom: 2px solid transparent;
		color: var(--subtle-text);
		transition: color var(--transition-speed) var(--transition-timing), border-color var(--transition-speed) var(--transition-timing);
        margin-bottom: -2px;
        position: relative;

		&:hover {
			color: var(--primary-bg-hover);
		}

		&.active {
			color: var(--primary-bg);
			font-weight: 600;
            border-bottom-color: var(--primary-bg);
            transform: translateY(-1px);
		}
	}

	.tab-content {
		min-height: 150px;
        padding-top: 15px;

        h3 {
            margin-top: 0;
            margin-bottom: 10px;
            font-weight: 600;
        }
        p {
            margin-top: 0;
            margin-bottom: 15px;
            color: var(--subtle-text);
            font-size: 0.95rem;
            line-height: 1.5;
        }
        ul {
            list-style: disc;
            padding-left: 20px;
            color: var(--subtle-text);
            font-size: 0.95rem;
             li {
                margin-bottom: 8px;
            }
        }
	}

    .tab-panel {
        // Styles specific to the content panels if needed
    }

    // --- Chart Placeholder ---
    .chart-placeholder {
        @extend .pseudo-3d-element;
        display: flex;
        align-items: flex-end;
        justify-content: space-around;
        height: 120px;
        padding: 15px 10px 0px 10px;
        background-color: #f9fafb;
        border-color: var(--border-color-light) var(--border-color-dark) var(--border-color-dark) var(--border-color-light);

        .bar {
            width: 10%;
            background-color: var(--primary-bg);
            border-radius: 3px 3px 0 0;
            animation: grow 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
            transform-origin: bottom;
            position: relative;
            border: 1px solid;
            // Use pre-defined darker primary for border
            border-color: var(--primary-border-highlight) var(--primary-bg-darker) transparent var(--primary-border-highlight);
            box-shadow: inset 0px 1px 1px rgba(255, 255, 255, 0.2),
                        0 1px 2px var(--primary-shadow-color);

            &:nth-child(even) {
                background-color: var(--primary-bg-hover);
                 // Use the darker hover color as the darker border color here
                 //), 15%) var(--primary-bg-active) transparent lighten(var(--primary-bg-hover), 15%);
            }
        }
    }

    @keyframes grow {
        from { transform: scaleY(0); }
        to { transform: scaleY(1); }
    }

     // --- Input Styles ---
    .text-input, .select-input {
        @extend .pseudo-3d-element;
        padding: 10px 12px;
        font-size: 0.95rem;
        color: var(--text-color);
        background-color: var(--element-bg);
        width: 100%;
        box-sizing: border-box;

        &:focus {
            outline: none;
            border-color: var(--primary-border-highlight) var(--primary-bg-darker) var(--primary-bg-darker) var(--primary-border-highlight);
            box-shadow:
                inset 0px 1px 1px rgba(0, 0, 0, 0.05),
                0 0 0 2px var(--primary-shadow-color);
        }

         &::placeholder {
            color: var(--subtle-text);
            opacity: 0.8;
        }
    }

    .select-input {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        padding-right: 36px;
        cursor: pointer;
    }

     // --- Slider Styles ---
    .slider-container {
        display: flex;
        align-items: center;
        gap: 15px;
        width: 100%;

        label {
            font-size: 0.9rem;
            color: var(--subtle-text);
            white-space: nowrap;
        }
    }

    .slider-input {
        flex-grow: 1;
        appearance: none;
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        outline: none;
        cursor: pointer;
        border: var(--border-width) solid;
        border-color: var(--border-color-light) var(--border-color-dark) var(--border-color-dark) var(--border-color-light);
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);

        // Thumb (handle) styling - Webkit (Chrome, Safari, Edge)
        &::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            background: var(--primary-bg);
            border-radius: 50%;
            cursor: pointer;
            border: var(--border-width) solid;
            border-color: var(--primary-border-highlight) var(--primary-bg-darker) var(--primary-bg-darker) var(--primary-border-highlight);
            box-shadow: 0 1px 3px var(--primary-shadow-color);
            transition: transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out;
            margin-top: -7px;
        }
        &:active::-webkit-slider-thumb {
             transform: scale(1.1);
            box-shadow: 0 2px 5px var(--primary-shadow-color);
        }

        // Thumb (handle) styling - Firefox
        &::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: var(--primary-bg);
            border-radius: 50%;
            cursor: pointer;
            border: var(--border-width) solid;
            border-color: var(--primary-border-highlight) var(--primary-bg-darker) var(--primary-bg-darker) var(--primary-border-highlight);
            box-shadow: 0 1px 3px var(--primary-shadow-color);
            transition: transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out;
        }
         &:active::-moz-range-thumb {
             transform: scale(1.1);
             box-shadow: 0 2px 5px var(--primary-shadow-color);
        }
    }

    // Settings Item Example (in Tabs)
    .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        span {
             font-size: 0.95rem;
        }
        .select-input {
            width: auto;
            min-width: 150px;
        }
    }

    // --- Card Styles ---
    .card {
        @extend .pseudo-3d-element;
        padding: 20px;
        background-color: var(--element-bg);

        h3 {
            margin-top: 0;
            margin-bottom: 10px;
            font-weight: 600;
        }
        p {
            margin-top: 0;
            margin-bottom: 0;
            color: var(--subtle-text);
            font-size: 0.95rem;
            line-height: 1.5;
        }
    }

    // --- Alert Styles ---
    .alert {
        @extend .pseudo-3d-element;
        display: flex;
        align-items: flex-start;
        padding: 15px;
        margin-bottom: 15px;
        width: 100%;
        box-sizing: border-box;
        gap: 12px;

        .alert-icon {
            color: var(--primary-bg);
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 24px;
            width: 24px;
        }

        .alert-content {
            flex: 1;

            h4 {
                margin: 0 0 5px 0;
                font-weight: 600;
                font-size: 1rem;
            }

            p {
                margin: 0;
                color: var(--subtle-text);
                font-size: 0.95rem;
                line-height: 1.5;
            }
        }

        .alert-close {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 0;
            margin: 0;
            color: var(--subtle-text);
            opacity: 0.6;
            transition: all var(--transition-speed) var(--transition-timing);

            &:hover {
                opacity: 1;
                transform: scale(1.1);
            }
        }

        &.alert-info {
            border-color: var(--primary-border-highlight) var(--primary-bg-darker) var(--primary-bg-darker) var(--primary-border-highlight);
            background-color: rgba(59, 130, 246, 0.05);

            .alert-icon {
                color: var(--primary-bg);
            }

            .alert-content h4 {
                color: var(--primary-bg-hover);
            }
        }

        &.alert-success {
            border-color: var(--success-border-highlight) var(--success-bg-darker) var(--success-bg-darker) var(--success-border-highlight);
            background-color: rgba(16, 185, 129, 0.05);

            .alert-icon {
                color: var(--success-bg);
            }

            .alert-content h4 {
                color: var(--success-bg-hover);
            }
        }

        &.alert-warning {
            border-color: var(--warning-border-highlight) var(--warning-bg-darker) var(--warning-bg-darker) var(--warning-border-highlight);
            background-color: rgba(245, 158, 11, 0.05);

            .alert-icon {
                color: var(--warning-bg);
            }

            .alert-content h4 {
                color: var(--warning-bg-hover);
            }
        }

        &.alert-error {
            border-color: var(--destructive-border-highlight) var(--destructive-bg-darker) var(--destructive-bg-darker) var(--destructive-border-highlight);
            background-color: rgba(239, 68, 68, 0.05);

            .alert-icon {
                color: var(--destructive-bg);
            }

            .alert-content h4 {
                color: var(--destructive-bg-hover);
            }
        }
    }

    // --- Badge Styles ---
    .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
        line-height: 1;
        padding: 0.35em 0.65em;
        border-radius: var(--border-radius-full);
        border: var(--border-width) solid;
        transition: all var(--transition-speed) var(--transition-timing);

        // Light reflection effect
        position: relative;
        overflow: hidden;

        &::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 50%;
            background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%);
            pointer-events: none;
        }

        &:hover {
            transform: translateY(var(--hover-lift)) scale(1.05);
        }

        &.badge-primary {
            background-color: var(--primary-bg);
            color: var(--primary-text);
            border-color: var(--primary-border-highlight) var(--primary-bg-darker) var(--primary-bg-darker) var(--primary-border-highlight);
            box-shadow: 0 1px 2px var(--primary-shadow-color);
        }

        &.badge-success {
            background-color: var(--success-bg);
            color: var(--success-text);
            border-color: var(--success-border-highlight) var(--success-bg-darker) var(--success-bg-darker) var(--success-border-highlight);
            box-shadow: 0 1px 2px var(--success-shadow-color);
        }

        &.badge-warning {
            background-color: var(--warning-bg);
            color: var(--warning-text);
            border-color: var(--warning-border-highlight) var(--warning-bg-darker) var(--warning-bg-darker) var(--warning-border-highlight);
            box-shadow: 0 1px 2px var(--warning-shadow-color);
        }

        &.badge-destructive {
            background-color: var(--destructive-bg);
            color: var(--destructive-text);
            border-color: var(--destructive-border-highlight) var(--destructive-bg-darker) var(--destructive-bg-darker) var(--destructive-border-highlight);
            box-shadow: 0 1px 2px var(--destructive-shadow-color);
        }

        &.badge-neutral {
            background-color: var(--neutral-200);
            color: var(--neutral-700);
            border-color: var(--neutral-100) var(--neutral-300) var(--neutral-300) var(--neutral-100);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        // Outline variants
        &.badge-outline-primary {
            background-color: transparent;
            color: var(--primary-bg);
            border-color: var(--primary-bg);
            box-shadow: 0 1px 2px rgba(var(--primary-shadow-color), 0.1);

            &::before {
                display: none;
            }
        }

        &.badge-outline-success {
            background-color: transparent;
            color: var(--success-bg);
            border-color: var(--success-bg);
            box-shadow: 0 1px 2px rgba(var(--success-shadow-color), 0.1);

            &::before {
                display: none;
            }
        }

        &.badge-outline-warning {
            background-color: transparent;
            color: var(--warning-bg);
            border-color: var(--warning-bg);
            box-shadow: 0 1px 2px rgba(var(--warning-shadow-color), 0.1);

            &::before {
                display: none;
            }
        }

        &.badge-outline-destructive {
            background-color: transparent;
            color: var(--destructive-bg);
            border-color: var(--destructive-bg);
            box-shadow: 0 1px 2px rgba(var(--destructive-shadow-color), 0.1);

            &::before {
                display: none;
            }
        }
    }

    // --- Avatar Styles ---
    .avatar {
        position: relative;
        width: 40px;
        height: 40px;
        border-radius: var(--border-radius-full);
        overflow: hidden;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: var(--neutral-200);
        color: var(--neutral-700);
        font-weight: 600;
        font-size: 0.9rem;
        border: var(--border-width) solid;
        border-color: var(--neutral-100) var(--neutral-300) var(--neutral-300) var(--neutral-100);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transition: all var(--transition-medium) var(--transition-bounce);
        cursor: pointer;

        &:hover {
            transform: translateY(var(--hover-lift)) scale(var(--scale-hover));
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        &.avatar-sm {
            width: 30px;
            height: 30px;
            font-size: 0.7rem;
        }

        &.avatar-lg {
            width: 50px;
            height: 50px;
            font-size: 1.1rem;
        }

        &.avatar-success {
            background-color: var(--success-bg);
            color: var(--success-text);
            border-color: var(--success-border-highlight) var(--success-bg-darker) var(--success-bg-darker) var(--success-border-highlight);
        }

        &.avatar-primary {
            background-color: var(--primary-bg);
            color: var(--primary-text);
            border-color: var(--primary-border-highlight) var(--primary-bg-darker) var(--primary-bg-darker) var(--primary-border-highlight);
        }
    }

    .avatar-group {
        display: flex;
        align-items: center;

        .avatar {
            margin-right: -10px;
            border: 2px solid var(--element-bg);

            &:hover {
                transform: translateY(var(--hover-lift)) scale(var(--scale-hover));
                z-index: 1;
            }

            &:last-child {
                margin-right: 0;
            }
        }
    }

    // --- Modal Styles ---
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        padding: 20px;
        backdrop-filter: blur(2px);
    }

    .modal {
        @extend .pseudo-3d-elevated;
        background-color: var(--element-bg);
        border-radius: var(--border-radius-lg);
        width: 100%;
        max-width: 500px;
        max-height: calc(100vh - 40px);
        overflow: hidden;
        display: flex;
        flex-direction: column;

        .modal-header {
            padding: 20px;
            border-bottom: 1px solid var(--border-color-light);
            display: flex;
            align-items: center;
            justify-content: space-between;

            h3 {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
            }

            .modal-close {
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 5px;
                margin: -5px;
                color: var(--subtle-text);
                transition: all var(--transition-speed) var(--transition-timing);
                border-radius: var(--border-radius-full);

                &:hover {
                    color: var(--text-color);
                    background-color: var(--neutral-100);
                    transform: rotate(90deg);
                }
            }
        }

        .modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;

            p {
                margin-top: 0;
                margin-bottom: 15px;
                color: var(--subtle-text);
                font-size: 0.95rem;
                line-height: 1.5;

                &:last-child {
                    margin-bottom: 0;
                }
            }
        }

        .modal-footer {
            padding: 15px 20px;
            border-top: 1px solid var(--border-color-light);
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
    }

    // --- Accordion Styles ---
    .accordion {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .accordion-item {
        @extend .pseudo-3d-element;
        border-radius: var(--border-radius);
        overflow: hidden;

        &:hover {
            transform: translateY(var(--hover-lift));
        }
    }

    .accordion-header {
        width: 100%;
        padding: 15px;
        background-color: var(--element-bg);
        border: none;
        text-align: left;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all var(--transition-speed) var(--transition-timing);

        svg {
            transition: transform var(--transition-speed) var(--transition-timing);
            color: var(--subtle-text);

            &.rotated {
                transform: rotate(180deg);
            }
        }

        &:hover {
            background-color: var(--neutral-50);
        }

        &.active {
            color: var(--primary-bg);
            background-color: var(--neutral-50);

            svg {
                color: var(--primary-bg);
            }
        }
    }

    .accordion-content {
        padding: 0 15px 15px 15px;

        p {
            margin-top: 0;
            margin-bottom: 15px;
            color: var(--subtle-text);
            font-size: 0.95rem;
            line-height: 1.5;

            &:last-child {
                margin-bottom: 0;
            }
        }
    }

    // --- Tooltip Styles ---
    .tooltip-container {
        position: relative;
        display: inline-flex;
    }

    .text-with-tooltip {
        position: relative;
        display: inline-flex;
        color: var(--primary-bg);
        text-decoration: underline dotted;
        cursor: help;

        .tooltip {
            visibility: hidden;
            opacity: 0;
        }

        &:hover .tooltip {
            visibility: visible;
            opacity: 1;
        }
    }

    .tooltip {
        position: absolute;
        background-color: var(--neutral-800);
        color: white;
        font-size: 0.8rem;
        padding: 8px 12px;
        border-radius: var(--border-radius);
        width: max-content;
        max-width: 250px;
        z-index: 10;
        text-align: center;
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
        pointer-events: none;
        transition: all var(--transition-speed) var(--transition-timing);

        &.tooltip-top {
            bottom: calc(100% + 10px);
            left: 50%;
            transform: translateX(-50%);
        }

        &.tooltip-bottom {
            top: calc(100% + 10px);
            left: 50%;
            transform: translateX(-50%);
        }

        .tooltip-arrow {
            position: absolute;
            width: 0;
            height: 0;
            border-style: solid;

            .tooltip-top & {
                bottom: -5px;
                left: 50%;
                transform: translateX(-50%);
                border-width: 5px 5px 0 5px;
                border-color: var(--neutral-800) transparent transparent transparent;
            }

            .tooltip-bottom & {
                top: -5px;
                left: 50%;
                transform: translateX(-50%);
                border-width: 0 5px 5px 5px;
                border-color: transparent transparent var(--neutral-800) transparent;
            }
        }
    }

    // --- Progress Styles ---
    .progress {
        @extend .pseudo-3d-inset;
        width: 100%;
        height: 12px;
        background-color: var(--neutral-100);
        border-radius: var(--border-radius-full);
        overflow: hidden;
    }

    .progress-bar {
        height: 100%;
        background-color: var(--primary-bg);
        width: 0;
        border-radius: var(--border-radius-full);
        transition: width 0.3s var(--transition-timing);
        background-image: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.15) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.15) 50%,
            rgba(255, 255, 255, 0.15) 75%,
            transparent 75%,
            transparent
        );
        background-size: 20px 20px;
    }

    .progress-indeterminate .progress-bar {
        width: 100%;
        background-size: 20px 20px;
        animation: progress-bar-stripes 1s linear infinite, pulse 2s ease-in-out infinite;
    }

    @keyframes progress-bar-stripes {
        from { background-position: 20px 0; }
        to { background-position: 0 0; }
    }

    @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
    }

    .progress-label {
        font-size: 0.9rem;
        color: var(--subtle-text);
        margin-top: 5px;
    }

    // --- Pagination Styles ---
    .pagination {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .pagination-pages {
        display: flex;
        gap: 5px;
    }

    .pagination-item {
        @extend .pseudo-3d-element;
        padding: 8px 12px;
        min-width: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: var(--element-bg);
        color: var(--text-color);
        font-size: 0.9rem;
        border: var(--border-width) solid;
        border-color: var(--secondary-border-highlight) var(--border-color-dark) var(--border-color-dark) var(--secondary-border-highlight);
        cursor: pointer;
        transition: all var(--transition-speed) var(--transition-timing);

        &:hover:not(:disabled) {
            background-color: var(--secondary-bg-hover);
            transform: translateY(var(--hover-lift));
        }

        &:active:not(:disabled) {
            transform: translateY(var(--press-translate-y));
            background-color: var(--secondary-bg-active);
            border-color: var(--border-color-dark) var(--secondary-border-highlight) var(--secondary-border-highlight) var(--border-color-dark);
            box-shadow: inset 0px 1px 2px rgba(0, 0, 0, 0.1);
        }

        &.active {
            background-color: var(--primary-bg);
            color: var(--primary-text);
            border-color: var(--primary-border-highlight) var(--primary-bg-darker) var(--primary-bg-darker) var(--primary-border-highlight);
            box-shadow:
                inset 0px 1px 1px rgba(255, 255, 255, 0.3),
                0 var(--shadow-depth-1) var(--shadow-blur-1) var(--primary-shadow-color);
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background-color: var(--neutral-100);
        }

        &.pagination-prev, &.pagination-next {
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
    }

    // --- Animated Card Styles ---
    .animated-card {
        @extend .pseudo-3d-elevated;
        padding: 25px;
        position: relative;
        overflow: hidden;
        transform-style: preserve-3d;

        .card-floating-element {
            position: absolute;
            top: 15px;
            right: 15px;
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, var(--primary-border-highlight), var(--primary-bg));
            border-radius: 50%;
            filter: blur(20px);
            opacity: 0.2;
            transform-style: preserve-3d;
            transform: translateZ(50px);
            pointer-events: none;
        }

        h3 {
            position: relative;
            margin-top: 0;
            margin-bottom: 15px;
            transform: translateZ(30px);
        }

        p {
            position: relative;
            transform: translateZ(20px);
        }

        .btn {
            position: relative;
            transform: translateZ(40px);
        }
    }
</style>