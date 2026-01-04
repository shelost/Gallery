<script>

	import Gallery from '$lib/components/Gallery.svelte'

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
		{url: 'MARC-1', caption: ''}
	]

</script>


<main>


	<div class="container">

		<div class = 'mast'>

	
			<div class = 'expo'>
				<img src = 'smiley.png' alt = 'Smiley' class = 'avatar'>
				<h1>
					Hi! My name is Heewon. <br>

					I'm a <a href = '/design'>designer</a>, <a href = '/code'>engineer </a>, and occasional <a href = '/comics'>artist. </a>
				</h1>
			</div>
			
	</div>
	
	<p>
		Currently, I'm interested in building a new <a href="https://x.com/karpathy/status/1917920257257459899?lang=en">UI paradigm</a> for generative AI applications. <br> <br>
		Let's collaborate! Reach out anytime at <a href="mailto:shelost.off@gmail.com">shelost.off@gmail.com</a>.
	</p>


	<div class = 'title'>	
		<h2> 
			Experience
		</h2>
	</div>

	<ul> 
		<div class = 'elem'>
			<div class = 'header'>
				<h3> Stan </h3>
				<p>
					I was the <b>Founding Designer @ Stan, </b> collaborating with Creators to build the future of work.
					
				</p>
				<p>
					Stan allows you to set up a custom mobile store in minutes,
					allowing you to focus on what you do best (Creating!) while we take care of the business logistics.
				</p>
				<p>
					We scaled from <b>0 to $30M ARR </b> in 3 years, led by the mega duo of John & Vitalii.
				</p>
				<div class = 'tags'>
					<a href = 'https://stan.store' class = 'noud'>
						<div class = 'tag stan'>
							<h2> Homepage </h2>
						</div>
					</a>
					<a href = 'https://gmv.stan.store' class = 'noud'>
						<div class = 'tag'>
							<h2> GMV (Live) </h2>
						</div>
					</a>
				</div>
			</div>
			<div class = 'space'>
				<img class = "banner" src="stan4.svg" alt="">
			</div>
		</div>
	</ul>

	<div class = 'title'>
		<h2> 
			Research
		</h2>
		<p>
			While in school, I worked on solving the ARC challenge with <a href="https://www.cs.cornell.edu/~ellisk/">Prof. Kevin Ellis</a>.
		</p>
	</div>

	<ul> 

		
			<div class = 'elem'>
				<div class = 'header'>
					<h3>MARC</h3>
					<p>
						The Markings Analysis & Reasoning Corpus (MARC) is a visual reasoning dataset, inspired by François Chollet's <a href = 'https://arcprize.org/arc-agi'> ARC Challenge. </a>
						Instead of grid-based datasets, it consists of stroke- and drawing-based data.
					</p>
				</div>
				<a href = 'https://shelost.github.io/arcaide2/'>
					<div class = 'space'>
						<Gallery images = {marc} col = 1 />
					</div>
				</a>
			</div>
	


		<a href = 'https://shelost.github.io/arcaide2/'>
			<div class = 'elem'>
				<div class = 'header'>
					<h3>Arcaide</h3>
					<p>
						An extremely cleverly named ARC annotation web tool, which generates JSON files with specially annotated objects from raw ARC data.
					</p>
				</div>
				<div class = 'space'>
					<img class = 'banner' src = 'arcaide.png' >
				</div>
			</div>
		</a>

	</ul>

	<div class = 'title'>	
		<h2> 
			Games
		</h2>
	</div>

	<div class = 'flex'>

		<a href = 'https://shelost.github.io/platformr' class = 'noud'>
			<div class = 'icon'>
				<img class = 'app' src = 'icon-platformr.png' alt = ''>
				<h4> Platformr </h4>
			</div>
		</a>

		<a href = 'https://shelost.github.io/11rooms' class = 'noud'>
			<div class = 'icon'>
				<img class = 'app' src = 'icon-rooms.png' alt = ''>
				<h4> 11 Rooms </h4>
			</div>
		</a>

		<a href = 'https://shelost.github.io/orbiting' class = 'noud'>
			<div class = 'icon'>
				<img class = 'app' src = 'icon-orbiting.png' alt = ''>
				<h4> Just Orbiting By </h4>
			</div>
		</a>

		<a href = 'https://shelost.github.io/wordchain' class = 'noud'>
			<div class = 'icon'>
				<img class = 'app' src = 'icon-wordchain.png' alt = ''>
				<h4> Wordchain </h4>
			</div>
		</a>

	</div>

	<div class = 'title'>
		<h2> Comics </h2>
	</div>

	<ul> 


			<div class = 'elem'>
				<div class = 'header'>
					<a href="/pandemonium">
						<h3>Pandemonium</h3>
					</a>
					<p>
						This was my first real comics chapter, based on a combination of classic Eastern novels such as "Three Kingdoms" and "Journey to the West."
					</p>
					<p>
						I only ended up writing one chapter so far — but the full
						 <a href = "https://ahnheewon.notion.site/All-Nations-b63d9a85eb1147cd8ae4545bf0f98627?pvs=143">story outline</a> can be found below!
					</p>
					<div class = 'tags'>
						<a href = "https://comic.naver.com/challenge/detail?titleId=846439&no=1" class = 'noud'>
							<div class = 'tag naver'>
								<img src = '/naver.svg' alt = 'Naver Logo'>
								<h2> Naver Webtoon </h2>
							</div>
						</a>
						<a href = "https://ahnheewon.notion.site/All-Nations-b63d9a85eb1147cd8ae4545bf0f98627?pvs=143" class = 'noud'>
							<div class = 'tag'>
								<h2> Story Outline </h2>
							</div>
						</a>
						<a href = "/pandemonium-art" class = 'noud'>
							<div class = 'tag'>
								<h2> Character Sheets </h2>
							</div>
						</a>
					</div>
				</div>

				<a href="/pandemonium">
					<div class = 'space'>
						<Gallery images = {pandemonium[0]} col = 3 />
						<Gallery images = {pandemonium[1]} col = 2 />
						<Gallery images = {pandemonium[2]} col = 1 />
					</div>
				</a>
			</div>
	
			

		
			<div class = 'elem'>
				<div class = 'header'>
					<h3>Kingdom</h3>
					<p>
						This is my concept for a historical adventure series, loosely based on the 2009 historical K-Drama
						<a href = 'https://en.wikipedia.org/wiki/Queen_Seondeok_(TV_series)'>Queen Seondeok</a> set in 7th-century Korea.
					</p>
					<p>
						I did a lot of research for this project, which may one day materialize.
					</p>

					<div class = 'tags'>
						<a href = "https://notion.so/668-Novel-1b67696bef164e83ae68cd3cb095d33b?pvs=74&assetsVersion=23.13.20251208.1257&cookie_sync_completed=true" class = 'noud'>
							<div class = 'tag'>
								<h2> Story Outline </h2>
							</div>
						</a>
						<a href = "/kingdom" class = 'noud'>
							<div class = 'tag'>
								<h2> Concept Art</h2>
							</div>
						</a>
					</div>
				</div>
				<div class = 'space'>
					<Gallery images = {samhan[0]} col = 3 />
					<Gallery images = {samhan[1]} col = 1 />
				</div>
			</div>
	
			

	</ul>

	<div class = 'title'>
		<h2> Personal </h2>
	</div>

	<ul> 
		<li>
			<a href="/gapyear">
				My Gap Year
				<span class = 'date'>2025</span>
			</a>
		</li>
		<li>
			<a href="/anorexia">
				Anorexia
				<span class = 'date'>2025</span>
			</a>
		</li>
	</ul>

	<div class = 'title'>
		<h2> Writing </h2>
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

	<div class = 'title'>	
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

	@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Geist:wght@100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
	@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,200..900;1,200..900&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Geist:wght@100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');

	$default: 'DM Sans', 'Inter', sans-serif;

	main{
	
	}

	.flex{
		width: 90%;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		margin: 60px auto 100px auto;
		.icon{
			.app{
				width: 150px;
				border: 2px solid white;
				border-radius: 36px;
				filter: drop-shadow(-4px 16px 16px rgba(black, .15));
				transition: .2s ease;
				&:hover{
					transform: translateY(-4px);
				}
			}
			h4{
				font-family: 'Inter', sans-serif;
				font-weight: 600;
				font-size: 17px;
				letter-spacing: -.3px;
				margin: 12px;
				text-align: center;
			}
		}
	}

	.mast{
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 18px;
		margin-bottom: 32px;
		img{
			width: 120px;
			border-radius: 18px;
			border: 1px solid white;
	
		}
	}

	.container{
		padding: 60px 0 100px 0;
		max-width: 800px;
		margin: auto;
	}

	a{
		color: #6355FF;
		color: black;
		font-weight: 600;
		border-bottom: 1px solid rgba(#030025, .15);
		&:hover{
			color: #5200FF;
		}
	}

	.title{
		margin: 80px 0 16px 0;
		box-sizing: border-box;
		border-bottom: 2px solid rgba(black, .05);
	}

	.header{
		margin: 48px 0 12px 0;
	}

	.space{
		width: 80%;
		margin: 40px auto;
		padding: 24px;
		border-radius: 8px;
		background: white;
		box-shadow: -12px 24px 60px rgba(black, .1), inset -2px -4px 6px rgba(black, .05);
	}

	h1{
		font-family: 'Crimson Pro', sans-serif;
		text-align: left;
		font-size: 40px;
		font-weight: 400;
		letter-spacing: -1.5px;
		line-height: 100%;
		margin-bottom: 32px;
		color: #030025;
	}

	h2{
		font-family: 'Crimson Pro', sans-serif;
		font-size: 44px;
		font-weight: 400;
		letter-spacing: -1.25px;
		line-height: 130%;
		margin: 60px 0 8px 0;
		color: #030025;
	}

	h3{
		font-family: $default;
		font-size: 28px;
		font-weight: 600;
		letter-spacing: -1px;
		line-height: 1.5;
		margin-bottom: 0px;
	}

	.banner{
		width: 100%;
		border-radius: 8px;
	}

	.noud{
		border: none;
	}

	.tags{
		margin: 24px 0 12px 0;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		border-bottom: none;
		.tag{
			background: rgba(black, .1);
			color: black;
			font-weight: 400;
			border-radius: 40px;
			padding: 10px 16px;
			width: fit-content;
			display: flex;
			align-items: center;
			gap: 8px;
			&.stan{
				background: #6355FF;
				h2{
					font-weight: 700;
					color: white;
				}
			}
			&.naver{
				background: #00D05C;
				h2{
					font-weight: 700;
					color: white;
				}
			}
			img{
				height: 18px;
			}
			h2{
				color: black;
				font-family: 'DM Sans', sans-serif;
				font-weight: 600;
				font-size: 16px;
				margin: 0;
				letter-spacing: -.3px;
				white-space: nowrap;
			}
		}
	}

	p, li{
		font-family: $default;
		font-size: 17px;
		font-weight: 400;
		letter-spacing: -.3px;
		line-height: 1.5;
		margin: 0 0 0px 0;
		color: #030025;
		list-style: none;
		span{
			font-family: $default;
			font-size: 14px;
			color: rgba(#030025, .4);
			font-weight: 800;
			margin-left: 2px;
		}
		a{
			//letter-spacing: -0.4px;
		}
	}

	p{
		margin: 18px 0;
		line-height: 1.3;
	}

	li{
		margin: 0 0;
	}

	ul{
		padding-inline-start: 0px;
	}

	@media (max-width: 768px) {
		.container{
			width: 100%;
			box-sizing: border-box;
			padding: 40px 20px;
		}
	}

</style>