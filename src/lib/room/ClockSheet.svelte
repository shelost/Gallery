<script>
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { HOME, MONTHS, Now, dayOfYear, loadWeather, moon, pad, relativeTo, wallClock } from '$lib/directions/today.js';
	import Heading from './Heading.svelte';

	/** @typedef {import('$lib/directions/today.js').Weather} Weather */

	/**
	 * The clock on the table, picked up: the time at home on a dial and in digits, the day and how
	 * far through the year it is, the weather outside, the moon tonight, and the time elsewhere.
	 * @type {{ hour12?: boolean }}
	 */
	let { hour12 = $bindable(true) } = $props();

	const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const ELSEWHERE = [
		{ place: 'Daejeon', zone: 'Asia/Seoul' },
		{ place: 'London', zone: 'Europe/London' },
		{ place: 'San Francisco', zone: 'America/Los_Angeles' }
	];

	const smooth = new Now(50);
	const coarse = new Now(1000);

	let weather = $state.raw(/** @type {Weather | null} */ (null));
	let failed = $state(false);

	const time = $derived(prefersReducedMotion.current ? coarse.current : smooth.current);
	const clock = $derived(time === null ? null : wallClock(time, HOME.zone));
	const seconds = $derived(clock && time !== null ? clock.second + (prefersReducedMotion.current ? 0 : (time % 1000) / 1000) : 0);
	const minutes = $derived(clock ? clock.minute + seconds / 60 : 0);
	const hours = $derived(clock ? (clock.hour % 12) + minutes / 60 : 0);
	const year = $derived(clock ? dayOfYear(clock) : null);
	const tonight = $derived(time === null ? null : moon(time));
	const weekday = $derived(clock ? DAYS[new Date(Date.UTC(clock.year, clock.month - 1, clock.day)).getUTCDay()] : '');

	/** @param {number} celsius */
	const fahrenheit = (celsius) => Math.round((celsius * 9) / 5 + 32);

	/** @param {{ hour: number, minute: number }} at */
	function digits({ hour, minute }) {
		const h = hour12 ? hour % 12 || 12 : hour;
		return `${hour12 ? h : pad(h)}:${pad(minute)}`;
	}

	onMount(() => {
		const controller = new AbortController();
		loadWeather(controller.signal)
			.then((result) => (weather = result))
			.catch(() => (failed = !controller.signal.aborted));
		return () => controller.abort();
	});
</script>

