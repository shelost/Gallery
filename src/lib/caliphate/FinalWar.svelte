<script>
	import {
		AMERICA_COMEBACK_MARKS,
		CHINA_STEAMROLL_MARKS,
		DUAL_600_MARKS,
		HERACLIUS_MARKS,
		TODAY_EAST_ASIA_MARKS,
		WAR_620_MARKS
	} from './empire.js';
	import Flag from './Flag.svelte';
	import Inset from './Inset.svelte';
	import { MARCH_AMERICA_BACK, MARCH_CHINA_WAR, MARCH_HERACLIUS, MARCH_PERSIA_WAR } from './marches.js';
	import { antique, modern } from './sheets.js';

	const FRAME = { lon0: 18, lon1: 62, lat0: 20, lat1: 46 };
	const CHAIN = { ...modern, lat0: 4 };

	/**
	 * Year-by-year border change. Each step's `from` is the previous colored map, so replay
	 * always starts with a painted base and grows into the next border. `spread` is the way
	 * the armies moved: Persia west into Rome, Heraclius east into Persia.
	 * @type {{
	 *   year: number,
	 *   modernWhen: string,
	 *   line: string,
	 *   antique: { from: import('./empire.js').Region[], to: import('./empire.js').Region[], spread?: import('./sheets.js').Spread, marches?: import('./marches.js').March[] },
	 *   modern: { from: import('./empire.js').Region[], to: import('./empire.js').Region[], spread?: import('./sheets.js').Spread, marches?: import('./marches.js').March[] }
	 * }[]}
	 */
	const STEPS = [
		{
			year: 602,
			modernWhen: 'today',
			line: 'The border when the war starts, with client states between the two powers.',
			antique: { from: DUAL_600_MARKS, to: DUAL_600_MARKS },
			modern: { from: TODAY_EAST_ASIA_MARKS, to: TODAY_EAST_ASIA_MARKS }
		},
		{
			year: 614,
			modernWhen: 'the first island',
			line: 'Persia takes Jerusalem. In the story, China pulls the first island chain into its orbit.',
			antique: { from: DUAL_600_MARKS, to: WAR_620_MARKS, spread: 'west', marches: MARCH_PERSIA_WAR },
			modern: { from: TODAY_EAST_ASIA_MARKS, to: CHINA_STEAMROLL_MARKS, spread: 'east', marches: MARCH_CHINA_WAR }
		},
		{
			year: 620,
			modernWhen: 'the steamroll',
			line: 'Persia holds Egypt, and the island chain leans toward China. At this point it looks like the other side has lost.',
			antique: { from: WAR_620_MARKS, to: WAR_620_MARKS },
			modern: { from: CHINA_STEAMROLL_MARKS, to: CHINA_STEAMROLL_MARKS }
		},
		{
			year: 627,
			modernWhen: 'the comeback',
			line: 'Heraclius pushes into Mesopotamia, and America wins its allies back.',
			antique: { from: WAR_620_MARKS, to: HERACLIUS_MARKS, spread: 'east', marches: MARCH_HERACLIUS },
			modern: { from: CHINA_STEAMROLL_MARKS, to: AMERICA_COMEBACK_MARKS, spread: 'west', marches: MARCH_AMERICA_BACK }
		},
		{
			year: 628,
			modernWhen: 'the settled border',
			line: 'Both sides agree to the old border, and the map looks like 602 again.',
			antique: { from: HERACLIUS_MARKS, to: DUAL_600_MARKS, spread: 'west' },
			modern: { from: AMERICA_COMEBACK_MARKS, to: AMERICA_COMEBACK_MARKS }
		}
	];

	let index = $state(0);
	const step = $derived(STEPS[index]);
</script>

<div class="war">
	<div class="years" role="group" aria-label="Year by year">
		{#each STEPS as item, i (item.year)}
			<button
				type="button"
				class="pill"
				aria-pressed={i === index}
				title={item.modernWhen}
				onclick={() => (index = i)}
			>
				{item.year}
			</button>
		{/each}
	</div>

	<p class="line">{step.line}</p>
	<p class="key"><span class="gold">Gold</span> advances. <span class="red">Red</span> pushes back.</p>

	<div class="row">
		<article class="antique">
			<header>
				<strong>
					<Flag id="kaviani" />
					<Flag id="vexillum" />
					{step.year}
				</strong>
				<span>Rome and Persia</span>
			</header>
			{#key `a-${step.year}`}
				<Inset
					map={{
						world: antique,
						star: false,
						marks: step.antique.to,
						fromMarks: step.antique.from,
						spread: step.antique.spread,
						marches: step.antique.marches,
						focus: ['persia', 'romeEast'],
						frame: FRAME,
						autoplay: step.antique.from !== step.antique.to
					}}
					label="Final war, {step.year}"
				/>
			{/key}
		</article>
		<article class="fiction">
			<header>
				<strong>
					<Flag id="us" />
					<Flag id="cn" />
					{step.modernWhen}
				</strong>
				<span>America and China</span>
			</header>
			{#key `m-${step.year}`}
				<Inset
					map={{
						world: CHAIN,
						star: false,
						marks: step.modern.to,
						fromMarks: step.modern.from,
						spread: step.modern.spread,
						marches: step.modern.marches,
						focus: ['persia', 'romeEast'],
						autoplay: step.modern.from !== step.modern.to
					}}
					label="Final war, {step.modernWhen}"
				/>
			{/key}
		</article>
	</div>
</div>

<style>
	.war {
		margin: 0.75rem 0 1.25rem;
	}

	.years {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem;
		margin-bottom: 0.85rem;
	}

	.pill {
		padding: 0.35rem 0.85rem;
		border: 1px solid color-mix(in srgb, var(--ink, #1c1b18) 18%, transparent);
		border-radius: 999px;
		background: transparent;
		color: var(--ink-2, #3a3834);
		cursor: pointer;
		font: inherit;
		font-size: 0.78rem;
		font-variant-numeric: tabular-nums;
		transition:
			background 160ms cubic-bezier(0.22, 0.61, 0.36, 1),
			color 160ms cubic-bezier(0.22, 0.61, 0.36, 1);
	}

	.pill:hover {
		background: color-mix(in srgb, var(--ink, #1c1b18) 6%, transparent);
	}

	.pill[aria-pressed='true'] {
		border-color: var(--ink, #1c1b18);
		background: var(--ink, #1c1b18);
		color: var(--paper, #f6f4ef);
	}

	.line {
		margin: 0.35rem 0 0.35rem;
		font-family: Iowan Old Style, Palatino, Georgia, serif;
		font-size: 1.02rem;
		font-style: italic;
		text-align: center;
	}

	.key {
		margin: 0 0 0.85rem;
		color: var(--ink-3, #6d6860);
		font-size: 0.78rem;
		text-align: center;
	}

	.gold {
		color: #8a5a12;
	}

	.red {
		color: #8e1028;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.9rem;
	}

	article {
		min-width: 0;
	}

	header {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.35rem;
		font-size: 0.82rem;
	}

	header strong {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	header span {
		color: var(--ink-3, #6d6860);
		font-style: italic;
	}

	@media (max-width: 720px) {
		.row {
			grid-template-columns: 1fr;
		}
	}
</style>
