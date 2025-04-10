<script>
	import { page } from '$app/state';
	import logo from '$lib/images/svelte-logo.svg';
	import github from '$lib/images/github.svg';
  import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

    let Pill

	function switchPage(page) {

		let tab = document.getElementById(page);
		let rect = tab.getBoundingClientRect();

		if (Pill) {
			Pill.style.left = `${rect.left}px`;
			Pill.style.top = `${rect.top}px`;
			Pill.style.width = `${rect.width}px`;
			Pill.style.height = `${rect.height}px`;
		}

		if (page === 'home') {
			goto('/')
		} else {
			goto('/' + page)
		}
	}

	onMount(() => {

		setPage()

		setTimeout(() => {
			setPage()
		}, 1000)

		window.addEventListener('resize', setPage)

        function setPage(){
            switch (page.url.pathname) {
				case '/':
					switchPage('home')
					break;
                default:
                    switchPage(page.url.pathname.slice(1))
                    break
			}
        }
	})



</script>

<header>
	<div class="corner">
		<img id = 'logo' src='ahw.png' alt="Logo" />
	</div>

	<nav>

		<div id = 'pill' bind:this={Pill}></div>

			<div id = 'home' class = 'tab' class:active={page.url.pathname === '/'} on:click={() => {switchPage('home')}}>
				<h2>
					Home
				</h2>

			</div>
			<div id = 'about' class = 'tab' class:active={page.url.pathname === '/about'} on:click={() => {switchPage('about')}}>
				<h2>
					About
				</h2>
			</div>
			<div id = 'blog' class = 'tab' class:active={page.url.pathname === '/blog'} on:click={() => {switchPage('blog')}}>
				<h2>
					Blog
				</h2>
			</div>

	</nav>

	<div class="corner right">
		<a href="https://github.com/shelost/dido">
			<img src={github} alt="GitHub" />
		</a>
	</div>
</header>

<style lang="scss">


	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		z-index: 10;
		margin-top: 10px;
		padding: 0 12px;
		box-sizing: border-box;
	}

	#pill{
		position: fixed;
		width: 40px;
		height: 40px;
		top: -40px;
		left: 50%;
		border-radius: 50px;
		background: #6355FF;
		box-shadow: -2px 4px 10px rgba(#030025, 0.5), inset -2px -4px 8px rgba(#030025, 0.25), inset 2px 4px 8px rgba(white, 0.2);
		transition: .2s ease;
	}

    .right{
        display: none;
    }

	nav {
		display: flex;
		justify-content: center;
		position: relative;

		padding: 6px 6px;
		border-radius: 50px;
		background: white;
		box-shadow: -8px 12px 24px rgba(#030025, 0.2), inset -2px -2px 4px rgba(#030025, 0.1), inset 2px 4px 8px rgba(white, 0.2);
		gap: 0px;
		z-index: 2;
	}

	.tab{
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 4;
		padding: 8px 14px;
		border-radius: 50px;
		transition: .2s ease;
		h2{
			font-size: 14px;
			font-weight: 600;
			letter-spacing: -.4px;
		}
		&.active{
			h2{
				color: white;
				text-shadow: -2px 4px 8px rgba(black, .5);
			}
		}
		&:hover{
			background: rgba(black, .1);
		}
	}


	.corner a {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.corner img {
		width: 36px;
		height: 36px;
	}

	#logo{
		width: auto;
		height: 24px;
		border-radius: 8px;
		object-fit: contain;
        margin-left: 4px;
		//filter: drop-shadow( -6px 6px 6px rgba(#030025, 0.15));
	}



	svg {
		width: 2em;
		height: 3em;
		display: none;
	}

	path {
		//fill: var(--background);
	}



	li {
		position: relative;
		height: 100%;
	}

	li[aria-current='page'] {
	}

	li[aria-current='page']::before {
		--size: 6px;
		content: '';
		width: 0;
		height: 0;
		position: absolute;
		top: 0px;
		left: calc(50% - var(--size));
		border: var(--size) solid transparent;
		border-top: var(--size) solid var(--color-theme-1);
		transition: .2s ease;
	}

	nav a {
		font-family: 'Inter', sans-serif;
		display: flex;
		height: 100%;
		align-items: center;
		padding: 0 0.5rem;
		color: var(--color-text);
		font-weight: 600;
		font-size: 14px;
		letter-spacing: -0.25px;
		text-decoration: none;
		transition: color 0.2s linear;
	}

	a:hover {
		color: var(--color-theme-1);
	}
</style>
