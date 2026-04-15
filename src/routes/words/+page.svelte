<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, scale, slide } from 'svelte/transition';
	import { cubicOut, backOut } from 'svelte/easing';

	interface WordItem {
		word: string;
		partOfSpeech: string;
	}

	interface CheckResult {
		correct: boolean;
		feedback: string;
		definition: string;
		partOfSpeech: string;
		example: string;
		nearNeighbors: string | null;
		roots: string;
	}

	interface MissedWord {
		word: string;
		definition: string;
		partOfSpeech: string;
		example: string;
		roots: string;
		nearNeighbors: string | null;
		yourAnswer: string;
		feedback: string;
		missedAt: number;
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

	let view: 'quiz' | 'library' = $state('quiz');
	let missedWords: MissedWord[] = $state([]);

	const STORAGE_KEY = 'gre-missed-words';

	function loadMissedWords(): MissedWord[] {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			return raw ? JSON.parse(raw) : [];
		} catch {
			return [];
		}
	}

	function saveMissedWords() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(missedWords));
		} catch { /* quota exceeded — ignore */ }
	}

	function addMissedWord(r: CheckResult, answer: string) {
		const exists = missedWords.some(m => m.word.toLowerCase() === (shuffledWords[currentIndex]?.word ?? '').toLowerCase());
		if (exists) return;

		missedWords = [...missedWords, {
			word: shuffledWords[currentIndex].word,
			definition: r.definition,
			partOfSpeech: r.partOfSpeech,
			example: r.example,
			roots: r.roots,
			nearNeighbors: r.nearNeighbors,
			yourAnswer: answer === 'idk' ? '' : answer,
			feedback: r.feedback,
			missedAt: Date.now()
		}];
		saveMissedWords();
	}

	function removeMissedWord(word: string) {
		missedWords = missedWords.filter(m => m.word !== word);
		saveMissedWords();
	}

	function clearAllMissed() {
		missedWords = [];
		saveMissedWords();
	}

	function shuffle<T>(arr: T[]): T[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	onMount(async () => {
		missedWords = loadMissedWords();
		const res = await fetch('/api/words/check');
		words = await res.json();
		shuffledWords = shuffle(words);
		loaded = true;
		setTimeout(() => inputEl?.focus(), 300);
	});

	let currentWord = $derived(shuffledWords[currentIndex] ?? null);
	let progress = $derived(stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0);

	async function checkAnswer() {
		if (!currentWord || checking) return;
		const trimmed = userAnswer.trim();
		if (!trimmed) return;

		checking = true;

		try {
			const res = await fetch('/api/words/check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ word: currentWord.word, answer: trimmed })
			});
			result = await res.json();
			revealed = true;
			stats.total++;
			if (result?.correct) {
				stats.correct++;
			} else {
				stats.incorrect++;
				if (result) addMissedWord(result, trimmed);
			}
		} catch {
			result = {
				correct: false,
				feedback: 'Something went wrong checking your answer. Try again.',
				definition: '',
				partOfSpeech: '',
				example: '',
				nearNeighbors: null,
				roots: ''
			};
			revealed = true;
		} finally {
			checking = false;
		}
	}

	function dontKnow() {
		userAnswer = 'idk';
		checkAnswer();
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

	function restart() {
		shuffledWords = shuffle(words);
		currentIndex = 0;
		userAnswer = '';
		result = null;
		revealed = false;
		showHint = false;
		stats = { correct: 0, incorrect: 0, total: 0 };
		quizComplete = false;
		view = 'quiz';
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

	function handleGlobalKeydown(e: KeyboardEvent) {
		if (!loaded || checking) return;
		const inputFocused = document.activeElement === inputEl;

		if (e.key === 'r' && !inputFocused) {
			e.preventDefault();
			view = view === 'library' ? 'quiz' : 'library';
			return;
		}

		if (view !== 'quiz' || quizComplete) return;

		if (e.key === 'n' && revealed && !inputFocused) {
			e.preventDefault();
			nextWord();
		} else if (e.key === 's' && !revealed && !inputFocused) {
			e.preventDefault();
			dontKnow();
		} else if (e.key === 'h' && !revealed && !inputFocused && !showHint) {
			e.preventDefault();
			showHint = true;
		}
	}

	function revealHint() {
		showHint = true;
	}

	let expandedMissed: string | null = $state(null);

	function toggleExpand(word: string) {
		expandedMissed = expandedMissed === word ? null : word;
	}
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<svelte:head>
	<title>GRE Words — Heewon</title>
</svelte:head>

<div class="words-page">
	<header class="words-header">
		<a href="/" class="back-link">← Back</a>
		<div class="title-row">
			<div class="title-block">
				<h1>GRE Vocabulary</h1>
				<p class="subtitle">
					{#if view === 'quiz'}
						Test your knowledge, one word at a time
					{:else}
						Words to review — {missedWords.length} saved
					{/if}
				</p>
			</div>
			<button
				class="view-toggle"
				class:active={view === 'library'}
				onclick={() => (view = view === 'library' ? 'quiz' : 'library')}
			>
				{#if view === 'quiz'}
					Missed ({missedWords.length})<kbd>R</kbd>
				{:else}
					Back to Quiz<kbd>R</kbd>
				{/if}
			</button>
		</div>
	</header>

	{#if !loaded}
		<div class="loading" in:fade>
			<div class="spinner"></div>
			<p>Loading words...</p>
		</div>

	{:else if view === 'library'}
		<!-- MISSED WORDS LIBRARY -->
		<div class="library" in:fade={{ duration: 200 }}>
			{#if missedWords.length === 0}
				<div class="library-empty">
					<p class="empty-icon">✦</p>
					<p>No missed words yet.</p>
					<p class="empty-sub">Words you get wrong will appear here with root breakdowns.</p>
				</div>
			{:else}
				<div class="library-actions">
					<span class="library-count">{missedWords.length} word{missedWords.length === 1 ? '' : 's'}</span>
					<button class="clear-btn" onclick={clearAllMissed}>Clear all</button>
				</div>

				<div class="library-list">
					{#each missedWords as m (m.word)}
						<div class="library-card" in:fly={{ y: 10, duration: 250 }}>
							<button class="library-card-header" onclick={() => toggleExpand(m.word)}>
								<div class="library-card-left">
									<span class="library-word">{m.word}</span>
									<span class="library-pos">{m.partOfSpeech}</span>
								</div>
								<span class="expand-icon" class:expanded={expandedMissed === m.word}>›</span>
							</button>

							<div class="library-card-def">
								<p>{m.definition}</p>
							</div>

							{#if expandedMissed === m.word}
								<div class="library-card-detail" transition:slide={{ duration: 250 }}>
									<div class="detail-section">
										<span class="detail-label">Root breakdown</span>
										<p class="detail-roots">{m.roots}</p>
									</div>

									{#if m.example}
										<div class="detail-section">
											<span class="detail-label">Example</span>
											<p class="detail-example">"{m.example}"</p>
										</div>
									{/if}

									{#if m.nearNeighbors}
										<div class="detail-section">
											<span class="detail-label">Near neighbors</span>
											<p class="detail-neighbors">{m.nearNeighbors}</p>
										</div>
									{/if}

									{#if m.yourAnswer}
										<div class="detail-section">
											<span class="detail-label">Your answer</span>
											<p class="detail-youranswer">{m.yourAnswer}</p>
										</div>
									{/if}

									<button class="remove-btn" onclick={() => removeMissedWord(m.word)}>
										Remove from library
									</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
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
				<div class="complete-actions">
					<button class="restart-btn" onclick={restart}>Study Again</button>
					{#if missedWords.length > 0}
						<button class="review-btn" onclick={() => (view = 'library')}>
							Review Missed ({missedWords.length})
						</button>
					{/if}
				</div>
			</div>
		</div>

	{:else if currentWord}
		<div class="quiz-container">
			<div class="progress-track">
				<div class="progress-fill" style="width: {((currentIndex + 1) / shuffledWords.length) * 100}%"></div>
				<span class="progress-label">{currentIndex + 1} / {shuffledWords.length}</span>
			</div>

			<div class="stats-bar">
				<span class="stat correct-stat">✓ {stats.correct}</span>
				<span class="stat incorrect-stat">✗ {stats.incorrect}</span>
			</div>

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
							{showHint ? 'Hint shown' : 'Hint'}<kbd>H</kbd>
						</button>
						<button class="skip-btn" onclick={dontKnow} disabled={checking}>
							Don't know<kbd>S</kbd>
						</button>
						<button
							class="check-btn"
							onclick={checkAnswer}
							disabled={!userAnswer.trim() || checking}
						>
							{checking ? 'Checking...' : 'Check'}<kbd>↵</kbd>
						</button>
					</div>
				</div>
			{/if}

			{#if revealed && result}
				<div
					class="result-card"
					class:correct={result.correct}
					class:incorrect={!result.correct}
					in:fly={{ y: 20, duration: 350, easing: cubicOut }}
				>
					<div class="result-header">
						<span class="result-icon">{result.correct ? '✓' : '✗'}</span>
						<span class="result-verdict">{result.correct ? 'Correct' : 'Incorrect'}</span>
					</div>

					<div class="result-body">
						<div class="ai-feedback">
							<p>{result.feedback}</p>
						</div>

						{#if result.roots}
							<div class="roots-block">
								<span class="def-label">Root breakdown</span>
								<p class="roots-text">{result.roots}</p>
							</div>
						{/if}

						{#if result.example}
							<div class="example-block">
								<span class="def-label">Example</span>
								<p class="example">"{result.example}"</p>
							</div>
						{/if}

						{#if result.nearNeighbors}
							<div class="neighbors-block">
								<span class="def-label">Near neighbors</span>
								<p class="neighbors">{result.nearNeighbors}</p>
							</div>
						{/if}

						{#if !result.correct && userAnswer && userAnswer !== 'idk'}
							<div class="your-answer-block">
								<span class="def-label">Your answer</span>
								<p class="your-answer">{userAnswer}</p>
							</div>
						{/if}
					</div>

					<button class="next-btn" onclick={nextWord}>
						{currentIndex >= shuffledWords.length - 1 ? 'Finish' : 'Next Word →'}<kbd>N</kbd>
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

		.title-row {
			display: flex;
			justify-content: space-between;
			align-items: flex-end;
			margin-top: 16px;
			gap: 16px;
		}

		.title-block {
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

		.view-toggle {
			font-family: 'DM Sans', sans-serif;
			font-size: 13px;
			font-weight: 600;
			padding: 8px 14px;
			border-radius: 8px;
			border: 1px solid rgba(14, 10, 51, 0.1);
			background: white;
			color: rgba(14, 10, 51, 0.6);
			cursor: pointer;
			transition: all 0.15s;
			white-space: nowrap;
			flex-shrink: 0;

			&:hover {
				border-color: rgba(14, 10, 51, 0.2);
				color: #0e0a33;
			}

			&.active {
				background: #0e0a33;
				color: white;
				border-color: #0e0a33;
			}
		}
	}

	/* --- Library --- */
	.library {
		width: 100%;
		max-width: 600px;
	}

	.library-empty {
		text-align: center;
		padding: 60px 20px;

		.empty-icon {
			font-size: 28px;
			color: rgba(14, 10, 51, 0.12);
			margin-bottom: 12px;
		}

		p {
			font-family: 'DM Sans', sans-serif;
			font-size: 15px;
			color: rgba(14, 10, 51, 0.5);
			font-weight: 400;
		}

		.empty-sub {
			font-size: 13px;
			color: rgba(14, 10, 51, 0.3);
			margin-top: 6px;
		}
	}

	.library-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;

		.library-count {
			font-family: 'DM Sans', sans-serif;
			font-size: 13px;
			color: rgba(14, 10, 51, 0.4);
			font-weight: 500;
		}

		.clear-btn {
			font-family: 'DM Sans', sans-serif;
			font-size: 12px;
			font-weight: 600;
			color: #ef4444;
			background: none;
			border: none;
			cursor: pointer;
			padding: 4px 8px;
			border-radius: 4px;
			transition: background 0.15s;

			&:hover {
				background: rgba(239, 68, 68, 0.06);
			}
		}
	}

	.library-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.library-card {
		background: white;
		border: 1px solid rgba(14, 10, 51, 0.06);
		border-radius: 12px;
		overflow: hidden;

		.library-card-header {
			width: 100%;
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 14px 16px;
			background: none;
			border: none;
			cursor: pointer;
			text-align: left;

			.library-card-left {
				display: flex;
				align-items: baseline;
				gap: 8px;
			}

			.library-word {
				font-family: 'Instrument Serif', 'ivypresto-text', serif;
				font-size: 22px;
				font-weight: 400;
				color: #0e0a33;
			}

			.library-pos {
				font-family: 'DM Sans', sans-serif;
				font-size: 11px;
				font-weight: 600;
				color: rgba(14, 10, 51, 0.35);
				text-transform: uppercase;
			}

			.expand-icon {
				font-size: 18px;
				color: rgba(14, 10, 51, 0.25);
				transition: transform 0.2s;

				&.expanded {
					transform: rotate(90deg);
				}
			}
		}

		.library-card-def {
			padding: 0 16px 12px;

			p {
				font-family: 'DM Sans', sans-serif;
				font-size: 14px;
				font-weight: 400;
				color: rgba(14, 10, 51, 0.6);
				line-height: 1.5;
			}
		}

		.library-card-detail {
			border-top: 1px solid rgba(14, 10, 51, 0.06);
			padding: 16px;
			display: flex;
			flex-direction: column;
			gap: 14px;

			.detail-section {
				.detail-label {
					font-family: 'DM Sans', sans-serif;
					font-size: 10px;
					font-weight: 700;
					text-transform: uppercase;
					letter-spacing: 0.8px;
					color: rgba(14, 10, 51, 0.28);
					display: block;
					margin-bottom: 4px;
				}
			}

			.detail-roots {
				font-family: 'DM Sans', sans-serif;
				font-size: 14px;
				font-weight: 400;
				color: #0e0a33;
				line-height: 1.55;
				background: rgba(14, 10, 51, 0.02);
				padding: 10px 12px;
				border-radius: 8px;
				border-left: 3px solid rgba(14, 10, 51, 0.08);
			}

			.detail-example {
				font-family: 'Instrument Serif', 'ivypresto-text', serif;
				font-size: 15px;
				font-style: italic;
				color: rgba(14, 10, 51, 0.5);
				line-height: 1.5;
			}

			.detail-neighbors {
				font-family: 'DM Sans', sans-serif;
				font-size: 13px;
				color: rgba(14, 10, 51, 0.45);
				font-style: italic;
			}

			.detail-youranswer {
				font-family: 'DM Sans', sans-serif;
				font-size: 13px;
				color: rgba(14, 10, 51, 0.4);
				background: rgba(239, 68, 68, 0.04);
				padding: 6px 10px;
				border-radius: 6px;
			}

			.remove-btn {
				align-self: flex-start;
				font-family: 'DM Sans', sans-serif;
				font-size: 12px;
				font-weight: 600;
				color: rgba(14, 10, 51, 0.35);
				background: none;
				border: none;
				cursor: pointer;
				padding: 4px 0;
				transition: color 0.15s;

				&:hover {
					color: #ef4444;
				}
			}
		}
	}

	/* --- Loading --- */
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

	/* --- Quiz --- */
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

				&:hover:not(:disabled) {
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
				.result-verdict { color: #15803d; }
			}
		}

		&.incorrect {
			border-color: rgba(239, 68, 68, 0.2);

			.result-header {
				background: rgba(239, 68, 68, 0.04);
				.result-icon { color: #ef4444; }
				.result-verdict { color: #b91c1c; }
			}
		}

		.result-header {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 14px 20px;

			.result-icon { font-size: 20px; font-weight: 700; }
			.result-verdict { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; }
		}

		.result-body {
			padding: 20px;
			display: flex;
			flex-direction: column;
			gap: 16px;

			.ai-feedback p {
				font-family: 'DM Sans', sans-serif;
				font-size: 15px;
				font-weight: 400;
				color: #0e0a33;
				line-height: 1.6;
			}

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

			.roots-text {
				font-family: 'DM Sans', sans-serif;
				font-size: 14px;
				font-weight: 400;
				color: rgba(14, 10, 51, 0.7);
				line-height: 1.5;
				background: rgba(14, 10, 51, 0.02);
				padding: 10px 12px;
				border-radius: 8px;
				border-left: 3px solid rgba(14, 10, 51, 0.08);
			}

			.example {
				font-family: 'Instrument Serif', 'ivypresto-text', serif;
				font-size: 16px;
				font-style: italic;
				color: rgba(14, 10, 51, 0.55);
				line-height: 1.5;
			}

			.neighbors {
				font-family: 'DM Sans', sans-serif;
				font-size: 14px;
				color: rgba(14, 10, 51, 0.5);
				font-style: italic;
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

			&:hover { background: rgba(14, 10, 51, 0.06); }
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

			.complete-icon { font-size: 32px; color: rgba(14, 10, 51, 0.15); margin-bottom: 12px; }
			h2 { font-family: 'Instrument Serif', 'ivypresto-text', serif; font-size: 32px; font-weight: 400; color: #0e0a33; }
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

				svg { width: 100%; height: 100%; }
				circle { transition: stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1); }

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

				.correct-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block; }
				.incorrect-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; display: inline-block; }
				.total { color: rgba(14, 10, 51, 0.35); font-size: 13px; margin-top: 8px; }
			}
		}

		.complete-actions {
			display: flex;
			flex-direction: column;
			gap: 10px;
			align-items: center;
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
			&:hover { background: #1a1455; }
		}

		.review-btn {
			background: none;
			color: rgba(14, 10, 51, 0.5);
			font-family: 'DM Sans', sans-serif;
			font-size: 14px;
			font-weight: 600;
			padding: 8px 20px;
			border: 1px solid rgba(14, 10, 51, 0.1);
			border-radius: 10px;
			cursor: pointer;
			transition: all 0.15s;
			&:hover { border-color: rgba(14, 10, 51, 0.25); color: #0e0a33; }
		}
	}

	kbd {
		display: inline-block;
		font-family: 'DM Sans', sans-serif;
		font-size: 10px;
		font-weight: 700;
		background: rgba(14, 10, 51, 0.08);
		color: rgba(14, 10, 51, 0.4);
		padding: 2px 6px;
		border-radius: 4px;
		margin-left: 6px;
		vertical-align: middle;
		line-height: 1;
		letter-spacing: 0.3px;
	}

	.check-btn kbd { background: rgba(255, 255, 255, 0.15); color: rgba(255, 255, 255, 0.6); }
	.next-btn kbd { background: rgba(14, 10, 51, 0.06); color: rgba(14, 10, 51, 0.3); }
	.view-toggle kbd { background: rgba(14, 10, 51, 0.06); color: rgba(14, 10, 51, 0.3); }
	.view-toggle.active kbd { background: rgba(255, 255, 255, 0.15); color: rgba(255, 255, 255, 0.5); }

	@media (max-width: 640px) {
		.words-page { padding: 24px 16px 60px; }
		.words-header .title-block h1 { font-size: 32px; }
		.words-header .title-row { flex-direction: column; align-items: flex-start; }
		.word-card { padding: 36px 24px; .word-display { font-size: 40px; } }
		.complete-screen .final-stats { flex-direction: column; gap: 20px; }
	}
</style>
