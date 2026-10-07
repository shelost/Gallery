<script>
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import Module from './Module.svelte';
	import { linkProps } from './links.js';
	import {
		BIRTHDAY,
		HOME,
		MONTHS,
		Now,
		age,
		dayOfYear,
		loadFacts,
		moon,
		pad,
		relativeTo,
		wallClock
	} from './today.js';

	/** @typedef {import('./today.js').Fact} Fact */

	/** Tenths of a second keep the age's last digits moving; the clock only needs its seconds. */
	const fine = new Now(100);
	const coarse = new Now(250);

	let facts = $state.raw(/** @type {Fact[]} */ ([]));
	let fact = $state(0);

	const time = $derived(coarse.current);
	const clock = $derived(time === null ? null : wallClock(time, HOME.zone));
	const life = $derived.by(() => {
		const at = prefersReducedMotion.current ? time : fine.current;
		return at === null ? null : age(at);
	});
	const decimals = $derived(prefersReducedMotion.current ? 2 : 9);
	const years = $derived(life ? life.years.toFixed(decimals).split('.') : ['--', '-'.repeat(decimals)]);
	const lunar = $derived(time === null ? null : moon(time));
	const date = $derived(clock ? `${MONTHS[clock.month - 1].slice(0, 3)} ${clock.day}` : '');
	/** Wikipedia's anniversaries, then how far through the year we are. */
	const reel = $derived.by(() => {
		if (!clock) return facts;
		const { day, of } = dayOfYear(clock);
		return [...facts, { year: `Day ${day}`, text: `${clock.year} is ${Math.round((day / of) * 100)}% done.` }];
	});
	const shown = $derived(reel.length ? reel[fact % reel.length] : null);

	onMount(() => {
		const controller = new AbortController();
		const { month, day } = wallClock(Date.now(), HOME.zone);
		loadFacts(month, day, controller.signal)
			.then((loaded) => (facts = loaded))
			.catch(() => {});
		return () => controller.abort();
	});
</script>

<Module area="age" label="Age" detail="Since {BIRTHDAY.year}" blink={clock?.second}>
	<p class="value">{years[0]}<span class="dim">.{years[1]}</span></p>
	<div class="meter" style:--p={life ? life.years % 1 : 0}><span></span></div>
	<p class="line">Born {BIRTHDAY.label}</p>
	<p class="line">{life ? `${life.daysLeft} days until ${life.turning}` : '—'}</p>
</Module>

<Module area="clock" label={HOME.place} detail={clock?.zone}>
	<p class="value time">
		{clock ? clock.hour % 12 || 12 : '--'}<span class="colon">:</span>{clock ? pad(clock.minute) : '--'}<small
			>{clock ? pad(clock.second) : '--'}</small
		><small>{clock ? (clock.hour < 12 ? 'AM' : 'PM') : ''}</small>
	</p>
	<p class="line">{clock ? `${clock.weekday} ${date}` : '—'}</p>
	<p class="line">{clock && time !== null ? relativeTo(clock.offset, time) : ''}</p>
	<p class="line">
		{#if lunar}
			<svg class="moon" viewBox="-1.2 -1.2 2.4 2.4" aria-hidden="true">
				<circle r="1" />
				<path d={lunar.path} />
			</svg>
			{lunar.name}, {Math.round(lunar.lit * 100)}% lit
		{/if}
	</p>
</Module>

<Module area="fact" label="On this day" detail={date}>
	{#snippet keys()}
		<button
			type="button"
			class="key"
			aria-label="Another fact"
			disabled={reel.length < 2}
			onclick={() => (fact += 1)}
		>
			<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.5 11 8l-5.5 4.5z" /></svg>
		</button>
	{/snippet}
	{#if shown}
		{#key shown.text}
			<div class="fact">
				<p class="value year">{shown.year}</p>
				<p class="text">{shown.text}</p>
			</div>
		{/key}
		<div class="foot">
			{#if shown.href}
				<a class="source" {...linkProps(shown.href)}>Wikipedia ↗</a>
			{:else}
				<span class="source">Ithaca time</span>
			{/if}
			<span class="line">{(fact % reel.length) + 1}/{reel.length}</span>
		</div>
	{:else}
		<p class="line">Tuning in…</p>
	{/if}
</Module>

<style>
	.value {
		font-size: 22px;
		font-weight: 300;
		line-height: 1;
		letter-spacing: -0.03em;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.dim,
	.line,
	small {
		color: var(--te-dim);
	}

	.line {
		font-size: 10.5px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* A recessed track: how far through this year of my life we are. */
	.meter {
		position: relative;
		height: 4px;
		margin: 0.25rem 0 0.2rem;
		border-radius: 999px;
		background: rgba(28, 27, 24, 0.08);
		box-shadow: inset 0 1px 1px rgba(28, 27, 24, 0.08);
	}

	.meter span {
		position: absolute;
		inset: 0 auto 0 0;
		width: calc(var(--p) * 100%);
		border-radius: inherit;
		background: var(--te-orange);
	}

	.time {
		font-size: 30px;
		margin-bottom: 0.15rem;
	}

	.time small {
		margin-left: 0.3em;
		font-size: 11px;
		letter-spacing: 0.04em;
	}

	.colon {
		animation: colon 1s steps(1, end) infinite;
	}

	@keyframes colon {
		50% {
			opacity: 0.2;
		}
	}

	.moon {
		display: inline-block;
		width: 10px;
		height: 10px;
		margin-right: 0.35em;
		vertical-align: -1px;
	}

	.moon circle {
		fill: rgba(28, 27, 24, 0.1);
	}

	.moon path {
		fill: var(--te-lit);
	}

	.fact {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.8rem;
		align-items: start;
		animation: swap 220ms var(--ease-out) both;
	}

	.year {
		font-size: 18px;
		color: var(--te-orange);
	}

	.text {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;
		font-size: 12.5px;
		line-height: 1.32;
		letter-spacing: -0.005em;
		text-wrap: pretty;
	}

	.foot {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		margin-top: auto;
	}

	.source {
		font-size: 11px;
		color: var(--te-dim);
	}

	a.source:hover {
		color: var(--accent);
	}

	@keyframes swap {
		from {
			opacity: 0;
			transform: translateY(3px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.colon,
		.fact {
			animation: none;
		}
	}
</style>
