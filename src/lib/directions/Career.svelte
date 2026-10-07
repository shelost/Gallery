<script>
	import Module from './Module.svelte';
	import { Now, fractionalYear } from './today.js';

	/**
	 * Life as a tape: every stretch on one track from the first year to the last, with a
	 * playhead at today. The one that's still going records up to the playhead. Hovering a
	 * stretch lights it across the page; clicking opens it.
	 * @type {{
	 *   jobs: import('./content.js').Job[],
	 *   area?: string,
	 *   active?: string | null,
	 *   onhover?: (id: string, hovering: boolean) => void,
	 *   onpick?: (job: import('./content.js').Job) => void
	 * }}
	 */
	let { jobs, area, active = null, onhover, onpick } = $props();

	const now = new Now(60_000);

	const first = $derived(Math.min(...jobs.map((job) => job.from)));
	const last = $derived(Math.max(...jobs.map((job) => job.until ?? job.from + 1)));
	const years = $derived(Array.from({ length: last - first + 1 }, (_, i) => first + i));
	const today = $derived(now.current === null ? null : fractionalYear(now.current));

	/** Where a year falls along the tape, from 0 to 1. @param {number} year */
	function at(year) {
		return (year - first) / (last - first);
	}

	/** Where the tape is too narrow to read, it scrolls, and it starts at today. @param {HTMLElement} node */
	function rewind(node) {
		node.scrollLeft = node.scrollWidth;
	}
</script>

<Module {area} label="Life" detail="{first} – now">
	<div class="reel" {@attach rewind}>
		<div class="tape" style:--years={years.length}>
			<ul class="jobs">
				{#each jobs as job (job.id)}
					<li style:--from={at(job.from)} style:--to={at(job.until ?? today ?? job.from)}>
						<button
							type="button"
							class={['job', job.until === null && 'live', job.id === active && 'on']}
							onclick={() => onpick?.(job)}
							onpointerenter={() => onhover?.(job.id, true)}
							onpointerleave={() => onhover?.(job.id, false)}
							onfocus={() => onhover?.(job.id, true)}
							onblur={() => onhover?.(job.id, false)}
						>
							<span class="name">{job.title}</span>
							<span class="years">{job.year}</span>
						</button>
					</li>
				{/each}
			</ul>
			<ol class="ruler" aria-hidden="true">
				{#each years as year (year)}
					<li style:--at={at(year)}>’{String(year).slice(2)}</li>
				{/each}
			</ol>
			{#if today !== null}
				<span class="playhead" style:--at={at(today)} aria-hidden="true"></span>
			{/if}
		</div>
	</div>
</Module>

<style>
	.reel {
		flex: 1;
		display: flex;
		min-height: 0;
		padding-top: 0.2rem;
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: none;
	}

	.reel::-webkit-scrollbar {
		display: none;
	}

	.tape {
		position: relative;
		flex: 1;
		min-width: calc(var(--years) * 4.4rem);
		display: grid;
		grid-template-rows: minmax(2.4rem, 1fr) auto;
		gap: 0.45rem;
		margin: 0.1rem 0.4rem 0;
	}

	.jobs {
		position: relative;
	}

	.jobs li {
		position: absolute;
		top: 0;
		bottom: 0;
		left: calc(var(--from) * 100%);
		width: calc((var(--to) - var(--from)) * 100%);
		transition: width 900ms var(--ease-out);
	}

	.job {
		position: absolute;
		inset: 0 3px 0 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.15rem;
		min-width: 3.4rem;
		padding: 0 0.55rem;
		border-radius: 10px;
		background: linear-gradient(180deg, #fff, #f6f5f2);
		box-shadow:
			0 0 0 1px rgba(28, 27, 24, 0.07),
			0 1px 2px rgba(28, 27, 24, 0.08),
			0 6px 12px -8px rgba(28, 27, 24, 0.25);
		color: var(--te-lit);
		white-space: nowrap;
		transition:
			background-color 150ms var(--ease-out),
			color 150ms var(--ease-out),
			transform 150ms var(--ease-out);
	}

	.job:hover,
	.job.on {
		background: var(--ink);
		color: #fff;
		transform: translateY(-1px);
	}

	/* Still recording: the stripes run toward the playhead. */
	.live {
		background: repeating-linear-gradient(
				-45deg,
				var(--accent) 0 5px,
				color-mix(in srgb, var(--accent), #000 12%) 5px 10px
			)
			0 0 / 14.14px 14.14px;
		color: #fff;
		animation: record 700ms linear infinite;
	}

	.live:hover,
	.live.on {
		background: var(--te-orange);
	}

	@keyframes record {
		to {
			background-position: 14.14px 0;
		}
	}

	.name {
		font-family: var(--sans);
		font-size: 12.5px;
		line-height: 1;
		letter-spacing: -0.01em;
	}

	.years {
		font-size: 9.5px;
		line-height: 1;
		opacity: 0.72;
	}

	.ruler {
		position: relative;
		height: 0.9rem;
	}

	.ruler li {
		position: absolute;
		left: calc(var(--at) * 100%);
		bottom: 0;
		transform: translateX(-50%);
		font-size: 9px;
		line-height: 1;
		color: var(--te-dim);
	}

	.ruler li::before {
		content: '';
		position: absolute;
		left: 50%;
		top: -0.35rem;
		height: 0.22rem;
		border-left: 1px solid var(--te-dim);
	}

	.playhead {
		position: absolute;
		top: -0.25rem;
		bottom: 1.1rem;
		left: calc(var(--at) * 100%);
		border-left: 1.5px solid var(--te-orange);
		pointer-events: none;
	}

	.playhead::before {
		content: '';
		position: absolute;
		top: -1px;
		left: -5.5px;
		border: 5px solid transparent;
		border-top: 6px solid var(--te-orange);
	}

	/* The narrow tape opens at today, so a stretch cut off on the left keeps its label at its right end. */
	@media (max-width: 560px) {
		.job {
			align-items: flex-end;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.jobs li {
			transition: none;
		}

		.live {
			animation: none;
		}
	}
</style>
