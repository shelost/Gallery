<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import Bust from '$lib/directions/Bust.svelte';
	import FloorPlan from '$lib/directions/FloorPlan.svelte';
	import Media from '$lib/directions/Media.svelte';
	import ZoomView from '$lib/directions/ZoomView.svelte';
	import { PROFILE, ROOMS, WORKS, findWork, worksIn } from '$lib/directions/content.js';
	import { linkProps } from '$lib/directions/links.js';
	import { inView } from '$lib/directions/motion.js';
	import { Zoom } from '$lib/directions/zoom.svelte.js';

	/** @typedef {import('$lib/directions/content.js').Work} Work */

	let { data } = $props();

	const zoom = new Zoom();
	const zoomed = $derived(zoom.current ? findWork(zoom.current) : undefined);

	/** Frame width in rem and picture ratio for each kind of work. @type {Record<string, { width: number, ratio: string }>} */
	const SIZES = {
		products: { width: 22, ratio: '4 / 3' },
		comics: { width: 16, ratio: '3 / 4' },
		games: { width: 15, ratio: '16 / 10' },
		design: { width: 16, ratio: '16 / 10' },
		webdev: { width: 16, ratio: '16 / 10' },
		videos: { width: 16, ratio: '16 / 9' },
		research: { width: 20, ratio: '16 / 10' }
	};

	/** Pieces hung larger or in a different shape. @type {Record<string, Partial<{ width: number, ratio: string }>>} */
	const OVERRIDES = {
		ovid: { width: 26 },
		stan: { width: 18, ratio: '4 / 5' },
		canvas: { width: 22 }
	};

	/** Rooms in walking order, each with its works. */
	const rooms = ROOMS.map((room) => ({
		...room,
		works: room.sections.flatMap((section) => worksIn(section))
	}));

	let current = $state('lobby');

	/** @param {Work} work */
	function size(work) {
		return { ...SIZES[work.section], ...OVERRIDES[work.id] };
	}

	/** The year of the work (or n.d.), then its place in the collection. @param {Work} work */
	function accession(work) {
		const number = WORKS.indexOf(work) + 1;
		return work.year ? `${work.year}.${number}` : `n.d.${number}`;
	}

	/** A triptych hangs its first work in the middle. @param {Work[]} works */
	function triptych([centre, left, ...rest]) {
		return [left, centre, ...rest];
	}

	/** @param {string} id */
	function walkTo(id) {
		document.getElementById(`room-${id}`)?.scrollIntoView({
			behavior: prefersReducedMotion.current ? 'auto' : 'smooth',
			block: 'start'
		});
	}

	/** Marks a room as current while it crosses the middle of the viewport. @param {string} id */
	function track(id) {
		return inView(
			(visible) => {
				if (visible) current = id;
			},
			{ rootMargin: '-45% 0px -50% 0px' }
		);
	}
</script>

<svelte:head>
	<title>Salon · Heewon Ahn</title>
</svelte:head>

