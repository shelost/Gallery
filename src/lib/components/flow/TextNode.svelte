<script lang="ts">
	// Imports
	import {
		Handle,
		Position,
		NodeResizer,
		type NodeProps,
		useSvelteFlow,
		type OnResizeStart,
		type OnResize,
		type OnResizeEnd
	} from '@xyflow/svelte';
	import { onMount, onDestroy, tick, createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';
	import {
		isEditingTextNode,
		isTextFocused,
		updateNodeDimensions,
		updateNodeDataReactive,
		nodes,
		connectModeActive,
		isNodeInResizingFrame,
		isNodeInDraggingFrame
	} from '$lib/stores/flowStores.js';
	import ViewModeButtons from '$lib/components/shared/ViewModeButtons.svelte';

	// Props
	type $$Props = NodeProps;
	export let id: $$Props['id'];
	export let parentId: $$Props['parentId'] = undefined;
	export let data: $$Props['data'] = {
		text: 'Text',
		fontSize: '12px',
		fontFamily: 'inherit',
		fontWeight: 'normal',
		textAlign: 'left',
		fitMode: 'fit',
		manualWidth: 200,
		lineHeight: 1.2,
		letterSpacing: '0px',
		autoFocus: false
	};
	export let selected: $$Props['selected'] = false;
	export let width: $$Props['width'] = undefined;
	export let height: $$Props['height'] = undefined;
	export let isInSelectionContext: boolean = false;
	export let isActiveChild: boolean = false;

	// SvelteFlow & Dispatcher
	const { updateNode, deleteElements } = useSvelteFlow();
	const dispatch = createEventDispatcher();

	// Local State
	let textarea: HTMLTextAreaElement | null = null;
	let virtualMeasureElement: HTMLDivElement | null = null;
	let virtualManualMeasureElement: HTMLDivElement | null = null;
	let nodeContainer: HTMLDivElement | null = null;
	let isEditing = data.autoFocus || false;
	let clickCount = 0;
	let clickTimeout: ReturnType<typeof setTimeout>;

	let updateDebounceTimeout: ReturnType<typeof setTimeout>;
	let pendingTextValue = data.text;
	const DEBOUNCE_DELAY = 300;

	let liveTextStreamTimeout: ReturnType<typeof setTimeout>;
	let lastStreamedContent = '';
	let typingPauseTimeout: ReturnType<typeof setTimeout>;
	const LIVE_STREAM_DEBOUNCE = 800;
	const TYPING_PAUSE_THRESHOLD = 500;
	let resizingHorizontally = false;

	const isNodeHovered = writable(false);

	let currentDimensions = { width: 0, height: 0 };
	let lastDimensionKey = '';
	let lastFitMode = data.fitMode;
	let lastContentValues: Record<string, any> = {
		text: data.text,
		fontSize: data.fontSize,
		fontFamily: data.fontFamily,
		fontWeight: data.fontWeight,
		letterSpacing: data.letterSpacing,
		lineHeight: data.lineHeight
	};

	// --- Reactive Logic ---

	$: isInDraggingContext = parentId && isNodeInDraggingFrame(id, parentId);

	$: {
		if (!isInDraggingContext) {
			const thisNode = $nodes.find((node) => node.id === id);
			if (thisNode) {
				const newWidth = thisNode.width || 0;
				const newHeight = thisNode.height || 0;
				const dimensionKey = `${Math.round(newWidth)}x${Math.round(newHeight)}`;

				if (dimensionKey !== lastDimensionKey) {
					lastDimensionKey = dimensionKey;
					currentDimensions = {
						width: newWidth,
						height: newHeight
					};
				}
			}
		}
	}

	$: {
		const currentFitMode = data.fitMode;
		const fitModeChanged = currentFitMode !== lastFitMode;

		if (!isInDraggingContext && fitModeChanged) {
			lastFitMode = currentFitMode;
			if (currentFitMode === 'fit') {
				fitContentUsingVirtualElement();
			} else if (currentFitMode === 'manual') {
				setManualWidth();
				adjustHeightForManualMode();
			}
		}
	}

	$: {
		if (!isInDraggingContext && data.fitMode === 'fit') {
			const currentValues = {
				text: data.text,
				fontSize: data.fontSize,
				fontFamily: data.fontFamily,
				fontWeight: data.fontWeight,
				letterSpacing: data.letterSpacing,
				lineHeight: data.lineHeight
			};

			const hasChanged = Object.keys(currentValues).some(
				(key) => currentValues[key] !== lastContentValues[key]
			);

			if (hasChanged) {
				lastContentValues = { ...currentValues };
				fitContentUsingVirtualElement(!!isEditing);
			}
		}
	}

	// Auto-adjust height in manual mode when width or content changes
	$: {
		if (!isInDraggingContext && data.fitMode === 'manual' && currentDimensions.width > 0) {
			const currentValues = {
				text: data.text,
				fontSize: data.fontSize,
				fontFamily: data.fontFamily,
				fontWeight: data.fontWeight,
				letterSpacing: data.letterSpacing,
				lineHeight: data.lineHeight
			};

			const hasContentChanged = Object.keys(currentValues).some(
				(key) => currentValues[key] !== lastContentValues[key]
			);

			if (hasContentChanged) {
				lastContentValues = { ...currentValues };
			}

			adjustHeightForManualMode(currentDimensions.width, currentDimensions.height);
		}
	}

	$: if (!selected) {
		clickCount = 0;
		if (clickTimeout) {
			clearTimeout(clickTimeout);
		}
		if (isEditing && textarea) {
			textarea.blur();
		}
	}

	$: if (id && !selected && (typeof data.text !== 'string' || data.text.trim() === '')) {
		setTimeout(() => {
			deleteElements({ nodes: [{ id }] });
		}, 0);
	}

	// --- Core Logic: Sizing & Data ---

	function updateDimensions(newDimensions: { width?: number; height?: number }) {
		const isInResizingContext = parentId && isNodeInResizingFrame(id, parentId);

		if (isInResizingContext) {
			if (data.fitMode === 'manual') {
				if (textarea) {
					const availableWidth = currentDimensions.width || newDimensions.width || 200;
					textarea.style.width = `${availableWidth - 20}px`;
				}
				return;
			}
		}
		updateNodeDimensions(id, newDimensions);
	}

	function updateDataReactive(dataUpdates: Record<string, any>) {
		updateNodeDataReactive(id, dataUpdates);
	}

	function debouncedUpdateNodeData(newText: string) {
		clearTimeout(updateDebounceTimeout);
		pendingTextValue = newText;
		updateDebounceTimeout = setTimeout(() => {
			updateDataReactive({ text: pendingTextValue });
		}, DEBOUNCE_DELAY);
	}

	async function fitContentUsingVirtualElement(preserveCursor = false) {
		if (!virtualMeasureElement || data.fitMode !== 'fit') return;

		const cursorPosition = preserveCursor ? saveCursorPosition() : null;

		virtualMeasureElement.textContent = (data.text || '') + ' ';

		await tick();

		const handleSpace = 0;
		const buffer = 4;

		let newWidth = virtualMeasureElement.offsetWidth + handleSpace + buffer;
		let newHeight = virtualMeasureElement.offsetHeight;

		if (newHeight < 30) newHeight = 30;

		const widthChanged = Math.abs(currentDimensions.width - newWidth) > 1;
		const heightChanged = Math.abs(currentDimensions.height - newHeight) > 1;

		if (widthChanged || heightChanged) {
			updateDimensions({ width: newWidth, height: newHeight });
		}

		if (cursorPosition) {
			requestAnimationFrame(() => {
				restoreCursorPosition(cursorPosition);
			});
		}
	}

	async function fitContent() {
		if (!textarea) return;
		await updateDataReactive({ fitMode: 'fit' });
		tick().then(() => fitContentUsingVirtualElement());
	}

	function setManualWidth() {
		if (data.fitMode !== 'manual') return;
		const manualWidth = (data.manualWidth as number) || currentDimensions.width || width || 200;
		if (Math.abs(currentDimensions.width - manualWidth) > 1) {
			updateDimensions({ width: manualWidth });
		}
	}

	async function adjustHeightForManualMode(newWidth?: number, currentHeight?: number) {
		const widthToUse = newWidth ?? currentDimensions.width;
		if (!virtualManualMeasureElement || data.fitMode !== 'manual' || widthToUse <= 0) return;

		// Set the virtual element width to match current node width
		virtualManualMeasureElement.style.width = `${widthToUse - 12}px`; // Account for padding
		virtualManualMeasureElement.textContent = (data.text || '') + ' ';

		await tick();

		const measuredHeight = virtualManualMeasureElement.offsetHeight;
		const minHeight = 30;
		const calculatedHeight = Math.max(measuredHeight, minHeight);

		// Only update if height actually changed significantly
		if (newWidth !== undefined && currentHeight !== undefined) {
			// Called from handleResize
			if (Math.abs(currentHeight - calculatedHeight) > 1) {
				updateDimensions({ width: newWidth, height: calculatedHeight });
			}
		} else {
			// Called from reactive block or onMount
			if (Math.abs(currentDimensions.height - calculatedHeight) > 1) {
				updateDimensions({ height: calculatedHeight });
			}
		}
	}

	// --- Core Logic: Editing State ---

	function enterEditMode() {
		if (!textarea || !selected) return;

		const firstTime = !isEditing;
		isEditing = true;
		textarea.focus();

		if (firstTime) {
			textarea.select();
		}
	}

	function handleFocus() {
		if ($connectModeActive) return;
		isEditing = true;
		updateNode(id, { draggable: false });

		isEditingTextNode.set(true);
		isTextFocused.set(true);

		if (typeof window !== 'undefined') {
			window.dispatchEvent(
				new CustomEvent('nodeEditingStart', {
					detail: { nodeId: id, nodeType: 'text', content: data.text || '', timestamp: Date.now() }
				})
			);
		}
	}

	function handleBlur() {
		isEditing = false;
		updateNode(id, { draggable: true });

		isEditingTextNode.set(false);
		isTextFocused.set(false);

		if (typeof window !== 'undefined') {
			window.dispatchEvent(
				new CustomEvent('nodeEditingStop', {
					detail: {
						nodeId: id,
						nodeType: 'text',
						finalContent: data.text || '',
						timestamp: Date.now()
					}
				})
			);
		}
	}

	// --- Event Handlers ---

	function handleTextAreaClick(event: MouseEvent) {
		if ($connectModeActive) return;

		if (isInSelectionContext && selected) {
			enterEditMode();
			event.stopPropagation();
			return;
		}

		if (!selected || isEditing) {
			return;
		}

		clickCount++;

		if (clickCount === 1) {
			clickTimeout = setTimeout(() => {
				clickCount = 0;
			}, 300);
		} else if (clickCount >= 2) {
			clearTimeout(clickTimeout);
			clickCount = 0;
			enterEditMode();
		}
		event.stopPropagation();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.code === 'Space' && isEditing) {
			event.stopPropagation();
		}
		if (event.key === 'Enter' && event.shiftKey && isEditing) {
			event.preventDefault();
			textarea?.blur();
		}
		if (event.key === 'Escape' && isEditing) {
			event.preventDefault();
			textarea?.blur();
		}
	}

	function handleMouseDown(event: MouseEvent) {
		if ($connectModeActive) return;
		if (isEditing) {
			event.stopPropagation();
		}
	}

	function handleWheel(event: WheelEvent) {
		event.stopPropagation();
	}

	function handleDragStart(event: DragEvent) {
		if (!event.dataTransfer || isEditing) return;
		event.dataTransfer.setData(
			'text/plain',
			JSON.stringify({
				type: 'text',
				nodeId: id,
				data: data
			})
		);
		event.dataTransfer.effectAllowed = 'move';
	}

	function handleResizeStart(event: Parameters<OnResizeStart>[0]) {
		const target = event.sourceEvent?.target as HTMLElement;
		if (target && target.className) {
			resizingHorizontally =
				target.className.includes('--r') || target.className.includes('--l');
		}

		const currentWidth = currentDimensions.width || width || 200;
		const currentHeight = currentDimensions.height || height || 100;

		updateDataReactive({
			fitMode: 'manual',
			manualWidth: currentWidth,
			manualHeight: currentHeight
		});
	}

	function handleResize(event: Parameters<OnResize>[0], params: Parameters<OnResize>[1]) {
		if (data.fitMode === 'manual') {
			updateDataReactive({
				manualWidth: params.width,
				manualHeight: params.height
			});
			if (resizingHorizontally) {
				adjustHeightForManualMode(params.width, params.height);
			}
		}
	}

	function handleResizeEnd(event: Parameters<OnResizeEnd>[0], params: Parameters<OnResizeEnd>[1]) {
		resizingHorizontally = false;
		if (data.fitMode === 'manual') {
			adjustHeightForManualMode(params.width, params.height);
		}
	}

	function handleEnterTextEditMode(event: Event) {
		const detail = (event as CustomEvent).detail;
		if (detail.nodeId === id) {
			enterEditMode();
		}
	}

	function handleChatNodeStreaming(event: Event) {
		const detail = (event as CustomEvent).detail;
		if (detail.targetNodeId === id && detail.targetNodeType === 'text') {
			data.text = detail.content;
			pendingTextValue = detail.content;
			updateDataReactive({ text: detail.content });

			tick().then(() => {
				if (data.fitMode === 'fit') {
					fitContentUsingVirtualElement();
				} else if (data.fitMode === 'manual') {
					adjustHeightForManualMode();
				}
			});
		}
	}

	// --- AI Text Analysis & Streaming ---

	function handleLiveTextInput(currentText: string) {
		clearTimeout(liveTextStreamTimeout);
		clearTimeout(typingPauseTimeout);

		const contentGrowth = currentText.length - lastStreamedContent.length;
		if (contentGrowth > 20) {
			streamTextToAI(currentText, false);
		}

		typingPauseTimeout = setTimeout(() => {
			streamTextToAI(currentText, true);
		}, TYPING_PAUSE_THRESHOLD);

		liveTextStreamTimeout = setTimeout(() => {
			streamTextToAI(currentText, false);
		}, LIVE_STREAM_DEBOUNCE);
	}

	function streamTextToAI(currentText: string, isTypingPause = false) {
		if (
			(currentText === lastStreamedContent && !isTypingPause) ||
			(currentText.length < 10 && !isTypingPause)
		) {
			return;
		}
		lastStreamedContent = currentText;

		if (typeof window !== 'undefined') {
			window.dispatchEvent(
				new CustomEvent('liveTextStream', {
					detail: {
						nodeId: id,
						currentText,
						fullText: currentText,
						nodeType: 'text',
						isTypingPause,
						wordCount: currentText.split(/\s+/).filter((w) => w.length > 0).length,
						characterCount: currentText.length,
						lastSentence: extractLastSentence(currentText),
						context: analyzeTextContext(currentText),
						timestamp: Date.now()
					}
				})
			);
		}
	}

	function extractLastSentence(text: string): string {
		if (!text) return '';
		const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
		if (sentences.length === 0) return text.trim();
		const lastSentence = sentences[sentences.length - 1].trim();
		if (lastSentence.length < 20 && sentences.length > 1) {
			const previousSentence = sentences[sentences.length - 2].trim();
			return `${previousSentence}. ${lastSentence}`;
		}
		return lastSentence;
	}

	function analyzeTextContext(text: string): any {
		const lowercaseText = text.toLowerCase();
		const words = text.split(/\s+/).filter((w) => w.length > 0);
		const domainSignals = {
			academic: [
				'research',
				'study',
				'analysis',
				'theory',
				'evidence',
				'methodology',
				'literature'
			],
			gaming: ['game', 'video', 'console', 'player', 'nintendo', 'mario', 'sonic', 'gameplay'],
			history: [
				'century',
				'empire',
				'war',
				'ancient',
				'medieval',
				'historical',
				'byzantine',
				'emperor'
			],
			business: ['market', 'strategy', 'company', 'revenue', 'customer', 'business', 'industry'],
			creative: ['story', 'character', 'narrative', 'plot', 'creative', 'artistic', 'design'],
			technical: ['system', 'technology', 'development', 'software', 'algorithm', 'database']
		};
		let dominantDomain = 'general';
		let maxMatches = 0;
		for (const [domain, keywords] of Object.entries(domainSignals)) {
			const matches = keywords.filter((keyword) => lowercaseText.includes(keyword)).length;
			if (matches > maxMatches) {
				maxMatches = matches;
				dominantDomain = domain;
			}
		}
		const hasQuestions = text.includes('?');
		const hasAnalyticalWords =
			/\b(however|therefore|furthermore|moreover|consequently|thus)\b/i.test(text);
		const hasPersonalWords = /\b(i think|i believe|in my opinion|personally)\b/i.test(text);
		let writingStyle = 'descriptive';
		if (hasAnalyticalWords) writingStyle = 'analytical';
		else if (hasPersonalWords) writingStyle = 'personal';
		else if (hasQuestions) writingStyle = 'exploratory';

		return {
			domain: dominantDomain,
			domainConfidence: maxMatches / Math.max(domainSignals[dominantDomain]?.length || 1, 1),
			writingStyle,
			wordCount: words.length,
			hasQuestions,
			isAnalytical: hasAnalyticalWords,
			isPersonal: hasPersonalWords,
			recentTopic: extractRecentTopic(text)
		};
	}

	function extractRecentTopic(text: string): string {
		const words = text.split(/\s+/).filter((w) => w.length > 0);
		const recentWords = words.slice(-50).join(' ');
		const nounPhrases = recentWords.match(/\b[A-Z][a-z]*(?:\s+[a-z]+)*\b/g) || [];
		return nounPhrases.slice(-3).join(', ') || 'general discussion';
	}

	// --- Utilities ---

	function saveCursorPosition() {
		if (!textarea) return null;
		return {
			start: textarea.selectionStart,
			end: textarea.selectionEnd,
			direction: textarea.selectionDirection
		};
	}

	function restoreCursorPosition(position: any) {
		if (!textarea || !position) return;
		try {
			textarea.setSelectionRange(position.start, position.end, position.direction);
		} catch (e) {
			textarea.selectionStart = position.start;
			textarea.selectionEnd = position.end;
		}
	}

	function handleDownloadText() {
		if (typeof document === 'undefined') return;
		
		const textContent = (data.text as string) || '';
		if (!textContent.trim()) {
			return;
		}
		const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `text-${id}-${Date.now()}.txt`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	// --- Lifecycle ---

	onMount(() => {
		const initialize = () => {
			if (data.fitMode === 'fit') {
				fitContentUsingVirtualElement();
			} else if (data.fitMode === 'manual') {
				setManualWidth();
				adjustHeightForManualMode(width, height);
			}
		};
		initialize();
		setTimeout(() => {
			initialize();
			if (!parentId && data.autoFocus) {
				textarea.focus();
			}
		}, 100);

		if (typeof window !== 'undefined') {
			window.addEventListener('fitNodeContent', (e) => {
				if ((e as CustomEvent).detail.nodeId === id) {
					fitContent();
				}
			});
			window.addEventListener('enterTextEditMode', handleEnterTextEditMode);
			window.addEventListener('chatNodeStreaming', handleChatNodeStreaming);
		}
	});

	onDestroy(() => {
		clearTimeout(clickTimeout);
		clearTimeout(updateDebounceTimeout);
		clearTimeout(liveTextStreamTimeout);
		clearTimeout(typingPauseTimeout);
		isEditingTextNode.set(false);
		isTextFocused.set(false);
		if (typeof window !== 'undefined') {
			window.removeEventListener('enterTextEditMode', handleEnterTextEditMode);
			window.removeEventListener('chatNodeStreaming', handleChatNodeStreaming);
		}
	});
</script>

<div class="floatable top header" style="display: none;">
	<div class="left-controls">
		<button
			class="download-btn"
			on:click|stopPropagation={handleDownloadText}
			title="Download text as .txt file"
		>
			<span class="material-symbols-outlined">download</span>
		</button>
	</div>

	<h3>Text</h3>

	<div class="right-controls">
		<ViewModeButtons nodeId={id} />
	</div>
</div>

<div
	bind:this={nodeContainer}
	class="flow-node"
	draggable={!isEditing}
	on:dragstart={handleDragStart}
	on:mouseenter={() => isNodeHovered.set(true)}
	on:mouseleave={() => isNodeHovered.set(false)}
	role="button"
	tabindex="0"
>
	<NodeResizer
		isVisible={true}
		minWidth={100}
		minHeight={30}
		onResizeStart={handleResizeStart}
		onResize={handleResize}
		onResizeEnd={handleResizeEnd}
	/>

	<div class="node">
		<div class="textarea-container">
			<textarea
				bind:this={textarea}
				bind:value={data.text}
				style="font-size:{data.fontSize || '12px'}; font-family:{data.fontFamily ||
					'inherit'}; font-weight:{data.fontWeight || 'normal'}; text-align:{data.textAlign ||
					'left'}; color:{data.color || 'black'}; line-height:{data.lineHeight ||
					1.2}; letter-spacing:{data.letterSpacing || '0px'};"
				rows="1"
				readonly={!isEditing}
				tabindex={isEditing ? 0 : -1}
				on:focus={handleFocus}
				on:blur={handleBlur}
				on:wheel={handleWheel}
				on:keydown={handleKeyDown}
				on:mousedown={handleMouseDown}
				on:click={handleTextAreaClick}
				class:fit-mode={data.fitMode === 'fit'}
			></textarea>
		</div>
		<Handle type="source" position={Position.Right} />
	</div>
