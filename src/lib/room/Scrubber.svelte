<script>
	/**
	 * Where the song is, as a bar to drag: elapsed on the left, the length on the right. Until the
	 * player knows the length the bar sits empty and can't be dragged.
	 * @type {{ time: number, duration: number, onseek: (seconds: number) => void }}
	 */
	let { time, duration, onseek } = $props();

	const progress = $derived(duration > 0 ? Math.min(1, time / duration) : 0);

	/** @param {number} seconds */
	function clock(seconds) {
		const whole = Math.max(0, Math.floor(seconds));
		return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
	}
</script>

<div class="scrubber" style:--progress={progress}>
	<span class="time">{clock(time)}</span>
	<input
		type="range"
		min="0"
		max={duration || 1}
		step="0.1"
		value={time}
		disabled={!duration}
		aria-label="Seek"
		aria-valuetext="{clock(time)} of {clock(duration)}"
		oninput={(event) => onseek(Number(event.currentTarget.value))}
	/>
	<span class="time">{duration ? clock(duration) : '-:--'}</span>
</div>

<style>
	.scrubber {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.6rem;
	}

	.time {
		min-width: 2.4em;
		color: #a39d92;
		font-family: var(--mono);
		font-size: 0.66rem;
		font-variant-numeric: tabular-nums;
	}

	.time:last-child {
		text-align: right;
	}

	input {
		width: 100%;
		height: 1rem;
		margin: 0;
		background: none;
		cursor: pointer;
		appearance: none;
	}

	input:disabled {
		cursor: default;
	}

	input::-webkit-slider-runnable-track {
		height: 3px;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--accent) calc(var(--progress) * 100%), rgba(255, 255, 255, 0.16) 0);
	}

	input::-moz-range-track {
		height: 3px;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--accent) calc(var(--progress) * 100%), rgba(255, 255, 255, 0.16) 0);
	}

	input::-webkit-slider-thumb {
		width: 11px;
		height: 11px;
		margin-top: -4px;
		border: 0;
		border-radius: 50%;
		background: #f2ede4;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
		appearance: none;
		transition: scale 120ms var(--ease-out);
	}

	input::-moz-range-thumb {
		width: 11px;
		height: 11px;
		border: 0;
		border-radius: 50%;
		background: #f2ede4;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
	}

	input:not(:disabled):hover::-webkit-slider-thumb {
		scale: 1.25;
	}

	input:disabled::-webkit-slider-thumb {
		opacity: 0;
	}

	input:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
		border-radius: 4px;
	}
</style>
