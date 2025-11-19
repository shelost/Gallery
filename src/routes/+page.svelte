<script>

</script>


<main>


	<div class="container">

		<div class = 'mast'>

			<img src = 'heewon9.png' alt = 'Heewon' />

			<div class = 'expo'>
				<h1>Heewon Ahn</h1>

				<a>
					<h3> A Wandering Webdev </h3>
				</a>
			</div>
			
	</div>
	
	<p>
		Hi! I'm Heewon.  <br> <br>
		Currently, I'm interested in building a new <a href="https://x.com/karpathy/status/1917920257257459899?lang=en">UI paradigm</a> for generative AI applications. <br> <br>
		I believe the future of the web will not be contained in &lt;div&gt;s and grid layouts, but in a more ephemeral & magical interface that fully captures the capabilities of modern agentic technologies. <br> <br>
		Let's collaborate! Reach out anytime at <a href="mailto:shelost.off@gmail.com">shelost.off@gmail.com</a>.
	</p>


	<div class = 'header'>	
		<h2> 
			Experience
		</h2>
	</div>

	<ul> 
		<li> 
			<a href="https://www.stan.store">Stan</a> — I was the first designer @ Stan, helping to build the future of work.
		</li>
	</ul>

	<div class = 'header'>
		<h2> 
			Research
		</h2>
		<h3>
			While in school, I worked on solving the ARC challenge with <a href="https://www.cs.cornell.edu/~ellisk/">Prof. Kevin Ellis</a>.
		</h3>
	</div>

	<ul> 
		<li>	
		<a href="/marc">MARC</a> — an unfinished research dataset, based on ARC.
		</li>
		<li>
			<a href="https://shelost.github.io/arcaide2">Arcaide</a> — an ARC annotation web tool.
		</li>
	</ul>

	<div class = 'header'>	
		<h2> 
			Games
		</h2>
	</div>

	<ul> 
		<li>
			<a href="/platformr">Platformr</a> — a 2D platformer game, with a twist.
		</li>
		<li>
			<a href="https://shelost.github.io/wordchain">Wordchain</a> — a timed vocabulary brain game.
		</li>
		<li>
			<a href="https://shelost.github.io/11rooms">11 Rooms</a> — a mini Zelda-like RPG.
		</li>
		<li>
			<a href="https://shelost.github.io/orbiting">Just Orbiting By</a> — fun with circles.
		</li>
	</ul>

	<div class = 'header'>
		<h2> Comics </h2>
	</div>

	<ul> 
		<li>
			<a href="/pandemonium">Pandemonium</a> — my first chapter
		</li>
		<li>
			<a href="/kingdom">Kingdom</a> — concept art for a historical adventure series
		</li>
	</ul>

	<div class = 'header'>
		<h2> Blog </h2>
	</div>

	<ul> 
		<li>
			<a href="/palace">
				The AI Palace Economy
				<span class = 'date'>2025</span>
			</a>
		</li>
		<li>
			<a href="/persia">
				The Roman-Persian Wars
				<span class = 'date'>2025</span>
			</a>
		</li>
		<li>
			<a href="/timeline">
				The Civilization Timeline
				<span class = 'date'>2024</span>
			</a>
		</li>
		<li>
			<a href="/mario">
				The Super Mario Bros. Movie Review
				<span class = 'date'>2023</span>
			</a>
		</li>
	</ul>

	<div class = 'header'>	
		<h2> 
			Random
		</h2>
	</div>

	<ul> 
		<li> 
			<a href="https://www.sketchdreamer.com/canvas">AI Canvas</a> — realtime AI image generation, based on Tldraw's <a href="https://drawfast.tldraw.com/">Drawfast</a>
		</li>
		<li> 
			<a href="https://www.sketchdreamer.com/phone">iPhone 3D Creator </a> — a helper tool for UX designers
		</li>
		<li>
			<a href="https://tryorange.vercel.app/">Orange</a> — morphing HTML Canvas shapes
		</li>
		<li>
			<a href="https://dido-ui.vercel.app/">Dido UI</a> — a minimalistic UI library
		</li>
		<li>
			<a href="https://mathwsteve.web.app/">Math With Steve</a> — a website for my HS precalc teacher
		</li>
	</ul>

</div>



</main>


<style lang="scss">

	main{
	
	}

	.mast{
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 18px;
		img{
			width: 64px;
			border-radius: 2px;
			box-shadow: -4px 8px 16px rgba(#030025, .15);
		}
	}

	.container{
		padding: 60px 0 100px 0;
		max-width: 600px;
		margin: auto;
	}

	a{
		color: #6355FF;
		font-weight: 600;
		&:hover{
			color: #5200FF;
		}
	}

	.header{
		margin: 40px 0 16px 0;
	}

	h1{
		font-family: 'Hedvig Letters Serif', sans-serif;
		text-align: left;
		font-size: 28px;
		font-weight: 650;
		letter-spacing: -.2px;
		line-height: 130%;
		margin-bottom: 3px;
		color: #030025;
	}

	h2{
		font-family: 'Instrument Serif', sans-serif;
		font-size: 28px;
		font-weight: 400;
		letter-spacing: -.25px;
		line-height: 130%;
		//margin: 40px 0 4px 0;
		margin: 0 0 8px 0;
		color: #030025;
	}

	h3{
		font-family: "Hedvig Letters Serif", 'Newsreader', sans-serif;
		font-size: 14px;
		font-weight: 400;
		letter-spacing: -.2px;
		line-height: 1.5;
		margin-bottom: 0px;
	}

	p, li{
		font-family: "Hedvig Letters Serif", 'Newsreader', sans-serif;
		font-size: 14px;
		font-weight: 100;
		letter-spacing: -.2px;
		line-height: 1.5;
		margin: 48px 0;
		color: #030025;
		span{
			font-family: "Hedvig Letters Serif", 'Newsreader', sans-serif;
			font-size: 14px;
			color: rgba(#030025, .4);
			margin-left: 2px;
		}
		a{
			//letter-spacing: -0.4px;
		}
	}

	li{
		margin: 4px 0;
	}

	ul{
		padding-inline-start: 18px;
	}

	@media (max-width: 768px) {
		.container{
			width: 100%;
			box-sizing: border-box;
			padding: 40px 20px;
		}
	}

</style>