<script module>
	/** The balloon types itself a word at a time; each word keeps its global index for the stagger. */
	const BALLOON = (() => {
		const parts = [
			{ text: "Hi! I'm Heewon, a " },
			{ text: 'designer', href: '#tier-stan' },
			{ text: ', ' },
			{ text: 'engineer', href: '#tier-games' },
			{ text: ', and occasional ' },
			{ text: 'artist', href: '#tier-comics' },
			{ text: '.' }
		];
		let index = 0;
		return parts.map((part, i) => ({
			...part,
			id: i,
			words: (part.text.match(/\S+\s*/g) ?? []).map((text) => ({ text, index: index++ }))
		}));
	})();
</script>

<script>
	import ActionLines from '$lib/directions/ActionLines.svelte';
	import Coda from '$lib/directions/Coda.svelte';
	import Panel from '$lib/directions/Panel.svelte';
	import Stage from '$lib/directions/Stage.svelte';
	import Stat from '$lib/directions/Stat.svelte';
	import ZoomView from '$lib/directions/ZoomView.svelte';
	import { PROFILE, findWork, worksIn } from '$lib/directions/content.js';
	import { linkProps } from '$lib/directions/links.js';
	import { Spotlight } from '$lib/directions/spotlight.svelte.js';
	import { Zoom } from '$lib/directions/zoom.svelte.js';
	import { MediaQuery } from 'svelte/reactivity';

	const zoom = new Zoom();
	const spotlight = new Spotlight();
	const canHover = new MediaQuery('(hover: hover)');
	const zoomed = $derived(zoom.current ? findWork(zoom.current) : undefined);
	const games = worksIn('games');
	const writing = worksIn('writing');
</script>

<svelte:head>
	<title>Panels · Heewon Ahn</title>
</svelte:head>