<div class="clocks">
	<Heading kicker={HOME.place} title="The time at home" hint="Everything the clock on the table knows." />

	<div class="grid">
		<figure class="dial">
			<svg viewBox="-100 -100 200 200" role="img" aria-label={clock ? `${digits(clock)} in ${HOME.place}` : 'Clock'}>
				<circle class="face" r="96" />
				{#each { length: 60 } as _, i (i)}
					<line class={['tick', i % 5 === 0 && 'hour']} y1={i % 5 === 0 ? -86 : -89} y2="-92" transform="rotate({i * 6})" />
				{/each}
				{#each [12, 3, 6, 9] as n (n)}
					{@const angle = (n / 12) * Math.PI * 2}
					<text class="numeral" x={Math.sin(angle) * 72} y={-Math.cos(angle) * 72}>{n}</text>
				{/each}
				<line class="hand hours" y1="10" y2="-48" transform="rotate({hours * 30})" />
				<line class="hand minutes" y1="12" y2="-72" transform="rotate({minutes * 6})" />
				<g transform="rotate({seconds * 6})">
					<line class="hand seconds" y1="18" y2="-80" />
					<circle class="seconds" cy="-62" r="3.2" />
				</g>
				<circle class="cap" r="4" />
			</svg>
		</figure>

		<div class="cards">
			<section class="card digital">
				<p class="label">Now</p>
				<p class="big">
					{clock ? digits(clock) : '--:--'}<span class="secs">{clock ? pad(clock.second) : '--'}</span>
					{#if hour12 && clock}<span class="meridiem">{clock.hour < 12 ? 'AM' : 'PM'}</span>{/if}
				</p>
				<div class="switch" role="radiogroup" aria-label="Clock format">
					<button type="button" role="radio" aria-checked={hour12} class={[hour12 && 'on']} onclick={() => (hour12 = true)}>12h</button>
					<button type="button" role="radio" aria-checked={!hour12} class={[!hour12 && 'on']} onclick={() => (hour12 = false)}>24h</button>
				</div>
			</section>

			<section class="card day">
				<p class="label">Today</p>
				<p class="big serif">{clock ? `${weekday}` : '—'}</p>
				<p class="small">{clock ? `${MONTHS[clock.month - 1]} ${clock.day}, ${clock.year}` : ''}</p>
				{#if year}
					<div class="bar" aria-label="Day {year.day} of {year.of}">
						<span style:width="{(year.day / year.of) * 100}%"></span>
					</div>
					<p class="small">Day {year.day} of {year.of} · {Math.round((year.day / year.of) * 100)}% through the year</p>
				{/if}
			</section>

			<section class="card weather">
				<p class="label">Outside</p>
				{#if weather}
					<p class="big"><span class="icon" aria-hidden="true">{weather.icon}</span>{fahrenheit(weather.temperature)}°</p>
					<p class="small">{weather.label} · feels like {fahrenheit(weather.feels)}°</p>
					<p class="small">High {fahrenheit(weather.high)}° · Low {fahrenheit(weather.low)}° · Wind {Math.round(weather.wind)} km/h</p>
				{:else}
					<p class="small">{failed ? 'The forecast didn’t come through.' : 'Looking out the window…'}</p>
				{/if}
			</section>

			<section class="card moon">
				<p class="label">Tonight</p>
				{#if tonight}
					<div class="phase">
						<svg viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true">
							<circle class="dark" r="1" />
							<path class="lit" d={tonight.path} />
						</svg>
						<div>
							<p class="big serif">{tonight.name}</p>
							<p class="small">{Math.round(tonight.lit * 100)}% lit</p>
						</div>
					</div>
				{/if}
			</section>
		</div>

		<section class="card elsewhere">
			<p class="label">Elsewhere</p>
			<ul>
				{#each ELSEWHERE as place (place.zone)}
					{@const there = time === null ? null : wallClock(time, place.zone)}
					<li>
						<span class="place">{place.place}</span>
						<span class="time">{there ? digits(there) : '--:--'}{hour12 && there ? (there.hour < 12 ? ' am' : ' pm') : ''}</span>
						<span class="small">{there && time !== null ? relativeTo(there.offset, time) : ''}</span>
					</li>
				{/each}
			</ul>
		</section>
	</div>
</div>

<style>
	.clocks {
		display: grid;
		gap: 1.4rem;
		padding: clamp(1.4rem, 3vw, 2.4rem);
	}

	.grid {
		display: grid;
		grid-template-columns: minmax(14rem, 22rem) minmax(0, 1fr);
		gap: 1rem;
	}

	.dial {
		margin: 0;
		padding: 1rem;
		border-radius: 1.2rem;
		background: #fbfaf7;
		box-shadow: 0 0 0 1px rgba(28, 27, 24, 0.06);
	}

	.dial svg {
		display: block;
		width: 100%;
	}

	.face {
		fill: #fff;
		stroke: rgba(28, 27, 24, 0.08);
		stroke-width: 1;
	}

	.tick {
		stroke: rgba(28, 27, 24, 0.25);
		stroke-width: 1;
	}

	.tick.hour {
		stroke: var(--ink);
		stroke-width: 2.2;
	}

	.numeral {
		fill: var(--ink-2);
		font-family: var(--serif);
		font-size: 15px;
		text-anchor: middle;
		dominant-baseline: central;
	}

	.hand {
		stroke: var(--ink);
		stroke-linecap: round;
	}

	.hours {
		stroke-width: 6;
	}

	.minutes {
		stroke-width: 3.5;
	}

	.hand.seconds {
		stroke: var(--accent);
		stroke-width: 1.4;
	}

	circle.seconds {
		fill: var(--accent);
	}

	.cap {
		fill: var(--ink);
		stroke: var(--accent);
		stroke-width: 1.5;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.card {
		display: grid;
		align-content: start;
		gap: 0.35rem;
		padding: 1rem 1.1rem;
		border-radius: 1.2rem;
		background: #fbfaf7;
		box-shadow: 0 0 0 1px rgba(28, 27, 24, 0.06);
	}

	.card p {
		margin: 0;
	}

	.label {
		color: var(--ink-3);
		font-family: var(--mono);
		font-size: 0.64rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.big {
		display: flex;
		align-items: baseline;
		gap: 0.3rem;
		color: var(--ink);
		font-family: var(--mono);
		font-size: clamp(1.6rem, 3vw, 2.2rem);
		font-variant-numeric: tabular-nums;
		line-height: 1.1;
	}

	.big.serif {
		font-family: var(--serif);
		font-size: clamp(1.3rem, 2.4vw, 1.7rem);
	}

	.secs {
		color: var(--ink-3);
		font-size: 0.5em;
	}

	.meridiem {
		color: var(--accent);
		font-size: 0.4em;
	}

	.small {
		color: var(--ink-2);
		font-size: 0.8rem;
		line-height: 1.4;
	}

	.switch {
		display: inline-flex;
		justify-self: start;
		margin-top: 0.35rem;
		padding: 0.15rem;
		border-radius: 999px;
		background: rgba(28, 27, 24, 0.06);
	}

	.switch button {
		padding: 0.25rem 0.7rem;
		border: 0;
		border-radius: 999px;
		background: none;
		color: var(--ink-2);
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.switch button.on {
		background: #fff;
		color: var(--ink);
		box-shadow: 0 1px 2px rgba(28, 27, 24, 0.15);
	}

	.bar {
		height: 0.4rem;
		margin: 0.3rem 0 0.1rem;
		overflow: hidden;
		border-radius: 999px;
		background: rgba(28, 27, 24, 0.08);
	}

	.bar span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--accent);
	}

	.icon {
		font-family: system-ui, sans-serif;
		font-size: 0.8em;
	}

	.phase {
		display: flex;
		align-items: center;
		gap: 0.9rem;
	}

	.phase svg {
		flex: none;
		width: 3.4rem;
		height: 3.4rem;
	}

	.dark {
		fill: #2a2a30;
	}

	.lit {
		fill: #f4efd9;
	}

	.elsewhere {
		grid-column: 1 / -1;
	}

	.elsewhere ul {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.elsewhere li {
		display: grid;
		gap: 0.1rem;
	}

	.place {
		color: var(--ink);
		font-size: 0.9rem;
		font-weight: 500;
	}

	.time {
		color: var(--ink);
		font-family: var(--mono);
		font-size: 1.2rem;
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 760px) {
		.grid,
		.cards,
		.elsewhere ul {
			grid-template-columns: minmax(0, 1fr);
		}

		.dial {
			max-width: 18rem;
		}
	}
</style>