{#snippet label(work)}
	<p class="label-title"><cite>{work.title}</cite>{#if work.year}, {work.year}{/if}</p>
	<p class="label-medium">{work.medium}</p>
	<p class="label-credit">{work.credit}</p>
	<p class="label-number">Acc. {accession(work)}</p>
{/snippet}

{#snippet frame(work, inCase = false)}
	{@const { width, ratio } = size(work)}
	<figure class={['work', inCase && 'case']} style:--w="{width}rem">
		<button
			type="button"
			class="frame"
			style:view-transition-name={zoom.tileName(work.id)}
			aria-label="Look closer at {work.title}"
			onclick={() => zoom.show(work.id)}
		>
			<span class="picture" style:aspect-ratio={ratio}>
				<Media media={work.media} title={work.title} />
			</span>
		</button>
		<figcaption class="label">{@render label(work)}</figcaption>
	</figure>
{/snippet}

<main class="salon">
	<section class="entrance" aria-label="Entrance" {@attach track('lobby')}>
		<div class="plinth">
			<Bust size="min(17rem, 62vw)" />
			<span class="base" aria-hidden="true"></span>
		</div>
		<div class="title-wall">
			<p class="overline sfumato">Salon · Selected works, 2020–2026</p>
			<h1 class="sfumato" style:--i="1">{PROFILE.name}</h1>
			<p class="dek sfumato" style:--i="2">Designer, engineer, and occasional artist.</p>
			<p class="wall-text sfumato" style:--i="3">
				{PROFILE.bio} The collection hangs in seven rooms, each named the way a museum names its
				media. Stop in front of a screen and it plays. Click any frame to walk up to it.
			</p>
		</div>
	</section>

	{#each rooms as room (room.id)}
		<section class="room" id="room-{room.id}" aria-labelledby="sign-{room.id}" {@attach track(room.id)}>
			<header class="sign">
				{#if room.numeral}<p class="numeral">Room {room.numeral}</p>{/if}
				<h2 id="sign-{room.id}">{room.name}</h2>
				<p class="note">{room.note}</p>
			</header>

			{#if room.id === 'manuscripts'}
				<ol class="catalog">
					{#each room.works as work (work.id)}
						{@const stats = data.essays[work.id]}
						<li>
							<a class="entry" {...linkProps(work.href)}>
								<span class="label-title"><cite>{work.title}</cite>, {work.year}</span>
								<span class="label-medium">
									{#if stats?.minutes}
										Manuscript, {stats.words.toLocaleString('en-US')} words. About {stats.minutes} minutes.
									{:else}
										{work.medium}
									{/if}
								</span>
								<span class="blurb">{work.blurb}</span>
								<span class="label-number">Acc. {accession(work)}</span>
								<span class="read">Read in the drawer</span>
							</a>
						</li>
					{/each}
				</ol>
			{:else}
				<div class={['wall', room.id === 'commissions' && 'triptych']}>
					{#each room.id === 'commissions' ? triptych(room.works) : room.works as work (work.id)}
						{@render frame(work, room.id === 'archive')}
					{/each}
				</div>
			{/if}
		</section>
	{/each}

	<footer class="exit">
		<p class="dek">Thank you for visiting.</p>
		<p class="links">
			{#each PROFILE.links as link (link.href)}
				<a {...linkProps(link.href)}>{link.label}</a>
			{/each}
		</p>
	</footer>
</main>

<FloorPlan rooms={ROOMS} {current} onpick={walkTo} />

{#if zoomed}
	<ZoomView work={zoomed} variant="salon" onclose={() => zoom.hide()}>
		<div class="placard">{@render label(zoomed)}</div>
	</ZoomView>
{/if}

<style>
	.salon {
		--wall: #f4f2ec;
		--wall-dim: #e7e4dc;
		--mat: #fdfcf9;
		--bronze: #8f7048;
		--bronze-light: #cbb38b;

		background: var(--wall);
		transition: background-color 200ms var(--ease-out);
	}

	/* Entrance */
	.entrance {
		display: grid;
		grid-template-columns: auto minmax(0, 30rem);
		justify-content: center;
		align-items: center;
		gap: clamp(2rem, 6vw, 5rem);
		min-height: min(52rem, 92vh);
		padding: 4rem 1.5rem 5rem;
	}

	.plinth {
		display: grid;
		justify-items: center;
	}

	.base {
		width: 76%;
		height: 2.4rem;
		margin-top: -0.4rem;
		border-radius: 2px;
		background: linear-gradient(180deg, #ece9e2, #dbd7ce);
		box-shadow:
			inset 0 1px 0 #fff,
			0 18px 24px -18px rgba(40, 30, 18, 0.45);
	}

	.overline {
		font-family: var(--mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--ink-3);
	}

	h1 {
		margin-top: 0.9rem;
		font-family: var(--serif);
		font-size: clamp(3rem, 7vw, 5rem);
		font-weight: 400;
		line-height: 0.95;
		letter-spacing: -0.02em;
	}

	.dek {
		margin-top: 0.6rem;
		font-family: var(--serif);
		font-size: 22px;
		font-style: italic;
		color: var(--ink-2);
	}

	.wall-text {
		margin-top: 1.4rem;
		color: var(--ink-2);
		text-wrap: pretty;
	}

	/* Rooms */
	.room {
		padding: 5rem clamp(1.25rem, 5vw, 4rem) 6rem;
		border-top: 1px solid var(--rule);
		transition: background-color 200ms var(--ease-out);
	}

	.sign {
		max-width: 40rem;
		margin: 0 auto 3.5rem;
		text-align: center;
	}

	.numeral {
		font-family: var(--mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--sanguine);
	}

	.sign h2 {
		margin-top: 0.4rem;
		font-family: var(--serif);
		font-size: clamp(2rem, 4vw, 2.75rem);
		line-height: 1.05;
		letter-spacing: -0.01em;
	}

	.note {
		margin-top: 0.6rem;
		font-size: 14px;
		color: var(--ink-2);
	}

	/* Works hang on a common centre line; labels sit below without moving it. */
	.wall {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		column-gap: clamp(2rem, 4vw, 3.75rem);
		row-gap: 10rem;
		max-width: 80rem;
		margin: 0 auto;
		padding-bottom: 7rem;
	}

	.triptych {
		column-gap: clamp(1.25rem, 2.5vw, 2rem);
	}

	.work {
		position: relative;
		isolation: isolate;
		width: min(var(--w), 100%);
		margin: 0;
		transition: opacity 200ms var(--ease-out);
	}

	.frame {
		position: relative;
		display: block;
		width: 100%;
		padding: 7%;
		background: var(--mat);
		cursor: zoom-in;
		box-shadow:
			0 0 0 1px rgba(80, 60, 35, 0.35),
			0 0 0 4px var(--bronze-light),
			0 0 0 5px var(--bronze),
			0 24px 30px -20px rgba(40, 28, 14, 0.55);
	}

	.picture {
		display: block;
		overflow: hidden;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
	}

	/* Archive: documents lying in a glass case. */
	.case .frame {
		padding: 8% 8% 10%;
		background: linear-gradient(180deg, #eef0ef, #e2e6e5);
		box-shadow:
			0 0 0 1px rgba(60, 70, 72, 0.35),
			0 26px 34px -24px rgba(20, 28, 30, 0.5);
	}

	.case .frame::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(
			115deg,
			rgba(255, 255, 255, 0.55),
			rgba(255, 255, 255, 0) 32%,
			rgba(255, 255, 255, 0) 72%,
			rgba(255, 255, 255, 0.28)
		);
	}

	.case .picture {
		box-shadow: 0 8px 12px -8px rgba(0, 0, 0, 0.4);
	}

	/* Museum labels */
	.label {
		position: absolute;
		top: calc(100% + 1.5rem);
		left: 0;
		width: max(100%, 15rem);
		max-width: 19rem;
		text-align: left;
	}

	.label-title {
		display: block;
		font-family: var(--serif);
		font-size: 17px;
		line-height: 1.25;
		color: var(--ink);
	}

	.label-title cite {
		font-style: italic;
	}

	.label-medium {
		display: block;
		margin-top: 0.3rem;
		font-size: 12.5px;
		line-height: 1.45;
		color: var(--ink-2);
	}

	.label-credit {
		font-size: 12.5px;
		line-height: 1.45;
		color: var(--ink-3);
	}

	.label-number {
		display: block;
		margin-top: 0.35rem;
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.06em;
		color: var(--ink-3);
	}

	.placard {
		padding-top: 0.75rem;
		border-top: 1px solid var(--rule);
	}

	/* Manuscripts: catalog entries in a vitrine */
	.catalog {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(19rem, 100%), 1fr));
		gap: 1rem;
		max-width: 54rem;
		margin: 0 auto;
		padding: 1rem;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.35));
		box-shadow:
			0 0 0 1px rgba(60, 70, 72, 0.22),
			inset 0 1px 0 #fff,
			0 26px 40px -30px rgba(20, 28, 30, 0.45);
	}

	.entry {
		box-sizing: border-box;
		display: grid;
		align-content: start;
		gap: 0.15rem;
		height: 100%;
		padding: 1.1rem 1.2rem 1rem;
		background: var(--mat);
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.06),
			0 0 0 1px rgba(0, 0, 0, 0.04);
		transition: transform 160ms var(--ease-out);
	}

	.blurb {
		margin-top: 0.45rem;
		font-size: 13.5px;
		line-height: 1.5;
		color: var(--ink-2);
		text-wrap: pretty;
	}

	.read {
		margin-top: 0.6rem;
		font-size: 12.5px;
		color: var(--sanguine);
	}

	/* Chiaroscuro: the wall dims and a pool of light settles on the work you stop at. */
	@media (hover: hover) {
		.room:has(.work:hover) {
			background-color: var(--wall-dim);
		}

		.room:has(.work:hover) .work:not(:hover) {
			opacity: 0.38;
		}

		.work::before {
			content: '';
			position: absolute;
			z-index: -1;
			inset: -30% -35% -55%;
			pointer-events: none;
			background: radial-gradient(closest-side, rgba(255, 251, 240, 0.95), rgba(255, 251, 240, 0));
			opacity: 0;
			transition: opacity 200ms var(--ease-out);
		}

		.work:hover::before {
			opacity: 1;
		}

		.entry:hover {
			transform: translateY(-2px);
		}
	}

	.exit {
		padding: 5rem 1.5rem 9rem;
		border-top: 1px solid var(--rule);
		text-align: center;
	}

	.links {
		display: flex;
		justify-content: center;
		gap: 1.25rem;
		margin-top: 0.75rem;
		font-size: 14px;
	}

	.links a {
		color: var(--ink-2);
		text-decoration: underline;
		text-decoration-color: var(--rule);
		text-underline-offset: 3px;
	}

	@media (max-width: 760px) {
		.entrance {
			grid-template-columns: 1fr;
			justify-items: center;
			text-align: center;
			min-height: 0;
			padding-top: 3rem;
		}

		.wall {
			row-gap: 3rem;
			padding-bottom: 0;
		}

		.work {
			width: min(calc(var(--w) * 1.3), 100%);
		}

		.label {
			position: static;
			width: auto;
			max-width: none;
			margin-top: 1.25rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.room,
		.work,
		.work::before,
		.entry {
			transition: none;
		}
	}
</style>
