<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { cubicOut, backOut } from 'svelte/easing';

	interface WordItem {
		word: string;
		partOfSpeech: string;
	}

	interface CheckResult {
		correct: boolean;
		score: number;
		feedback: string;
		definition: string;
		partOfSpeech: string;
		example: string;
	}

	let words: WordItem[] = $state([]);
	let shuffledWords: WordItem[] = $state([]);
	let currentIndex = $state(0);
	let userAnswer = $state('');
	let result: CheckResult | null = $state(null);
	let checking = $state(false);
	let revealed = $state(false);
	let inputEl: HTMLInputElement | null = $state(null);
	let stats = $state({ correct: 0, incorrect: 0, total: 0 });
	let quizComplete = $state(false);
	let loaded = $state(false);
	let showHint = $state(false);

	function shuffle<T>(arr: T[]): T[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	onMount(async () => {
		const res = await fetch('/api/words/check');
		words = await res.json();
		shuffledWords = shuffle(words);
		loaded = true;
		setTimeout(() => inputEl?.focus(), 300);
	});

	let currentWord = $derived(shuffledWords[currentIndex] ?? null);
	let progress = $derived(stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0);

	async function checkAnswer() {
		if (!userAnswer.trim() || !currentWord || checking) return;
		checking = true;

		try {
			const res = await fetch('/api/words/check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ word: currentWord.word, answer: userAnswer })
			});
			result = await res.json();
			revealed = true;
			stats.total++;
			if (result?.correct) {
				stats.correct++;
			} else {
				stats.incorrect++;
			}
		} catch {
			result = {
				correct: false,
				score: 0,
				feedback: 'Something went wrong. Try again.',
				definition: '',
				partOfSpeech: '',
				example: ''
			};
			revealed = true;
		} finally {
			checking = false;
		}
	}

	function nextWord() {
		if (currentIndex >= shuffledWords.length - 1) {
			quizComplete = true;
			return;
		}
		currentIndex++;
		userAnswer = '';
		result = null;
		revealed = false;
		showHint = false;
		setTimeout(() => inputEl?.focus(), 100);
	}

	function skipWord() {
		stats.total++;
		stats.incorrect++;
		nextWord();
	}

	function restart() {
		shuffledWords = shuffle(words);
		currentIndex = 0;
		userAnswer = '';
		result = null;
		revealed = false;
		showHint = false;
		stats = { correct: 0, incorrect: 0, total: 0 };
		quizComplete = false;
		setTimeout(() => inputEl?.focus(), 100);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			if (revealed) {
				nextWord();
			} else {
				checkAnswer();
			}
		}
	}

	function revealHint() {
		showHint = true;
	}
</script>

<svelte:head>
	<title>GRE Words — Heewon</title>
</svelte:head>

