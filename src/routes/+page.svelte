<script>
	import Counter from './Counter.svelte';
	import welcome from '$lib/images/svelte-welcome.webp';
	import welcomeFallback from '$lib/images/svelte-welcome.png';
	import * as Config from '$lib/config.ts'
	import { activeElem, activeObject, themeColor } from '$lib/store'
    import { goto } from '$app/navigation';
	import { titleCase, tagIcon, Class, Id } from '$lib/utils'
	import { onMount } from 'svelte'

	export let data

	let Scroll, Bar;

	themeColor.set('f3f4f7')

	//themeColor.set('e0e0e0')

	let view = 1

	onMount(() => {
		const sections = document.querySelectorAll(".sec");

		function updateActiveSection() {

			// Update Active
			let closest = null;
			let object = null
			let minDistance = Infinity;

			sections.forEach((sec, index) => {
				const rect = sec.getBoundingClientRect();
				const distance = Math.abs(rect.top + window.innerHeight * .25);
				const dist2 = rect.top
				let height = rect.bottom - rect.top

				const inView = rect.top - 200 < window.innerHeight && rect.top + height > 0
				const hgroup = document.querySelectorAll('hgroup')[index]
				//title.innerHTML = rect.top + '<br>' + (rect.top + 100 < window.innerHeight) + '<br>' + (rect.top + height) + '<br>' + inView
				//sec.style.perspective = '800px'
				//sec.style.transform = `rotate3d(1, 0, 0,${(Math.max(0, rect.top/window.innerHeight)*90)}deg)`

				if (inView){
					//sec.style.border = '2px solid red'
					sec.style.transformOrigin = 'top center'
					//hgroup.style.transform = `perspective(800px) rotateX(${(Math.max(0, rect.top/window.innerHeight)*40)}deg) scale(1)`
				}else{
					sec.style.transform = ''
				}

				if (distance < minDistance) {
					minDistance = distance;
					closest = sec;
					object = data.posts[index]
				}
			});

			activeElem.set(closest);
			activeObject.set(object)

			if ($activeObject.meta.color){
				themeColor.set(object.meta.color)
			}else{
				themeColor.set('f3f4f7')
			}

			let rect= $activeElem.getBoundingClientRect()
			let mid = window.innerHeight/2
			let diff = mid - rect.top

			// Scrollbar

			let scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
			let scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
			let percent = (scrollTop / scrollHeight);

			if (Bar && Scroll){
				Bar.style.height = Scroll.getBoundingClientRect().height * percent + 'px'
			}
		}

		window.addEventListener("scroll", updateActiveSection);
		updateActiveSection(); // Initialize on load

		for (let i=0; i<Class('banner').length; i++){
			let div = Class('banner')[i]
			let rect = div.getBoundingClientRect()
			let mid = window.innerHeight/2
		}

		return () => window.removeEventListener("scroll", updateActiveSection);

	});

