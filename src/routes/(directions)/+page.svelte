<script module>
	import { GROUPS, LIFE, SHELVES, findWork, newestFirst } from '$lib/directions/content.js';

	/** Works left off this page. */
	const HIDDEN = new Set(['gapyear']);

	/**
	 * The life timeline opens the page beside the live modules; every section follows with its panels.
	 * Lists and panels both run newest first.
	 */
	const groups = GROUPS.map((group) => ({
		...group,
		label: group.id === 'products' ? 'Building' : group.label,
		ellipsis: group.id === 'products',
		works: group.works.filter((work) => !HIDDEN.has(work.id))
	}));

	const school = findWork('school');

	const educationRow = {
		id: 'education',
		numeral: '',
		label: 'Education',
		works: school ? [school] : []
	};

	const productAt = groups.findIndex((group) => group.id === 'products');
	groups.splice(productAt + 1, 0, educationRow);

	const ROWS = [{ id: 'life', numeral: '', label: 'Life', works: newestFirst(LIFE) }, ...groups];

	/** Recommendations close the page, standing on shelves instead of hanging in panels. */
	const SHELF = { id: 'shelf', numeral: 'IX', label: 'Shelf', works: [] };

	/** Narration boxes, the way a comic sets a scene. @type {Record<string, string>} */
	const NARRATION = {
		timeline: 'Three weeks of research later…',
		stan: 'Meanwhile, at Stan…',
		canvas: 'Later, in the age of AI…',
		arcaide: 'At Cornell, with Prof. Kevin Ellis…',
		cameo: 'Meanwhile, on YouTube…'
	};
</script>

<script>
	import { MediaQuery } from 'svelte/reactivity';
	import ActionLines from '$lib/directions/ActionLines.svelte';
	import Burst from '$lib/directions/Burst.svelte';
	import Career from '$lib/directions/Career.svelte';
	import Coda from '$lib/directions/Coda.svelte';
	import Footer from '$lib/directions/Footer.svelte';
	import GameBoy from '$lib/directions/GameBoy.svelte';
	import Intro from '$lib/directions/Intro.svelte';
	import Panel from '$lib/directions/Panel.svelte';
	import SectionNav from '$lib/directions/SectionNav.svelte';
	import Shelves from '$lib/directions/Shelves.svelte';
	import Stage from '$lib/directions/Stage.svelte';
	import Stat from '$lib/directions/Stat.svelte';
	import WorkGroup from '$lib/directions/WorkGroup.svelte';
	import ZoomView from '$lib/directions/ZoomView.svelte';
	import { getDirectionsContext } from '$lib/directions/context.js';
	import { Spotlight } from '$lib/directions/spotlight.svelte.js';
	import { Zoom } from '$lib/directions/zoom.svelte.js';
	import Room from '$lib/room/Room.svelte';

	/** @typedef {import('$lib/directions/content.js').Work} Work */

	let { data } = $props();

	const directions = getDirectionsContext();
	const zoom = new Zoom();
	const spotlight = new Spotlight();
	const canHover = new MediaQuery('(hover: hover)');
	const zoomed = $derived(zoom.current ? findWork(zoom.current) : undefined);

	/** An essay's title, with its reading time when it's long enough to have one. @param {Work} essay */
	function reading(essay) {
		const minutes = data.essays[essay.id]?.minutes;
		return minutes ? `${essay.title} · ${minutes} min read` : essay.title;
	}
</script>

<svelte:head>
	<title>Heewon Ahn</title>
</svelte:head>

<!--
	A work's panel. Its area defaults to its id; videos with a poster wait for a hover to play.
	Comics stack their pages behind the cover, and everything else gets focus lines when lit.
