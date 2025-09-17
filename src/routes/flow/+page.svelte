<script>
	import { SvelteFlow, Background } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import ElementNode from './ElementNode.svelte';
	import TextNode from './TextNode.svelte';

	export let data;

	const nodeTypes = { element: ElementNode, text: TextNode };

	const posts = data?.posts ?? [];

	const columnWidth = 300;
	const rowHeight = 140;

	// Build nodes: title, subtitle, section headers, grouped posts
	let yCursor = 20;
	/** @type {any[]} */
	const nodes = [];

	// Title
	nodes.push({
		id: 'title',
		type: 'text',
		data: {
			text: 'Heewon Ahn',
			fontSize: '36px',
			fontWeight: '600',
			textAlign: 'left'
		},
		position: { x: 100, y: yCursor }
	});
	yCursor += 44;

	// Subtitle
	nodes.push({
		id: 'subtitle',
		type: 'text',
		data: {
			text: 'I design websites',
			fontSize: '16px',
			fontWeight: '450',
			color: 'rgba(0,0,0,0.6)',
			textAlign: 'left'
		},
		position: { x: 100, y: yCursor }
	});
	yCursor += 60;

	// Group by type with section headers
	let currentType = undefined;
	let sectionIndex = 0;
	let indexWithinSection = 0;

	for (let i = 0; i < posts.length; i++) {
		const post = posts[i];
		const type = post?.meta?.type ?? 'misc';

		if (i === 0 || type !== currentType) {
			currentType = type;
			indexWithinSection = 0;
			const titleCase = (s) => s?.charAt(0).toUpperCase() + s?.slice(1);

			nodes.push({
				id: `section-${sectionIndex}`,
				type: 'text',
				data: {
					text: titleCase(currentType),
					fontSize: '20px',
					fontWeight: '600',
					textAlign: 'left'
				},
				position: { x: 100, y: yCursor }
			});
			sectionIndex += 1;
			yCursor += 40;
		}

		const col = indexWithinSection % 3;
		const row = Math.floor(indexWithinSection / 3);
		nodes.push({
			id: `post-${i}`,
			type: 'element',
			data: post,
			position: { x: 100 + col * columnWidth, y: yCursor + row * rowHeight }
		});
		indexWithinSection += 1;

		const nextType = posts[i + 1]?.meta?.type;
		if (!nextType || nextType !== currentType) {
			const rowsUsed = Math.ceil(indexWithinSection / 3);
			yCursor += rowsUsed * rowHeight + 40;
		}
	}

	const edges = [];

	const contentHeight = nodes.length ? yCursor + 40 : 1000;
</script>

<div class="page-container">
	<div class="flow-wrapper" style="height: {contentHeight}px">
		<SvelteFlow
			nodes={nodes}
			edges={edges}
			nodeTypes={nodeTypes}
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
