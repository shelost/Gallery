<script>
	let { data } = $props();

	let container;
	let measuredWidth = $state(0);

	function measure() {
		if (container) {
			const rect = container.getBoundingClientRect();
			measuredWidth = Math.ceil(rect.width);
		}
	}

	$effect(() => {
		// remeasure when text or style changes
		data?.text;
		data?.fontSize;
		data?.fontWeight;
		measure();
	});
</script>

<div
	class="text-node"
	style="width: {measuredWidth}px; text-align: {data?.textAlign ?? 'left'};"
>
	<div
		bind:this={container}
		class="text-content"
		style="
			font-size: {data?.fontSize ?? '16px'};
			font-weight: {data?.fontWeight ?? '500'};
			color: {data?.color ?? '#111827'};
		"
	>
		{data?.text}
	</div>
</div>

<style>
	.text-node {
		display: inline-block;
		background: transparent;
	}
	.text-content {
		white-space: nowrap;
		line-height: 1.2;
		padding: 0;
	}
</style>


