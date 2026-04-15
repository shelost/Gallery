<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, scale, slide } from 'svelte/transition';
	import { cubicOut, backOut } from 'svelte/easing';
	import {
		greTests,
		getAllQuestions,
		getQuestionsByType,
		questionTypeLabels,
		type GREQuestion,
		type QuestionType,
		type GRETest
	} from '$lib/data/gre-questions';

	interface MissedQuestion {
		question: GREQuestion;
		yourChoice: number;
		missedAt: number;
	}

	type Mode = 'menu' | 'quiz' | 'review';
	type QuizSource = 'all' | 'test' | 'type';

	let mode: Mode = $state('menu');
	let loaded = $state(false);

	let questions: GREQuestion[] = $state([]);
	let currentIndex = $state(0);
	let selectedChoice: number | null = $state(null);
	let revealed = $state(false);
	let stats = $state({ correct: 0, incorrect: 0, total: 0 });
	let quizComplete = $state(false);

	let missedQuestions: MissedQuestion[] = $state([]);
	let expandedMissed: string | null = $state(null);

	let timerEnabled = $state(false);
	let timeRemaining = $state(0);
	let timerInterval: ReturnType<typeof setInterval> | null = $state(null);

	const MISSED_KEY = 'gre-missed-questions';

	function loadMissed(): MissedQuestion[] {
		try {
			const raw = localStorage.getItem(MISSED_KEY);
			if (!raw) return [];
			const parsed = JSON.parse(raw);
			const allQ = getAllQuestions();
			return parsed
				.map((m: any) => {
					const question = allQ.find(q => q.id === m.questionId);
					if (!question) return null;
					return { question, yourChoice: m.yourChoice, missedAt: m.missedAt };
				})
				.filter(Boolean) as MissedQuestion[];
		} catch {
			return [];
		}
	}

	function saveMissed() {
		try {
			const serializable = missedQuestions.map(m => ({
				questionId: m.question.id,
				yourChoice: m.yourChoice,
				missedAt: m.missedAt
			}));
			localStorage.setItem(MISSED_KEY, JSON.stringify(serializable));
		} catch {}
	}

	function addMissed(q: GREQuestion, choice: number) {
		if (missedQuestions.some(m => m.question.id === q.id)) return;
		missedQuestions = [...missedQuestions, { question: q, yourChoice: choice, missedAt: Date.now() }];
		saveMissed();
	}

	function removeMissed(id: string) {
		missedQuestions = missedQuestions.filter(m => m.question.id !== id);
		saveMissed();
	}

	function clearAllMissed() {
		missedQuestions = [];
		saveMissed();
	}

	function shuffle<T>(arr: T[]): T[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	onMount(() => {
		missedQuestions = loadMissed();
		loaded = true;
	});

	function startQuiz(source: QuizSource, testId?: string, questionType?: QuestionType) {
		let pool: GREQuestion[];
		if (source === 'test' && testId) {
			const test = greTests.find(t => t.id === testId);
			pool = test ? test.sections.flatMap(s => s.questions) : getAllQuestions();
		} else if (source === 'type' && questionType) {
			pool = getQuestionsByType(questionType);
		} else {
			pool = getAllQuestions();
		}
		questions = shuffle(pool);
		currentIndex = 0;
		selectedChoice = null;
		revealed = false;
		stats = { correct: 0, incorrect: 0, total: 0 };
		quizComplete = false;
		mode = 'quiz';

		if (timerEnabled && questions.length > 0) {
			const minutesPerQuestion = 1.5;
			timeRemaining = Math.ceil(questions.length * minutesPerQuestion * 60);
			startTimer();
		}
	}

	function startTimer() {
		stopTimer();
		timerInterval = setInterval(() => {
			timeRemaining--;
			if (timeRemaining <= 0) {
				stopTimer();
				quizComplete = true;
			}
		}, 1000);
	}

	function stopTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	function formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	let currentQuestion = $derived(questions[currentIndex] ?? null);
	let progress = $derived(stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0);

	function selectChoice(index: number) {
		if (revealed) return;
		selectedChoice = index;
	}

	function confirmAnswer() {
		if (selectedChoice === null || !currentQuestion || revealed) return;
		revealed = true;
		stats.total++;
		if (selectedChoice === currentQuestion.correctIndex) {
			stats.correct++;
		} else {
			stats.incorrect++;
			addMissed(currentQuestion, selectedChoice);
		}
	}

	function nextQuestion() {
		if (currentIndex >= questions.length - 1) {
			quizComplete = true;
			stopTimer();
			return;
		}
		currentIndex++;
		selectedChoice = null;
		revealed = false;
	}

	function backToMenu() {
		stopTimer();
		mode = 'menu';
		quizComplete = false;
	}

	function restart() {
		questions = shuffle(questions);
		currentIndex = 0;
		selectedChoice = null;
		revealed = false;
		stats = { correct: 0, incorrect: 0, total: 0 };
		quizComplete = false;
	}

	function toggleExpand(id: string) {
		expandedMissed = expandedMissed === id ? null : id;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!loaded || mode !== 'quiz' || quizComplete) return;
		if (e.key >= '1' && e.key <= '5' && !revealed && currentQuestion) {
			const idx = parseInt(e.key) - 1;
			if (idx < currentQuestion.choices.length) {
				selectChoice(idx);
			}
		} else if (e.key === 'Enter') {
			if (revealed) {
				nextQuestion();
			} else if (selectedChoice !== null) {
				confirmAnswer();
			}
		}
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		if (!loaded) return;
		const inputFocused = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
		if (inputFocused) return;

		if (e.key === 'r' && mode !== 'menu') {
			e.preventDefault();
			mode = mode === 'review' ? 'quiz' : 'review';
			if (mode === 'quiz' && questions.length === 0) mode = 'menu';
			return;
		}

		handleKeydown(e);
	}

	function typeTag(type: QuestionType): string {
		const labels: Record<QuestionType, string> = {
			'sentence-completion': 'SC',
			'analogy': 'AN',
			'antonym': 'AT',
			'reading-comprehension': 'RC'
		};
		return labels[type];
	}

	function choiceLetter(i: number): string {
		return String.fromCharCode(65 + i);
	}
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<svelte:head>
	<title>GRE Practice — Heewon</title>
