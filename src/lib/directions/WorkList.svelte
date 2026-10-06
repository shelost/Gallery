<script module>
	/** Shared by every list on the page, so moving between groups keeps previews warm. */
	let lastClosed = 0;
</script>

<script>
	import Media from './Media.svelte';
	import Tag from './Tag.svelte';
	import { linkProps } from './links.js';

	/**
	 * @type {{
	 *   works: import('./content.js').Work[],
	 *   active?: string | null,
	 *   preview?: boolean
	 * }}
	 */
	let { works, active = $bindable(null), preview = true } = $props();

	let current = $state.raw(/** @type {import('./content.js').Work | null} */ (null));
	let shown = $state(false);
	let y = $state(0);
	let openTimer = 0;
	let closeTimer = 0;

	/** @param {import('./content.js').Work} work @param {HTMLElement} row */
	function enter(work, row) {
		active = work.id;
		current = work;
		y = row.offsetTop + row.offsetHeight / 2;
		clearTimeout(closeTimer);
		if (shown) return;
		clearTimeout(openTimer);
		if (performance.now() - lastClosed < 400) shown = true;
		else openTimer = window.setTimeout(() => (shown = true), 140);
	}

	function leave() {
		clearTimeout(openTimer);
		closeTimer = window.setTimeout(() => {
			if (shown) lastClosed = performance.now();
			shown = false;
			if (active === current?.id) active = null;
		}, 90);
	}
</script>

<div class="worklist">
	<ul onpointerleave={leave}>
		{#each works as work (work.id)}
			<li>
				<a
					class={['row', active === work.id && 'on']}
					{...linkProps(work.href)}
					onpointerenter={(event) => enter(work, event.currentTarget)}
					onfocus={(event) => enter(work, event.currentTarget)}
					onblur={leave}
				>
					<span class="title">{work.title}{#if work.tag}&nbsp;<Tag label={work.tag} />{/if}</span>
					<span class="note">{work.blurb}</span>
					<span class="meta">{work.year || work.kicker}</span>
				</a>
			</li>
		{/each}
	</ul>

	{#if preview}
		<div class={['preview', shown && 'shown']} style:--y="{y}px" aria-hidden="true">
			{#if current}
				<div class="frame">
					{#key current.id}
						<Media media={current.media} playing={shown} title={current.title} />
					{/key}
				</div>
				<p class="caption">
					<span>{current.kind}</span>
					{#if current.year}<span>{current.year}</span>{/if}
				</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.worklist {
		position: relative;
	}

	ul {
		display: grid;
	}

	.row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: baseline;
		gap: 0.9rem;
		padding: 0.42rem 0;
		color: var(--ink);
		transition: opacity 150ms var(--ease-out);
	}

	ul:hover .row:not(:hover, .on),
	ul:has(.on) .row:not(.on) {
		opacity: 0.45;
	}

	.title {
		white-space: nowrap;
	}

	.note {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		color: var(--ink-3);
	}

	.meta {
		color: var(--ink-3);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.row:hover .title,
	.row.on .title {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 3px;
		text-decoration-color: var(--accent);
	}

	.preview {
		position: absolute;
		top: 0;
		left: calc(100% + 3rem);
		width: 17rem;
		pointer-events: none;
		opacity: 0;
		transform: translateY(calc(var(--y) - 50%)) scale(0.97);
		transform-origin: left center;
		transition: opacity 160ms var(--ease-out);
	}

	.preview.shown {
		opacity: 1;
		transform: translateY(calc(var(--y) - 50%)) scale(1);
		transition:
			opacity 160ms var(--ease-out),
			transform 220ms var(--ease-out);
	}

	.frame {
		position: relative;
		aspect-ratio: 4 / 3;
		padding: 10px;
		--media-bg: var(--paper-2);
	}

	.frame::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			linear-gradient(var(--ink-3), var(--ink-3)) top left / 8px 1px no-repeat,
			linear-gradient(var(--ink-3), var(--ink-3)) top left / 1px 8px no-repeat,
			linear-gradient(var(--ink-3), var(--ink-3)) top right / 8px 1px no-repeat,
			linear-gradient(var(--ink-3), var(--ink-3)) top right / 1px 8px no-repeat,
			linear-gradient(var(--ink-3), var(--ink-3)) bottom left / 8px 1px no-repeat,
			linear-gradient(var(--ink-3), var(--ink-3)) bottom left / 1px 8px no-repeat,
			linear-gradient(var(--ink-3), var(--ink-3)) bottom right / 8px 1px no-repeat,
			linear-gradient(var(--ink-3), var(--ink-3)) bottom right / 1px 8px no-repeat;
	}

	.caption {
		display: flex;
		justify-content: space-between;
		padding: 0.35rem 10px 0;
		font-size: 12px;
		color: var(--ink-3);
	}

	@media (max-width: 1180px), (hover: none) {
		.preview {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.row {
			grid-template-columns: minmax(0, 1fr) auto;
		}

		.note {
			display: none;
		}

		.title {
			white-space: normal;
		}
	}
</style>