-->
{#snippet frame(/** @type {string} */ id, /** @type {Record<string, any>} */ options = {})}
	{@const item = findWork(id)}
	<Panel
		work={item}
		area={id}
		{zoom}
		lit={spotlight.current === id}
		playing={item?.media?.poster && canHover.current ? spotlight.current === id : undefined}
		onhover={spotlight.set}
		pages={item?.pages}
		lines={!item?.pages}
		narration={NARRATION[id]}
		{...options}
	/>
{/snippet}

{#snippet life()}
	<Room area="room" />
	<Career
		jobs={LIFE}
		area="career"
		active={spotlight.current}
		onhover={spotlight.set}
		onpick={(job) => directions.open(job.href)}
	/>
{/snippet}

{#snippet shout()}
	<Burst text="Now building!" />
{/snippet}

{#snippet products()}
	{@render frame('ovid', { caption: 'Ovid · App · Visual UX for AI', children: shout, playing: undefined })}
	{@render frame('king', { caption: 'Kingforall · Novel · Historical Fiction', playing: undefined })}
	{@render frame('chancellor', { caption: 'Chancellor · Blog · Tech, History, Current Events' })}
{/snippet}

{#snippet education()}
	{@render frame('school', {
		caption: 'Cornell · 2021–22 · Dropped out',
		media: null
	})}
{/snippet}

{#snippet writing(/** @type {{ works: Work[] }} */ group)}
	{#each group.works as essay (essay.id)}
		{@render frame(essay.id, { caption: reading(essay) })}
	{/each}
{/snippet}

{#snippet design()}
	{@render frame('stan', { fit: 'contain', caption: 'Stan · founding designer' })}
	{@render frame('nybc', { caption: 'NYBC · posters' })}
	<Panel area="arr" class="text">
		<ActionLines seed={30} count={56} inner={120} />
		<span class="sfx"><Stat value={30} prefix="$" suffix="M" /></span>
		<p class="box">ARR in three years, led by John and Vitalii.</p>
	</Panel>
	{@render frame('lab', { caption: 'Cornell L+R Lab · logos' })}
	{@render frame('redesign', { caption: 'Logo redesigns' })}
	{@render frame('brainteam', { caption: 'Team Ithaca · school team designs' })}
	{@render frame('paintball', { caption: 'Ithaca Paintball · branding' })}
{/snippet}

{#snippet games(/** @type {{ works: Work[] }} */ group)}
	<GameBoy games={group.works} {zoom} active={spotlight.current} onhover={spotlight.set} />
{/snippet}

{#snippet webdev()}
	<Stage area="stage">
		{@render frame('canvas', { area: undefined, caption: 'AI Canvas · realtime image generation' })}
		{#snippet insets()}
			{@render frame('iphone', { lines: false })}
			{@render frame('dido', { lines: false })}
			{@render frame('scioly', { lines: false })}
		{/snippet}
	</Stage>
	{@render frame('stan-gmv', { caption: 'Stan GMV tracker, live' })}
	{@render frame('stan-remix', { caption: 'Stan Remix' })}
{/snippet}

{#snippet comics()}
	{@render frame('samhan', { caption: 'The King of Samhan · concept art' })}
	{@render frame('pandemonium', { caption: 'Pandemonium · 천하만국', class: 'korean' })}
{/snippet}

{#snippet research()}
	{@render frame('marc', { caption: 'MARC · reasoning dataset' })}
	{@render frame('arcaide', { caption: 'Arcaide · ARC annotation tool' })}
{/snippet}

{#snippet videos()}
	{@render frame('future-ui', { caption: 'The Future of UI in the AI Era · Inflection Fellowship 2026' })}
	{@render frame('king-trailer', { caption: 'King for All · AI teaser trailer' })}
	{@render frame('cameo', { caption: "Cameo in John's video, from 7:32" })}
	{@render frame('reel', { caption: 'Game portfolio reel' })}
	<Coda />
{/snippet}

<main class="frames">
	{#each ROWS as row, i (row.id)}
		{@const tier = { life, products, education, writing, design, games, webdev, comics, research, videos }[row.id]}
		<div class="row" id={row.id}>
			<div class="index">
				{#if i === 0}
					<div class="intro">
						<Intro avatar links>
							I really like the <code>&lt;canvas&gt;</code> element, so a few of these frames are alive.
						</Intro>
					</div>
				{/if}
				<WorkGroup group={row} i={i + 2} preview={false} bind:active={spotlight.current} />
			</div>
			<section class={['tier', row.id]} aria-label={i === 0 ? 'About' : row.label}>
				{@render tier?.(row)}
			</section>
		</div>
	{/each}
</main>

<div class="shelf-foot" id={SHELF.id}>
	<Shelves shelves={SHELVES} />
	<div class="shelf-links">
		<Footer i={ROWS.length + 3} />
	</div>
</div>

<SectionNav items={[...ROWS, SHELF]} />

{#if zoomed}
	<ZoomView work={zoomed} variant="panels" onclose={() => zoom.hide()} />
{/if}

<style>
	.frames {
		--gutter: 18px;
		--line: 2px;
		--inset: 12px;
		max-width: var(--page-max);
		margin: 0 auto;
		padding: clamp(4.5rem, 12vh, 8rem) var(--page-pad) 10rem;
	}

	.row {
		display: grid;
		grid-template-columns: minmax(16rem, 22rem) minmax(0, 1fr);
		column-gap: clamp(2.5rem, 5vw, 5.5rem);
		margin-bottom: clamp(3rem, 6vw, 5rem);
		scroll-margin-top: 2.5rem;
	}

	.index {
		position: sticky;
		top: 2.5rem;
		align-self: start;
		padding-left: 2.75rem;
	}

	.index :global(section) {
		margin-bottom: 0;
	}

	/* The column is narrow, so each blurb gets its own line under the title. */
	.index :global(.row) {
		grid-template-columns: minmax(0, 1fr) auto;
		row-gap: 0.05rem;
	}

	.index :global(.note) {
		grid-row: 2;
		grid-column: 1 / -1;
	}

	.intro {
		margin-bottom: 3rem;
	}

	.shelf-foot {
		scroll-margin-top: 1rem;
	}

	.shelf-links {
		padding: 0.25rem max(var(--page-pad), calc((100% - var(--page-max)) / 2 + var(--page-pad))) 6.5rem;
		background: #cfc6b6;
	}

	.shelf-links :global(.links) {
		border-top-color: rgba(28, 27, 24, 0.16);
	}

	.tier {
		display: grid;
		gap: var(--gutter);
		min-width: 0;
	}

	.life {
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: clamp(26rem, 44vw, 38rem) 9rem;
		grid-template-areas: 'room' 'career';
	}

	.products {
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-template-rows: 18rem;
		grid-template-areas: 'ovid king chancellor';
	}

	.education {
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: 14rem;
		grid-template-areas: 'school';
	}

	.writing {
		grid-template-columns: 1.35fr 1fr;
		grid-template-rows: 16rem 12rem 14rem;
		grid-template-areas:
			'pygmalion pygmalion'
			'palace persia'
			'timeline mario';
	}

	.design {
		grid-template-columns: 1.2fr 1fr 0.8fr;
		grid-template-rows: repeat(3, 12rem);
		grid-template-areas:
			'stan nybc arr'
			'stan nybc lab'
			'redesign brainteam paintball';
	}

	.games {
		grid-template-columns: minmax(15rem, 17.5rem) minmax(0, 1fr);
		column-gap: clamp(1.75rem, 3.5vw, 3rem);
		align-items: start;
	}

	.webdev {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-template-rows: 26rem 13rem;
		grid-template-areas:
			'stage stage'
			'stan-gmv stan-remix';
		row-gap: calc(var(--gutter) + 6px);
	}

	.comics {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-template-rows: 23rem;
		grid-template-areas: 'samhan pandemonium';
		column-gap: clamp(1.75rem, 3.5vw, 3rem);
	}

	.research {
		grid-template-columns: 1fr 1.3fr;
		grid-template-rows: 15rem;
		grid-template-areas: 'marc arcaide';
	}

	.videos {
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-template-rows: 13rem 13rem;
		grid-template-areas:
			'future-ui king-trailer cameo'
			'reel end end';
	}

	@media (max-width: 900px) {
		.row {
			grid-template-columns: minmax(0, 1fr);
			row-gap: 1.75rem;
			margin-bottom: 4rem;
		}

		.index {
			position: static;
		}

		.frames .tier:not(.life) {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: none;
			grid-template-areas: none;
		}

		.frames .tier:not(.life) > :global(*) {
			grid-area: auto;
		}

		.tier > :global(.panel),
		.tier > :global(.stage > .panel) {
			min-height: 14rem;
		}

		.tier > :global(.stack) {
			min-height: 24rem;
		}

		.games > :global(.console) {
			justify-self: center;
		}
	}

	@media (max-width: 720px) {
		.index {
			padding-left: 0;
		}
	}

	@media (max-width: 560px) {
		.frames .life {
			grid-template-rows: 24rem auto;
		}

		.frames .life > :global(.module) {
			min-height: 9.5rem;
		}

		.games :global(.carts) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