</svelte:head>

<div class="gre-page">
	<header class="gre-header">
		<a href="/" class="back-link">← Back</a>
		<div class="title-row">
			<div class="title-block">
				<h1>GRE Practice</h1>
				<p class="subtitle">
					{#if mode === 'menu'}
						Verbal reasoning — sentence completions, analogies, antonyms
					{:else if mode === 'review'}
						Missed questions — {missedQuestions.length} saved
					{:else if quizComplete}
						Quiz complete
					{:else}
						{questionTypeLabels[currentQuestion?.type ?? 'sentence-completion']} · Question {currentIndex + 1} of {questions.length}
					{/if}
				</p>
			</div>
			{#if mode !== 'menu'}
				<div class="header-actions">
					{#if mode === 'quiz' && !quizComplete}
						<button class="view-toggle" onclick={backToMenu}>
							Menu
						</button>
					{/if}
					<button
						class="view-toggle"
						class:active={mode === 'review'}
						onclick={() => {
							if (mode === 'review') {
								if (questions.length > 0) mode = 'quiz';
								else mode = 'menu';
							} else {
								mode = 'review';
							}
						}}
					>
						{#if mode === 'review'}
							Back<kbd>R</kbd>
						{:else}
							Missed ({missedQuestions.length})<kbd>R</kbd>
						{/if}
					</button>
				</div>
			{/if}
		</div>
	</header>

	{#if !loaded}
		<div class="loading" in:fade>
			<div class="spinner"></div>
			<p>Loading questions...</p>
		</div>

	{:else if mode === 'menu'}
		<!-- MENU -->
		<div class="menu" in:fade={{ duration: 200 }}>
			<div class="menu-section">
				<h2 class="menu-heading">Full Tests</h2>
				<div class="menu-grid">
					{#each greTests as test}
						{@const count = test.sections.reduce((sum, s) => sum + s.questions.length, 0)}
						<button class="menu-card" onclick={() => startQuiz('test', test.id)}>
							<span class="menu-card-title">{test.name}</span>
							<span class="menu-card-meta">{count} questions · {test.sections.length} section{test.sections.length > 1 ? 's' : ''}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="menu-section">
				<h2 class="menu-heading">By Question Type</h2>
				<div class="menu-grid">
					{#each Object.entries(questionTypeLabels) as [type, label]}
						{@const count = getQuestionsByType(type as QuestionType).length}
						{#if count > 0}
							<button class="menu-card" onclick={() => startQuiz('type', undefined, type as QuestionType)}>
								<span class="menu-card-title">{label}</span>
								<span class="menu-card-meta">{count} questions</span>
							</button>
						{/if}
					{/each}
				</div>
			</div>

			<div class="menu-section">
				<h2 class="menu-heading">Quick Practice</h2>
				<div class="menu-grid">
					<button class="menu-card menu-card-primary" onclick={() => startQuiz('all')}>
						<span class="menu-card-title">All Questions</span>
						<span class="menu-card-meta">{getAllQuestions().length} questions · shuffled</span>
					</button>
				</div>
			</div>

			{#if missedQuestions.length > 0}
				<div class="menu-section">
					<button class="menu-card menu-card-missed" onclick={() => mode = 'review'}>
						<span class="menu-card-title">Review Missed ({missedQuestions.length})</span>
						<span class="menu-card-meta">Questions you got wrong</span>
					</button>
				</div>
			{/if}
		</div>

	{:else if mode === 'review'}
		<!-- MISSED QUESTIONS REVIEW -->
		<div class="library" in:fade={{ duration: 200 }}>
			{#if missedQuestions.length === 0}
				<div class="library-empty">
					<p class="empty-icon">✦</p>
					<p>No missed questions yet.</p>
					<p class="empty-sub">Questions you get wrong will appear here for review.</p>
				</div>
			{:else}
				<div class="library-actions">
					<span class="library-count">{missedQuestions.length} question{missedQuestions.length === 1 ? '' : 's'}</span>
					<button class="clear-btn" onclick={clearAllMissed}>Clear all</button>
				</div>

				<div class="library-list">
					{#each missedQuestions as m (m.question.id)}
						<div class="library-card" in:fly={{ y: 10, duration: 250 }}>
							<button class="library-card-header" onclick={() => toggleExpand(m.question.id)}>
								<div class="library-card-left">
									<span class="type-badge">{typeTag(m.question.type)}</span>
									<span class="library-prompt">{m.question.prompt.slice(0, 60)}...</span>
								</div>
								<span class="expand-icon" class:expanded={expandedMissed === m.question.id}>›</span>
							</button>

							{#if expandedMissed === m.question.id}
								<div class="library-card-detail" transition:slide={{ duration: 250 }}>
									<div class="detail-section">
										<span class="detail-label">Question</span>
										<p class="detail-prompt">{m.question.prompt}</p>
									</div>

									<div class="detail-choices">
										{#each m.question.choices as choice, i}
											<div
												class="detail-choice"
												class:correct-choice={i === m.question.correctIndex}
												class:wrong-choice={i === m.yourChoice && i !== m.question.correctIndex}
											>
												<span class="choice-letter">{choiceLetter(i)}</span>
												<span>{choice}</span>
												{#if i === m.question.correctIndex}
													<span class="choice-mark">✓</span>
												{/if}
												{#if i === m.yourChoice && i !== m.question.correctIndex}
													<span class="choice-mark wrong">✗</span>
												{/if}
											</div>
										{/each}
									</div>

									<div class="detail-section">
										<span class="detail-label">Explanation</span>
										<p class="detail-explanation">{m.question.explanation}</p>
									</div>

									<button class="remove-btn" onclick={() => removeMissed(m.question.id)}>
										Remove from review
									</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

	{:else if quizComplete}
		<!-- COMPLETE SCREEN -->
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
						<p class="total">{stats.total} questions total</p>
					</div>
				</div>
				<div class="complete-actions">
					<button class="restart-btn" onclick={restart}>Try Again</button>
					<button class="restart-btn secondary" onclick={backToMenu}>New Quiz</button>
					{#if missedQuestions.length > 0}
						<button class="review-btn" onclick={() => (mode = 'review')}>
							Review Missed ({missedQuestions.length})
						</button>
					{/if}
				</div>
			</div>
		</div>

	{:else if currentQuestion}
		<!-- QUIZ -->
		<div class="quiz-container">
			<div class="progress-track">
				<div class="progress-fill" style="width: {((currentIndex + 1) / questions.length) * 100}%"></div>
				<span class="progress-label">{currentIndex + 1} / {questions.length}</span>
			</div>

			<div class="stats-bar">
				<span class="stat correct-stat">✓ {stats.correct}</span>
				<span class="stat incorrect-stat">✗ {stats.incorrect}</span>
				{#if timerEnabled && timeRemaining > 0}
					<span class="stat timer-stat">{formatTime(timeRemaining)}</span>
				{/if}
			</div>

			{#key currentQuestion.id}
				<div class="question-card" in:fly={{ y: 30, duration: 400, easing: cubicOut }}>
					<span class="type-badge">{questionTypeLabels[currentQuestion.type]}</span>

					{#if currentQuestion.type === 'antonym'}
						<p class="question-prompt antonym-prompt">{currentQuestion.prompt}</p>
						<p class="question-instruction">Select the word most nearly <strong>opposite</strong> in meaning.</p>
					{:else if currentQuestion.type === 'analogy'}
						<p class="question-prompt analogy-prompt">{currentQuestion.prompt}</p>
						<p class="question-instruction">Select the pair that best expresses a similar relationship.</p>
					{:else}
						<p class="question-prompt">{currentQuestion.prompt}</p>
					{/if}
				</div>
			{/key}

			<div class="choices-area">
				{#each currentQuestion.choices as choice, i}
					<button
						class="choice-btn"
						class:selected={selectedChoice === i && !revealed}
						class:correct={revealed && i === currentQuestion.correctIndex}
						class:incorrect={revealed && selectedChoice === i && i !== currentQuestion.correctIndex}
						class:dimmed={revealed && i !== currentQuestion.correctIndex && i !== selectedChoice}
						onclick={() => selectChoice(i)}
						disabled={revealed}
					>
						<span class="choice-letter-btn">{choiceLetter(i)}</span>
						<span class="choice-text">{choice}</span>
						{#if revealed && i === currentQuestion.correctIndex}
							<span class="choice-indicator">✓</span>
						{/if}
						{#if revealed && selectedChoice === i && i !== currentQuestion.correctIndex}
							<span class="choice-indicator wrong">✗</span>
						{/if}
					</button>
				{/each}
			</div>

			{#if !revealed}
				<div class="action-row">
					<button
						class="check-btn"
						onclick={confirmAnswer}
						disabled={selectedChoice === null}
					>
						Confirm<kbd>↵</kbd>
					</button>
				</div>
			{/if}

			{#if revealed}
				<div class="explanation-card" in:fly={{ y: 20, duration: 350, easing: cubicOut }}
					class:correct-border={selectedChoice === currentQuestion.correctIndex}
					class:incorrect-border={selectedChoice !== currentQuestion.correctIndex}
				>
					<div class="explanation-header">
						<span class="explanation-icon">{selectedChoice === currentQuestion.correctIndex ? '✓' : '✗'}</span>
						<span class="explanation-verdict">{selectedChoice === currentQuestion.correctIndex ? 'Correct' : 'Incorrect'}</span>
					</div>
					<div class="explanation-body">
						<p>{currentQuestion.explanation}</p>
					</div>
					<button class="next-btn" onclick={nextQuestion}>
						{currentIndex >= questions.length - 1 ? 'Finish' : 'Next Question →'}<kbd>↵</kbd>
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	.gre-page {
		min-height: 100vh;
		padding: 40px 20px 80px;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: #fafbfd;
	}

	.gre-header {
		width: 100%;
		max-width: 640px;
		margin-bottom: 40px;

		.back-link {
			font-family: 'DM Sans', sans-serif;
			font-size: 14px;
			color: rgba(14, 10, 51, 0.4);
			text-decoration: none;
			transition: color 0.2s;
			&:hover { color: rgba(14, 10, 51, 0.8); }
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

		.header-actions {
			display: flex;
			gap: 8px;
			flex-shrink: 0;
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
			&:hover { border-color: rgba(14, 10, 51, 0.2); color: #0e0a33; }
			&.active { background: #0e0a33; color: white; border-color: #0e0a33; }
		}
	}

	/* --- Menu --- */
	.menu {
		width: 100%;
		max-width: 640px;
		display: flex;
		flex-direction: column;
		gap: 32px;
	}

	.menu-heading {
		font-family: 'DM Sans', sans-serif;
		font-size: 13px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.8px;
		color: rgba(14, 10, 51, 0.3);
		margin-bottom: 12px;
	}

	.menu-grid {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.menu-card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 18px 20px;
		background: white;
		border: 1px solid rgba(14, 10, 51, 0.06);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
		&:hover { border-color: rgba(14, 10, 51, 0.15); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }

		.menu-card-title {
			font-family: 'DM Sans', sans-serif;
			font-size: 16px;
			font-weight: 600;
			color: #0e0a33;
		}
		.menu-card-meta {
			font-family: 'DM Sans', sans-serif;
			font-size: 13px;
			color: rgba(14, 10, 51, 0.4);
		}

		&.menu-card-primary {
			background: #0e0a33;
			border-color: #0e0a33;
			.menu-card-title { color: white; }
			.menu-card-meta { color: rgba(255,255,255,0.5); }
			&:hover { background: #1a1455; }
		}

		&.menu-card-missed {
			border-color: rgba(239, 68, 68, 0.2);
			.menu-card-title { color: #b91c1c; }
			&:hover { border-color: rgba(239, 68, 68, 0.35); }
		}
	}

	/* --- Loading --- */
	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		margin-top: 100px;
		p { font-family: 'DM Sans', sans-serif; font-size: 14px; color: rgba(14, 10, 51, 0.4); }
		.spinner {
			width: 28px; height: 28px;
			border: 2.5px solid rgba(14, 10, 51, 0.08);
			border-top-color: rgba(14, 10, 51, 0.5);
			border-radius: 50%;
			animation: spin 0.7s linear infinite;
		}
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	/* --- Quiz --- */
	.quiz-container {
		width: 100%;
		max-width: 640px;
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
		.timer-stat { color: rgba(14, 10, 51, 0.5); margin-left: auto; }
	}

	.question-card {
		background: white;
		border: 1px solid rgba(14, 10, 51, 0.06);
		border-radius: 16px;
		padding: 32px 28px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
		margin-top: 8px;

		.question-prompt {
			font-family: 'DM Sans', sans-serif;
			font-size: 17px;
			font-weight: 400;
			color: #0e0a33;
			line-height: 1.65;
			margin-top: 14px;
		}

		.antonym-prompt {
			font-family: 'Instrument Serif', 'ivypresto-text', serif;
			font-size: 32px;
			font-weight: 400;
			text-align: center;
			margin-top: 20px;
			letter-spacing: -0.3px;
		}

		.analogy-prompt {
			font-family: 'Instrument Serif', 'ivypresto-text', serif;
			font-size: 26px;
			font-weight: 400;
			text-align: center;
			margin-top: 20px;
		}

		.question-instruction {
			font-family: 'DM Sans', sans-serif;
			font-size: 13px;
			color: rgba(14, 10, 51, 0.4);
			text-align: center;
			margin-top: 12px;
		}
	}

	.type-badge {
		display: inline-block;
		background: rgba(14, 10, 51, 0.04);
		color: rgba(14, 10, 51, 0.45);
		font-family: 'DM Sans', sans-serif;
		font-size: 11px;
		font-weight: 700;
		padding: 4px 10px;
		border-radius: 100px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.choices-area {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.choice-btn {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 14px 16px;
		background: white;
		border: 1.5px solid rgba(14, 10, 51, 0.08);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;

		&:hover:not(:disabled) { border-color: rgba(14, 10, 51, 0.2); }

		&.selected {
			border-color: #0e0a33;
			background: rgba(14, 10, 51, 0.02);
		}

		&.correct {
			border-color: #22c55e;
			background: rgba(34, 197, 94, 0.06);
		}

		&.incorrect {
			border-color: #ef4444;
			background: rgba(239, 68, 68, 0.04);
		}

		&.dimmed {
			opacity: 0.45;
		}

		&:disabled { cursor: default; }

		.choice-letter-btn {
			font-family: 'DM Sans', sans-serif;
			font-size: 12px;
			font-weight: 700;
			color: rgba(14, 10, 51, 0.35);
			background: rgba(14, 10, 51, 0.05);
			width: 24px;
			height: 24px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 6px;
			flex-shrink: 0;
			margin-top: 1px;
		}

		.choice-text {
			font-family: 'DM Sans', sans-serif;
			font-size: 15px;
			font-weight: 400;
			color: #0e0a33;
			line-height: 1.5;
			flex: 1;
		}

		.choice-indicator {
			font-size: 16px;
			font-weight: 700;
			color: #22c55e;
			flex-shrink: 0;
			margin-top: 2px;
			&.wrong { color: #ef4444; }
		}
	}

	.action-row {
		display: flex;
		gap: 8px;

		.check-btn {
			flex: 1;
			font-family: 'DM Sans', sans-serif;
			font-size: 14px;
			font-weight: 600;
			padding: 12px 20px;
			border-radius: 10px;
			border: none;
			cursor: pointer;
			transition: all 0.15s ease;
			background: #0e0a33;
			color: white;
			&:hover:not(:disabled) { background: #1a1455; }
			&:disabled { opacity: 0.4; cursor: not-allowed; }
		}
	}

	.explanation-card {
		background: white;
		border-radius: 16px;
		overflow: hidden;
		border: 1.5px solid rgba(14, 10, 51, 0.06);

		&.correct-border { border-color: rgba(34, 197, 94, 0.25); }
		&.incorrect-border { border-color: rgba(239, 68, 68, 0.2); }

		.explanation-header {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 14px 20px;
			.explanation-icon { font-size: 20px; font-weight: 700; }
			.explanation-verdict { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; }
		}

		&.correct-border .explanation-header {
			background: rgba(34, 197, 94, 0.06);
			.explanation-icon { color: #22c55e; }
			.explanation-verdict { color: #15803d; }
		}
		&.incorrect-border .explanation-header {
			background: rgba(239, 68, 68, 0.04);
			.explanation-icon { color: #ef4444; }
			.explanation-verdict { color: #b91c1c; }
		}

		.explanation-body {
			padding: 20px;
			p {
				font-family: 'DM Sans', sans-serif;
				font-size: 15px;
				font-weight: 400;
				color: rgba(14, 10, 51, 0.7);
				line-height: 1.6;
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

	/* --- Library / Review --- */
	.library { width: 100%; max-width: 640px; }

	.library-empty {
		text-align: center;
		padding: 60px 20px;
		.empty-icon { font-size: 28px; color: rgba(14, 10, 51, 0.12); margin-bottom: 12px; }
		p { font-family: 'DM Sans', sans-serif; font-size: 15px; color: rgba(14, 10, 51, 0.5); }
		.empty-sub { font-size: 13px; color: rgba(14, 10, 51, 0.3); margin-top: 6px; }
	}

	.library-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
		.library-count { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(14, 10, 51, 0.4); font-weight: 500; }
		.clear-btn {
			font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
			color: #ef4444; background: none; border: none; cursor: pointer;
			padding: 4px 8px; border-radius: 4px; transition: background 0.15s;
			&:hover { background: rgba(239, 68, 68, 0.06); }
		}
	}

	.library-list { display: flex; flex-direction: column; gap: 8px; }

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
			gap: 12px;

			.library-card-left {
				display: flex;
				align-items: center;
				gap: 10px;
				min-width: 0;
			}

			.library-prompt {
				font-family: 'DM Sans', sans-serif;
				font-size: 14px;
				font-weight: 400;
				color: #0e0a33;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.expand-icon {
				font-size: 18px;
				color: rgba(14, 10, 51, 0.25);
				transition: transform 0.2s;
				flex-shrink: 0;
				&.expanded { transform: rotate(90deg); }
			}
		}

		.library-card-detail {
			border-top: 1px solid rgba(14, 10, 51, 0.06);
			padding: 16px;
			display: flex;
			flex-direction: column;
			gap: 14px;
		}

		.detail-section {
			.detail-label {
				font-family: 'DM Sans', sans-serif;
				font-size: 10px;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.8px;
				color: rgba(14, 10, 51, 0.28);
				display: block;
				margin-bottom: 6px;
			}
		}

		.detail-prompt {
			font-family: 'DM Sans', sans-serif;
			font-size: 14px;
			color: #0e0a33;
			line-height: 1.55;
		}

		.detail-choices {
			display: flex;
			flex-direction: column;
			gap: 4px;
		}

		.detail-choice {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 8px 10px;
			border-radius: 8px;
			font-family: 'DM Sans', sans-serif;
			font-size: 13px;
			color: rgba(14, 10, 51, 0.6);

			&.correct-choice {
				background: rgba(34, 197, 94, 0.08);
				color: #15803d;
			}
			&.wrong-choice {
				background: rgba(239, 68, 68, 0.06);
				color: #b91c1c;
			}

			.choice-letter {
				font-weight: 700;
				font-size: 11px;
				color: rgba(14, 10, 51, 0.3);
				width: 18px;
				text-align: center;
				flex-shrink: 0;
			}

			.choice-mark {
				margin-left: auto;
				font-weight: 700;
				font-size: 14px;
				color: #22c55e;
				&.wrong { color: #ef4444; }
			}
		}

		.detail-explanation {
			font-family: 'DM Sans', sans-serif;
			font-size: 14px;
			color: rgba(14, 10, 51, 0.6);
			line-height: 1.55;
			background: rgba(14, 10, 51, 0.02);
			padding: 10px 12px;
			border-radius: 8px;
			border-left: 3px solid rgba(14, 10, 51, 0.08);
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
			&:hover { color: #ef4444; }
		}
	}

	/* --- Complete --- */
	.complete-screen {
		display: flex;
		justify-content: center;
		margin-top: 60px;
		width: 100%;
		max-width: 640px;

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
				width: 100px; height: 100px;
				svg { width: 100%; height: 100%; }
				circle { transition: stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
				.stat-percent {
					position: absolute; top: 50%; left: 50%;
					transform: translate(-50%, -50%);
					font-family: 'DM Sans', sans-serif; font-size: 22px; font-weight: 700; color: #0e0a33;
				}
			}

			.stat-details {
				text-align: left;
				p {
					font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 400;
					color: rgba(14, 10, 51, 0.6); margin-bottom: 6px;
					display: flex; align-items: center; gap: 8px;
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
			&.secondary {
				background: white;
				color: #0e0a33;
				border: 1px solid rgba(14, 10, 51, 0.15);
				&:hover { border-color: rgba(14, 10, 51, 0.3); }
			}
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
		.gre-page { padding: 24px 16px 60px; }
		.gre-header .title-block h1 { font-size: 32px; }
		.gre-header .title-row { flex-direction: column; align-items: flex-start; }
		.question-card { padding: 24px 20px; }
		.question-card .antonym-prompt { font-size: 28px; }
		.question-card .analogy-prompt { font-size: 22px; }
		.complete-screen .final-stats { flex-direction: column; gap: 20px; }
	}
</style>