</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section id = 'app'>

	<div id = 'top'> </div>
	<div id = 'sidebar'>

	</div>

	<div id = 'scroll' bind:this={Scroll}>
		<div id = 'bar' bind:this={Bar}></div>
	</div>

	<section id = 'page'>


		<section class = 'splash'>
			<img src = 'smiley.png' id = 'logo' alt = 'Logo'>
			<h1> Heewon </h1>
			<h2> Designer + Webdev </h2>

			<div id = 'search'>
				<input placeholder = 'Search...'>
			</div>

		</section>


		<section id = 'sections' class:list={view == 2}>
		{#each data.posts as link, i}

			<section
				id = '{link.meta.title}'
				class = 'sec r{link.meta.rating} {link.meta.type}'
				>

				<hgroup class = 'hgroup'>
					<div class = 'header'>
						{#if link.meta.card}
								<img src = 'card/{link.meta.card}.png' alt = 'card' class = 'card'>
							{/if}
						<div class = 'title'>

							<h1> {link.meta.title} </h1>
							{#each link.meta.tags as tag, j}
								<div class = 'tag'>
									{#if tagIcon(tag)}
										<img src = 'icon/{tagIcon(tag)}.svg' class = 'icon' alt = 'icon'>
									{/if}
									<h2> {titleCase(tag)} </h2>
								</div>
							{/each}
						</div>
						<h2> {link.meta.description} </h2>
						<div class = 'type'>
							<h3> {link.meta.type} </h3>
						</div>
						<p> {link.meta.blurb} </p>
						<div class = 'tags'>
							{#each link.meta.categories as cat, j}
								<div class = 'tag'>
									{#if tagIcon(cat)}
										<img src = 'icon/{tagIcon(cat)}.svg' class = 'icon' alt = 'icon'>
									{/if}
									<h2> {titleCase(cat)} </h2>
								</div>
							{/each}
						</div>
					</div>

					<div class = 'top'>
						<button on:click = {() => {goto('/' + link.slug)}}>
							<h2>
								View >
							</h2>
						</button>
						<div class = 'rating'>
							<h2> {link.meta.rating} </h2>
							<div class = 'bar'>
								<div class = 'fill'>
								</div>
							</div>
						</div>
					</div>

				</hgroup>

				{#if link.meta.preview}
					<!--
					<div class = 'banner' style = 'background-image: url(bento/{link.meta.preview}.svg)'></div>
					-->
					<img src = 'bento/{link.meta.preview}.svg' class = 'banner' alt = 'banner'>
				{/if}


				<div class="prose preview prose-img">
					<svelte:component this={link.content} />
				</div>

			</section>

		{/each}
		</section>


	</section>
</section>

<style lang="scss">



	#scroll{
		position: sticky;
		top: 10px;
		width: 10px;
		height: calc(100vh - 24px);
		//height: 500px;
		margin: 8px;
		margin-right: 12px;
		background: rgba(#030025, .3);
		background: white;
		border-radius: 20px;
		//border: 1px solid rgba(white, .2);
		//box-shadow: -4px 0px 12px 2px rgba(black, .2);
		margin-top: 90vh;
		overflow: hidden;

		display: none;

		#bar{
			position: absolute;
			top: 0;
			left: 0;
			width: 10px;
			height: 36px;
			background: black;
			border-radius: 20px;
			transition: .1s ease;

			&::after{
				content: '';
				position: absolute;
				bottom: 2px;
				left: 1.5px;
				background: white;
				width: 5px;
				height: 5px;
				border-radius: 4px;
			}
		}
	}

	#app{
		display: flex;
		//width: 95vw;
		//border: 2px solid black;
	}

	#sidebar{
		width: 140px;
		height: calc(100vh - 52px);
		padding: 24px;
		position: sticky;
		top: 0;
		display: none;

		p{
			font-size: 12px;
			text-wrap: wrap;
		}
	}

	.rating{
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 24px;
		h2{
			font-size: 14px;
		}
		.bar{
			width: 100px;
			height: 8px;
			background: black;
			border-radius: 50px;
		}
	}

	input{
		font-family: 'Inter', sans-serif;
		font-weight: 500;
		letter-spacing: -.4px;
		border: none;
		background: rgba(white, .8);
		box-shadow: 8px 12px 24px rgba(#030025, .06);
		border: 2px solid white;
		width: 300px;
		padding: 12px 16px;
		border-radius: 50px;
		margin: 28px 0;
		&:focus{
			outline: none;
		}
	}


	.prose{
		height: 500px;
		overflow: hidden;
		border-radius: 8px;
		display: none;
	}

	#page{
		flex: 1;
		//border: 1px solid red;
		//transform: perspective(800px) rotateX(2deg);
	}

	#sections{
		//transform: rotate3d(10, 2, -2, 20deg);
		&.list{
			.sec{
				padding: 12px;
				hgroup{
					display: flex;
					align-items: flex-start;
					width: 100%;
					.header{
						.title{
							h1{
								font-size: 22px;
							}
						}
					}
					.top{
						margin: 0;
						padding: 0 20px;
					}
					.tags{
						margin: 0;
					}
				}
			}
			.banner{
				display: none;
			}
		}
	}

	.sec{
		padding: 0px 30px 0px 0px;
		border-radius: 8px;
		transition: .2s ease;
		width: clamp(200px, 100%, 1200px);
		margin: 12px auto;

		//background: rgba(white, .8);
		//border: 2px solid rgba(white, .5);
		//box-shadow: -20px 30px 80px rgba(black, .08);

		display: flex;
		gap: 24px;
		justify-content: left;
		transition: .2s ease;

		.banner{
			border-radius: 0px;
			width: calc(100% - 320px);
			//width: 70%;
			margin: auto;
			filter: drop-shadow(-8px 16px 32px rgba(black, .1));
			transition: .2s ease;
		}

		hgroup{
			position: sticky;
			top: 0px;


			align-self: flex-start;
			width: 180px;
			flex-shrink: 0;
			overflow: hidden;
			transition: .2s ease;

			padding: 24px;
			padding-right: 24px;
			border-radius: 8px;
			border: 2px solid white;

			background: rgba(white, 1);
			//box-shadow: -4px 12px 36px rgba(#030025, .08), inset 0 -6px 8px rgba(#030025, .02);


			.header{
				width: 100%;
				height: 100%;

				img{
					width: 100%;
					border-radius: 4px;
					margin-bottom: 18px;
				}

				.title{
					display: flex;
					align-items: center;
					gap: 12px;
					h2{
						margin: 0;
					}

				}

				h1{
					font-size: 24px;
					font-weight: 700;
					line-height: 100%;
					letter-spacing: -.7px;
					text-align: left;
					margin-bottom: 8px;
					color: rgba(#030025, .75);
				}

				h2{
					font-size: 14px;
					font-weight: 550;
					line-height: 120%;
					color: rgba(#030025, .4);
					letter-spacing: -.4px;
					text-align: left;
					margin-bottom: 20px;
				}

				h3{
					display: none;
				}

				p{
					font-size: 12px;
					font-weight: 450;
					letter-spacing: -.3px;
					margin: 12px 0;
					line-height: 140%;
					color: rgba(#030025, .6);
				}

				.tags{
					display: flex;
					flex-wrap: wrap;
					gap: 8px;
					margin: 20px 0;
					.tag{
						display: flex;
						align-items: center;
						gap: 6px;
						background: white;
						padding: 6px 8px;
						border-radius: 10px;
						box-shadow: 0 4px 12px rgba(black, .1);

						//border: 1px solid rgba(black, .1);

						transition: .2s ease;
						cursor: pointer;
						.icon{
							height: 14px;
							margin: 0;
							border-radius: 0;
						}
						h2{
							font-size: 13px;
							font-weight: 700;
							letter-spacing: -.2px;
							color: rgba(#030025, .6);
							margin: 0;
							padding: 0;
						}
						&:hover{
							box-shadow: 0 5px 12px rgba(black, .12);
							transform: translateY(-1px);
						}
					}
				}
			}

			.top{
				display: none;
				flex-direction: column;
				//align-items: flex-end;
				gap: 8px;

				margin-top: 48px;
			}

		}



		/*
		&.r4{
			.banner{
				aspect-ratio: 5/4;
			}
		}

		&.r3{

			.banner{
				aspect-ratio: 5/3;
			}
		}
		&.r2{
			.banner{
				aspect-ratio: 5/2;
			}
		}
			*/

	}

	.splash{
		height: 70vh;

		display: flex;
		flex-direction: column;
		justify-content: center;

		padding: 40px;

		#logo{
			height: 100px;
			width: 100px;
			border-radius: 50px;
			margin-bottom: 20px;
		}

		h1{
			font-size: 60px;
			font-weight: 800;
			letter-spacing: -1.8px;
			text-align: left;
		}

		h3{
			font-size: 16px;
			font-weight: 600;
			letter-spacing: -.5px;
			text-align: left;
			padding: 4px 8px;
			margin: 8px 0;
			background: white;
			border-radius: 8px;
			width: fit-content;
		}
	}

	@media screen and (max-width: 768px){

		#page{
			width: 100%;
		}

		#scroll{
			margin: 0;
		}

		.sec{
			padding: 0px;
			display: inline;

			hgroup{
				display: block;
				position: sticky;
				top: 0;
				align-self: flex-start;
				width: 100%;
				padding: 16px;


				.header{
					h1{
						font-size: 18px;
						margin-bottom: 6px;
					}
					h2{
						font-size: 14px;
					}
				}

				.top{
					display: none;
				}
			}

			.banner{
				width: 102%;
				transform: translateX(-1%);
			}
		}
	}


</style>
