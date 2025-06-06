<script>
	import Counter from './Counter.svelte';
	import Navbar from './Navbar.svelte';
	import welcome from '$lib/images/svelte-welcome.webp';
	import welcomeFallback from '$lib/images/svelte-welcome.png';
	import * as Config from '$lib/config.ts'
	import SmartImage from '$lib/components/SmartImage.svelte'
	import { activeElem, activeObject, themeColor, loading, openDrawer, expandedPost } from '$lib/store'
    import { goto } from '$app/navigation';
	import { titleCase, tagIcon, Class, Id } from '$lib/utils'
	import { onMount } from 'svelte'
	import { writable } from 'svelte/store'
	import NumberFlow, { continuous } from '@number-flow/svelte'
	import {
		blur,
		crossfade,
		draw,
		fade,
		fly,
		scale,
		slide,
	} from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	// Variables

	export let data

	let Scroll, Bar, App, Flex, Pill, Drawer;
	let sections, previews
	let splash = writable(false)
	let view = writable(2)
	let val = 0

	let Click;

	themeColor.set('f3f4f7')

	function typeDisplay(str){
		switch(str){
			case 'comic':
				return {title: 'Comics', icon: 'comic', description: "I've been getting into drawing comics as a hobby."}
			case 'game':
				return {title: 'Games', icon: 'game', description: 'I sometimes make JavaScript <canvas> games.'}
			case 'design':
				return {title: 'Products', icon: 'design', description: 'I do Product Design work for startups.'}
			case 'gallery':
				return {title: 'Design', icon: 'gallery', description: "I've dabbled in graphic design."}
			default:
				return {title: titleCase(str), icon: str, description: 'Hello'}
		}
	}

</script>

<svelte:head>
	<!-- Resource hints for performance -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

	<!-- Preload critical assets -->
	<link rel="preload" href="heewon8.png" as="image" />

	<!-- Prefetch optimized image formats -->
	<link rel="prefetch" as="image" type="image/webp" />

</svelte:head>



