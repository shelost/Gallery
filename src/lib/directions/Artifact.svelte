<script>
	/**
	 * A recommendation as a physical object: a CSS box with a printed front, a spine, and a top,
	 * standing at an angle the way Stripe Press shelves its books. It turns to face you on hover,
	 * and records and CDs slide their disc out.
	 * `scene` stands the object in a shared cabinet instead of on its own horizon, and `open` turns
	 * it to face you as if it were hovered. Real cover art, when there is some, replaces the print.
	 * @type {{ item: import('./content.js').ShelfItem, format: import('./content.js').ShelfFormat, i?: number, scene?: boolean, lit?: boolean, open?: boolean }}
	 */
	let { item, format, i = 0, scene = false, lit = false, open = false } = $props();

	/** Covers on one shelf of music take turns between these. */
	const MOTIFS = ['sun', 'bands', 'type'];

	const motif = $derived(MOTIFS[i % MOTIFS.length]);
	const disc = $derived(format === 'cd' || format === 'vinyl');
</script>

<div
	class={['artifact', format, scene && 'scene', lit && 'lit', open && 'open']}
	style:--tone={item.tone}
	style:--ink={item.ink}
	style:--d={item.depth}
	style:--cover={item.cover ? `url("${item.cover}")` : undefined}
	aria-hidden="true"
