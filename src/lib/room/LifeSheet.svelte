<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { LIFE, SCHOOLS } from '$lib/directions/content.js';
	import { BIRTHDAY, MONTHS, Now, age } from '$lib/directions/today.js';
	import Heading from './Heading.svelte';

	/**
	 * The age counter, picked up: a life of eighty years as a dot for every month, a year of it to a
	 * row and forty years to a column. The months gone are filled, this one fills as it goes, and the
	 * ones where something began are marked. Pointing at any month says where I was then.
	 * @typedef {{ id: string, title: string, kicker: string, year: string, from: number, until: number | null, grade?: number }} Chapter
	 */

	const YEARS = 80;
	const COLUMNS = 2;
	/** A row is a year of my life, so it starts in the month I was born. */
	const INITIALS = Array.from({ length: 12 }, (_, i) => MONTHS[(BIRTHDAY.month - 1 + i) % 12][0]);

	/** 1st, 2nd, 3rd, and th from there, as far as school grades go. @param {number} n */
	const ordinal = (n) => `${n}${['th', 'st', 'nd', 'rd'][n] ?? 'th'}`;

	/** Months since the month I was born. @param {[number, number]} date a year, and a month from 1 to 12 */
	const monthsTo = ([year, month]) => (year - BIRTHDAY.year) * 12 + month - BIRTHDAY.month;

	/** Birth, school, and everything on the life shelf, in the order they began. @type {Chapter[]} */
	const CHAPTERS = [
		{ id: 'born', title: 'Born', kicker: 'Daejeon', year: BIRTHDAY.label, from: 0, until: 0 },
		...SCHOOLS.map((school) => {
			const from = monthsTo(school.from);
			const until = monthsTo(school.until);
			return {
				id: school.id,
				title: school.title,
				kicker: `${ordinal(school.grade)}–${ordinal(school.grade + Math.floor((until - from) / 12))} grade`,
				year: `${school.from[0]}–${String(school.until[0]).slice(-2)}`,
				grade: school.grade,
				from,
				until
			};
		}),
		// The life shelf only has years, so each is read as a school year, September through August.
		...LIFE.map((job) => ({
			id: job.id,
			title: job.title,
			kicker: job.kicker,
			year: job.year,
			from: monthsTo([job.from, 9]),
			until: job.until === null ? null : monthsTo([job.until, 8])
		}))
	].toSorted((a, b) => a.from - b.from);

	const STARTS = new Set(CHAPTERS.map((chapter) => chapter.from));

	const fine = new Now(100);
	const coarse = new Now(1000);

	/** The chapter pointed at in the list, and the month pointed at in the grid. */
	let focus = $state(/** @type {string | null} */ (null));
	let pointed = $state(/** @type {number | null} */ (null));

	const time = $derived(prefersReducedMotion.current ? coarse.current : fine.current);
	const life = $derived(time === null ? null : age(time));
	/** This month, counted from birth, and how much of it has gone. */
	const month = $derived.by(() => {
		if (time === null) return null;
		const date = new Date(time);
		const start = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
		const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
		return { at: monthsTo([date.getFullYear(), date.getMonth() + 1]), gone: (time - start) / (end - start) };
	});
	const now = $derived(month ? month.at : -1);
	const fill = $derived(month ? `${month.gone * 100}%` : '0%');

	/** @param {Chapter} chapter @param {number} at months since I was born */
	const during = (chapter, at) => at >= chapter.from && at <= (chapter.until ?? now);

	/** What's lit: the chapter pointed at in the list, or everything going on in the month pointed at. */
	const lit = $derived.by(() => {
		if (focus !== null) return CHAPTERS.filter((chapter) => chapter.id === focus);
		const at = pointed;
		return at === null ? [] : CHAPTERS.filter((chapter) => during(chapter, at));
	});

	/** The month the readout tells about: the one pointed at, where a chapter began, or this one. */
	const shown = $derived(pointed ?? CHAPTERS.find((chapter) => chapter.id === focus)?.from ?? (now < 0 ? null : now));
	const happening = $derived(shown === null ? [] : CHAPTERS.filter((chapter) => during(chapter, shown)));

	/** @param {number} at */
	const stage = (at) => (at < now ? 'past' : at === now ? 'now' : 'ahead');

	/** October 2026, and how old I was. @param {number} at months since I was born */
	function when(at) {
		const months = BIRTHDAY.month - 1 + at;
		return `${MONTHS[months % 12]} ${BIRTHDAY.year + Math.floor(months / 12)} · age ${Math.floor(at / 12)}`;
	}

	/** A chapter as it was a month in, down to the grade at school. @param {Chapter} chapter @param {number} at */
	const doing = (chapter, at) =>
		chapter.grade === undefined
			? chapter.title
			: `${chapter.title}, ${ordinal(chapter.grade + Math.floor((at - chapter.from) / 12))} grade`;

	/** Points at the dot under the pointer, keeping the last one while it crosses a gap. @param {PointerEvent} event */
	function point(event) {
		const at = event.target instanceof HTMLElement ? event.target.dataset.month : undefined;
		if (at !== undefined) pointed = Number(at);
	}
