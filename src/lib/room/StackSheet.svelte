<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { STACK, findWork } from '$lib/directions/content.js';
	import { linkProps } from '$lib/directions/links.js';
	import Heading from './Heading.svelte';

	/**
	 * The laptop, opened: what I build with, as a row of app icons. Choosing one lifts it and
	 * tells you about it, with the things I've made in it, in a panel that keeps one height
	 * whichever is chosen. A project's clip plays while it's pointed at.
	 */

	const TOOLS = STACK.map((tool) => ({
		...tool,
		made: tool.made.map((id) => (id === 'self' ? { id, title: 'This site', blurb: 'You’re in it.', href: null, media: null } : findWork(id))).filter((work) => work !== undefined)
	}));

	/** @type {string | null} */
	let chosen = $state(null);
	/** @type {string | null} */
	let hovered = $state(null);

	const tool = $derived(TOOLS.find((each) => each.id === chosen) ?? null);
	const duration = $derived(prefersReducedMotion.current ? 0 : 1);

	/** @param {string} id */
	function choose(id) {
		chosen = chosen === id ? null : id;
	}

	/** @param {string} id @param {boolean} on */
	function point(id, on) {
		hovered = on ? id : hovered === id ? null : hovered;
	}

	/** @param {Event} event @param {boolean} on */
	function preview(event, on) {
		const video = /** @type {HTMLElement} */ (event.currentTarget).querySelector('video');
		if (!video) return;
		if (on) video.play().catch(() => {});
		else video.pause();
	}
</script>