>
	<div class="box">
		{#if disc}
			<span class="disc"></span>
		{/if}
		<div class={['face', 'front', disc && motif, item.cover && 'art']}>
			{#if !item.cover}
				{#if format === 'dvd' || format === 'vhs'}
					<span class="badge">{format}</span>
				{/if}
				<span class="title" lang={item.lang}>{item.title}</span>
				{#if item.by}
					<span class="by" lang={item.lang}>{item.by}</span>
				{/if}
				{#if item.year}
					<span class="year">{item.year}</span>
				{/if}
				{#if format === 'cassette'}
					<span class="reels"><i></i><i></i></span>
				{/if}
			{/if}
		</div>
		<div class="face spine"><span lang={item.lang}>{item.title}</span></div>
		<div class="face top"></div>
	</div>
</div>

<style>
	.artifact {
		--w: 7rem;
		--h: 10.5rem;
		--d: 1.6rem;
		--spine: color-mix(in oklab, var(--tone) 72%, black);
		--lid: color-mix(in oklab, var(--tone) 82%, white);
		position: relative;
		width: var(--w);
		height: var(--h);
		perspective: 1100px;
		perspective-origin: 50% 20%;
	}

	/* A soft contact shadow where the object meets the shelf. */
	.artifact::before {
		content: '';
		position: absolute;
		left: 4%;
		right: -10%;
		bottom: -6px;
		height: 14px;
		background: radial-gradient(closest-side, rgba(28, 22, 10, 0.32), transparent);
		filter: blur(2px);
	}

	.box {
		position: relative;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		transform-origin: 50% 100%;
		transform: translateY(0) rotateX(-9deg) rotateY(36deg);
		transition: transform 600ms var(--ease-out);
	}

	.artifact:hover .box,
	.artifact.open .box {
		transform: translateY(-0.6rem) rotateX(-3deg) rotateY(6deg);
	}

	.face {
		position: absolute;
		backface-visibility: hidden;
		overflow: hidden;
	}

	.front {
		inset: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.75rem 0.7rem;
		background: var(--tone);
		color: var(--ink);
		transform: translateZ(calc(var(--d) / 2));
	}

	/* Light from the upper left, falling off across the cover. */
	.front::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(105deg, rgba(255, 255, 255, 0.16), transparent 45%, rgba(0, 0, 0, 0.1));
		pointer-events: none;
	}

	.spine {
		top: 0;
		left: calc(50% - var(--d) / 2);
		width: var(--d);
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--spine);
		color: var(--ink);
		transform: rotateY(-90deg) translateZ(calc(var(--w) / 2));
	}

	.spine span {
		max-height: calc(100% - 1rem);
		overflow: hidden;
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		font-size: 8.5px;
		line-height: 1;
		letter-spacing: 0.02em;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.top {
		left: 0;
		top: calc(50% - var(--d) / 2);
		width: 100%;
		height: var(--d);
		background: var(--lid);
		transform: rotateX(90deg) translateZ(calc(var(--h) / 2));
	}

	.title {
		font-size: 13px;
		font-weight: 500;
		line-height: 1.05;
		letter-spacing: -0.02em;
	}

	.by,
	.year {
		font-size: 9px;
		line-height: 1.2;
		letter-spacing: 0.04em;
		opacity: 0.78;
	}

	.by {
		margin-top: auto;
	}

	.badge {
		align-self: flex-start;
		font-size: 8px;
		font-weight: 700;
		line-height: 1;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	/* Books: a serif title on cloth, the binding down the spine, page edges on top. */
	.book .front {
		padding: 0.95rem 0.8rem 0.8rem;
		box-shadow: inset 4px 0 0 rgba(0, 0, 0, 0.14);
	}

	.book .title {
		font-family: var(--serif);
		font-size: 17px;
		font-weight: 400;
		line-height: 1;
		letter-spacing: -0.01em;
	}

	.book .by {
		font-size: 8.5px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.book .top {
		background: repeating-linear-gradient(90deg, #f4efe2 0 1px, #e6dfcd 1px 2px);
	}

	/* DVDs: a black plastic keep case behind a sleeve with the logo band across the top. */
	.dvd {
		--w: 7.2rem;
		--h: 10.2rem;
		--d: 0.75rem;
		--spine: #15171d;
		--lid: #22252d;
	}

	.dvd .front {
		padding: 0 0.65rem 0.7rem;
		border-radius: 2px;
		box-shadow: inset 0 0 0 3px #15171d;
	}

	.dvd .badge {
		align-self: stretch;
		margin: 0 -0.65rem 0.6rem;
		padding: 0.4rem 0.65rem 0.35rem;
		background: #0d0d0f;
		color: #f4f4f4;
	}

	.dvd .title {
		font-size: 15px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.01em;
	}

	.dvd .by {
		margin-top: auto;
	}

	.dvd .spine {
		color: #d6d6d6;
	}

	/* CDs: a jewel case with its clear hinge down the left and glare across the plastic. */
	.cd {
		--w: 7.6rem;
		--h: 6.7rem;
		--d: 0.6rem;
		--spine: #18181a;
		--lid: #d7dde1;
	}

	.cd .front {
		padding: 0.55rem 0.55rem 0.55rem 1.05rem;
	}

	.cd .front::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 0.55rem;
		background: repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.5) 0 2px, rgba(255, 255, 255, 0.22) 2px 4px);
		box-shadow: 1px 0 0 rgba(0, 0, 0, 0.18);
	}

	.cd .front::after {
		background: linear-gradient(118deg, rgba(255, 255, 255, 0.42) 0 16%, transparent 32%, transparent 70%, rgba(255, 255, 255, 0.12));
	}

	.cd .spine {
		color: #e8e8e8;
	}

	.cd .spine span,
	.vinyl .spine span {
		font-size: 6.5px;
	}

	.cd .title {
		font-size: 11.5px;
	}

	.cd .by {
		font-size: 8px;
	}

	/* Records: a square sleeve with the disc tucked inside. */
	.vinyl {
		--w: 9.4rem;
		--h: 9.4rem;
		--d: 0.32rem;
	}

	.vinyl .title {
		font-size: 14px;
		max-width: 80%;
	}

	/* Cover art for music, cycling down the shelf. */
	.front.sun {
		background:
			radial-gradient(circle at 72% 62%, var(--ink) 0 24%, transparent 24.5%),
			var(--tone);
	}

	.front.sun .title,
	.front.sun .by {
		position: relative;
		z-index: 1;
	}

	.front.bands {
		justify-content: flex-start;
		background: linear-gradient(
			to bottom,
			var(--tone) 0 52%,
			var(--ink) 52% 60%,
			var(--tone) 60% 68%,
			var(--ink) 68% 72%,
			var(--tone) 72% 79%,
			var(--ink) 79% 81%,
			var(--tone) 81%
		);
	}

	.front.type .title {
		font-size: 19px;
		font-weight: 700;
		line-height: 0.88;
		letter-spacing: -0.045em;
	}

	.vinyl .front.type .title {
		font-size: 24px;
	}

	.disc {
		position: absolute;
		border-radius: 50%;
		transform: translateX(0) rotate(0);
		transition: transform 700ms var(--ease-out);
	}

	.artifact:hover .disc,
	.artifact.open .disc {
		transform: translateX(46%) rotate(70deg);
	}

	.cd .disc {
		top: 6%;
		left: 0.9rem;
		height: 88%;
		aspect-ratio: 1;
		background:
			radial-gradient(circle, var(--paper) 0 8%, rgba(0, 0, 0, 0.18) 8.5% 10%, #e9edf0 10.5% 16%, transparent 16.5%),
			conic-gradient(from 20deg, #e7ebee, #c8d2db, #f2e7f3, #d2e6df, #e7ebee, #cdd5dd, #f0ece0, #e7ebee);
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
	}

	.vinyl .disc {
		inset: 3%;
		background:
			radial-gradient(circle, var(--paper) 0 2.5%, var(--ink) 3% 17%, #0b0b0b 17.5% 19%, transparent 19.5%),
			repeating-radial-gradient(circle, #141414 0 2px, #222 2px 3px);
	}

	/* VHS: a dark sleeve, a boxed logo, and a retro stripe along the bottom. */
	.vhs {
		--w: 6.2rem;
		--h: 10.8rem;
		--d: 1.5rem;
	}

	.vhs .front {
		padding: 0.7rem 0.6rem;
		background: linear-gradient(to top, #e63946 0 4%, #f4a261 4% 7.5%, #e9c46a 7.5% 11%, var(--tone) 11%);
	}

	.vhs .badge {
		padding: 0.2rem 0.3rem;
		border: 1px solid currentColor;
		border-radius: 2px;
	}

	.vhs .title {
		margin-top: 0.4rem;
		font-size: 22px;
		font-weight: 700;
		letter-spacing: -0.02em;
		text-transform: uppercase;
	}

	/* Cassettes: a J-card in a clear case, with the tape's reels showing through. */
	.cassette {
		--w: 9.6rem;
		--h: 6.2rem;
		--d: 1.2rem;
		--lid: #dfe3e5;
	}

	.cassette .front {
		padding: 0.55rem 0.65rem;
		gap: 0.15rem;
	}

	.cassette .front::after {
		background: linear-gradient(118deg, rgba(255, 255, 255, 0.34) 0 14%, transparent 30%);
	}

	.cassette .title {
		font-size: 12.5px;
	}

	.cassette .by {
		margin-top: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.reels {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: auto;
		padding: 0.25rem 1.1rem;
		border-radius: 0.6rem;
		background: color-mix(in oklab, var(--tone) 60%, black);
	}

	.reels i {
		width: 1.15rem;
		height: 1.15rem;
		border-radius: 50%;
		background: radial-gradient(circle, var(--tone) 0 26%, transparent 28%), color-mix(in oklab, var(--ink) 85%, transparent);
		box-shadow: 0 0 0 2px color-mix(in oklab, var(--tone) 60%, black);
	}

	/* Magazines: thin, with a masthead and a rule under it. */
	.magazine {
		--w: 7.6rem;
		--h: 10rem;
		--d: 0.28rem;
	}

	.magazine .front {
		padding: 0.7rem;
		background:
			radial-gradient(circle at 50% 78%, var(--ink) 0 26%, transparent 26.5%),
			var(--tone);
	}

	.magazine .title {
		padding-bottom: 0.4rem;
		border-bottom: 1.5px solid currentColor;
		font-family: var(--serif);
		font-size: 17px;
		font-weight: 400;
		line-height: 0.95;
	}

	.magazine .spine span {
		display: none;
	}

	/* The real cover, printed edge to edge over whatever design the format would have drawn. */
	.front.art {
		background: var(--cover) center / cover no-repeat, var(--tone);
	}

	.dvd .front.art {
		box-shadow: inset 0 0 0 3px #15171d;
	}

	[lang='ko'] {
		font-family: var(--korean);
	}

	/* Inside the cabinet the camera is shared, so each object only turns a little. */
	.artifact.scene {
		perspective: none;
	}

	.artifact.scene .box {
		transform: rotateX(-2deg) rotateY(14deg);
	}

	.artifact.scene:hover .box,
	.artifact.scene.lit .box {
		transform: translateY(-0.45rem) rotateX(0deg) rotateY(5deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.box,
		.disc,
		.artifact.scene .box {
			transition: none;
		}

		.artifact.scene:hover .box,
		.artifact.scene.lit .box {
			transform: rotateX(-2deg) rotateY(14deg);
		}
	}
</style>
