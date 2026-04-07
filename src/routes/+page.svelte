<script>
	import { onMount } from 'svelte'
	import Gallery from '$lib/components/Gallery.svelte'
	import Battery from '$lib/components/Battery.svelte'

	// Completion percentages for each route/project
	const routeCompletion = {
		'/stan': 95,
		'/marc': 50,
		'/arcaide': 90,
		'/pandemonium': 80,
		'/kingdom': 45,
		'/palace':70,
		'/persia': 75,
		'/timeline': 100,
		'/mario': 100,
		'/movies': 25,
		'/gapyear': 80,
		'/anorexia': 100,
		'/canvas': 85,
		'/phone': 90,
		'/orange': 75,
		'/dido': 70,
		'/mathwsteve': 100
	}

	let pandemonium = [
		[
			{ url: 'p1', caption: '' },
			{ url: 'p20', caption: '' },
			{ url: 'p28', caption: '' },
		],
		[
			{ url: 'px-1', caption: '' },
			{ url: 'px-5', caption: '' },
		],
		[
			{ url: 'banner-pandemonium', caption: '' },
		]
	]

	let samhan = [
		[
			{ url: 'img-253', caption: '' },
			{ url: 'img-240', caption: '' },
			{ url: 'img-234', caption: '' },
		],
		[
			{ url: 'samhan', caption: '' },
		]
	]

	let stanley = [
		{ url: 'banner-stanley', caption: '' },
	]

	let marc = [
		{ url: 'MARC-1', caption: '' }
	]

	const navItems = [
		{ id: 'games', label: 'Webdev', icon: '🖥️' },
		{ id: 'experience', label: 'Design', icon: '🎨' },
		{ id: 'research', label: 'Research', icon: '🔬' },
		{ id: 'comics', label: 'Comics', icon: '📚' },
		{ id: 'writing', label: 'Writing', icon: '✍️' },
	]

	let activeIndex = 0
	let navRefs = Array(navItems.length).fill(null)
	let indicatorLeft = 0
	let indicatorWidth = 0
	let navElement
	let isNavigating = false
	let scrollTimeout

	function scrollToSection(id, targetIndex) {
		isNavigating = true
		activeIndex = targetIndex
		updateIndicator()

		const element = document.getElementById(id)
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}

		// Re-enable scroll tracking after scroll completes
		clearTimeout(scrollTimeout)
		scrollTimeout = setTimeout(() => {
			isNavigating = false
		}, 1000)
	}

	function updateActiveSection() {
		// Don't update if user is actively navigating
		if (isNavigating) return

		const scrollPos = window.scrollY + 200

		for (let i = navItems.length - 1; i >= 0; i--) {
			const element = document.getElementById(navItems[i].id)
			if (element && element.offsetTop <= scrollPos) {
				if (activeIndex !== i) {
					activeIndex = i
					updateIndicator()
				}
				break
			}
		}
	}

	function updateIndicator() {
		if (navRefs[activeIndex] && navElement) {
			const activeBtn = navRefs[activeIndex]
			const navRect = navElement.getBoundingClientRect()
			const btnRect = activeBtn.getBoundingClientRect()

			indicatorLeft = btnRect.left - navRect.left
			indicatorWidth = btnRect.width - 4
		}
	}

	onMount(() => {
		// Small delay to ensure DOM is ready
		setTimeout(() => {
			updateIndicator()
			updateActiveSection()
		}, 100)

		window.addEventListener('scroll', updateActiveSection, { passive: true })
		window.addEventListener('resize', updateIndicator)

		return () => {
			clearTimeout(scrollTimeout)
			window.removeEventListener('scroll', updateActiveSection)
			window.removeEventListener('resize', updateIndicator)
		}
	})
</script>


<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=call_made" />