<div class="stack">
	<Heading kicker="On the laptop" title="What I build with" hint="Two favorites, and what I’ve made with them." />

	<ul class={['icons', chosen && 'picked']}>
		{#each TOOLS as each (each.id)}
			<li>
				<button
					type="button"
					class={['app', chosen === each.id && 'on', hovered === each.id && 'over']}
					aria-pressed={chosen === each.id}
					onclick={() => choose(each.id)}
					onpointerenter={() => point(each.id, true)}
					onpointerleave={() => point(each.id, false)}
					onfocus={() => point(each.id, true)}
					onblur={() => point(each.id, false)}
				>
					<span class="icon" style:--tone={each.mark.tone} style:--ink={each.mark.ink} style:--logo="url({each.mark.logo})" aria-hidden="true">
						<span class="logo"></span>
					</span>
					<span class={['name', each.id === 'canvas' && 'code']}>{each.title}</span>
					{#if each.favorite}
						<span class="pip" aria-label={each.favorite}></span>
					{/if}
				</button>
			</li>
		{/each}
	</ul>

	<div class="detail">
		{#key tool}
			<div class="leaf" in:fly={{ y: 10, duration: 420 * duration, delay: 140 * duration, easing: cubicOut }} out:fade={{ duration: 160 * duration }}>
				{#if tool}
					<header>
						<span class="name">
							<span class={['title', tool.id === 'canvas' && 'code']}>{tool.title}</span>
							<span class={['kicker', tool.favorite && 'favorite']}>{tool.favorite ?? tool.kicker}</span>
						</span>
						<a class="go" {...linkProps(tool.href)} aria-label="{tool.title} docs">
							<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 8.5l5-5M4.5 3.5h4v4" /></svg>
						</a>
					</header>
					<p class="note">{tool.note}</p>
					{#if tool.made.length}
						<ul class="made">
							{#each tool.made as work (work.id)}
								{@const media = work.media}
								<li>
									<svelte:element
										this={work.href ? 'a' : 'div'}
										class="work"
										{...work.href ? linkProps(work.href) : {}}
										role={work.href ? undefined : 'group'}
										onpointerenter={(/** @type {PointerEvent} */ event) => preview(event, true)}
										onpointerleave={(/** @type {PointerEvent} */ event) => preview(event, false)}
									>
										<span class="thumb">
											{#if media?.kind === 'video'}
												<video src={media.src} poster={media.poster} muted loop playsinline preload="none" aria-label={media.alt}></video>
											{:else}
												<span class="here" aria-hidden="true">✦</span>
											{/if}
										</span>
										<span class="label">
											<span class="what">{work.title}</span>
											<span class="blurb">{work.blurb}</span>
										</span>
									</svelte:element>
								</li>
							{/each}
						</ul>
					{/if}
				{:else}
					<p class="empty">Pick one to read about it.</p>
				{/if}
			</div>
		{/key}
	</div>
</div>

<style>
	.stack {
		display: grid;
		gap: 1.6rem;
		padding: clamp(1.4rem, 3vw, 2.4rem);
	}

	.icons {
		display: flex;
		justify-content: center;
		gap: clamp(1rem, 4vw, 2.6rem);
		margin: 0;
		padding: 0.4rem 0 0;
		list-style: none;
	}

	.app {
		position: relative;
		display: grid;
		justify-items: center;
		gap: 0.6rem;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
		transition: opacity 220ms var(--ease-out);
	}

	.picked .app:not(.on):not(.over) {
		opacity: 0.5;
	}

	/* An app icon: a squircle of the brand colour, lit from above, with the mark in its own ink. */
	.icon {
		display: grid;
		place-items: center;
		width: clamp(4.2rem, 9vw, 5.4rem);
		aspect-ratio: 1;
		border-radius: 23%;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.22), transparent 48%, rgba(0, 0, 0, 0.08)),
			var(--tone);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.35),
			inset 0 0 0 1px rgba(0, 0, 0, 0.06),
			0 1px 2px rgba(28, 27, 24, 0.12),
			0 10px 22px -12px rgba(28, 27, 24, 0.45);
		transition:
			translate 320ms var(--ease-detent),
			scale 320ms var(--ease-detent),
			box-shadow 320ms var(--ease-out);
	}

	.logo {
		width: 54%;
		aspect-ratio: 1;
		background: var(--ink);
		-webkit-mask: var(--logo) center / contain no-repeat;
		mask: var(--logo) center / contain no-repeat;
	}

	.over .icon {
		translate: 0 -3px;
	}

	.on .icon {
		translate: 0 -8px;
		scale: 1.06;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.35),
			inset 0 0 0 1px rgba(0, 0, 0, 0.06),
			0 0 0 3px rgba(255, 255, 255, 0.9),
			0 0 0 4.5px var(--accent),
			0 22px 30px -16px rgba(28, 27, 24, 0.5);
	}

	.app:active .icon {
		scale: 0.95;
	}

	.app:focus-visible {
		outline: none;
	}

	.app:focus-visible .icon {
		outline: 2px solid var(--accent);
		outline-offset: 4px;
	}

	.app .name {
		color: var(--ink);
		font-size: 0.82rem;
		font-weight: 500;
	}

	.pip {
		position: absolute;
		top: -0.25rem;
		right: -0.25rem;
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.95);
	}

	/* Every description is stacked in one cell of a fixed height, so choosing never moves the sheet. */
	.detail {
		display: grid;
		height: 15.5rem;
		overflow: hidden;
	}

	.leaf {
		grid-area: 1 / 1;
		display: grid;
		align-content: start;
		gap: 0.7rem;
		min-width: 0;
	}

	header {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.75rem;
	}

	header .name {
		display: grid;
		line-height: 1.15;
	}

	.title {
		color: var(--ink);
		font-size: 1.3rem;
		font-weight: 500;
		letter-spacing: -0.03em;
	}

	.code {
		font-family: var(--mono);
		letter-spacing: 0;
	}

	.title.code {
		font-size: 1.1rem;
	}

	.kicker {
		color: var(--ink-3);
		font-size: 0.78rem;
	}

	.kicker.favorite {
		color: var(--accent);
	}

	.go {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		color: var(--ink-2);
		transition:
			background-color 160ms var(--ease-out),
			color 160ms var(--ease-out);
	}

	.go:hover {
		background: var(--ink);
		color: var(--paper);
	}

	.go svg {
		width: 0.7rem;
		height: 0.7rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.note {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		margin: 0;
		color: var(--ink-2);
		font-size: 0.9rem;
		line-height: 1.38;
		text-wrap: pretty;
	}

	.empty {
		align-self: center;
		margin: 0;
		color: var(--ink-3);
		font-size: 0.9rem;
		text-align: center;
	}

	.leaf:has(.empty) {
		align-content: center;
	}

	.made {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.work {
		display: grid;
		gap: 0.5rem;
		padding: 0.45rem;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.45);
		color: inherit;
		text-decoration: none;
		transition: background-color 160ms var(--ease-out);
	}

	a.work:hover {
		background: rgba(255, 255, 255, 0.85);
	}

	.thumb {
		display: grid;
		place-items: center;
		height: 5.6rem;
		overflow: hidden;
		border-radius: 8px;
		background: rgba(28, 27, 24, 0.07);
	}

	.thumb video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.here {
		color: var(--accent);
		font-size: 1.2rem;
	}

	.label {
		display: grid;
		min-width: 0;
		line-height: 1.25;
	}

	.what {
		color: var(--ink);
		font-size: 0.86rem;
		font-weight: 500;
	}

	.blurb {
		overflow: hidden;
		color: var(--ink-3);
		font-size: 0.78rem;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	@media (max-width: 640px) {
		.detail {
			height: 19rem;
		}

		.made {
			grid-template-columns: minmax(0, 1fr);
		}

		.thumb {
			height: 4.2rem;
		}
	}
</style>