</script>

<div class="life">
	<Heading kicker="Since {BIRTHDAY.year}" title="Eighty years" hint="A dot for every month. Point at one to see what happened." />

	<div class="counter" aria-live="off">
		<span class="whole">{life ? Math.floor(life.years) : '--'}</span>
		<span class="part">{life ? life.years.toFixed(prefersReducedMotion.current ? 2 : 8).split('.')[1] : '--------'}</span>
		<span class="caption">
			{#if life}
				years old · {((life.years / YEARS) * 100).toFixed(1)}% of eighty · turning {life.turning} in {life.daysLeft}
				{life.daysLeft === 1 ? 'day' : 'days'}
			{/if}
		</span>
	</div>

	<div class="body">
		<figure class="chart">
			<div
				class="grid"
				role="img"
				aria-label="Eighty years, a dot for every month"
				style:--columns={COLUMNS}
				onpointerover={point}
				onpointerleave={() => (pointed = null)}
			>
				{#each { length: COLUMNS } as _, column (column)}
					<div class="column">
						<div class="months" aria-hidden="true">
							<span></span>
							{#each INITIALS as initial, i (i)}
								<span>{initial}</span>
							{/each}
						</div>
						{#each { length: YEARS / COLUMNS } as _, row (row)}
							{@const year = column * (YEARS / COLUMNS) + row}
							<div class={['year', year % 10 === 0 && 'decade']}>
								<span class="label">{year % 5 === 0 ? year : ''}</span>
								{#each { length: 12 } as _, i (i)}
									{@const at = year * 12 + i}
									<span
										class={['dot', stage(at), STARTS.has(at) && 'start', lit.some((chapter) => during(chapter, at)) && 'lit']}
										style:--fill={at === now ? fill : undefined}
										data-month={at}
									></span>
								{/each}
							</div>
						{/each}
					</div>
				{/each}
			</div>
			<figcaption class="readout">
				{#if shown !== null}
					<span class="when">{when(shown)}</span>
					{#each happening as chapter (chapter.id)}
						<span class="doing">{doing(chapter, shown)}</span>
					{/each}
				{/if}
			</figcaption>
		</figure>

		<div class="side">
			<ol class="chapters">
				{#each CHAPTERS as chapter (chapter.id)}
					<li>
						<button
							type="button"
							class={[lit.includes(chapter) && 'on']}
							onpointerenter={() => (focus = chapter.id)}
							onpointerleave={() => (focus = null)}
							onfocus={() => (focus = chapter.id)}
							onblur={() => (focus = null)}
						>
							<span class="age">{Math.floor(chapter.from / 12)}</span>
							<span class="what">
								<span class="title">{chapter.title}</span>
								<span class="kicker">{chapter.kicker}</span>
							</span>
							<span class="dates">{chapter.year}</span>
						</button>
					</li>
				{/each}
			</ol>

			<p class="legend" aria-hidden="true">
				<span><i class="dot past"></i>Gone</span>
				<span><i class="dot now" style:--fill="50%"></i>This month</span>
				<span><i class="dot ahead"></i>Ahead</span>
				<span><i class="dot past start"></i>Something began</span>
			</p>
		</div>
	</div>
</div>

<style>
	.life {
		display: grid;
		gap: 1.3rem;
		padding: clamp(1.4rem, 3vw, 2.4rem);
	}

	.counter {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0 0.1rem;
		font-family: var(--mono);
		font-variant-numeric: tabular-nums;
	}

	.whole {
		color: var(--ink);
		font-size: clamp(3rem, 7vw, 4.6rem);
		line-height: 1;
	}

	.part {
		color: var(--ink-3);
		font-size: clamp(1.4rem, 3vw, 2rem);
	}

	.part::before {
		content: '.';
	}

	.caption {
		flex-basis: 100%;
		margin-top: 0.4rem;
		color: var(--ink-2);
		font-family: var(--sans, inherit);
		font-size: 0.85rem;
	}

	.body {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: start;
		gap: clamp(1.4rem, 4vw, 3rem);
	}

	.chart {
		display: grid;
		gap: 0.8rem;
		width: 19rem;
		margin: 0;
	}

	/* A year to a row from the month I was born, forty years to a column, a little room at each decade. */
	.grid {
		display: grid;
		grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
		gap: 1.2rem;
	}

	.column {
		display: grid;
		gap: 0.1rem;
	}

	.months,
	.year {
		display: grid;
		grid-template-columns: 1.2rem repeat(12, minmax(0, 1fr));
		align-items: center;
		gap: 0.1rem;
	}

	.months {
		margin-bottom: 0.15rem;
		color: var(--ink-3);
		font-family: var(--mono);
		font-size: 0.48rem;
		line-height: 1;
		text-align: center;
	}

	.year.decade {
		margin-top: 0.35rem;
	}

	.months + .year {
		margin-top: 0;
	}

	.label {
		padding-right: 0.25rem;
		color: var(--ink-3);
		font-family: var(--mono);
		font-size: 0.55rem;
		line-height: 1;
		text-align: right;
		opacity: 0.55;
	}

	.decade .label {
		opacity: 1;
	}

	.dot {
		--fill: 0%;
		display: block;
		width: 100%;
		aspect-ratio: 1;
		border-radius: 50%;
		transition:
			transform 160ms var(--ease-out),
			background-color 160ms var(--ease-out);
	}

	.dot.past {
		background: var(--ink);
	}

	.dot.ahead {
		box-shadow: inset 0 0 0 1px rgba(28, 27, 24, 0.2);
	}

	.dot.start {
		background: var(--accent);
	}

	.dot.now {
		background: linear-gradient(0deg, var(--accent) var(--fill), transparent var(--fill));
		box-shadow: inset 0 0 0 1.5px var(--accent);
		animation: breathe 2.4s ease-in-out infinite;
	}

	.dot.lit {
		transform: scale(1.12);
	}

	.dot.lit.past {
		background: var(--accent);
	}

	.grid .dot:hover {
		position: relative;
		z-index: 1;
		transform: scale(1.7);
	}

	/* Three lines tall whatever it says, so pointing around doesn't move the page. */
	.readout {
		display: flex;
		flex-wrap: wrap;
		align-content: start;
		gap: 0.15rem 0.5rem;
		min-height: 3.3rem;
		color: var(--ink-2);
		font-size: 0.82rem;
	}

	.when {
		flex-basis: 100%;
		color: var(--ink);
		font-family: var(--mono);
		font-size: 0.7rem;
		letter-spacing: 0.02em;
	}

	.doing + .doing::before {
		content: '·';
		margin-right: 0.5rem;
		color: var(--ink-3);
	}

	.side {
		display: grid;
		align-content: start;
		gap: 1.4rem;
	}

	.chapters {
		display: grid;
		gap: 0.1rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.chapters button {
		display: grid;
		grid-template-columns: 1.6rem minmax(0, 1fr) 4.8rem;
		align-items: baseline;
		gap: 0.6rem;
		width: 100%;
		padding: 0.42rem 0.6rem;
		border: 0;
		border-radius: 0.7rem;
		background: none;
		color: inherit;
		font: inherit;
		line-height: 1.3;
		text-align: left;
		cursor: default;
		transition: background-color 160ms var(--ease-out);
	}

	.chapters button.on {
		background: rgba(255, 0, 76, 0.07);
	}

	.age {
		color: var(--accent);
		font-family: var(--mono);
		font-size: 0.78rem;
	}

	.what {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0 0.45rem;
		min-width: 0;
	}

	.title {
		color: var(--ink);
		font-size: 0.9rem;
		font-weight: 500;
	}

	.kicker {
		color: var(--ink-3);
		font-size: 0.78rem;
	}

	.dates {
		color: var(--ink-3);
		font-family: var(--mono);
		font-size: 0.66rem;
		text-align: right;
		white-space: nowrap;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem 1.4rem;
		margin: 0;
		padding: 0 0.6rem;
		color: var(--ink-3);
		font-size: 0.78rem;
	}

	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.legend .dot {
		display: inline-block;
		width: 0.7rem;
		animation: none;
	}

	@keyframes breathe {
		50% {
			box-shadow:
				inset 0 0 0 1.5px var(--accent),
				0 0 0 2.5px rgba(255, 0, 76, 0.18);
		}
	}

	@media (max-width: 720px) {
		.body {
			grid-template-columns: minmax(0, 1fr);
		}

		.chart {
			width: 100%;
		}

		.grid {
			gap: 0.9rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dot {
			transition: none;
			animation: none;
		}
	}
</style>
