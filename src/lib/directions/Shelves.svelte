<script>
	import Artifact from './Artifact.svelte';
	import { linkProps } from './links.js';
	import { embed, pageFor } from './music.js';

	/** @typedef {import('./content.js').Shelf} Shelf */
	/** @typedef {import('./content.js').ShelfItem} ShelfItem */
	/** @typedef {{ title?: string, extract?: string, thumbnail?: { source: string }, content_urls?: { desktop?: { page: string } } }} Summary */

	/** @type {{ shelves: Shelf[] }} */
	let { shelves } = $props();

	const BAYS = [
		{ id: 'reading', label: 'Reading', ids: ['nonfiction', 'fiction', 'manga', 'blogs'] },
		{ id: 'picture', label: 'Picture', ids: ['movies', 'youtube', 'podcasts'] },
		{
			id: 'listening',
			label: 'Listening',
			ids: ['songs-christian', 'songs-en', 'songs-international'],
			front: ['music']
		}
	];

	const rows = $derived(
		BAYS.map((bay) => ({
			...bay,
			back: gather(bay.ids),
			front: gather(bay.front ?? [])
		}))
	);

	const flower = $derived(
		shelves.flatMap((shelf) => shelf.items).find((item) => item.youtube === '-1JCohwW0EA')
	);

	/** @type {HTMLDialogElement | undefined} */
	let dialog = $state();

	/** @param {HTMLDialogElement} node */
	function remember(node) {
		dialog = node;
	}
	/** @type {ShelfItem | null} */
	let active = $state(null);
	/** @type {Summary | null} */
	let summary = $state(null);
	let loading = $state(false);

	const frame = $derived(embed(active));
	const audible = $derived(frame !== '');
	const page = $derived(summary?.content_urls?.desktop?.page ?? (active ? pageFor(active) : undefined));
	const platter = $derived(audible ? active : flower);

	/** @param {string[] | undefined} ids */
	function gather(ids) {
		if (!ids) return [];
		return ids.flatMap((id) => {
			const shelf = shelves.find((entry) => entry.id === id);
			if (!shelf) return [];
			return shelf.items.map((item, i) => ({ item, format: shelf.format, i }));
		});
	}

	let request = 0;

	/** @param {ShelfItem} item */
	async function pick(item) {
		const ticket = ++request;
		active = item;
		summary = null;
		loading = false;
		if (dialog && !dialog.open) dialog.showModal();
		if (!item.wiki || item.youtube || item.query) return;
		loading = true;
		try {
			const res = await fetch(
				`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.wiki)}`
			);
			if (ticket !== request) return;
			summary = res.ok ? await res.json() : null;
		} catch {
			if (ticket === request) summary = null;
		} finally {
			if (ticket === request) loading = false;
		}
	}

	function shut() {
		if (dialog?.open) dialog.close();
		active = null;
		summary = null;
		loading = false;
	}
</script>

