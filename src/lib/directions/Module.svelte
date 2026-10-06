<script>
	/**
	 * A module for a bento grid in the Braun manner: a white molded body with a quiet printed
	 * label and a recessed pale screen for its readout. The LED blinks whenever `blink` changes;
	 * `keys` sit at the end of the label row.
	 * @type {{
	 *   area?: string,
	 *   label: string,
	 *   detail?: string,
	 *   blink?: unknown,
	 *   class?: import('svelte/elements').ClassValue,
	 *   keys?: import('svelte').Snippet,
	 *   children: import('svelte').Snippet
	 * }}
	 */
	let { area, label, detail, blink, class: className, keys, children } = $props();
</script>

<div class={['module', className]} style:--area={area} role="group" aria-label={label}>
	<div class="top">
		{#if blink !== undefined}
			{#key blink}<span class="led" aria-hidden="true"></span>{/key}
		{/if}
		<span class="silk">{label}</span>
		{#if detail}<span class="silk detail">{detail}</span>{/if}
		{@render keys?.()}
	</div>
	<div class="screen">
		{@render children()}
	</div>
</div>

<style>
	.module {
		position: relative;
		grid-area: var(--area);
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		min-width: 0;
		min-height: 0;
		padding: 0.75rem 0.85rem 0.85rem;
		border-radius: 22px;
		background: linear-gradient(180deg, #fff, var(--te-body) 55%, var(--te-body-2));
		box-shadow:
			inset 0 1px 0 #fff,
			inset 0 -2px 0 rgba(28, 27, 24, 0.05),
			0 0 0 1px rgba(28, 27, 24, 0.06),
			0 1px 2px rgba(28, 27, 24, 0.06),
			0 18px 32px -18px rgba(28, 27, 24, 0.32);
		transition:
			transform 300ms var(--ease-out),
			box-shadow 300ms var(--ease-out);
	}

	@media (hover: hover) {
		.module:hover {
			transform: translateY(-2px);
			box-shadow:
				inset 0 1px 0 #fff,
				inset 0 -2px 0 rgba(28, 27, 24, 0.05),
				0 0 0 1px rgba(28, 27, 24, 0.06),
				0 2px 4px rgba(28, 27, 24, 0.06),
				0 26px 40px -20px rgba(28, 27, 24, 0.36);
		}
	}

	.top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 1.4rem;
	}

	.detail {
		margin-left: auto;
		white-space: nowrap;
	}

	.top :global(.key) {
		width: 1.4rem;
		height: 1.4rem;
		font-size: 11px;
	}

	.top :global(.key svg) {
		width: 12px;
		height: 12px;
	}

	.detail + :global(.key) {
		margin-left: 0.15rem;
	}

	.top :global(.key:disabled) {
		opacity: 0.45;
		cursor: default;
	}

	.screen {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-height: 0;
		padding: 0.6rem 0.75rem;
		border-radius: 14px;
		background: var(--te-screen);
		color: var(--te-lit);
		font-family: var(--sans);
		font-size: 12px;
		line-height: 1.35;
		overflow: hidden;
		box-shadow:
			var(--te-well),
			0 1px 0 #fff;
	}
</style>
