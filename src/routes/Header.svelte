<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import logo from '$lib/images/svelte-logo.svg';
	import github from '$lib/images/github.svg';
</script>

<header>

	<div id='mast' on:click={() => goto('/')}>
		<img id = 'ahw' src='ahnheewon3.png' alt="Logo" />
	</div>


	<nav>
		<ul>
			<li class:active = {page.url.pathname === '/'} aria-current={page.url.pathname === '/' ? 'page' : undefined}>
				<a href="/">
					<h2>
						Home
					</h2>
				</a>
			</li>
			<li class:active = {page.url.pathname === '/about'} aria-current={page.url.pathname === '/about' ? 'page' : undefined}>
				<a href="/about">
					<h2>
						About
					</h2>
				</a>
			</li>
			<li class:active = {page.url.pathname === '/sverdle'} aria-current={page.url.pathname.startsWith('/sverdle') ? 'page' : undefined}>
				<a href="/sverdle">
					<h2>
						Games
					</h2>
				</a>
			</li>
		</ul>
	</nav>

	<!--
	<div class="corner">
		<a href="https://github.com/sveltejs/kit">
			<img src={github} alt="GitHub" />
		</a>
	</div>
	-->
</header>

<style lang="scss">

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		top: 0;
		width: 100%;
		position: fixed;
		z-index: 5;

		padding: 4px 12px;
		//margin: 4px 2px;
		box-sizing: border-box;
		background: white;

		border-radius: 8px;
		//box-shadow: 0 -4px 28px rgba(#030025, 0.1), inset -2px 2px 4px rgba(white, .4);

		//background: rgba(white, 1);
		//border-bottom: 1px solid rgba(black, .05);
	}

	#ahw{
		height: 18px;
		cursor: pointer;
	}

	.corner {
		height: 44px;
	}

	.corner a {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.corner img {
		width: 2em;
		height: 2em;
		object-fit: contain;
	}

	nav {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 100px;

		background: white;
		backdrop-filter: blur(10px);
		//box-shadow: 0 10px 30px rgba(#030025, 0.1), inset -2px 2px 4px rgba(white, .4);
		//border: 1px solid rgba(white, .5);

		h2{
			//color: white;
		}
	}

	path {
		fill: var(--background);
	}

	ul {
		position: relative;
		padding: 0 24px;
		margin: 0;
		height: 40px;
		display: flex;
		justify-content: center;
		align-items: center;
		list-style: none;
		background-size: contain;
		background: none;
	}

	li {
		position: relative;
		height: 100%;
	}

	li[aria-current='page']::before {
		--size: 6px;
		content: '';
		width: 0;
		height: 0;
		position: absolute;
		top: 0;
		left: calc(50% - var(--size));
		border: var(--size) solid transparent;
		border-top: var(--size) solid var(--color-theme-1);
	}

	nav a {
		display: flex;
		height: 100%;
		align-items: center;
		padding: 0 0.5rem;
		//text-transform: uppercase;
		background: none;
		transition: color 0.2s linear;
		cursor: pointer;

		h2{
			font-size: 13px;
			font-weight: 600;
			letter-spacing: -0px;
			cursor: pointer;
		}
	}


</style>
