<script>
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';

	let fileInput;
	let dragActive = false;

	let uploadedImage = $state(null);
	let uploadedFileName = $state('');
	let generatedImage = $state(null);
	let sketchDescription = $state('');
	let revisedPrompt = $state('');
	let loading = $state(false);
	let error = $state('');
	let mode = $state('complete');

	let stylePrompt = $state('A fully colored Korean historical comic panel (manhwa style), with vibrant saturated colors, clean ink lines, traditional Silla-dynasty clothing and architecture, professional digital coloring with cel-shading and soft gradients.');

	const presetStyles = [
		{
			name: 'Korean Historical',
			prompt: 'A fully colored Korean historical comic panel (manhwa style), with vibrant saturated colors, clean ink lines, traditional Silla-dynasty clothing and architecture, professional digital coloring with cel-shading and soft gradients.'
		},
		{
			name: 'Manga (B&W)',
			prompt: 'A high-contrast black and white manga panel with professional screen tones, detailed cross-hatching, dynamic speed lines, and clean inking in classic shonen manga style.'
		},
		{
			name: 'Watercolor',
			prompt: 'A beautifully rendered watercolor comic panel with soft washes, visible brushstrokes, delicate color blending, muted earth tones, and an ethereal atmospheric quality.'
		},
		{
			name: 'American Comics',
			prompt: 'A fully colored American comic book panel in the style of Marvel/DC, with bold flat colors, dramatic lighting, strong shadows, clean digital coloring, and dynamic composition.'
		},
		{
			name: 'Ligne Claire',
			prompt: 'A Tintin/Moebius ligne claire comic panel with uniform line weight, flat vibrant colors, minimal shading, clean precise outlines, and a European bande dessinée aesthetic.'
		},
		{
			name: 'Painterly',
			prompt: 'A richly painted comic panel in a semi-realistic painterly style with visible brushwork, atmospheric lighting, rich color palette, cinematic composition, and detailed environmental rendering.'
		}
	];

	function handleFileDrop(event) {
		event.preventDefault();
		dragActive = false;
		const file = event.dataTransfer?.files?.[0];
		if (file && file.type.startsWith('image/')) {
			processFile(file);
		}
	}

	function handleFileSelect(event) {
		const file = event.target.files?.[0];
		if (file) {
			processFile(file);
		}
	}

	function processFile(file) {
		uploadedFileName = file.name;
		const reader = new FileReader();
		reader.onload = (e) => {
			uploadedImage = e.target?.result;
			generatedImage = null;
			sketchDescription = '';
			revisedPrompt = '';
			error = '';
		};
		reader.readAsDataURL(file);
	}

	function handleDragOver(event) {
		event.preventDefault();
		dragActive = true;
	}

	function handleDragLeave() {
		dragActive = false;
	}

	async function generateCompletion() {
		if (!uploadedImage) return;

		loading = true;
		error = '';
		generatedImage = null;
		sketchDescription = '';
		revisedPrompt = '';

		try {
			const response = await fetch('/api/sketch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					imageBase64: uploadedImage,
					prompt: stylePrompt,
					mode: mode
				})
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || 'Something went wrong';
				return;
			}

			if (mode === 'describe') {
				sketchDescription = data.description;
			} else {
				generatedImage = data.image;
				sketchDescription = data.description || '';
				revisedPrompt = data.revisedPrompt || '';
			}
		} catch (err) {
			error = 'Network error — could not reach the server.';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	function downloadImage() {
		if (!generatedImage) return;
		const link = document.createElement('a');
		link.download = `completed-${uploadedFileName || 'sketch'}.png`;
		link.href = generatedImage;
		link.click();
	}

	function reset() {
		uploadedImage = null;
		uploadedFileName = '';
		generatedImage = null;
		sketchDescription = '';
		revisedPrompt = '';
		error = '';
		loading = false;
		if (fileInput) fileInput.value = '';
	}

	function selectPreset(preset) {
		stylePrompt = preset.prompt;
	}
</script>

<svelte:head>
	<title>Sketch Completer</title>
	<meta name="description" content="AI-powered sketch to finished comic panel" />
</svelte:head>

<div class="page">
	<header class="page-header">
		<a href="/" class="back-link">← Back</a>
		<div>
			<h1>Sketch Completer</h1>
			<p class="subtitle">Upload a rough sketch and let AI complete it into a finished comic panel.</p>
		</div>
	</header>

	<div class="workspace">
		<!-- Left: Upload + Controls -->
		<div class="panel controls-panel">
			{#if !uploadedImage}
				<div
					class="dropzone"
					class:drag-active={dragActive}
					ondrop={handleFileDrop}
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					role="button"
					tabindex="0"
				>
					<input
						type="file"
						accept="image/*"
						bind:this={fileInput}
						onchange={handleFileSelect}
						id="sketch-input"
						class="hidden-input"
					/>
					<label for="sketch-input" class="dropzone-label">
						<div class="dropzone-icon">🎨</div>
						<span class="dropzone-text">Drop your sketch here</span>
						<span class="dropzone-subtext">or click to browse</span>
						<span class="dropzone-formats">PNG, JPG, WEBP</span>
					</label>
				</div>
			{:else}
				<div class="uploaded-preview">
					<div class="preview-header">
						<h3>Your Sketch</h3>
						<button class="btn-icon" onclick={reset} title="Remove">✕</button>
					</div>
					<div class="preview-image-container">
						<img src={uploadedImage} alt="Uploaded sketch" class="preview-image" />
					</div>
				</div>

				<!-- Style Presets -->
				<div class="section">
					<h3>Style Preset</h3>
					<div class="presets-grid">
						{#each presetStyles as preset}
							<button
								class="preset-chip"
								class:active={stylePrompt === preset.prompt}
								onclick={() => selectPreset(preset)}
							>
								{preset.name}
							</button>
						{/each}
					</div>
				</div>

				<!-- Custom Prompt -->
				<div class="section">
					<h3>Style Description</h3>
					<textarea
						bind:value={stylePrompt}
						placeholder="Describe the desired art style, colors, and mood..."
						rows="4"
					></textarea>
				</div>

				<!-- Mode Toggle -->
				<div class="section">
					<h3>Mode</h3>
					<div class="mode-toggle">
						<button
							class="mode-btn"
							class:active={mode === 'complete'}
							onclick={() => mode = 'complete'}
						>
							🖼️ Complete Image
						</button>
						<button
							class="mode-btn"
							class:active={mode === 'describe'}
							onclick={() => mode = 'describe'}
						>
							📝 Describe Only
						</button>
					</div>
				</div>

				<!-- Generate Button -->
				<button
					class="btn-generate"
					onclick={generateCompletion}
					disabled={loading}
				>
					{#if loading}
						<span class="spinner"></span>
						{mode === 'describe' ? 'Analyzing...' : 'Generating...'}
					{:else}
						{mode === 'describe' ? '📝 Analyze Sketch' : '✨ Complete Sketch'}
					{/if}
				</button>
			{/if}
		</div>

		<!-- Right: Result -->
		<div class="panel result-panel">
			{#if error}
				<div class="error-msg" transition:fade>
					<span>⚠️</span>
					<p>{error}</p>
				</div>
			{/if}

			{#if loading}
				<div class="loading-state" transition:fade>
					<div class="loading-animation">
						<div class="loading-ring"></div>
						<div class="loading-ring delay-1"></div>
						<div class="loading-ring delay-2"></div>
					</div>
					<p class="loading-text">
						{mode === 'describe' ? 'AI is analyzing your sketch...' : 'AI is completing your sketch...'}
					</p>
					<p class="loading-subtext">This usually takes 15–30 seconds</p>
				</div>
			{:else if generatedImage}
				<div class="result" transition:fade>
					<div class="result-header">
						<h3>Completed Panel</h3>
						<button class="btn-download" onclick={downloadImage}>
							⬇ Download
						</button>
					</div>
					<div class="result-image-container">
						<img src={generatedImage} alt="AI-completed comic panel" class="result-image" />
					</div>
					{#if sketchDescription}
						<details class="description-details">
							<summary>AI Scene Analysis</summary>
							<p>{sketchDescription}</p>
						</details>
					{/if}
					{#if revisedPrompt}
						<details class="description-details">
							<summary>DALL-E Revised Prompt</summary>
							<p>{revisedPrompt}</p>
						</details>
					{/if}
				</div>
			{:else if sketchDescription && mode === 'describe'}
				<div class="result" transition:fade>
					<h3>Scene Analysis</h3>
					<div class="description-box">
						<p>{sketchDescription}</p>
					</div>
					<button
						class="btn-generate secondary"
						onclick={() => { mode = 'complete'; generateCompletion(); }}
					>
						✨ Now Generate the Image
					</button>
				</div>
			{:else}
				<div class="empty-state">
					<div class="empty-icon">🖌️</div>
					<p>Your completed panel will appear here</p>
					<p class="empty-subtext">Upload a sketch and click generate to start</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Tips -->
	<div class="tips">
		<h3>💡 Tips for best results</h3>
		<ul>
			<li><strong>Clean sketches work better</strong> — the clearer your line art, the better the AI can interpret it.</li>
			<li><strong>Be specific in your prompt</strong> — mention clothing styles, color palettes, lighting, and mood.</li>
			<li><strong>Try "Describe Only" first</strong> — see what the AI sees, then refine your prompt before generating.</li>
			<li><strong>Composition may shift</strong> — DALL-E generates new images inspired by your sketch, not pixel-exact completions. For exact composition, use local tools like ComfyUI + ControlNet.</li>
		</ul>
	</div>
</div>

<style lang="scss">
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 40px 24px 80px;
		color: rgba(white, 0.9);
	}

	.page-header {
		margin-bottom: 40px;
		.back-link {
			display: inline-block;
			color: rgba(white, 0.4);
			text-decoration: none;
			font-size: 14px;
			margin-bottom: 12px;
			&:hover { color: rgba(white, 0.7); }
		}
		h1 {
			font-family: "ivypresto-headline", 'Newsreader', sans-serif;
			font-size: 48px;
			font-weight: 500;
			color: rgba(white, 0.85);
			margin: 0 0 8px;
		}
		.subtitle {
			font-size: 16px;
			color: rgba(white, 0.4);
			margin: 0;
		}
	}

	.workspace {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
		min-height: 500px;

		@media (max-width: 800px) {
			grid-template-columns: 1fr;
		}
	}

	.panel {
		background: rgba(white, 0.04);
		border: 1px solid rgba(white, 0.08);
		border-radius: 16px;
		padding: 24px;
	}

	.hidden-input { display: none; }

	.dropzone {
		border: 2px dashed rgba(white, 0.15);
		border-radius: 12px;
		padding: 60px 24px;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 300px;
		display: flex;
		align-items: center;
		justify-content: center;

		&:hover, &.drag-active {
			border-color: rgba(white, 0.3);
			background: rgba(white, 0.03);
		}
	}

	.dropzone-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		cursor: pointer;
	}

	.dropzone-icon { font-size: 48px; }

	.dropzone-text {
		font-size: 16px;
		font-weight: 500;
		color: rgba(white, 0.6);
	}

	.dropzone-subtext {
		font-size: 13px;
		color: rgba(white, 0.3);
	}

	.dropzone-formats {
		font-size: 11px;
		color: rgba(white, 0.2);
		margin-top: 4px;
	}

	.uploaded-preview {
		margin-bottom: 20px;
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		h3 {
			font-size: 14px;
			font-weight: 600;
			color: rgba(white, 0.5);
			text-transform: uppercase;
			letter-spacing: 0.5px;
			margin: 0;
		}
	}

	.btn-icon {
		background: rgba(white, 0.08);
		border: none;
		color: rgba(white, 0.5);
		width: 28px;
		height: 28px;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		&:hover { background: rgba(white, 0.15); color: rgba(white, 0.8); }
	}

	.preview-image-container {
		border-radius: 8px;
		overflow: hidden;
		background: rgba(black, 0.2);
		border: 1px solid rgba(white, 0.06);
	}

	.preview-image {
		width: 100%;
		display: block;
		max-height: 300px;
		object-fit: contain;
	}

	.section {
		margin-bottom: 20px;
		h3 {
			font-size: 13px;
			font-weight: 600;
			color: rgba(white, 0.45);
			text-transform: uppercase;
			letter-spacing: 0.5px;
			margin: 0 0 10px;
		}
	}

	.presets-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.preset-chip {
		padding: 6px 14px;
		border-radius: 20px;
		border: 1px solid rgba(white, 0.12);
		background: rgba(white, 0.04);
		color: rgba(white, 0.55);
		font-size: 13px;
		cursor: pointer;
		transition: all 0.15s ease;

		&:hover {
			background: rgba(white, 0.08);
			color: rgba(white, 0.75);
		}

		&.active {
			background: rgba(white, 0.12);
			border-color: rgba(white, 0.25);
			color: rgba(white, 0.9);
		}
	}

	textarea {
		width: 100%;
		background: rgba(white, 0.04);
		border: 1px solid rgba(white, 0.1);
		border-radius: 8px;
		padding: 12px;
		color: rgba(white, 0.8);
		font-size: 14px;
		font-family: inherit;
		resize: vertical;
		min-height: 80px;
		box-sizing: border-box;

		&:focus {
			outline: none;
			border-color: rgba(white, 0.25);
		}

		&::placeholder { color: rgba(white, 0.2); }
	}

	.mode-toggle {
		display: flex;
		gap: 8px;
	}

	.mode-btn {
		flex: 1;
		padding: 10px;
		border-radius: 8px;
		border: 1px solid rgba(white, 0.1);
		background: rgba(white, 0.03);
		color: rgba(white, 0.5);
		font-size: 13px;
		cursor: pointer;
		transition: all 0.15s ease;

		&:hover { background: rgba(white, 0.06); }

		&.active {
			background: rgba(white, 0.1);
			border-color: rgba(white, 0.2);
			color: rgba(white, 0.9);
		}
	}

	.btn-generate {
		width: 100%;
		padding: 14px;
		border-radius: 10px;
		border: none;
		background: linear-gradient(135deg, #6366f1, #8b5cf6);
		color: white;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;

		&:hover:not(:disabled) {
			transform: translateY(-1px);
			box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		&.secondary {
			background: rgba(white, 0.08);
			margin-top: 16px;
			&:hover:not(:disabled) {
				background: rgba(white, 0.12);
				box-shadow: none;
			}
		}
	}

	.spinner {
		width: 18px;
		height: 18px;
		border: 2px solid rgba(white, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 400px;
		text-align: center;
		color: rgba(white, 0.3);
	}

	.empty-icon { font-size: 56px; margin-bottom: 16px; }

	.empty-state p {
		margin: 0;
		font-size: 15px;
	}

	.empty-subtext {
		font-size: 13px !important;
		color: rgba(white, 0.2) !important;
		margin-top: 6px !important;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 400px;
		text-align: center;
	}

	.loading-animation {
		position: relative;
		width: 80px;
		height: 80px;
		margin-bottom: 24px;
	}

	.loading-ring {
		position: absolute;
		inset: 0;
		border: 2px solid transparent;
		border-top-color: rgba(white, 0.4);
		border-radius: 50%;
		animation: spin 1.2s linear infinite;
	}

	.loading-ring.delay-1 {
		inset: 8px;
		border-top-color: rgba(white, 0.25);
		animation-duration: 1.6s;
		animation-direction: reverse;
	}

	.loading-ring.delay-2 {
		inset: 16px;
		border-top-color: rgba(white, 0.15);
		animation-duration: 2s;
	}

	.loading-text {
		color: rgba(white, 0.6);
		font-size: 16px;
		margin: 0;
	}

	.loading-subtext {
		color: rgba(white, 0.25);
		font-size: 13px;
		margin: 8px 0 0;
	}

	.result {
		h3 {
			font-size: 14px;
			font-weight: 600;
			color: rgba(white, 0.5);
			text-transform: uppercase;
			letter-spacing: 0.5px;
			margin: 0 0 12px;
		}
	}

	.result-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		h3 { margin: 0; }
	}

	.btn-download {
		padding: 8px 16px;
		border-radius: 8px;
		border: 1px solid rgba(white, 0.15);
		background: rgba(white, 0.06);
		color: rgba(white, 0.7);
		font-size: 13px;
		cursor: pointer;
		transition: all 0.15s ease;
		&:hover {
			background: rgba(white, 0.1);
			color: white;
		}
	}

	.result-image-container {
		border-radius: 12px;
		overflow: hidden;
		background: rgba(black, 0.2);
		border: 1px solid rgba(white, 0.06);
	}

	.result-image {
		width: 100%;
		display: block;
	}

	.description-details {
		margin-top: 12px;
		padding: 12px;
		background: rgba(white, 0.03);
		border-radius: 8px;
		border: 1px solid rgba(white, 0.06);

		summary {
			cursor: pointer;
			color: rgba(white, 0.4);
			font-size: 13px;
			font-weight: 500;
			&:hover { color: rgba(white, 0.6); }
		}

		p {
			margin: 10px 0 0;
			font-size: 13px;
			color: rgba(white, 0.5);
			line-height: 1.6;
		}
	}

	.description-box {
		padding: 16px;
		background: rgba(white, 0.03);
		border-radius: 8px;
		border: 1px solid rgba(white, 0.06);
		p {
			margin: 0;
			font-size: 14px;
			color: rgba(white, 0.7);
			line-height: 1.7;
		}
	}

	.error-msg {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 14px;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 8px;
		margin-bottom: 16px;

		span { font-size: 18px; }
		p {
			margin: 0;
			font-size: 14px;
			color: rgba(239, 68, 68, 0.8);
		}
	}

	.tips {
		margin-top: 48px;
		padding: 24px;
		background: rgba(white, 0.02);
		border: 1px solid rgba(white, 0.06);
		border-radius: 12px;

		h3 {
			font-size: 16px;
			color: rgba(white, 0.5);
			margin: 0 0 12px;
		}

		ul {
			margin: 0;
			padding: 0 0 0 20px;
		}

		li {
			font-size: 14px;
			color: rgba(white, 0.35);
			margin-bottom: 8px;
			line-height: 1.5;
			strong { color: rgba(white, 0.55); }
		}
	}
</style>
