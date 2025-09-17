<script>
	import { Handle, Position } from '@xyflow/svelte';
	let { data } = $props();
</script>

<div class="element-node">
	
	<div class="mast">
		<h1 class="title">
			{data?.meta.title ?? 'Untitled'}
		</h1>
		<h2 class="description">
			{data?.meta.description ?? 'No description'}
		</h2>
	</div>
	<!--
	<Handle type="target" position={Position.Top} />
	<Handle type="source" position={Position.Bottom} />
	-->
</div>

<style lang="scss">

	.element-node {
		min-width: 160px;
		max-width: 240px;
		font-family: 'Inter', sans-serif;
		padding: 10px 12px;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: white;
		box-shadow: 0 4px 10px rgba(0,0,0,0.05);
	}

	.mast{
		text-align: left;
		h1{
			font-family: 'Inter', sans-serif;
			font-size: 14px;
			font-weight: 600;
			letter-spacing: -0.5px;
			line-height: 1.2;
			text-align: left;
		}
		h2{
			font-family: 'Inter', sans-serif;
			font-size: 12px;
			font-weight: 400;
			line-height: 1.2;
			color: rgba(0,0,0,0.5);
		}
	}

</style>