<section id = 'app' bind:this={App} class:offset={$openDrawer}>

	<section class = 'splash' >

		<div class = 'screen'>

			<img src="heewon8.png" id="heewon" alt="Logo" width="200" height="67" fetchpriority="high"
				in:fly={{y: 50, duration: 600, delay: 0}} />
			<div class = 'expo'>

				<h1>
					<i>Hi!</i> I'm Heewon.
				</h1>
				<p>
					I have a lot of random interests.
				</p>
				<p>

				</p>
				<p >
					Let's work together! You can reach me at <a href = 'mailto:shelost.off@gmail.com'>shelost.off@gmail.com</a>.
				</p>

			</div>

		</div>

	</section>

	<div id = 'flex' bind:this={Flex} class = 'view{$view}'>

		<div id = 'featured'>

			<a href = 'https://opal.computer' target = '_blank'>
				<div class = 'featured'>
					<div class = 'logo'>
						<svg width="810" height="379" viewBox="0 0 810 379" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M725.653 305C725.292 305 725 304.708 725 304.347V304.347C725 304.271 725.013 304.195 725.039 304.123C731.019 287.652 735.4 273.428 735.4 240.082V89.5025C735.4 58.8858 729.444 41.233 713.182 24.008C713.066 23.8856 713 23.7223 713 23.5539V23.5539C713 23.2556 713.201 22.9948 713.489 22.9185L793.922 1.65925C797.094 0.820945 800.2 3.21266 800.2 6.49325V240.082C800.2 272.278 804.979 287.647 810.961 304.123C810.987 304.195 811 304.271 811 304.347V304.347C811 304.708 810.708 305 810.347 305H725.653Z" fill="white"/>
							<path d="M575.937 312C549.537 312 528.737 297.6 528.737 269.2C528.737 224.471 583.2 203.19 629.973 192.855C632.282 192.344 633.937 190.307 633.937 187.942V174C633.937 149.6 623.537 138.4 594.337 138.4C578.391 138.4 560.643 141.644 543.146 148.815C541.514 149.483 539.625 148.932 538.647 147.465V147.465C537.751 146.122 537.841 144.348 538.899 143.129C559.06 119.905 591.605 98.4004 634.337 98.4004C678.737 98.4004 699.137 121.2 699.137 155.2V248.8C699.137 273.601 707.6 279.2 720.8 279.2C726.022 279.2 731.624 275.26 733.647 265.843C734.195 263.292 736.313 261.268 738.922 261.268H741.3C744.868 261.268 747.437 264.945 746.392 268.357C740.93 286.188 732.259 317.8 689.8 316.5C668.937 316.5 651.937 304.589 643.968 290.169C641.833 286.307 635.398 285.116 632.277 288.235C619.007 301.503 597.922 312 575.937 312ZM585.537 248.8C585.537 264 595.537 274.8 613.137 274.8C620.303 274.8 626.886 272.763 631.646 270.178C633.115 269.38 633.937 267.796 633.937 266.124V210.712C633.937 207.365 630.705 204.963 627.547 206.073C600.715 215.502 585.537 230.599 585.537 248.8Z" fill="white"/>
							<path d="M313.726 379.5C313.154 379.5 312.69 379.037 312.69 378.465V378.465C312.69 378.356 312.709 378.243 312.743 378.139C319.511 357.506 323.49 358.705 323.49 322V207.5C323.49 175.927 327.686 133.159 311.469 111.66C311.043 111.095 310.8 110.414 310.8 109.707V109.707C310.8 108.155 311.944 106.84 313.48 106.626L380.999 97.1953C384.006 96.7753 386.69 99.1108 386.69 102.147V128.729C386.69 129.688 387.396 130.501 388.345 130.637V130.637C389.05 130.738 389.749 130.443 390.178 129.875C402.322 113.804 424.085 98.4004 455.09 98.4004C503.49 98.4004 535.09 139.2 535.09 199.6C535.09 262.4 498.29 312 425.89 312C414.071 312 403.782 310.725 394.819 308.581C391.548 307.798 388.29 310.206 388.29 313.57V322.4C388.29 357.506 391.871 357.5 399.032 378.132C399.07 378.24 399.09 378.358 399.09 378.473V378.473C399.09 379.04 398.631 379.5 398.063 379.5H313.726ZM425.09 300.4C453.49 300.4 467.49 266 467.49 214C467.49 157.2 451.49 133.6 419.89 133.6C407.85 133.6 398.139 137.261 390.454 142.155C389.078 143.031 388.29 144.572 388.29 146.204V237.6C388.29 283.2 405.49 300.4 425.09 300.4Z" fill="white"/>
							<path d="M155.6 311.999C69.6 311.999 0 245.999 0 159.999C0 73.9992 69.6 7.19922 155.6 7.19922C241.6 7.19922 311.6 73.9992 311.6 159.999C311.6 245.999 241.6 311.999 155.6 311.999ZM155.6 298.799C208.8 298.799 233.6 244.799 233.6 159.999C233.6 75.1992 209.2 20.7992 155.6 20.7992C102 20.7992 78 75.5992 78 159.999C78 244.399 102.4 298.799 155.6 298.799Z" fill="white"/>
							<defs>
							<clipPath id="clip0_2880_4274">
							<rect width="810" height="379" fill="white"/>
							</clipPath>
							</defs>
						</svg>
					</div>
					<div class = 'expo'>
						<h3> Design Software </h3>
					</div>
				</div>
			</a>
			<a href = 'https://chancellorax.substack.com' target = '_blank'>
				<div class = 'featured'>
					<div class = 'logo'>
						<svg width="1381" height="300" viewBox="0 0 1381 300" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M1277.26 263.467V262.863C1281.18 249.878 1282.69 239.61 1282.69 217.565V166.528C1282.69 147.503 1279.07 136.631 1272.12 126.364V125.76L1313.19 110.66V145.993C1322.86 133.611 1334.33 110.358 1352.75 111.868L1352.15 147.805H1351.24C1346.41 145.691 1337.96 143.577 1330.71 143.577C1324.07 143.577 1318.33 146.899 1314.1 152.033V217.867C1314.1 239.006 1315.01 249.878 1318.93 262.863V263.467H1277.26Z" fill="white"/>
							<path d="M1215.45 267.999C1186.16 267.999 1161.7 233.572 1161.7 190.387C1161.7 147.203 1186.16 112.172 1215.45 112.172C1244.44 112.172 1269.21 147.203 1269.21 190.387C1269.21 233.572 1244.44 267.999 1215.45 267.999ZM1215.45 262.865C1232.36 262.865 1236.29 233.572 1236.29 190.387C1236.29 147.203 1232.06 117.608 1215.45 117.608C1198.54 117.608 1194.31 147.203 1194.31 190.387C1194.31 233.572 1198.54 262.865 1215.45 262.865Z" fill="white"/>
							<path d="M1115.32 263.464V262.86C1118.04 253.498 1120.15 244.741 1120.15 224.809V78.646C1120.15 61.4325 1116.53 51.4669 1109.58 42.1052V41.5012L1151.26 28.5156V224.809C1151.26 244.137 1153.67 253.8 1156.69 262.86V263.464H1115.32Z" fill="white"/>
							<path d="M1065.62 263.464V262.86C1068.34 253.498 1070.45 244.741 1070.45 224.809V78.646C1070.45 61.4325 1066.83 51.4669 1059.88 42.1052V41.5012L1101.56 28.5156V224.809C1101.56 244.137 1103.98 253.8 1107 262.86V263.464H1065.62Z" fill="white"/>
							<path d="M1030.61 242.028C1044.19 242.028 1052.95 232.364 1058.99 221.794L1060.5 222.398C1054.76 248.067 1038.46 267.999 1015.51 267.999C985.911 267.999 967.188 235.082 967.188 192.199C967.188 145.391 990.743 112.172 1017.62 112.172C1044.5 112.172 1060.5 145.391 1060.2 175.59L998.292 174.986C998.896 224.512 1011.88 242.028 1030.61 242.028ZM1016.11 117.608C1004.33 117.608 998.292 142.069 998.292 169.852L1029.7 168.946V160.49C1029.7 129.989 1025.17 117.608 1016.11 117.608Z" fill="white"/>
							<path d="M963.446 223.304L964.654 223.908C959.822 248.973 945.629 267.999 923.885 267.999C895.498 267.999 877.379 237.196 877.379 194.011C877.379 145.089 901.84 112.172 936.267 112.172C945.629 112.172 953.782 114.286 958.614 115.796L961.03 149.317L958.916 149.921C949.555 136.331 936.267 117.608 927.509 117.608C918.752 117.608 909.692 137.237 909.692 175.59C909.692 219.076 920.865 241.122 939.287 241.122C950.461 241.122 958.916 233.27 963.446 223.304Z" fill="white"/>
							<path d="M761.997 263.467V262.863C765.621 249.576 767.433 239.006 767.433 216.357V166.226C767.131 147.201 763.809 136.631 756.863 126.364V125.76L797.934 110.66V137.537L798.84 137.839C804.88 126.062 816.053 112.17 834.475 112.17C852.594 112.17 865.278 125.458 865.278 149.919V216.357C865.278 238.704 866.486 249.576 870.412 262.863V263.467H829.039V262.863C832.663 249.576 833.871 238.402 833.871 216.659V153.543C833.871 141.161 829.643 134.517 818.167 134.517C810.315 134.517 803.068 137.839 798.84 144.785V216.659C798.84 238.402 800.048 249.576 803.672 262.863V263.467H761.997Z" fill="white"/>
							<path d="M681.579 267.999C667.99 267.999 655.004 258.939 655.004 239.008C655.004 207.601 685.505 191.897 710.872 185.555V157.47C710.872 142.673 705.738 135.123 690.639 135.123C680.371 135.123 669.197 139.351 661.044 146.297L660.138 144.485C669.801 127.573 686.713 112.172 709.362 112.172C732.313 112.172 742.279 128.479 742.279 150.525V234.176C742.279 241.122 744.695 246.557 750.735 246.557C753.755 246.557 756.473 245.35 759.492 242.632L760.096 243.538C757.379 252.295 750.433 267.395 733.521 267.395C721.14 267.395 713.59 258.335 711.778 246.255C706.342 257.429 696.075 267.999 681.579 267.999ZM683.693 225.418C683.693 238.706 689.431 245.652 698.792 245.652C703.926 245.652 708.154 244.142 710.872 241.726V190.689C695.169 196.427 683.693 207.903 683.693 225.418Z" fill="white"/>
							<path d="M539.915 263.464V262.86C543.237 249.874 545.049 239.607 545.049 217.561V78.646C545.049 61.4325 541.727 51.4669 534.781 42.1052V41.5012L576.456 28.5156V137.232C582.798 125.756 593.971 112.167 612.091 112.167C630.21 112.167 642.894 125.454 642.894 149.916V217.561C642.894 239.305 644.102 249.874 648.028 262.86V263.464H606.655V262.86C610.279 249.874 611.487 239.003 611.487 217.863V153.54C611.487 141.158 606.957 134.514 595.783 134.514C587.931 134.514 580.684 137.836 576.456 144.782V217.863C576.456 239.003 577.966 249.874 581.59 262.86V263.464H539.915Z" fill="white"/>
							<path d="M531.483 196.73L528.765 255.014C522.423 258.94 504.002 267.999 483.466 267.999C438.168 267.999 404.043 224.211 404.043 152.639C404.043 81.0674 433.638 37.8828 486.788 37.8828C498.868 37.8828 516.081 40.2987 527.859 43.3186L531.181 94.053L527.859 94.657C507.928 56.6062 494.942 43.3186 484.976 43.3186C460.817 43.3186 458.401 89.8251 458.401 152.639C458.401 215.453 468.971 262.563 486.486 262.563C498.264 262.563 509.74 238.102 528.463 196.428L531.483 196.73Z" fill="white"/>
							<path d="M340.027 242.028C353.617 242.028 362.375 232.364 368.414 221.794L369.924 222.398C364.186 248.067 347.879 267.999 324.928 267.999C295.333 267.999 276.609 235.082 276.609 192.199C276.609 145.391 300.165 112.172 327.042 112.172C353.919 112.172 369.924 145.391 369.622 175.59L307.714 174.986C308.318 224.512 321.304 242.028 340.027 242.028ZM325.532 117.608C313.754 117.608 307.714 142.069 307.714 169.852L339.121 168.946V160.49C339.121 129.989 334.591 117.608 325.532 117.608Z" fill="white"/>
							<path d="M161.517 263.464V262.86C164.839 249.874 166.65 239.607 166.65 217.561V78.646C166.65 61.4325 163.329 51.4669 156.383 42.1052V41.5012L198.057 28.5156V137.232C204.399 125.756 215.573 112.167 233.692 112.167C251.812 112.167 264.495 125.454 264.495 149.916V217.561C264.495 239.305 265.703 249.874 269.629 262.86V263.464H228.256V262.86C231.88 249.874 233.088 239.003 233.088 217.863V153.54C233.088 141.158 228.558 134.514 217.385 134.514C209.533 134.514 202.285 137.836 198.057 144.782V217.863C198.057 239.003 199.567 249.874 203.191 262.86V263.464H161.517Z" fill="white"/>
							<path d="M114.973 262.867V263.471H64.8428V262.867C70.2786 243.539 72.3925 232.366 72.3925 205.791V48.4539L66.0508 48.7559C55.1791 49.3598 43.4015 72.0091 29.8119 97.0743L28 96.1683L33.7378 42.4141H145.776L151.816 96.1683L149.702 97.0743C136.414 72.0091 124.335 49.3598 113.765 48.7559L107.121 48.4539V205.791C107.121 232.064 109.537 243.539 114.973 262.867Z" fill="white"/>
							</svg>

					</div>
					<div class = 'expo'>
						<h3> Newsletter </h3>
					</div>
				</div>
			</a>
		</div>



		<section id = 'page'>
			<section id = 'sections'>

			{#each data.posts as link, i}

				{#if i == 0 || i > 0 && link.meta.type != data.posts[i-1].meta.type }
					<div class = 'head'
					in:fly={{y: 100, duration: 300, delay: 20*i}}>
						<h1> {typeDisplay(link.meta.type).title} </h1>
						<p> {typeDisplay(link.meta.type).description} </p>
					</div>
				{/if}

				<section
					id = '{link.meta.title}'
					class = 'sec r{link.meta.rating} {link.meta.type}'
					in:fly={{y: 100, duration: 300, delay: 100*i}}
					on:click={() => {
						if (link.meta.url) {
							window.location = link.meta.url
						}else{
							goto('/' + link.slug)
						}
					}}
					>

					<hgroup class = 'hgroup'>

						<div class = 'left'>

							<div class = 'mast'>
								{#if link.meta.card}
									<SmartImage
										src="card/card-{link.meta.card}.png"
										alt="{link.meta.title} card"
										className="card" />
								{/if}

								<div class = 'title'>
									<h1> {link.meta.title} </h1>
									{#each link.meta.tags as tag, j}
										<div class = 'tag'>
											{#if tagIcon(tag)}
												<img src="icon/{tagIcon(tag)}.svg" class="icon" alt="icon" />
											{/if}
											<h3> {titleCase(tag)} </h3>
										</div>
									{/each}
								</div>

								<h2> {link.meta.description} </h2>
								<div class = 'type'>
									<h3> {link.meta.type} </h3>
								</div>
							</div>

							<div class = 'info'>
								<p> {link.meta.blurb} </p>
								<div class = 'tags'>
									{#each link.meta.categories as cat, j}
										<div class = 'tag'>
											{#if tagIcon(cat)}
												<img src="icon/{tagIcon(cat)}.svg" class="icon" alt="icon" />
											{/if}
											<h3> {titleCase(cat)} </h3>
										</div>
									{/each}
								</div>

								<button>
									<h2> View Project </h2>
								</button>
							</div>

						</div>

						<div class = 'right'>
							<img src="expand.svg" class="expand" alt="view" on:click={() => {
								expandedPost.set(link)
								openDrawer.set(true)
							}} />
							<div class = 'rating'>
								<h2> {link.meta.rating} </h2>
								<div class = 'bar'>
									<div class = 'fill'>
									</div>
								</div>
							</div>
						</div>

					</hgroup>

					<div class = 'preview'>

						<div class = 'background' style='background: #{link.meta.color}'></div>

						<div class = 'content'>
							{#if link.meta.video}
								<video class = 'video' autoplay muted playsinline loop>
									<source src = 'video/{link.meta.video}.mp4' type = 'video/mp4'>
								</video>
							{:else if link.meta.preview}
								<SmartImage
									src="bento/{link.meta.preview}.svg"
									alt="{link.meta.title} banner"
									className="banner" />
								<div class = 'gradient'></div>
							{:else}
								<div class="prose prose-preview">
									<svelte:component this={link.content} />
								</div>
							{/if}
						</div>
					</div>
				</section>


			{/each}
			</section>

		</section>
	</div>

	<div id = 'scroll' bind:this={Scroll}>
		<div id = 'bar' bind:this={Bar}></div>
	</div>

</section>


<style lang="scss">

	#app{
		color: white;
	}

	h1, h2, h3, h4, h5, h6, p{
		color: rgba(white, .75);
	}

	.splash{
		width: 1080px;
		max-width: 90%;
		margin: 80px auto;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;

		img{
			height: 180px;
			width: 180px;
			border-radius: 100px;
		}
		.screen{
			display: flex;
			align-items: center;
			justify-content: flex-start;
			gap: 40px;
			@media screen and (max-width: 800px) {
				flex-direction: column;
			}
		}
		.expo{
			h1{
				font-family: "ivypresto-headline", 'Newsreader', sans-serif;
				text-align: left;
				font-size: 60px;
				font-weight: 300;
				letter-spacing: 0px;
				margin-bottom: 24px;
			}
			p{
				color: rgba(white, .5);
				text-align: left;
				font-size: 15px;
				font-weight: 250;
				letter-spacing: .1px;
				margin: 12px 0;
			}
			@media screen and (max-width: 800px) {
				h1{
					text-align: center;
				}
				p{
					text-align: center;
				}
			}
		}
	}

	#featured{
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px 40px;
		width: 1080px;
		max-width: 90%;
		margin: 40px auto;

		@media screen and (max-width: 800px) {
			display: flex;
			flex-direction: column;
			gap: 20px;
		}

		a{
			padding: 0;
			background: none !important;
			border: none !important;
		}

		.featured{
			width: 100%;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			box-sizing: border-box;
			gap: 20px;
			background: rgba(white, .04);
			padding: 50px;
			border-radius: 8px;
			transition: .2s ease;
			cursor: pointer;
			.logo{
				height: 52px;
				width: fit-content;
				svg{
					height: 100%;
					width: fit-content;
					path{
						fill: rgba(white, .8);
						transition: .2s ease;
					}
				}
			}
			.expo{
				h3{
					font-weight: 300;
					letter-spacing: 0px;
				}
			}
			&:hover{
				background: rgba(white, .05);
				.logo{
					svg{
						path{
							fill: rgba(white, 1);
						}
					}
				}
			}
		}
	}

	.head{
		grid-column: 1 / 4;
		width: 100%;
		margin: 80px 0 60px 0;
		h1{
			font-family: "ivypresto-headline", 'Newsreader', sans-serif;
			font-size: 48px;
			font-weight: 300;
			letter-spacing: .25px;
			text-align: left;
			margin-bottom: 12px;
		}
		p{
			font-family: "utopia-std-display", 'Newsreader', sans-serif;
			font-size: 18px;
			font-weight: 100;
			letter-spacing: 0px;
			color: rgba(white, .2);
			text-align: left;
		}
	}

	#sections{
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 60px 40px;
		width: 1080px;
		max-width: 90%;
		margin: 40px auto;
		padding-bottom: 100px;

		@media screen and (max-width: 800px) {
			display: flex;
			flex-direction: column;
			gap: 40px;
		}
	}

.sec{
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 0px;
	height: fit-content;
	cursor: pointer;

	background: #000064;
	background: rgba(white, .03);
	box-shadow: -24px 60px 60px rgba(#030025, .2);
	border-radius: 8px;

	max-height: 540px;
	//overflow: hidden;
	transition: .2s ease;

	&:hover{
		background: rgba(white, .05);
		transform: translateY(-2px);
	}

	&#Stan{
		.title{
			h1{
				font-family: 'Plus Jakarta Sans', sans-serif;
				font-weight: 700;
				letter-spacing: -.5px;
			}
		}
	}

	&#Soteria{
		.title{
			h1{
				font-family: 'DM Serif Display', 'Newsreader', sans-serif;
				font-weight: 500;
				letter-spacing: -0px;
				text-transform: uppercase;
				transform: translateY(1px);
			}
		}
	}

	&#Wolf\ Financial {
		.title{
			h1{
				font-family: 'Poppins', sans-serif;
				font-weight: 600;
				letter-spacing: -.8px;
			}
		}
	}

	hgroup{
		display: flex;
		padding: 10px 20px 0px 20px;
		.left{
			margin: 0;
			padding: 0;
			.mast{
				:global(.card){
					height: 64px;
					width: 64px;
					border-radius: 6px;
					margin-top: -18px;
					box-shadow: -6px 12px 24px rgba(black, .25);
				}
				.title{
					margin: 18px 0 8px 0;
					h1{
						font-family: "ivypresto-headline", 'Newsreader', sans-serif;
						font-size: 32px;
						font-weight: 500;
						letter-spacing: .3px;
						text-align: left;
						//color: #030025;
					}

				}
				h2{
					font-family: "utopia-std-display", "ivypresto-headline", 'Newsreader', sans-serif;
					font-size: 18px;
					font-weight: 100;
					letter-spacing: 0px;
					color: rgba(white, .2);
					//color: rgba(#030025, .5);
					margin-bottom: 12px;
				}

				h3{
					display: none;
				}
			}

			.info{
				p{
					font-size: 13px;
					font-weight: 400;
					letter-spacing: -.25px;
					margin: 12px 0;
					line-height: 125%;
					color: rgba(white, .4);
					//color: rgba(#030025, .5);
				}
				button{
					display: none;
					h2{
						display: block;
					}
				}
			}
		}
		.right{
			display: none;
			.expand{}
		}
	}


	.preview{
		display: flex;
		width: 100%;
		padding: 18px;
		box-sizing: border-box;
		max-height: 100%;
		opacity: .95;

		overflow: hidden;
		 -webkit-mask-image: -webkit-gradient(linear, 50% 50%, 52% 100%, from(rgba(black,1)), to(rgba(black,0)));

		.content{
			overflow: visible;
			filter: drop-shadow(0 40px 40px rgba(#030025, .2));
		}
		:global(.banner){
			width: 100%;
		}
		video{
			width: 100%;
			border-radius: 6px;
		}
	}

	&.game{
		.preview{
			-webkit-mask-image: none;
		}
	}

}

.tags{
	display: none;
	gap: 10px;
	margin: 16px 0;
	.tag{
		display: flex;
		align-items: center;
		gap: 6px;
		background: rgba(white, .05);
		padding: 6px 10px;
		border-radius: 4px;
		img{
			height: 16px;
		}
		h3{
			font-family: "ivypresto-headline", 'Newsreader', sans-serif;
			font-size: 16px;
			font-weight: 300;
			letter-spacing: .3px;
		}

	}
}


</style>
