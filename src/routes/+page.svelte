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
		Hi! I'm Heewon, a developer based in Ithaca, NY.  <br> <br>
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
			<a href="https://www.stan.store">Stan</a> — I was the first designer, helping to build the future of work.
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
		<a href="https://shelost.github.io/marc">MARC</a> — an unfinished research dataset, based on ARC.
		</li>
		<li>
			<a href="https://shelost.github.io/arcaide2">Arcaide</a> — an ARC annotation web tool.
		</li>
	</ul>

	<div class = 'header'>	
		<h2> 
			Games
		</h2>
		<h3>
			I enjoyed making Javascript games in high school.
		</h3>
	</div>

	<ul> 
		<li>
			<a href="https://shelost.github.io/platformr">Platformr</a> — a 2D platformer game, with a twist.
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
		<h3>
			My life goal is to finish my comic masterpiece someday — if I had one!
		</h3>
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
		<h3>
			Thoughts on the most important issues of our time.
		</h3>
	</div>

	<ul> 
		<li>
			<a href="https://chancellorax.substack.com/p/so-i-just-saw-the-super-mario-bros">The Super Mario Bros. Movie Review</a> 
		</li>
		<li>
			<a href="/persia">The Roman-Persian War and its Implications on Geopolitical Conflict in the 21st Century</a>
		</li>
		<li>
			<a href="/palace">The Future of the AI Economy, or the Great Orb</a>
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
		font-family: 'Hedvig Letters Serif', sans-serif;
		font-size: 20px;
		font-weight: 600;
		letter-spacing: -0px;
		line-height: 130%;
		//margin: 40px 0 4px 0;
		margin: 0 0 8px 0;
		color: #030025;
	}

	h3{
		font-size: 15px;
		font-weight: 400;
		letter-spacing: -0.3px;
		line-height: 130%;
		margin-bottom: 0px;
	
	}

	p{
		font-size: 15px;
		font-weight: 400;
		letter-spacing: -0.25px;
		line-height: 130%;
		margin: 48px 0;
		color: #030025;
		a{
			letter-spacing: -0.4px;
		}
	}

	ul{
		padding-inline-start: 18px;
	}


	li{
		font-size: 15px;
		font-weight: 400;
		letter-spacing: -0.25px;
		line-height: 130%;
		margin: 4px 0;
		color: #030025;
		a{
			letter-spacing: -0.4px;
		}
	}

	@media (max-width: 768px) {
		.container{
			width: 100%;
			box-sizing: border-box;
			padding: 40px 20px;
		}
	}

</style>