</div>

<!-- Virtual measurement element for fit mode -->
<div
	bind:this={virtualMeasureElement}
	class="virtual-measure"
	style="font-size:{data.fontSize || '12px'}; font-family:{data.fontFamily ||
		'inherit'}; font-weight:{data.fontWeight || 'normal'}; text-align:{data.textAlign ||
		'left'}; line-height:{data.lineHeight || 1.2}; letter-spacing:{data.letterSpacing || '0px'};"
></div>

<!-- Virtual measurement element for manual mode height adjustment -->
<div
	bind:this={virtualManualMeasureElement}
	class="virtual-measure-manual"
	style="font-size:{data.fontSize || '12px'}; font-family:{data.fontFamily ||
		'inherit'}; font-weight:{data.fontWeight || 'normal'}; text-align:{data.textAlign ||
		'left'}; line-height:{data.lineHeight || 1.2}; letter-spacing:{data.letterSpacing || '0px'};"
></div>

<style lang="scss">
	.virtual-measure {
		position: absolute;
		visibility: hidden;
		top: -9999px;
		left: -9999px;
		pointer-events: none;
		max-width: 1000px;
		padding: 6px 6px;
		border: none;
		box-sizing: border-box;
		white-space: pre-wrap;
		overflow-wrap: break-word;
		width: auto;
		height: auto;
		display: inline-block;
		font: inherit;
		font-size: 12px;
		font-weight: 500;
		line-height: 1;
		letter-spacing: -0.3px;
	}

	.virtual-measure-manual {
		position: absolute;
		visibility: hidden;
		top: -9999px;
		left: -9999px;
		pointer-events: none;
		padding: 6px 6px;
		border: none;
		box-sizing: border-box;
		white-space: pre-wrap;
		overflow-wrap: break-word;
		height: auto;
		display: block;
		font: inherit;
		font-size: 12px;
		font-weight: 500;
		line-height: 1;
		letter-spacing: -0.3px;
	}

	.flow-node {
		position: relative;
		width: 100%;
		height: 100%;
		max-width: 1000px;
		max-height: 100%;
	}

	.node {
		position: relative;
		display: flex;
		gap: 8px;
		width: 100%;
		max-width: 100%;
		height: 100%;
		max-height: 100%;
		overflow: hidden;
	}

	.textarea-container {
		flex: 1;
		overflow: hidden;
		position: relative;
		min-height: 0;
		height: 100%;
	}

	textarea {
		font: inherit;
		padding: 6px 6px;
		border-radius: 4px;
		width: 100%;
		height: 100%;
		max-height: none;
		border: none;
		background: none;
		box-sizing: border-box;
		resize: none;
		overflow: auto;
		transition: none;

		&.fit-mode {
			overflow: hidden;
		}

		font-size: 12px;
		font-weight: 500;
		line-height: 1;
		letter-spacing: -0.3px;
		color: black;
	}

	textarea[readonly] {
		cursor: pointer;
		user-select: none;
	}

	textarea:not([readonly]) {
		cursor: text;
		user-select: text;
	}

	.left-controls,
	.right-controls {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.download-btn {
		height: 22px;
		width: 22px;
		padding: 0;
		border: 1px solid rgba(black, 0.3);
		border-radius: 6px;
		background: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: 0.2s ease;

		span {
			font-size: 16px;
			line-height: 1;
			color: #4285f4;
		}

		&:hover {
			background: rgba(#4285f4, 0.1);
			border-color: rgba(#4285f4, 0.3);
		}
	}
</style>