<div class="words-page">
	<header class="words-header">
		<a href="/" class="back-link">← Back</a>
		<div class="title-block">
			<h1>GRE Vocabulary</h1>
			<p class="subtitle">Test your knowledge, one word at a time</p>
		</div>
	</header>

	{#if !loaded}
		<div class="loading" in:fade>
			<div class="spinner"></div>
			<p>Loading words...</p>
		</div>
	{:else if quizComplete}
		<div class="complete-screen" in:scale={{ duration: 500, easing: backOut }}>
			<div class="complete-card">
				<div class="complete-icon">✦</div>
				<h2>Quiz Complete</h2>
				<div class="final-stats">
					<div class="stat-ring">
						<svg viewBox="0 0 100 100">
							<circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="8" />
							<circle
								cx="50" cy="50" r="42" fill="none"
								stroke={progress >= 70 ? '#22c55e' : progress >= 40 ? '#eab308' : '#ef4444'}
								stroke-width="8"
								stroke-dasharray={`${progress * 2.64} 264`}
								stroke-linecap="round"
								transform="rotate(-90 50 50)"
							/>
						</svg>
						<span class="stat-percent">{progress}%</span>
					</div>
					<div class="stat-details">
						<p><span class="correct-dot"></span> {stats.correct} correct</p>
						<p><span class="incorrect-dot"></span> {stats.incorrect} incorrect</p>
						<p class="total">{stats.total} words total</p>
					</div>
				</div>
				<button class="restart-btn" onclick={restart}>Study Again</button>
			</div>
		</div>
	{:else if currentWord}
		<div class="quiz-container">
			<!-- Progress bar -->
			<div class="progress-track">
				<div class="progress-fill" style="width: {((currentIndex + 1) / shuffledWords.length) * 100}%"></div>
				<span class="progress-label">{currentIndex + 1} / {shuffledWords.length}</span>
			</div>

			<!-- Stats bar -->
			<div class="stats-bar">
				<span class="stat correct-stat">✓ {stats.correct}</span>
				<span class="stat incorrect-stat">✗ {stats.incorrect}</span>
			</div>

			<!-- Word card -->
			{#key currentWord.word}
				<div class="word-card" in:fly={{ y: 30, duration: 400, easing: cubicOut }}>
					<span class="pos-badge">{currentWord.partOfSpeech}</span>
					<h2 class="word-display">{currentWord.word}</h2>

					{#if showHint && !revealed}
						<p class="hint" in:fade={{ duration: 200 }}>
							First letter: <strong>{currentWord.word[0]}</strong> ·
							{currentWord.word.length} letters
						</p>
					{/if}
				</div>
			{/key}

			<!-- Input area -->
			{#if !revealed}
				<div class="input-area" in:fade={{ duration: 200 }}>
					<div class="input-wrapper">
						<input
							bind:this={inputEl}
							bind:value={userAnswer}
							onkeydown={handleKeydown}
							placeholder="What does this word mean?"
							disabled={checking}
							autocomplete="off"
							spellcheck="false"
						/>
						{#if checking}
							<div class="input-spinner"></div>
						{/if}
					</div>
					<div class="action-row">
						<button class="hint-btn" onclick={revealHint} disabled={showHint}>
							{showHint ? 'Hint shown' : 'Hint'}
						</button>
						<button class="skip-btn" onclick={skipWord}>Skip</button>
						<button
							class="check-btn"
							onclick={checkAnswer}
							disabled={!userAnswer.trim() || checking}
						>
							{checking ? 'Checking...' : 'Check'}
						</button>
					</div>
				</div>
			{/if}

			<!-- Result -->
			{#if revealed && result}
				<div
					class="result-card"
					class:correct={result.correct}
					class:incorrect={!result.correct}
					in:fly={{ y: 20, duration: 350, easing: cubicOut }}
				>
					<div class="result-header">
						<span class="result-icon">{result.correct ? '✓' : '✗'}</span>
						<span class="result-label">{result.feedback}</span>
					</div>
					<div class="result-body">
						<div class="def-block">
							<span class="def-label">Definition</span>
							<p class="definition">{result.partOfSpeech} {result.definition}</p>
						</div>
						{#if result.example}
							<div class="example-block">
								<span class="def-label">Example</span>
								<p class="example">"{result.example}"</p>
							</div>
						{/if}
						{#if !result.correct}
							<div class="your-answer-block">
								<span class="def-label">Your answer</span>
								<p class="your-answer">{userAnswer}</p>
							</div>
						{/if}
					</div>
					<button class="next-btn" onclick={nextWord}>
						{currentIndex >= shuffledWords.length - 1 ? 'Finish' : 'Next Word →'}
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	.words-page {
		min-height: 100vh;
		padding: 40px 20px 80px;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: #fafbfd;
	}

	.words-header {
		width: 100%;
		max-width: 600px;
		margin-bottom: 40px;

		.back-link {
			font-family: 'DM Sans', sans-serif;
			font-size: 14px;
			color: rgba(14, 10, 51, 0.4);
			text-decoration: none;
			transition: color 0.2s;

			&:hover {
				color: rgba(14, 10, 51, 0.8);
			}
		}

		.title-block {
			margin-top: 16px;

			h1 {
				font-family: 'Instrument Serif', 'ivypresto-text', serif;
				font-size: 42px;
				font-weight: 400;
				color: #0e0a33;
				line-height: 1.1;
			}

			.subtitle {
				font-family: 'DM Sans', sans-serif;
				font-size: 15px;
				font-weight: 400;
				color: rgba(14, 10, 51, 0.45);
				margin-top: 6px;
			}
		}
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		margin-top: 100px;

		p {
			font-family: 'DM Sans', sans-serif;
			font-size: 14px;
			color: rgba(14, 10, 51, 0.4);
			font-weight: 400;
		}

		.spinner {
			width: 28px;
			height: 28px;
			border: 2.5px solid rgba(14, 10, 51, 0.08);
			border-top-color: rgba(14, 10, 51, 0.5);
			border-radius: 50%;
			animation: spin 0.7s linear infinite;
		}
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.quiz-container {
		width: 100%;
		max-width: 600px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.progress-track {
		width: 100%;
		height: 4px;
		background: rgba(14, 10, 51, 0.06);
		border-radius: 4px;
		position: relative;
		overflow: hidden;

		.progress-fill {
			height: 100%;
			background: #0e0a33;
			border-radius: 4px;
			transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		}

		.progress-label {
			position: absolute;
			right: 0;
			top: 10px;
			font-family: 'DM Sans', sans-serif;
			font-size: 12px;
			color: rgba(14, 10, 51, 0.35);
			font-weight: 500;
		}
	}

	.stats-bar {
		display: flex;
		gap: 16px;
		margin-top: 4px;

		.stat {
			font-family: 'DM Sans', sans-serif;
			font-size: 13px;
			font-weight: 600;
		}

		.correct-stat { color: #22c55e; }
		.incorrect-stat { color: #ef4444; }
	}

	.word-card {
		background: white;
		border: 1px solid rgba(14, 10, 51, 0.06);
		border-radius: 16px;
		padding: 48px 40px;
		text-align: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
		margin-top: 8px;

		.pos-badge {
			display: inline-block;
			background: rgba(14, 10, 51, 0.04);
			color: rgba(14, 10, 51, 0.45);
			font-family: 'DM Sans', sans-serif;
			font-size: 12px;
			font-weight: 600;
			padding: 4px 12px;
			border-radius: 100px;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		.word-display {
			font-family: 'Instrument Serif', 'ivypresto-text', serif;
			font-size: 56px;
			font-weight: 400;
			color: #0e0a33;
			margin-top: 16px;
			line-height: 1.1;
			letter-spacing: -0.5px;
		}

		.hint {
			font-family: 'DM Sans', sans-serif;
			font-size: 13px;
			color: rgba(14, 10, 51, 0.35);
			margin-top: 16px;
			font-weight: 400;

			strong {
				color: rgba(14, 10, 51, 0.6);
			}
		}
	}

	.input-area {
		display: flex;
		flex-direction: column;
		gap: 12px;

		.input-wrapper {
			position: relative;

			input {
				width: 100%;
				padding: 16px 20px;
				font-family: 'DM Sans', sans-serif;
				font-size: 16px;
				font-weight: 400;
				color: #0e0a33;
				background: white;
				border: 1.5px solid rgba(14, 10, 51, 0.1);
				border-radius: 12px;
				outline: none;
				transition: border-color 0.2s, box-shadow 0.2s;
				box-sizing: border-box;

				&::placeholder {
					color: rgba(14, 10, 51, 0.25);
					font-weight: 400;
				}

				&:focus {
					border-color: rgba(14, 10, 51, 0.25);
					box-shadow: 0 0 0 3px rgba(14, 10, 51, 0.04);
				}

				&:disabled {
					opacity: 0.6;
				}
			}

			.input-spinner {
				position: absolute;
				right: 16px;
				top: 50%;
				transform: translateY(-50%);
				width: 18px;
				height: 18px;
				border: 2px solid rgba(14, 10, 51, 0.1);
				border-top-color: rgba(14, 10, 51, 0.5);
				border-radius: 50%;
				animation: spin 0.7s linear infinite;
			}
		}

		.action-row {
			display: flex;
			gap: 8px;

			button {
				font-family: 'DM Sans', sans-serif;
				font-size: 14px;
				font-weight: 600;
				padding: 10px 20px;
				border-radius: 10px;
				border: none;
				cursor: pointer;
				transition: all 0.15s ease;

				&:disabled {
					opacity: 0.4;
					cursor: not-allowed;
				}
			}

			.hint-btn {
				background: rgba(14, 10, 51, 0.04);
				color: rgba(14, 10, 51, 0.5);

				&:hover:not(:disabled) {
					background: rgba(14, 10, 51, 0.08);
				}
			}

			.skip-btn {
				background: rgba(14, 10, 51, 0.04);
				color: rgba(14, 10, 51, 0.5);

				&:hover {
					background: rgba(14, 10, 51, 0.08);
				}
			}

			.check-btn {
				flex: 1;
				background: #0e0a33;
				color: white;

				&:hover:not(:disabled) {
					background: #1a1455;
				}
			}
		}
	}

	.result-card {
		background: white;
		border-radius: 16px;
		overflow: hidden;
		border: 1.5px solid rgba(14, 10, 51, 0.06);

		&.correct {
			border-color: rgba(34, 197, 94, 0.25);

			.result-header {
				background: rgba(34, 197, 94, 0.06);

				.result-icon { color: #22c55e; }
				.result-label { color: #15803d; }
			}
		}

		&.incorrect {
			border-color: rgba(239, 68, 68, 0.2);

			.result-header {
				background: rgba(239, 68, 68, 0.04);

				.result-icon { color: #ef4444; }
				.result-label { color: #b91c1c; }
			}
		}

		.result-header {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 14px 20px;

			.result-icon {
				font-size: 20px;
				font-weight: 700;
			}

			.result-label {
				font-family: 'DM Sans', sans-serif;
				font-size: 14px;
				font-weight: 600;
			}
		}

		.result-body {
			padding: 20px;
			display: flex;
			flex-direction: column;
			gap: 16px;

			.def-label {
				font-family: 'DM Sans', sans-serif;
				font-size: 11px;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.8px;
				color: rgba(14, 10, 51, 0.3);
				display: block;
				margin-bottom: 4px;
			}

			.definition {
				font-family: 'DM Sans', sans-serif;
				font-size: 16px;
				font-weight: 400;
				color: #0e0a33;
				line-height: 1.5;
			}

			.example {
				font-family: 'Instrument Serif', 'ivypresto-text', serif;
				font-size: 16px;
				font-style: italic;
				color: rgba(14, 10, 51, 0.55);
				line-height: 1.5;
			}

			.your-answer {
				font-family: 'DM Sans', sans-serif;
				font-size: 14px;
				color: rgba(14, 10, 51, 0.5);
				background: rgba(14, 10, 51, 0.03);
				padding: 8px 12px;
				border-radius: 8px;
				line-height: 1.4;
			}
		}

		.next-btn {
			width: 100%;
			padding: 14px;
			font-family: 'DM Sans', sans-serif;
			font-size: 14px;
			font-weight: 600;
			color: #0e0a33;
			background: rgba(14, 10, 51, 0.03);
			border: none;
			border-top: 1px solid rgba(14, 10, 51, 0.06);
			cursor: pointer;
			transition: background 0.15s;

			&:hover {
				background: rgba(14, 10, 51, 0.06);
			}
		}
	}

	.complete-screen {
		display: flex;
		justify-content: center;
		margin-top: 60px;
		width: 100%;
		max-width: 600px;

		.complete-card {
			background: white;
			border: 1px solid rgba(14, 10, 51, 0.06);
			border-radius: 20px;
			padding: 48px 40px;
			text-align: center;
			width: 100%;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);

			.complete-icon {
				font-size: 32px;
				color: rgba(14, 10, 51, 0.15);
				margin-bottom: 12px;
			}

			h2 {
				font-family: 'Instrument Serif', 'ivypresto-text', serif;
				font-size: 32px;
				font-weight: 400;
				color: #0e0a33;
			}
		}

		.final-stats {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 32px;
			margin: 32px 0;

			.stat-ring {
				position: relative;
				width: 100px;
				height: 100px;

				svg {
					width: 100%;
					height: 100%;
					transform: rotate(0deg);
				}

				circle {
					transition: stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1);
				}

				.stat-percent {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					font-family: 'DM Sans', sans-serif;
					font-size: 22px;
					font-weight: 700;
					color: #0e0a33;
				}
			}

			.stat-details {
				text-align: left;

				p {
					font-family: 'DM Sans', sans-serif;
					font-size: 14px;
					font-weight: 400;
					color: rgba(14, 10, 51, 0.6);
					margin-bottom: 6px;
					display: flex;
					align-items: center;
					gap: 8px;
				}

				.correct-dot {
					width: 8px;
					height: 8px;
					border-radius: 50%;
					background: #22c55e;
					display: inline-block;
				}

				.incorrect-dot {
					width: 8px;
					height: 8px;
					border-radius: 50%;
					background: #ef4444;
					display: inline-block;
				}

				.total {
					color: rgba(14, 10, 51, 0.35);
					font-size: 13px;
					margin-top: 8px;
				}
			}
		}

		.restart-btn {
			background: #0e0a33;
			color: white;
			font-family: 'DM Sans', sans-serif;
			font-size: 15px;
			font-weight: 600;
			padding: 12px 32px;
			border: none;
			border-radius: 10px;
			cursor: pointer;
			transition: background 0.15s;

			&:hover {
				background: #1a1455;
			}
		}
	}

	@media (max-width: 640px) {
		.words-page {
			padding: 24px 16px 60px;
		}

		.words-header .title-block h1 {
			font-size: 32px;
		}

		.word-card {
			padding: 36px 24px;

			.word-display {
				font-size: 40px;
			}
		}

		.complete-screen .final-stats {
			flex-direction: column;
			gap: 20px;
		}
	}
</style>
