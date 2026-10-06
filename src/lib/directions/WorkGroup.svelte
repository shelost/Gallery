<script>
	import WorkList from './WorkList.svelte';

	/**
	 * One numbered section of the index. Lists can share one `active` row: each only clears the
	 * row it set, so moving between lists never drops the new one.
	 * @type {{
	 *   group: { id: string, numeral: string, label: string, ellipsis?: boolean, works: import('./content.js').Work[] },
	 *   active?: string | null,
	 *   i?: number,
	 *   preview?: boolean
	 * }}
	 */
	let { group, active = $bindable(null), i = 0, preview = true } = $props();

	const owns = $derived(group.works.some((work) => work.id === active));
</script>

<section class="sfumato" style:--i={i} aria-labelledby="group-{group.id}">
	<h2 id="group-{group.id}">
		<span class="num">{group.numeral}</span>
		{group.label}{#if group.ellipsis}<span class="ellipsis" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>{/if}
	</h2>
	<WorkList
		works={group.works}
		{preview}
		bind:active={
			() => (owns ? active : null),
			(id) => {
				if (id !== null) active = id;
				else if (owns) active = null;
			}
		}
	/>
</section>

<style>
	section {
		position: relative;
		margin-bottom: 2.75rem;
	}

	h2 {
		margin-bottom: 0.4rem;
		color: var(--ink-3);
	}

	.ellipsis span {
		animation: ellipsis 1.4s infinite;
		opacity: 0;
	}

	.ellipsis span:nth-child(2) {
		animation-delay: 0.2s;
	}

	.ellipsis span:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes ellipsis {
		0% {
			opacity: 0;
		}
		30%,
		80% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ellipsis span {
			animation: none;
			opacity: 1;
		}
	}

	.num {
		position: absolute;
		left: -2.75rem;
		width: 2rem;
		font-family: var(--serif);
		font-size: 16px;
		line-height: 1.4;
		text-align: right;
		color: var(--ink-3);
	}

	@media (max-width: 720px) {
		.num {
			position: static;
			display: inline-block;
			width: auto;
			margin-right: 0.5rem;
			text-align: left;
		}
	}
</style>
