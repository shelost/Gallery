<script>
	import { SvelteFlow, Background } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';

	const initialNodes = [
		{
			id: '1',
			type: 'input',
			data: { label: 'Start' },
			position: { x: 250, y: 5 }
		},
		{
			id: '2',
			data: { label: 'A process' },
			position: { x: 250, y: 100 }
		},
		{
			id: '3',
			data: { label: 'Another process' },
			position: { x: 250, y: 200 }
		},
		{
			id: '4',
			data: { label: 'Yet another process' },
			position: { x: 250, y: 300 }
		},
		{
			id: '5',
			data: { label: 'Something else' },
			position: { x: 250, y: 400 }
		},
		{
			id: '6',
			data: { label: 'More things' },
			position: { x: 250, y: 500 }
		},
		{
			id: '7',
			data: { label: 'Keep going' },
			position: { x: 250, y: 600 }
		},
		{
			id: '8',
			data: { label: 'Almost there' },
			position: { x: 250, y: 700 }
		},
		{
			id: '9',
			data: { label: 'Last one' },
			position: { x: 250, y: 800 }
		},
		{
			id: '10',
			type: 'output',
			data: { label: 'End' },
			position: { x: 250, y: 950 }
		}
	];

	const initialEdges = [
		{ id: 'e1-2', source: '1', target: '2' },
		{ id: 'e2-3', source: '2', target: '3' },
		{ id: 'e3-4', source: '3', target: '4' },
		{ id: 'e4-5', source: '4', target: '5' },
		{ id: 'e5-6', source: '5', target: '6' },
		{ id: 'e6-7', source: '6', target: '7' },
		{ id: 'e7-8', source: '7', target: '8' },
		{ id: 'e8-9', source: '8', target: '9' },
		{ id: 'e9-10', source: '9', target: '10' }
	];

	const lastNode = initialNodes.reduce((last, node) =>
		node.position.y > last.position.y ? node : last
	);
	// Add some padding for the last node's height and some bottom margin
	const contentHeight = lastNode.position.y + 150;
</script>

<div class="page-container">
	<div class="flow-wrapper" style="height: {contentHeight}px">
		<SvelteFlow
			nodes={initialNodes}
			edges={initialEdges}
			fitView
			pannable={false}
			zoomOnScroll={false}
			zoomOnDoubleClick={false}
			preventScrolling={false}
		>
			<Background />
		</SvelteFlow>
	</div>
</div>

<style>
	:global(body) {
		overflow: hidden;
	}
	.page-container {
		height: 100dvh;
		overflow-y: auto;
		overflow-x: hidden;
	}
	.flow-wrapper {
		width: 100%;
		min-height: 100dvh;
	}
</style>
