<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { LIFE } from '$lib/directions/content.js';
	import { BIRTHDAY, Now, age } from '$lib/directions/today.js';
	import Heading from './Heading.svelte';

	/**
	 * The age counter, picked up: a life of eighty years as a grid of dots, a decade to a row. The
	 * years gone are filled, this one fills as it goes, and the ones I remember are marked.
	 */

	const YEARS = 80;
	const DECADE = 10;

	/** Birth, then everything on the life shelf, at the age it started. */
	const EVENTS = [
		{ id: 'born', title: 'Born', detail: `Daejeon, ${BIRTHDAY.label}`, from: 0, until: 0 },
		...LIFE.map((entry) => ({
			id: entry.id,
			title: entry.title,
			detail: `${entry.kicker} · ${entry.year}`,
			from: entry.from - BIRTHDAY.year,
			until: (entry.until ?? new Date().getFullYear()) - BIRTHDAY.year
		}))
	];

	const fine = new Now(100);
	const coarse = new Now(1000);

	let focus = $state(/** @type {string | null} */ (null));

	const life = $derived.by(() => {
		const at = prefersReducedMotion.current ? coarse.current : fine.current;
		return at === null ? null : age(at);
	});
	const now = $derived(life ? Math.floor(life.years) : -1);
	const marked = $derived(EVENTS.find((event) => event.id === focus) ?? null);

	/** @param {number} year */
	function stage(year) {
		if (year < now) return 'past';
		if (year === now) return 'now';
		return 'ahead';
	}

	/** @param {number} year */
	const eventAt = (year) => EVENTS.find((event) => event.from === year);

	/** @param {number} year */
	const inSpan = (year) => marked !== null && year >= marked.from && year <= marked.until;
</script>

<div class="life">
	<Heading kicker="Since {BIRTHDAY.year}" title="Eighty years" hint="A dot for every year. Point at one to see what happened." />

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
		<div class="grid" role="list" aria-label="Eighty years, one dot each">
			{#each { length: YEARS / DECADE } as _, row (row)}
				<span class="decade" aria-hidden="true">{row * DECADE}</span>
				{#each { length: DECADE } as _, col (col)}
					{@const year = row * DECADE + col}
					{@const event = eventAt(year)}
					<span
						role="listitem"
						class={['dot', stage(year), event && 'event', inSpan(year) && 'span', event?.id === focus && 'focus']}
						style:--fill={year === now && life ? `${(life.years - now) * 100}%` : undefined}
						title="{BIRTHDAY.year + year}, age {year}{event ? ` · ${event.title}` : ''}"
						aria-label="{BIRTHDAY.year + year}, age {year}{event ? `, ${event.title}` : ''}"
						onpointerenter={() => event && (focus = event.id)}
						onpointerleave={() => event && (focus = null)}
					></span>
				{/each}
			{/each}
		</div>

		<ol class="events">
			{#each EVENTS as event (event.id)}
				<li>
					<button
						type="button"
						class={[focus === event.id && 'on']}
						onpointerenter={() => (focus = event.id)}
						onpointerleave={() => (focus = null)}
						onfocus={() => (focus = event.id)}
						onblur={() => (focus = null)}
					>
						<span class="age">{event.from}</span>
						<span class="what">
							<span class="title">{event.title}</span>
							<span class="detail">{event.detail}</span>
						</span>
					</button>
				</li>
			{/each}
		</ol>
	</div>

	<p class="legend" aria-hidden="true">
		<span><i class="dot past"></i>Gone</span>
		<span><i class="dot now" style:--fill="50%"></i>This year</span>
		<span><i class="dot ahead"></i>Ahead</span>
		<span><i class="dot ahead event"></i>Something happened</span>
	</p>
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

	.grid {
		display: grid;
		grid-template-columns: 2rem repeat(10, 1.7rem);
		align-items: center;
		gap: 0.55rem 0.5rem;
	}

	.decade {
		color: var(--ink-3);
		font-family: var(--mono);
		font-size: 0.66rem;
		text-align: right;
	}

	.dot {
		--fill: 0%;
		position: relative;
		display: inline-block;
		width: 1.7rem;
		aspect-ratio: 1;
		border-radius: 50%;
		transition:
			transform 200ms var(--ease-out),
			box-shadow 200ms var(--ease-out);
	}

	.dot.past {
		background: var(--ink);
	}

	.dot.now {
		background: linear-gradient(0deg, var(--accent) var(--fill), transparent var(--fill));
		box-shadow: inset 0 0 0 2px var(--accent);
		animation: breathe 2.4s ease-in-out infinite;
	}

	.dot.ahead {
		box-shadow: inset 0 0 0 1.5px rgba(28, 27, 24, 0.2);
	}

	/* A marked year wears a ring of its own, outside the dot. */
	.dot.event::after {
		content: '';
		position: absolute;
		inset: -4px;
		border: 2px solid var(--accent);
		border-radius: 50%;
	}

	.dot.span {
		transform: scale(1.12);
	}

	.dot.span.past {
		background: var(--accent);
	}

	.dot.focus {
		transform: scale(1.25);
	}

	.events {
		display: grid;
		gap: 0.2rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.events button {
		display: grid;
		grid-template-columns: 2.2rem minmax(0, 1fr);
		align-items: baseline;
		width: 100%;
		padding: 0.45rem 0.6rem;
		border: 0;
		border-radius: 0.7rem;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: default;
		transition: background-color 160ms var(--ease-out);
	}

	.events button.on {
		background: rgba(255, 0, 76, 0.07);
	}

	.age {
		color: var(--accent);
		font-family: var(--mono);
		font-size: 0.8rem;
	}

	.what {
		display: grid;
	}

	.title {
		color: var(--ink);
		font-size: 0.92rem;
		font-weight: 500;
	}

	.detail {
		color: var(--ink-3);
		font-size: 0.78rem;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem 1.4rem;
		margin: 0;
		color: var(--ink-3);
		font-size: 0.78rem;
	}

	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.legend .dot {
		width: 0.8rem;
		animation: none;
	}

	.legend .dot.event::after {
		inset: -3px;
		border-width: 1.5px;
	}

	@keyframes breathe {
		50% {
			box-shadow:
				inset 0 0 0 2px var(--accent),
				0 0 0 5px rgba(255, 0, 76, 0.14);
		}
	}

	@media (max-width: 720px) {
		.body {
			grid-template-columns: minmax(0, 1fr);
		}

		.grid {
			grid-template-columns: 1.6rem repeat(10, minmax(0, 1.5rem));
			gap: 0.45rem 0.35rem;
		}

		.dot {
			width: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dot {
			transition: none;
			animation: none;
		}
	}
</style>
