<script>
	/**
	 * A candidate bar, like an input method's: the word at the caret offered back as hangul
	 * and hanja, likeliest first. Tab takes the first; click takes any.
	 * @type {{ suggester: import('./suggester.svelte.js').Suggester }}
	 */
	let { suggester } = $props();
</script>

{#if suggester.candidates.length}
	<div class="candidates" role="listbox" aria-label="Suggestions">
		{#each suggester.candidates as candidate, n (candidate.kind + candidate.text + n)}
			<button
				type="button"
				role="option"
				aria-selected={n === 0}
				class={['candidate', candidate.kind, n === 0 && 'first']}
				onmousedown={(event) => event.preventDefault()}
				onclick={() => suggester.choose(candidate)}
			>
				<span class="text">{candidate.text}</span>
				<span class="note">{candidate.note}</span>
				{#if n === 0}<kbd>Tab</kbd>{/if}
			</button>
		{/each}
	</div>
{/if}

<style>
	.candidates {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		scrollbar-width: none;
		padding: 7px 6px 2px 0;
		margin-top: -7px;
	}

	.candidate {
		position: relative;
		flex: none;
		display: grid;
		justify-items: center;
		gap: 1px;
		padding: 5px 12px 4px;
		border: 1px solid rgb(42 34 27 / 0.15);
		border-radius: 10px;
		background: rgb(255 255 255 / 0.55);
		color: inherit;
		cursor: pointer;
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}

	.candidate:hover,
	.candidate:focus-visible {
		background: rgb(42 34 27 / 0.06);
		outline: none;
	}

	.candidate.first {
		border-color: rgb(181 40 28 / 0.55);
	}

	.text {
		font-family: 'Gowun Batang', 'Noto Serif KR', 'Noto Serif TC', serif;
		font-size: 1.15rem;
		line-height: 1.15;
	}

	.hanja .text {
		color: #2a1a12;
	}

	.note {
		font-family: Inter, sans-serif;
		font-size: 0.62rem;
		opacity: 0.5;
		white-space: nowrap;
	}

	kbd {
		position: absolute;
		top: -7px;
		right: -5px;
		padding: 0 4px;
		border-radius: 4px;
		background: #b5281c;
		color: #f4ecdd;
		font-family: Inter, sans-serif;
		font-size: 0.55rem;
		line-height: 1.5;
	}
</style>