<main>
	<nav bind:this={navElement}>
		<div class="indicator" style="left: {indicatorLeft}px; width: {indicatorWidth}px;"></div>
		{#each navItems as item, i}
			<button
				class="navbtn"
				class:active={activeIndex === i}
				on:click={() => scrollToSection(item.id, i)}
				bind:this={navRefs[i]}
			>
				<span class="icon">{item.icon}</span>
				<span class="label">{item.label}</span>
			</button>
		{/each}
	</nav>

	<div class="container">


		<div class="mast">
			<div class="expo">
				<img src="smiley.png" alt="Smiley" class="avatar">
				<h1>
					Hi! My name is Heewon. <br>
					I'm a <a href="#experience">designer</a>, <a href="#games">engineer</a>, and occasional <a href="#comics">artist.</a>
				</h1>
				<p>
					Currently, I'm interested in building a new <a href="https://x.com/karpathy/status/1917920257257459899?lang=en">UI paradigm</a> for generative AI applications. <br> <br>
					Let's collaborate! Reach out anytime at <a href="mailto:shelost.off@gmail.com">shelost.off@gmail.com</a>.
				</p>

				<div class = 'flex'>
					<div class = 'battery'>
						<Battery percentage={100} />
						<h3> Complete! </h3>
					</div>
					<div class = 'battery'>	
						<Battery percentage={50} />
						<h3> In Progress </h3>
					</div>
					<div class = 'battery'>	
						<Battery percentage={25} />
						<h3> Working on it... </h3>
					</div>
				</div>
			</div>
		</div>



		
		<div class="title" id="games">
			<h2> Webdev </h2>
			<p> Fun web games + apps! I created all of the graphics and code in the pre-AI dinosaur era.</p>
		</div>

		<div class="flex">
			<a href="https://shelost.github.io/platformr" class="noud">
				<div class="icon">
					<img class="app" src="icon-platformr.png" alt="">
					<h4>Platformr</h4>
					<Battery percentage={100} />
				</div>
			</a>

			<a href="https://shelost.github.io/11rooms" class="noud">
				<div class="icon">
					<img class="app" src="icon-rooms.png" alt="">
					<h4>11 Rooms</h4>
					<Battery percentage={100} />
				</div>
			</a>

			<a href="https://shelost.github.io/orbiting" class="noud">
				<div class="icon">
					<img class="app" src="icon-orbiting.png" alt="">
					<h4>Just Orbiting By</h4>
					<Battery percentage={100} />
				</div>
			</a>

			<a href="https://shelost.github.io/wordchain" class="noud">
				<div class="icon">
					<img class="app" src="icon-wordchain.png" alt="">
					<h4>Wordchain</h4>
					<Battery percentage={100} />
				</div>
			</a>

			<a href="https://shelost.github.io/trails" class="noud">
				<div class="icon">
					<img class="app" src="icon-trails.png" alt="">
					<h4>Trails</h4>
					<Battery percentage={100} />
				</div>
			</a>

			<a href="https://shelost.github.io/superpong" class="noud">
				<div class="icon">
					<img class="app" src="icon-pong.png" alt="">
					<h4>Super Pong</h4>
					<Battery percentage={100} />
				</div>
			</a>


		</div>

		<div class = 'grid'>

		
			<div class = 'video'>
				<a href="https://www.sketchdreamer.com/canvas">
					<video src = 'realtime 3.mov' autoplay loop muted playsinline></video>
				</a>
				<h4>
					AI Canvas
					<span class = 'date'>2025</span>
					<Battery percentage={routeCompletion['/canvas']} />
				</h4>
				<p>
					Realtime AI image generation, based on Tldraw's <a href="https://drawfast.tldraw.com/">Drawfast</a>
				</p>
			</div>

			<div class = 'video'>
				<a href="https://www.sketchdreamer.com/phone">
					<video src = 'iphone3d.mov' autoplay loop muted playsinline></video>
				</a>
				<h4> 
					iPhone 3D Creator
					<span class = 'date'>2025</span>
					<Battery percentage={routeCompletion['/canvas']} />
				</h4>
				<p>
					A helper tool for UX designers
				</p>
			</div>

			<div class = 'video'>
				<a href="https://dido-ui.vercel.app/">
					<video src = 'dido.mov' autoplay loop muted playsinline></video>
				</a>
				<h4>
					Dido UI
					<span class = 'date'>2025</span>
					<Battery percentage={50} />
				</h4>
				<p>
					A minimalistic UI library
					
				</p>
			</div>

			<div class = 'video'>
				<a href="https://shelost.github.io/scioly">
					<video src = 'scioly.mov' autoplay loop muted playsinline></video>
				</a>
				<h4>
					Science Olympiad
					<span class = 'date'>2020</span>
					<Battery percentage={50} />
				</h4>
				<p>
					Website for Ithaca's Science Olympiad team
				</p>
			</div>
		
		</div>

	

		<div class="title" id="experience">
			<h2>Design</h2>
			<p>
				Can you really call it <i>experience</i> if there's only one company on the list?
			</p>
		</div>

		<ul>
			<div class="elem">
				<div class="header">

					<img src="stan.svg" alt="Pandemonium" class="logo horizontal">
					<div class="title-row">
						<h3>Stan</h3>
					</div>

					<div class = 'expo'>
						<p>
							I was the <b>Founding Designer @ Stan,</b> dropping out of college at 19 to help build the future of work.
						</p>
						<p>
							Stan allows you to set up a custom mobile store in minutes,
							allowing you to focus on what you do best (Creating!) while we take care of the business logistics.
						</p>
						<p>
							We scaled from <b>0 to $30M ARR</b> in 3 years, led by the mega duo of John & Vitalii.
						</p>
					</div>
					
					<div class="tags">
						<a href="https://stan.store" class="noud">
							<div class="tag stan">
								<h2>Homepage</h2>
							</div>
						</a>
						<a href="https://gmv.stan.store" class="noud">
							<div class="tag">
								<h2>GMV (Live)</h2>
							</div>
						</a>
					</div>
				</div>
				<div class="space">
					<img class="banner" src="stan4.svg" alt="">
				</div>
			</div>
		</ul>


		<div class="title" id="comics">
			<h2>Comics</h2>
			<p>
				My childhood dream was to become a comic artist, and I'm getting there one day at a time!
			</p>
		</div>

		<ul>
			<div class="elem">
				<div class="header">
					<img src="title-cheonha.png" alt="Pandemonium" class="logo square">
					<div class="title-row">
						<h3>
							Pandemonium
							<span class = 'date'>2024</span>
						</h3>
						
						<Battery percentage={routeCompletion['/pandemonium']} />
					</div>

					<div class = 'expo'>
						<p>
							This was my first real comics chapter, based on a combination of classic Eastern novels such as "Three Kingdoms" and "Journey to the West."
						</p>
						<p>
							I only ended up writing one chapter so far — but the full
							<a href="https://ahnheewon.notion.site/All-Nations-b63d9a85eb1147cd8ae4545bf0f98627?pvs=143">story outline</a> can be found below!
						</p>
					</div>
					
					<div class="tags">
						<a href="https://www.webtoons.com/en/canvas/cheonha/the-girl/viewer?title_no=1112025&episode_no=1" class="noud">
							<div class="tag naver">
								<img src="/naver.svg" alt="Naver Logo">
								<h2>Naver Webtoon</h2>
							</div>
						</a>
						<a href="https://comic.naver.com/challenge/detail?titleId=846439&no=1" class="noud">
							<div class="tag naver">
								<img src="/naver.svg" alt="Naver Logo">
								<h2>네이버 도전만화</h2>
							</div>
						</a>
						<a href="https://ahnheewon.notion.site/All-Nations-b63d9a85eb1147cd8ae4545bf0f98627?pvs=143" class="noud">
							<div class="tag notion">
								<img src="/notion.svg" alt="Naver Logo">
								<h2>Story Outline</h2>
							</div>
						</a>
						<a href="/pandemonium-art" class="noud">
							<div class="tag">
								<h2>Character Sheets</h2>
							</div>
						</a>
					</div>
				</div>

				<a href="/pandemonium">
					<div class="space">
						<Gallery images={pandemonium[0]} col={3} />
						<Gallery images={pandemonium[1]} col={2} />
						<Gallery images={pandemonium[2]} col={1} />
					</div>
				</a>
			</div>

			<div class="elem">
				<div class="header">
					<img src="title-samhan.png" alt="Pandemonium" class="logo horizontal">
					<div class="title-row">
						<h3>
							King of Samhan
							<span class = 'date'>2025</span>
						</h3>
						<Battery percentage={routeCompletion['/kingdom']} />
					</div>

					<div class = 'expo'>
						<p>
							This is my concept for a historical adventure series, loosely based on the 2009 historical K-Drama
							<a href="https://en.wikipedia.org/wiki/Queen_Seondeok_(TV_series)">Queen Seondeok</a> set in 7th-century Korea.
						</p>
						<p>
							I did a lot of research for this project, which may one day materialize.
						</p>
					</div>
					
					<div class="tags">
						<a href="https://notion.so/668-Novel-1b67696bef164e83ae68cd3cb095d33b?pvs=74&assetsVersion=23.13.20251208.1257&cookie_sync_completed=true" class="noud">
							<div class="tag notion">
								<img src="/notion.svg" alt="Naver Logo">
								<h2>Story Outline</h2>
							</div>
						</a>
						<a href="/kingdom" class="noud">
							<div class="tag">
								<h2>Concept Art</h2>
							</div>
						</a>
					</div>
				</div>
				<div class="space">
					<Gallery images={samhan[0]} col={3} />
					<Gallery images={samhan[1]} col={1} />
				</div>
			</div>
		</ul>

		<div class="title" id="research">
			<h2>Research</h2>
			<p>
				While in school, I worked on solving the ARC challenge with <a href="https://www.cs.cornell.edu/~ellisk/">Prof. Kevin Ellis</a>.
			</p>
		</div>

		<ul>


			
				<div class="elem">
					<div class="header">
					<img src="logo-arcaide.png" alt="Pandemonium" class="logo square">
					<div class="title-row">
						<h3>Arcaide</h3>
						<Battery percentage={routeCompletion['/arcaide']} />
					</div>
						<p>
							An extremely cleverly named ARC annotation web tool, which generates JSON files with specially annotated objects from raw ARC data.
						</p>
						<div class = 'tags'>
							<a href="https://shelost.github.io/arcaide2/">
								<div class = 'tag link'>
									<img src="arrow_top_right.svg" class = 'arrow_top_right' alt="Link">
									<h2> View App </h2>
								</div>
							</a>
							<a href="https://github.com/shelost/arcaide2">	
							<div class = 'tag github'>
								<img src="logo-github.svg" alt="GitHub">
								<h2> GitHub </h2>
							</div>
						</a>
						<a href="https://arcprize.org/arcaide">
							<div class = 'tag'>
								<h2> Beta Version </h2>
							</div>
						</a>
						</div>
					</div>
					<div class="space">
						<img class="banner" src="arcaide.png" alt="Arcaide">
					</div>
				</div>
			

			
			<div class="elem">
				<div class="header">
					<img src="logo-marc.svg" alt="Pandemonium" class="logo horizontal">
					<div class="title-row">
						<h3>MARC</h3>
						<Battery percentage={routeCompletion['/marc']} />
					</div>
					<p>
						The Markings Analysis & Reasoning Corpus (MARC) is a visual reasoning dataset, inspired by François Chollet's <a href="https://arcprize.org/arc-agi">ARC Challenge.</a>
						Instead of grid-based datasets, it consists of stroke- and drawing-based data.
					</p>
					<div class = 'tags'>
						<a href = "/marc">
							<div class = 'tag'>
								<h2> View Dataset </h2>
							</div>
						</a>
					</div>
				</div>
				<a href="/marc">
					<div class="space">
						<Gallery images={marc} col={1} />
					</div>
				</a>
			</div>

		</ul>


		<div class="title" id="writing">
			<h2>Writing</h2>
		</div>

		<ul>
			<li>
				<a href="/movies">
					Favorite Movies
					<span class="date">2026</span>
				</a>
				<Battery percentage={routeCompletion['/movies']} />
			</li>
			<li>
				<a href="/gapyear">
					My Gap Year
					<span class="date">2025</span>
				</a>
				<Battery percentage={routeCompletion['/gapyear']} />
			</li>
			<li>
				<a href="/anorexia">
					Anorexia
					<span class="date">2025</span>
				</a>
				<Battery percentage={routeCompletion['/anorexia']} />
			</li>
			<li>
				<a href="/palace">
					The AI Palace Economy
					<span class="date">2025</span>
				</a>
				<Battery percentage={routeCompletion['/palace']} />
			</li>
			<li>
				<a href="/persia">
					The Roman-Persian Wars
					<span class="date">2025</span>
				</a>
				<Battery percentage={routeCompletion['/persia']} />
			</li>
			<li>
				<a href="/timeline">
					The Civilization Timeline
					<span class="date">2024</span>
				</a>
				<Battery percentage={routeCompletion['/timeline']} />
			</li>
			<li>
				<a href="/mario">
					The Super Mario Bros. Movie Review
					<span class="date">2023</span>
				</a>
				<Battery percentage={routeCompletion['/mario']} />
			</li>
		</ul>


		<div class = 'title' id = 'videos'>
			<h2> Videos </h2>
			<p> A few videos I appear in. </p>
		</div>

		<div class = 'row'>
			<div class = 'video'>
				<iframe width="560" height="315" src="https://www.youtube.com/embed/stjPRf0Iogg?si=Jz-rUe4w8KKS6pYv" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
				<p class = 'caption'> This is John's video, but I appear at around the <b>7:32</b> mark!</p>
			</div>
			<div class = 'video'>
				<iframe width="560" height="315" src="https://www.youtube.com/embed/yHSWJty8QgI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
				<p class = 'caption'> My personal game portfolio video </p>
			</div>
		</div>



	</div>
</main>

<style lang="scss">

	@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Geist:wght@100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
	@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,200..900;1,200..900&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Geist:wght@100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
	@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Serif+Text:ital@0;1&display=swap');

	$default: 'DM Sans', 'Inter', sans-serif;

	main {
		padding-bottom: 280px;
	}

	.grid{
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 24px 40px;
		margin: 40px 0;

		.video{
			width: 100%;
			margin-bottom: 24px;
			video{
				width: 100%;
				border-radius: 8px;
				box-shadow: -4px 16px 32px rgba(black, .12);
			}
			h4{
				margin: 24px 0 6px 0;

				font-size: 24px;
				font-weight: 700;
				letter-spacing: -1px;

				span{
					font-size: 16px;
					font-weight: 700;
					letter-spacing: -.5px;
					color: rgba(black, .4);
					margin-right: 4px;
					margin-left: 1px;
				}
			}
			p{
				font-size: 20px;
				font-weight: 500;
				letter-spacing: -.6px;
				color: rgba(black, .4);
				margin: 0;
				a{
					color: rgba(black, .5) !important;
				}
			}
		}
		
	}

	nav {
		z-index: 10;
		position: fixed;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		border-radius: 28px;
		height: 72px;
		background: rgba(black, .9);
		border: 1px solid rgba(white, .1);
		backdrop-filter: blur(16px);
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px;
		overflow: hidden;
		box-shadow: -12px 32px 60px rgba(black, .9);
	}

	.row{
		display: flex;
		gap: 24px;
		margin: 40px 0;
		.video{
			flex: 1;
			iframe{
				aspect-ratio: 18/9;
				width: 100%;
				border-radius: 8px;
				box-shadow: -4px 18px 40px rgba(black, .2);
			}
		}
		.caption{
			margin-top: 16px;
		}
	}

	.indicator {
		position: absolute;
		top: 6px;
		bottom: 8px;
		background: rgba(white, .2);
		border-radius: 22px;
		transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 0;
		border: 1.5px solid rgba(white, .05);
		box-shadow: -4px 36px 40px rgba(#030025, .75), inset -1px -2px 4px rgba(black, .05);
		height: calc(100% - 16px);
	}

	.battery{
		display: flex;
		align-items: center;
		gap: 12px;
		h3{
			font-size: 16px;
			font-weight: 600;
			letter-spacing: -.5px;
			margin: 0;
		}
	}


	.navbtn {
		position: relative;
		z-index: 1;
		background: transparent;
		border: none;
		border-radius: 40px;
		padding: 12px 16px;
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: $default;
		font-size: 14px;
		font-weight: 600;
		color: rgba(white, .6);
		white-space: nowrap;
		box-shadow: none;
		width: 80px;
		display: flex;
		flex-direction: column;

		.icon {
			font-size: 20px;
			line-height: 1;
			
		}

		.label {
			font-size: 14px;
			font-weight: 500;
			letter-spacing: -.3px;
			color: white;
			transition: color 0.2s ease;
		}

		&:hover {
			color: rgba(#030025, .9);
		}

		&.active {
			color: #030025;
		}
	}

	.logo {
		margin: 8px 0;
		height: 120px;
		filter: drop-shadow(-2px 4px 8px rgba(black, .05));
		&.horizontal {
			height: 80px;
		}
	}

	.elem {
		display: flex;
		gap: 60px;

		.header {
			flex: 1;
			margin: 48px 0 12px 0;
			flex-shrink: 0;
		}

		.space {
			width: 440px;
			margin: 40px auto;
			padding: 12px;
			border-radius: 8px;
			background: white;
			height: fit-content;
			box-shadow: -12px 24px 60px rgba(black, .1), inset -2px -4px 6px rgba(black, .05);
		}
	}

	.flex {
		width: 90%;
		display: flex;
		flex-wrap: wrap;
		justify-content: left;
		gap: 40px;
		margin: 60px 0 100px 0;
		.icon {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 8px;
			.app {
				width: 150px;
				border: 5px solid rgba(white, .9);
				border-radius: 40px;
				filter: drop-shadow(-4px 16px 16px rgba(black, .05));
				transition: .2s ease;
				&:hover {
					transform: translateY(-4px);
				}
			}
			h4 {
				font-weight: 600;
				font-size: 20px;
				letter-spacing: -.7px;
				margin: 12px;
				text-align: center;
			}
		}
	}

	.mast {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 18px;
		margin: 24px 0 120px 0;

		img {
			width: 160px;
			border-radius: 4px;
			border: 1px solid white;
		}
	}

	.container {
		padding: 100px 0 0px 0;
		max-width: 1000px;
		margin: auto;
	}

	a {
		color: black;
		font-weight: 600;
		border-bottom: none;

		&:hover {
			color: #5200FF;
		}
	}

	.title {
		margin: 200px 0 80px 0;
		box-sizing: border-box;

		width: 70%;


		h2 {
			font-family: 'Crimson Pro', sans-serif;
			font-size: 44px;
			font-weight: 400;
			letter-spacing: -1.25px;
			line-height: 1;
			margin-bottom: 8px;
			color: #030025;
		}

		p{
			font-family: 'Crimson Pro', sans-serif;
			text-align: left;
			font-size: 36px;
			font-weight: 400;
			letter-spacing: -1.5px;
			line-height: 100%;
			margin: 0;
			color: rgba(#030025, .5);;
		}
	}

	h1 {
		font-family: 'Crimson Pro', sans-serif;
		text-align: left;
		font-size: 52px;
		font-weight: 400;
		letter-spacing: -2.5px;
		line-height: 90%;
		margin-bottom: 32px;
		color: #030025;

		a{
			border-bottom: 4px solid rgba(black, .15);
		}
	}


	h3 {
		font-family: $default;
		font-size: 30px;
		font-weight: 700;
		letter-spacing: -1.5px;
		line-height: 1.5;
		margin-bottom: 0px;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 0px;
		.date{
			font-size: 20px;
			font-weight: 700;
			letter-spacing: -.8px;
			color: rgba(black, .4);
			margin-right: 4px;
			margin-left: 1px;
		}
	}

	.banner {
		width: 100%;
		border-radius: 4px;
	}

	.noud {
		border: none;
	}

	.tags {
		margin: 24px 0 24px 0;
		display: flex;
		flex-wrap: wrap;
		gap: 12px 8px;
		border-bottom: none;
		.tag {
			background: rgba(black, .1);
			color: black;
			font-weight: 400;
			border-radius: 40px;
			padding: 10px 16px;
			width: fit-content;
			display: flex;
			align-items: center;
			gap: 8px;
			transition: .2s ease;

			.arrow_top_right{
				height: 14px;
			}

			&.stan {
				background: #6355FF;
				h2 {
					font-weight: 700;
					color: white;
				}
			}
			&.naver {
				background: #00D05C;
				h2 {
					font-weight: 700;
					color: white;
				}
			}
			&.link{
				background: black;
				h2{
					color: white;
					border: none;
				}
			}
			&.notion{
				background: #f0f0f0;
			}
			img {
				height: 18px;
			}
			h2 {
				color: black;
				font-family: 'DM Sans', sans-serif;
				font-weight: 600;
				font-size: 16px;
				margin: 0;
				letter-spacing: -.3px;
				white-space: nowrap;
			}
			&:hover {
				transform: translateY(-2px);
			}
		}
	}



	p, li {
		font-family: $default;
		font-size: 16px;
		font-weight: 400;
		letter-spacing: -.3px;
		line-height: 1.5;
		margin: 0;
		color: #030025;
		list-style: none;
		width: fit-content;
		span {
			font-family: $default;
			font-size: 16px;
			color: rgba(#030025, .4);
			font-weight: 600;
			margin-left: 2px;
			letter-spacing: -.4px;
		}
		a {
			width: fit-content;

			border-bottom: 1.5px solid rgba(black, .1);
		}
	}

	p {
		margin: 12px 0;
		line-height: 1.3;
	}

	li {
		font-size: 20px;
		letter-spacing: -.75px;
		margin: 4px 0;
		display: flex;
		align-items: center;
		gap: 12px;
		justify-content: space-between;
		
		a {
			flex: 1;
		}
		
		:global(.battery) {
			flex-shrink: 0;
			opacity: 0.7;
			transition: opacity 0.2s ease;
		}
		
		&:hover :global(.battery) {
			opacity: 1;
		}
	}

	ul {
		padding-inline-start: 0px;
	}

	@media (max-width: 768px) {
		main {
			padding-bottom: 100px;
		}

		.container {
			width: 100%;
			box-sizing: border-box;
			padding: 20px 16px 0 16px;
		}

		nav {
			bottom: 8px;
			height: 56px;
			padding: 3px;
			gap: 2px;
			border-radius: 28px;
		}

		.navbtn {
			padding: 8px 10px;
			width: 60px;
			font-size: 12px;

			.icon {
				font-size: 16px;
			}

			.label {
				font-size: 11px;
			}
		}

		.indicator {
			top: 6px;
			bottom: 6px;
			height: calc(100% - 12px);
		}

		.mast {
			flex-direction: column;
			align-items: flex-start;
			margin: 24px 0 60px 0;
			gap: 24px;

			img {
				width: 120px;
			}
		}

		.expo {
			h1 {
				font-size: 32px;
				letter-spacing: -1.5px;
				margin-bottom: 24px;
			}

			p {
				font-size: 18px;
				letter-spacing: -0.5px;
			}
		}

		.flex {
			width: 100%;
			gap: 24px;
			margin: 40px 0 60px 0;

			.icon {
				.app {
					width: 100px;
					border-radius: 24px;
				}

				h4 {
					font-size: 14px;
					margin: 8px;
				}
			}
		}

		.flex .battery {
			flex-direction: column;
			align-items: flex-start;
			gap: 16px;
		}

		.battery {
			h3 {
				font-size: 14px;
			}
		}

		.title {
			margin: 120px 0 40px 0;
			width: 100%;

			h2 {
				font-size: 32px;
				letter-spacing: -1px;
			}

			p {
				font-size: 20px;
				letter-spacing: -0.8px;
				margin-top: 8px;
			}
		}

		.grid {
			grid-template-columns: 1fr;
			gap: 24px;
			margin: 24px 0;

			.video {
				margin-bottom: 16px;

				h4 {
					font-size: 18px;
					margin: 16px 0 6px 0;

					span {
						font-size: 14px;
					}
				}

				p {
					font-size: 14px;
				}
			}
		}

		.row {
			flex-direction: column;
			gap: 24px;
			margin: 24px 0;

			.video {
				iframe {
					aspect-ratio: 16/9;
				}
			}

			.caption {
				font-size: 14px;
				margin-top: 12px;
			}
		}

		.elem {
			flex-direction: column;
			gap: 24px;

			.header {
				margin: 24px 0 12px 0;
			}

			.space {
				width: 100%;
				margin: 24px 0;
				padding: 8px;
			}
		}

		.logo {
			height: 80px;

			&.horizontal {
				height: 60px;
			}

			&.square {
				height: 80px;
			}
		}

		h3 {
			font-size: 24px;
			letter-spacing: -1px;
		}

		.title-row {
			gap: 8px;
		}

		.tags {
			margin: 16px 0;
			gap: 8px;

			.tag {
				padding: 8px 12px;

				h2 {
					font-size: 14px;
				}

				img {
					height: 14px;
				}
			}
		}

		p, li {
			font-size: 14px;

			span {
				font-size: 14px;
			}
		}

		li {
			font-size: 16px;
			letter-spacing: -0.5px;
			margin: 6px 0;
		}

		.expo {
			p {
				margin: 12px 0;
			}
		}
	}
</style>