<section class="stage" aria-labelledby="cabinet-title">
	<header>
		<p class="kicker">IX</p>
		<h2 id="cabinet-title">Shelf</h2>
		<p class="note">Things I keep coming back to.</p>
	</header>

	<div class="scene">
		<div class="world">
			<div class="plant side-a" aria-hidden="true">
				<svg viewBox="0 0 140 280">
					<ellipse cx="70" cy="262" rx="36" ry="8" fill="rgba(40,28,16,0.18)" />
					<path d="M46 168h48l-8 72H54z" fill="#efe8dc" />
					<path d="M42 160h56v14H42z" fill="#e4d9c6" />
					<path d="M70 168c-2-40 8-70 2-108" fill="none" stroke="#3d5344" stroke-width="2" />
					<ellipse cx="48" cy="92" rx="22" ry="8" transform="rotate(-40 48 92)" fill="#3f5c46" />
					<ellipse cx="96" cy="78" rx="24" ry="8" transform="rotate(36 96 78)" fill="#2f4636" />
					<ellipse cx="62" cy="58" rx="20" ry="7" transform="rotate(-18 62 58)" fill="#6d8a62" />
					<ellipse cx="84" cy="112" rx="22" ry="7" transform="rotate(22 84 112)" fill="#4e6b52" />
					<ellipse cx="54" cy="128" rx="18" ry="6" transform="rotate(-28 54 128)" fill="#2c4032" />
					<ellipse cx="88" cy="46" rx="16" ry="6" transform="rotate(14 88 46)" fill="#56725a" />
				</svg>
			</div>

			<div class="case">
				<div class="crown"></div>
				<div class="interior">
					{#each rows as bay (bay.id)}
						<div class="bay">
							{#if bay.back.length}
								<ul class="objects back">
									{#each bay.back as piece (piece.item.title + piece.format)}
										{@render object(piece.item, piece.format, piece.i)}
									{/each}
								</ul>
							{/if}
							{#if bay.front.length || bay.id === 'listening'}
							<ul class="objects front">
								{#each bay.front as piece (piece.item.title + piece.format)}
									{@render object(piece.item, piece.format, piece.i)}
								{/each}
								{#if bay.id === 'listening'}
									<li>
										<button
											type="button"
											class={['deck', audible && 'on']}
											aria-label="Play {platter?.title ?? 'a record'}"
											onclick={() => platter && pick(platter)}
										>
											<span class="lid"></span>
											<span class="plinth">
												<span class={['platter', audible && 'spin']}>
													<span class="label" lang={platter?.lang}>{platter?.title}</span>
												</span>
												<span class="arm"></span>
											</span>
										</button>
									</li>
								{/if}
							</ul>
							{/if}
							<div class="plank">
								<span>{bay.label}</span>
							</div>
						</div>
					{/each}
				</div>
				<div class="plinth-bar"></div>
			</div>

			<div class="plant side-b" aria-hidden="true">
				<svg viewBox="0 0 120 200">
					<ellipse cx="60" cy="186" rx="30" ry="7" fill="rgba(40,28,16,0.16)" />
					<path d="M40 118h40l-6 52H46z" fill="#a15a3a" />
					<path d="M36 110h48v12H36z" fill="#8d4b30" />
					<ellipse cx="60" cy="78" rx="16" ry="22" fill="#2f4a36" />
					<ellipse cx="38" cy="88" rx="14" ry="18" transform="rotate(-20 38 88)" fill="#3e5c44" />
					<ellipse cx="84" cy="90" rx="14" ry="18" transform="rotate(22 84 90)" fill="#4d6a4e" />
					<ellipse cx="52" cy="52" rx="12" ry="16" fill="#6a8660" />
					<ellipse cx="74" cy="48" rx="11" ry="15" transform="rotate(12 74 48)" fill="#2c4032" />
				</svg>
			</div>
		</div>
	</div>
</section>

{#snippet object(/** @type {ShelfItem} */ item, /** @type {Shelf['format']} */ format, /** @type {number} */ i)}
	<li>
		<button
			type="button"
			class={['piece', active === item && 'on']}
			aria-label={[item.title, item.by, item.year].filter(Boolean).join(', ')}
			onclick={() => pick(item)}
		>
			<span class="fit">
				<Artifact {item} {format} {i} scene lit={active === item} />
			</span>
			<span class="plaque">
				<span lang={item.lang}>{item.title}</span>
				{#if item.by}
					<small lang={item.lang}>{item.by}</small>
				{/if}
			</span>
		</button>
	</li>
{/snippet}

<dialog {@attach remember} aria-labelledby="shelf-dialog-title" onclose={() => (active = null)}>
	{#if active}
		<div class={['sheet', frame && 'video']}>
			<button type="button" class="close" onclick={shut}>Close</button>
			{#if frame}
				<iframe
					src={frame}
					title={active.title}
					allow="autoplay; encrypted-media; picture-in-picture"
					allowfullscreen
				></iframe>
			{:else if summary?.thumbnail}
				<img src={summary.thumbnail.source} alt="" />
			{/if}
			<div class="copy">
				<p class="eyebrow">{active.youtube || active.query ? 'Playing' : active.wiki ? 'Wikipedia' : 'Visit'}</p>
				<h3 id="shelf-dialog-title" lang={active.lang}>{summary?.title ?? active.title}</h3>
				{#if active.by || active.year}
					<p class="by" lang={active.lang}>{[active.by, active.year].filter(Boolean).join(', ')}</p>
				{/if}
				{#if loading}
					<p class="extract">Opening…</p>
				{:else if summary?.extract}
					<p class="extract">{summary.extract}</p>
				{/if}
				{#if page}
					<a {...linkProps(page)}>{active.wiki ? 'Read on Wikipedia' : 'Open'}</a>
				{/if}
			</div>
		</div>
	{/if}
</dialog>

<style>
	.stage {
		background:
			linear-gradient(#ebe4d8 0 46%, transparent 46%),
			linear-gradient(#d7cec0, #cfc6b6);
		padding: 3.25rem 0 4.5rem;
	}

	header {
		max-width: var(--page-max);
		margin: 0 auto 1.75rem;
		padding: 0 var(--page-pad);
	}

	.kicker,
	.note,
	.eyebrow,
	.plank span,
	.plaque small,
	.by {
		color: var(--ink-3);
	}

	.kicker {
		font-size: 11px;
		letter-spacing: 0.22em;
	}

	h2 {
		font-family: var(--serif);
		font-size: clamp(2.4rem, 4vw, 3.4rem);
		font-weight: 400;
		letter-spacing: -0.03em;
		line-height: 0.95;
	}

	.note {
		margin-top: 0.35rem;
	}

	.scene {
		perspective: 1800px;
		perspective-origin: 50% 20%;
		overflow-x: auto;
		padding: 1rem 0 2rem;
	}

	.world {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 1.25rem;
		min-width: 76rem;
		margin: 0 auto;
		padding: 0 1.5rem;
		transform: rotateX(9deg) rotateY(-16deg);
		transform-origin: 50% 80%;
		transform-style: preserve-3d;
		pointer-events: none;
	}

	.case::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		width: 1.35rem;
		height: 100%;
		background: linear-gradient(#3a291f, #241810);
		transform: rotateY(90deg);
		transform-origin: right center;
	}

	.case {
		position: relative;
		flex: 1;
		max-width: 68rem;
		padding: 0.85rem 0.7rem 0;
		background:
			linear-gradient(90deg, rgba(255, 255, 255, 0.05), transparent 12% 88%, rgba(0, 0, 0, 0.18)),
			linear-gradient(#4a3428, #3a291f);
		border-radius: 4px 4px 2px 2px;
		box-shadow:
			0 28px 40px -24px rgba(40, 26, 14, 0.55),
			0 2px 0 rgba(255, 255, 255, 0.12) inset;
		transform-style: preserve-3d;
		pointer-events: none;
	}

	.crown {
		height: 0.45rem;
		margin: -0.85rem -0.7rem 0.7rem;
		background: linear-gradient(#6a4e38, #3f2d22);
		border-radius: 3px 3px 0 0;
		box-shadow: 0 1px 0 rgba(212, 184, 140, 0.35) inset;
	}

	.interior {
		background:
			radial-gradient(120% 80% at 50% 0%, rgba(255, 255, 255, 0.28), transparent 46%),
			linear-gradient(#f3ece2, #e7dfd2);
		box-shadow: inset 0 18px 28px rgba(70, 48, 28, 0.08);
		pointer-events: none;
	}

	.bay + .bay {
		border-top: 0;
	}

	.objects {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 0.15rem;
		margin: 0;
		padding: 0.85rem 1rem 0;
		list-style: none;
	}

	.objects.back {
		padding-bottom: 0;
		transform: translateY(0.35rem) scale(0.96);
		transform-origin: 50% 100%;
	}

	.objects.front {
		position: relative;
		z-index: 3;
		margin-top: -0.35rem;
	}

	.plank {
		position: relative;
		z-index: 2;
		pointer-events: none;
		display: flex;
		align-items: center;
		height: 1.35rem;
		padding: 0 0.9rem;
		background:
			linear-gradient(#c4a27a, #c4a27a) 0 0 / 100% 38% no-repeat,
			linear-gradient(#7d5b3e, #5c412d);
		box-shadow:
			0 10px 16px -10px rgba(40, 24, 12, 0.55),
			inset 0 1px 0 rgba(255, 248, 236, 0.45);
	}

	.plank span {
		font-size: 9px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}

	.plinth-bar {
		height: 0.7rem;
		margin: 0 -0.7rem;
		background: linear-gradient(#3a291f, #2a1d16);
		border-radius: 0 0 2px 2px;
	}

	.piece,
	.deck {
		pointer-events: auto;
	}

	.piece {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		cursor: pointer;
	}

	.piece:focus-visible {
		outline: 1px solid #a68556;
		outline-offset: 4px;
	}

	.fit {
		display: block;
		zoom: 0.62;
	}

	.plaque {
		position: absolute;
		bottom: calc(100% - 0.2rem);
		left: 50%;
		z-index: 3;
		display: flex;
		flex-direction: column;
		width: max-content;
		max-width: 11rem;
		padding: 0.35rem 0.5rem 0.4rem;
		background: rgba(247, 243, 236, 0.94);
		box-shadow: 0 10px 18px -12px rgba(40, 26, 14, 0.6);
		opacity: 0;
		pointer-events: none;
		transform: translate(-50%, 4px);
		transition: opacity 180ms var(--ease-out), transform 180ms var(--ease-out);
		font-size: 11px;
		line-height: 1.25;
		text-align: center;
	}

	.plaque small {
		font-size: 9px;
	}

	.piece:hover .plaque,
	.piece:focus-visible .plaque,
	.piece.on .plaque {
		opacity: 1;
		transform: translate(-50%, 0);
	}

	.plant {
		flex: none;
		width: 7.5rem;
		filter: drop-shadow(0 16px 12px rgba(40, 26, 14, 0.18));
	}

	.side-a {
		width: 8.5rem;
		align-self: flex-end;
		margin-bottom: 0.4rem;
	}

	.side-b {
		width: 6.4rem;
		margin-bottom: 1.6rem;
	}

	.plant svg {
		display: block;
		width: 100%;
		height: auto;
	}

	.deck {
		position: relative;
		width: 8.6rem;
		height: 6.4rem;
		margin: 0 0.35rem 0.2rem;
		cursor: pointer;
	}

	.deck:focus-visible {
		outline: 1px solid #a68556;
		outline-offset: 4px;
	}

	.lid {
		position: absolute;
		inset: 0 0.2rem auto;
		height: 2.1rem;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.05));
		border: 1px solid rgba(90, 70, 40, 0.25);
		border-bottom: 0;
		border-radius: 3px 3px 0 0;
		transform: perspective(200px) rotateX(28deg);
		transform-origin: 50% 100%;
	}

	.plinth {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		height: 4.7rem;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.14), transparent 30%),
			linear-gradient(#6b4d36, #4a3426);
		border-radius: 3px;
		box-shadow:
			0 12px 16px -12px rgba(40, 24, 12, 0.7),
			inset 0 1px 0 rgba(255, 236, 210, 0.25);
	}

	.platter {
		position: absolute;
		top: 0.45rem;
		left: 0.7rem;
		width: 3.7rem;
		height: 3.7rem;
		border-radius: 50%;
		background:
			radial-gradient(circle, #f4efe4 0 18%, #1a1a1a 19% 22%, transparent 23%),
			repeating-radial-gradient(circle, #1a1a1a 0 1px, #2a2a2a 1px 2px);
		box-shadow: 0 6px 8px -4px rgba(0, 0, 0, 0.45);
	}

	.platter.spin {
		animation: spin 2.6s linear infinite;
	}

	.label {
		position: absolute;
		inset: 28%;
		display: grid;
		place-items: center;
		overflow: hidden;
		border-radius: 50%;
		background: #8c2f4a;
		color: #f6d6dc;
		font-size: 5px;
		line-height: 1.1;
		text-align: center;
	}

	.arm {
		position: absolute;
		top: 0.55rem;
		right: 0.85rem;
		width: 2.4rem;
		height: 2px;
		background: linear-gradient(#d7c4a2, #8d734c);
		transform-origin: 100% 50%;
		transform: rotate(-36deg);
		transition: transform 600ms var(--ease-out);
	}

	.arm::after {
		content: '';
		position: absolute;
		left: -5px;
		top: -3px;
		width: 8px;
		height: 8px;
		background: #2a241c;
		border-radius: 1px;
	}

	.deck.on .arm {
		transform: rotate(-8deg);
	}

	dialog {
		width: min(60rem, calc(100vw - 2rem));
		padding: 0;
		border: 0;
		background: #f7f3ec;
		color: var(--ink);
		box-shadow: 0 30px 70px rgba(28, 20, 10, 0.35);
	}

	dialog::backdrop {
		background: rgba(32, 24, 16, 0.48);
		backdrop-filter: blur(8px);
	}

	.sheet {
		display: grid;
		grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
		min-height: 18rem;
	}

	.sheet.video {
		grid-template-columns: minmax(0, 1.4fr) minmax(14rem, 0.8fr);
	}

	.sheet img,
	iframe {
		width: 100%;
		height: 100%;
		min-height: 16rem;
		border: 0;
		background: #111;
		object-fit: cover;
	}

	.copy {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		padding: 1.4rem 1.4rem 1.2rem;
	}

	.eyebrow {
		font-size: 10px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	h3 {
		font-family: var(--serif);
		font-size: 2rem;
		font-weight: 400;
		letter-spacing: -0.03em;
		line-height: 1;
	}

	.extract {
		color: var(--ink-2);
		font-size: 14px;
	}

	.copy a {
		align-self: flex-start;
		margin-top: auto;
		padding-top: 0.8rem;
		font-size: 13px;
		letter-spacing: 0.04em;
		border-bottom: 1px solid var(--ink);
	}

	.close {
		position: absolute;
		top: 0.7rem;
		right: 0.7rem;
		z-index: 1;
		padding: 0.25rem 0.45rem;
		background: rgba(247, 243, 236, 0.92);
		cursor: pointer;
		font-size: 12px;
	}

	.close:focus-visible {
		outline: 1px solid #a68556;
	}

	[lang='ko'] {
		font-family: var(--korean);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 800px) {
		.sheet,
		.sheet.video {
			grid-template-columns: 1fr;
		}

		.world {
			min-width: 60rem;
			padding: 0 var(--page-pad);
			transform: none;
		}

		/* The case is already wider than the screen; the plants would only push it further off. */
		.plant {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.platter.spin,
		.arm,
		.plaque {
			animation: none;
			transition: none;
		}
	}
</style>