<main class="panels">
	<header class="masthead">
		<span class="name">{PROFILE.name}</span>
		<span class="issue">Chapter 1 · Selected work, 2020–2026</span>
	</header>

	<section class="tier opening" aria-label="Introduction and products">
		<Panel area="splash" class="splash" reveal={false}>
			<ActionLines x={250} y={-40} />
			<img class="statue" src={PROFILE.bust} alt="A marble bust" draggable="false" />
			<p class="balloon">
				{#each BALLOON as part (part.id)}
					{#if part.href}
						<a {...linkProps(part.href)}
							>{#each part.words as word (word.index)}<span style:--c={word.index}
									>{word.text}</span
								>{/each}</a
						>
					{:else}
						{#each part.words as word (word.index)}<span style:--c={word.index}>{word.text}</span
							>{/each}
					{/if}
				{/each}
			</p>
			<p class="box title-box">
				<span class="seal" style:--mark="url({PROFILE.avatar})" aria-hidden="true"></span>
				Founding designer at Stan, builder of games and tools, and a comic artist in training.
			</p>
		</Panel>
		<Panel work={findWork('ovid')} area="ovid" caption="Ovid · visual LLM workflows" {zoom} reveal={false} />
		<Panel
			work={findWork('king')}
			area="king"
			caption="King for All · 삼한왕검"
			class="korean"
			{zoom}
			reveal={false}
		/>
	</section>

	<section class="tier stan" id="tier-stan" aria-label="Design at Stan">
		<Panel work={findWork('stan')} area="stan" fit="contain" caption="Stan · founding designer" {zoom} />
		<Panel area="nineteen" class="text">
			<span class="big">19</span>
			<p class="box">Dropped out of college to help build the future of work.</p>
		</Panel>
		<Panel work={findWork('stan-gmv')} area="gmv" caption="The GMV tracker, live" {zoom} />
		<Panel area="arr" class="text">
			<span class="sfx"><Stat value={30} prefix="$" suffix="M" /></span>
			<p class="box">ARR in three years, led by John and Vitalii.</p>
		</Panel>
	</section>

	<p class="narration" id="tier-games">Six web games, drawn and coded by hand before AI. Hover to play.</p>
	<section class="tier games" aria-label="Games">
		{#each games as game (game.id)}
			<Panel
				work={game}
				{zoom}
				playing={canHover.current ? spotlight.current === game.id : undefined}
				onhover={spotlight.set}
			/>
		{/each}
	</section>

	<section class="tier web" aria-label="Web apps and writing">
		<Stage area="canvas">
			<Panel work={findWork('canvas')} caption="AI Canvas · realtime image generation" {zoom} />
			{#snippet insets()}
				<Panel work={findWork('iphone')} {zoom} />
				<Panel work={findWork('dido')} {zoom} />
				<Panel work={findWork('scioly')} {zoom} />
			{/snippet}
		</Stage>
		<Panel area="notes" class="notes">
			<p class="box">Author's notes</p>
			<ol>
				{#each writing as essay (essay.id)}
					<li>
						<a {...linkProps(essay.href)}>
							<span>{essay.title}</span>
							<span class="year">{essay.year}</span>
						</a>
					</li>
				{/each}
			</ol>
		</Panel>
	</section>

	<section class="tier comics" id="tier-comics" aria-label="Comics and research">
		<Panel
			work={findWork('pandemonium')}
			area="pandemonium"
			caption="Pandemonium · 천하만국"
			class="korean"
			{zoom}
		/>
		<Panel
			work={findWork('samhan')}
			area="samhan"
			media={{ kind: 'image', src: '/img/samhan.png', alt: 'The King of Samhan banner' }}
			caption="The King of Samhan · concept art"
			{zoom}
		/>
		<Panel work={findWork('arcaide')} area="arcaide" caption="Arcaide · with Prof. Kevin Ellis" {zoom} />
		<Panel work={findWork('marc')} area="marc" caption="MARC · reasoning dataset" {zoom} />
	</section>

	<section class="tier ending" aria-label="Videos and contact">
		<Panel work={findWork('cameo')} area="cameo" caption="Cameo in John's video, from 7:32" {zoom} />
		<Panel work={findWork('reel')} area="reel" caption="Game portfolio reel" {zoom} />
		<Coda />
	</section>

	<footer class="folio">— 1 —</footer>
</main>

{#if zoomed}
	<ZoomView work={zoomed} variant="panels" onclose={() => zoom.hide()} />
{/if}

<style>
	.panels {
		--gutter: 14px;
		--line: 2px;
		max-width: 75rem;
		margin: 0 auto;
		padding: 2.5rem clamp(1rem, 3vw, 2.5rem) 8rem;
		background: var(--paper);
		scroll-behavior: smooth;
	}

	.masthead {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding-bottom: 0.6rem;
		margin-bottom: var(--gutter);
		border-bottom: 3px double var(--ink);
	}

	.name {
		font-weight: 500;
		letter-spacing: -0.03em;
	}

	.issue {
		font-family: var(--mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--ink-2);
	}

	.tier {
		display: grid;
		gap: var(--gutter);
		margin-bottom: var(--gutter);
	}

	.opening {
		grid-template-columns: 1.45fr 1fr;
		grid-template-rows: 15rem 19rem;
		grid-template-areas:
			'splash ovid'
			'splash king';
	}

	.stan {
		grid-template-columns: 1fr 0.7fr 1.5fr;
		grid-template-rows: 13rem 9rem;
		grid-template-areas:
			'stan nineteen gmv'
			'stan nineteen arr';
	}

	.games {
		grid-template-columns: repeat(6, 1fr);
	}

	.games > :global(.panel) {
		aspect-ratio: 1;
	}

	.web {
		grid-template-columns: 2fr 1fr;
		grid-template-rows: 26rem;
		grid-template-areas: 'canvas notes';
	}

	.comics {
		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 18rem 14rem;
		grid-template-areas:
			'pandemonium samhan samhan'
			'pandemonium arcaide marc';
	}

	.ending {
		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 13rem;
		grid-template-areas: 'cameo reel end';
	}

	/* Splash */
	.statue {
		position: absolute;
		right: -2%;
		bottom: -6%;
		height: 104%;
		filter: grayscale(1) contrast(1.1);
		user-select: none;
	}

	.balloon span {
		animation: type 120ms var(--ease-out) both;
		animation-delay: calc(var(--c) * 60ms + 450ms);
	}

	.panels .title-box {
		max-width: 19rem;
		display: flex;
		gap: 0.6rem;
		align-items: center;
	}

	/* A carved seal: the smiley's dark strokes cut through a sanguine square. */
	.seal {
		flex: none;
		width: 26px;
		height: 26px;
		border-radius: 2px;
		background: var(--sanguine);
		-webkit-mask: var(--mark) center / 100% no-repeat luminance;
		mask: var(--mark) center / 100% no-repeat luminance;
	}

	.narration {
		margin: 1.75rem 0 0.75rem;
		max-width: 40rem;
		color: var(--ink-2);
	}

	.web > :global(.notes) {
		border: 0;
		padding: 0.5rem 0.25rem;
	}

	.web .box {
		position: static;
		display: inline-block;
		margin-bottom: 1rem;
	}

	.web ol {
		display: grid;
		gap: 0.15rem;
	}

	.web ol a {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--rule);
	}

	.web ol a:hover span:first-child {
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-thickness: 1px;
	}

	.year {
		color: var(--ink-3);
		font-variant-numeric: tabular-nums;
	}

	.folio {
		margin-top: 2rem;
		text-align: center;
		font-family: var(--serif);
		font-size: 18px;
		color: var(--ink-2);
	}

	@keyframes type {
		from {
			opacity: 0;
		}
	}

	@media (max-width: 760px) {
		.tier {
			grid-template-columns: 1fr;
			grid-template-rows: none;
			grid-template-areas: none;
		}

		.panels .tier > :global(*) {
			grid-area: auto;
		}

		.tier > :global(.panel),
		.tier > :global(.stage > .panel) {
			min-height: 15rem;
		}

		.tier > :global(.splash) {
			min-height: 30rem;
		}

		.games {
			grid-template-columns: 1fr 1fr;
		}

		.games > :global(.panel) {
			min-height: 0;
		}

		.issue {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.balloon span {
			animation: none;
		}

		.panels {
			scroll-behavior: auto;
		}
	}
</style>
