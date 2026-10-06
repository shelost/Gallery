<script>
	import { BRUSHES, INKS, InkCanvas, Inkstone } from '$lib/sveltebrush';
	import '$lib/sveltebrush/ui/paper.css';
	import { linkProps } from '$lib/directions/links.js';

	/**
	 * The calligraphy set on the table, picked up: a sheet of hanji, the inkstone, and a few
	 * brushes from sveltebrush, with a way through to the full studio.
	 */

	const PHRASES = ['永', '風林火山', '바람이 분다', '龍', '사랑해'];
	const PADDING = { top: 36, right: 132, bottom: 36, left: 36 };

	let brushes = $state(structuredClone(BRUSHES));
	let selected = $state(BRUSHES[0].id);
	const brush = $derived(brushes.find((entry) => entry.id === selected) ?? brushes[0]);
	let color = $state(INKS[0].color);
	let ink = $state(1);
	let history = $state({ undo: 0, redo: 0 });
	let strokes = $state(0);
	/** @type {ReturnType<typeof InkCanvas> | undefined} */
	let canvas = $state();

	/** @param {string} text */
	function write(text) {
		canvas?.clear();
		canvas?.write(text, { padding: PADDING });
	}

	/** Writes the first character once the sheet has finished growing in. */
	$effect(() => {
		if (!canvas) return;
		const timer = setTimeout(() => write(PHRASES[0]), 520);
		return () => {
			clearTimeout(timer);
			canvas?.stop();
		};
	});
</script>

<div class="desk sb-ui">
	<header>
		<div>
			<p class="kicker">Sveltebrush</p>
			<h2>Ink brush &amp; calligraphy</h2>
			<p class="hint">Write on the paper, or let it write a phrase for you.</p>
		</div>
		<a class="studio" {...linkProps('/brush')}>Open the studio</a>
	</header>

	<div class="paper sb-paper">
		<div class="stage">
			<InkCanvas bind:this={canvas} bind:ink bind:history bind:strokes {brush} {color} />
		</div>
		<div class="well">
			<Inkstone level={ink} {color} onload={(amount) => canvas?.load(amount)} onset={(level) => canvas?.dip(level)} />
		</div>
	</div>

	<div class="tools">
		<div class="group" role="radiogroup" aria-label="Brush">
			{#each brushes as entry (entry.id)}
				<button
					type="button"
					role="radio"
					class={['chip', selected === entry.id && 'on']}
					aria-checked={selected === entry.id}
					onclick={() => (selected = entry.id)}
				>
					{entry.name}
				</button>
			{/each}
		</div>

		<div class="group" role="radiogroup" aria-label="Ink">
			{#each INKS as entry (entry.color)}
				<button
					type="button"
					role="radio"
					class={['swatch', color === entry.color && 'on']}
					style:--swatch={entry.color}
					aria-checked={color === entry.color}
					aria-label={entry.name}
					title={entry.name}
					onclick={() => (color = entry.color)}
				></button>
			{/each}
		</div>

		<div class="group phrases" aria-label="Write a phrase">
			{#each PHRASES as phrase (phrase)}
				<button type="button" class="chip phrase" onclick={() => write(phrase)}>{phrase}</button>
			{/each}
		</div>

		<div class="group">
			<button type="button" class="chip" disabled={!history.undo} onclick={() => canvas?.undo()}>Undo</button>
			<button type="button" class="chip" disabled={!strokes} onclick={() => canvas?.clear()}>Clear</button>
		</div>
	</div>
</div>

<style>
	.desk {
		display: grid;
		gap: 1rem;
		padding: clamp(1.2rem, 3vw, 2rem);
		color: #2a221b;
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: 0.8rem 1.5rem;
		padding-right: 2.6rem;
	}

	.kicker {
		margin: 0;
		color: var(--ink-3);
		font-family: var(--mono);
		font-size: 0.68rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0.15rem 0 0;
		font-family: var(--serif);
		font-size: 1.6rem;
		font-weight: 400;
	}

	.hint {
		margin: 0.15rem 0 0;
		color: var(--ink-3);
		font-size: 0.85rem;
	}

	.studio {
		padding: 0.55rem 1rem;
		border-radius: 999px;
		background: var(--ink);
		color: var(--paper);
		font-size: 0.82rem;
		font-weight: 500;
		text-decoration: none;
		transition: background-color 160ms var(--ease-out);
	}

	.studio:hover {
		background: var(--accent);
	}

	/* The sheet lies on a felt mat, as it would on the table. */
	.paper {
		position: relative;
		height: clamp(18rem, 52vh, 28rem);
		overflow: hidden;
		border-radius: 0.4rem;
		box-shadow:
			0 0 0 0.6rem #2b2b2e,
			0 0 0 calc(0.6rem + 1px) rgba(0, 0, 0, 0.3),
			0 18px 40px -16px rgba(30, 20, 10, 0.5);
		margin: 0.6rem;
	}

	.stage {
		position: absolute;
		inset: 0;
		mix-blend-mode: multiply;
	}

	.well {
		position: absolute;
		right: 1rem;
		bottom: 1rem;
	}

	.well :global(.inkstone) {
		--size: 84px;
	}

	.tools {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem 1.2rem;
		padding-top: 0.6rem;
	}

	.group {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.3rem;
	}

	.chip {
		padding: 0.38rem 0.8rem;
		border: 1px solid rgb(30 24 19 / 0.14);
		border-radius: 999px;
		background: rgb(255 255 255 / 0.5);
		color: inherit;
		font: inherit;
		font-size: 0.8rem;
		cursor: pointer;
		transition:
			background-color 160ms var(--ease-out),
			transform 120ms var(--ease-out);
	}

	.chip:hover:not(:disabled) {
		background: rgb(255 255 255 / 0.9);
	}

	.chip:active:not(:disabled) {
		transform: scale(0.96);
	}

	.chip:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.chip.on {
		border-color: #1e1813;
		background: #1e1813;
		color: #f4ecdd;
	}

	.phrase {
		font-family: 'Gowun Batang', var(--korean), serif;
	}

	.swatch {
		width: 1.35rem;
		height: 1.35rem;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: var(--swatch);
		box-shadow:
			0 0 0 2px #fbf8f2,
			0 0 0 3px rgb(30 24 19 / 0.18);
		cursor: pointer;
		transition: box-shadow 160ms var(--ease-out);
	}

	.swatch.on {
		box-shadow:
			0 0 0 2px #fbf8f2,
			0 0 0 4px #1e1813;
	}
</style>
