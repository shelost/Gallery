<script>
  import { onMount, onDestroy } from 'svelte';

  // Text state
  let transcription = '';
  let interimText = '';
  let wordCount = 0;

  // Recording state
  let isRecording = false;
  let isEditable = false;
  let recordingTimer = 0;
  let timerInterval;

  // Speech recognition
  let recognition;
  let isSupported = true;

  // Settings
  let removeFillerWords = true; // Default to removing filler words

  // Audio visualization
  let audioContext;
  let analyser;
  let microphone;
  let canvasCtx;
  let canvas;
  let animationFrame = null;
  let dataArray;
  let bufferLength;
  let browser;
  let visualizationHistory = [];
  let maxHistoryPoints = 200; // Number of time points to keep in history
  let visualizerScrollPosition = 0;

  onMount(() => {
    // Check if we're in a browser environment
    browser = typeof window !== 'undefined';
    if (!browser) return;

    // Check if the browser supports the Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      isSupported = false;
      return;
    }

    // Initialize canvas for visualization
    canvas = document.getElementById('visualizer');
    canvasCtx = canvas ? canvas.getContext('2d') : null;

    // Initialize the SpeechRecognition object
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    // Configure the recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Default language

    // Event handlers
    recognition.onresult = (event) => {
      let currentInterim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          currentInterim += transcript;
        }
      }

      // Only update if there's something new
      if (finalTranscript) {
        // Apply formatting and filler word removal to the final transcript
        let formattedFinal = formatTranscription(finalTranscript);

        // If the transcription is not empty, ensure proper spacing
        if (transcription) {
          // Check if we need to add punctuation between sentences
          const lastChar = transcription.trim().slice(-1);
          const needsPunctuation = !lastChar.match(/[.!?,;:]/) && formattedFinal.charAt(0).match(/[A-Z]/);

          // Add period if the last transcription ends without punctuation and the new one starts with a capital
          if (needsPunctuation) {
            transcription += '. ';
          }
          // Otherwise just add a space if we're not already ending with one
          else if (!transcription.endsWith(' ')) {
            transcription += ' ';
          }
        }

        transcription += formattedFinal;
        updateWordCount();
      }

      // Update the interim text
      interimText = currentInterim ? formatTranscription(currentInterim, true) : '';

      // Update the display
      updateDisplayText();
    };

    recognition.onend = () => {
      // If still recording, restart the recognition
      if (isRecording) {
        recognition.start();
      } else {
        interimText = '';
        isEditable = true;
        updateDisplayText();
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        isSupported = false;
      }
    };
  });

  onDestroy(() => {
    // Check if we're in a browser environment
    if (!browser) return;

    // Clean up resources
    stopVisualization();

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // Cancel animation frame if it exists
    if (browser && animationFrame !== null && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    // Close audio streams if open
    if (microphone) {
      microphone.getTracks().forEach(track => track.stop());
      microphone = null;
    }

    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
      audioContext = null;
    }
  });

  // Format the transcription to make it more professional
  function formatTranscription(text, isInterim = false) {
    if (!text) return '';

    let formatted = text.trim();

    // Remove filler words if option is enabled
    if (removeFillerWords) {
      // Common filler words and verbal tics
      const fillerWordsRegex = /\b(um|uh|like|you know|actually|basically|so|well|right|I mean|I guess|kinda|sort of|literally|anyway|okay so|mmm|hmm|er|eh)\b\s*/gi;
      formatted = formatted.replace(fillerWordsRegex, '');

      // Remove repeated words (common verbal tic)
      formatted = formatted.replace(/\b(\w+)\s+\1\b/gi, '$1');

      // Clean up excessive pauses represented as multiple commas or periods
      formatted = formatted.replace(/[.,]{2,}/g, '.');
    }

    // Capitalize first letter of text
    if (formatted.length > 0) {
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    // Add proper spacing after punctuation
    formatted = formatted.replace(/([.!?:;,])(\w)/g, '$1 $2');

    // Ensure common abbreviations have periods (Mr, Mrs, Dr, etc.)
    formatted = formatted.replace(/\b(Mr|Mrs|Dr|Ms|Jr|Sr|Prof|Inc|Ltd|Co|etc)(\s)/gi,
      (match, abbr, space) => abbr + '.' + space);

    // Capitalize proper nouns and first word of sentences (basic version)
    formatted = formatted.replace(/\.\s+([a-z])/g, (match, letter) => '. ' + letter.toUpperCase());

    // For common sentence starters like I, my, we, etc.
    formatted = formatted.replace(/\bi\b/g, 'I');

    return formatted;
  }

  // Update the display with current transcription and interim text
  function updateDisplayText() {
    if (!browser) return;

    const transcriptElement = document.getElementById('transcript-text');
    if (!transcriptElement) return;

    // If editable, use the contenteditable property
    if (isEditable) {
      if (!transcriptElement.hasAttribute('contenteditable')) {
        transcriptElement.setAttribute('contenteditable', 'true');
        transcriptElement.focus();
        // Place cursor at the end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(transcriptElement);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      return;
    }

    // For non-editable mode with transcription
    let displayHtml = transcription;

    // Add interim text with translucent styling
    if (interimText) {
      // Ensure proper spacing between transcription and interim
      if (displayHtml && !displayHtml.endsWith(' ') && !interimText.startsWith(' ')) {
        displayHtml += ' ';
      }
      displayHtml += `<span class="interim-text">${interimText}</span>`;
    }

    transcriptElement.innerHTML = displayHtml;
  }

  // Start audio visualization
  async function startVisualization() {
    if (!browser) return;

    try {
      // Create audio context if it doesn't exist
      if (!audioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioContext = new AudioContext();
        } else {
          return; // Audio context not supported
        }
      } else if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphone = stream;

      // Create analyzer
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024; // Larger FFT for more detailed frequency data
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);

      // Connect microphone to analyzer
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Reset visualization history when starting a new recording
      if (isRecording) {
        visualizationHistory = [];
        visualizerScrollPosition = 0;
      }

      // Start drawing
      drawWaveform();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }

  // Stop visualization
  function stopVisualization() {
    if (!browser) return;

    // Cancel animation frame if it exists
    if (animationFrame !== null && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    // Clear canvas
    if (canvasCtx && canvas) {
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Stop microphone if it's active
    if (microphone) {
      microphone.getTracks().forEach(track => track.stop());
      microphone = null;
    }

    // Close audio context
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.suspend();
    }
  }

  // Draw waveform visualization
  function drawWaveform() {
    if (!browser || !canvasCtx || !canvas || !analyser) return;

    // Safely request animation frame
    if (typeof window.requestAnimationFrame === 'function') {
      animationFrame = window.requestAnimationFrame(drawWaveform);
    } else {
      return; // requestAnimationFrame not available
    }

    // Get audio data for frequency analysis
    analyser.getByteFrequencyData(dataArray);

    // Store current data in history
    if (isRecording) {
      // Get average levels for fewer bars
      const numBars = 10;
      const levelsData = [];

      for (let i = 0; i < numBars; i++) {
        const startFreq = Math.floor(i * bufferLength / numBars);
        const endFreq = Math.floor((i + 1) * bufferLength / numBars);
        let sum = 0;

        for (let j = startFreq; j < endFreq; j++) {
          sum += dataArray[j];
        }

        // Average level for this frequency range (0-1)
        const avg = sum / (endFreq - startFreq) / 255;
        levelsData.push(avg);
      }

      // Add to history with timestamp
      visualizationHistory.push({
        time: Date.now(),
        levels: levelsData
      });

      // Limit history size
      if (visualizationHistory.length > maxHistoryPoints) {
        visualizationHistory.shift();
      }

      // Auto-scroll to the end
      visualizerScrollPosition = visualizationHistory.length - 1;
    }

    // Clear canvas
    canvasCtx.fillStyle = 'rgb(240, 240, 240)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw visualization history as bars
    const barWidth = 15;
    const barGap = 5;
    const barTotal = barWidth + barGap;
    const displayBars = Math.min(
      Math.floor(canvas.width / barTotal),
      visualizationHistory.length
    );

    // Calculate visible range with scrolling
    let startIdx = Math.max(0, visualizationHistory.length - displayBars);

    // Adjust startIdx based on scroll position when not recording
    if (!isRecording && visualizationHistory.length > displayBars) {
      const maxScrollPosition = visualizationHistory.length - displayBars;
      startIdx = Math.min(
        Math.max(0, visualizerScrollPosition),
        maxScrollPosition
      );
    }

    // Draw the bars
    for (let i = 0; i < displayBars; i++) {
      const historyIdx = startIdx + i;
      if (historyIdx >= visualizationHistory.length) break;

      const historyItem = visualizationHistory[historyIdx];
      const x = i * barTotal;

      // Draw each frequency band as a stacked bar
      for (let j = 0; j < historyItem.levels.length; j++) {
        const level = historyItem.levels[j];
        const barHeight = Math.max(2, level * canvas.height * 0.9); // Ensure at least 2px height
        const y = canvas.height - barHeight;

        // Use gradient colors based on frequency and level
        const hue = 200 + j * 5; // Blue-ish gradient
        const lightness = Math.max(40, 80 - level * 40); // Brighter for lower levels

        canvasCtx.fillStyle = `hsl(${hue}, 80%, ${lightness}%)`;
        canvasCtx.fillRect(
          x,
          y,
          barWidth,
          barHeight
        );
      }

      // Mark current position if recording
      if (isRecording && historyIdx === visualizationHistory.length - 1) {
        canvasCtx.fillStyle = 'rgba(231, 76, 60, 0.5)';
        canvasCtx.fillRect(x, 0, barWidth, canvas.height);
      }
    }
  }

  // Handle visualizer scrolling
  function handleVisualizerScroll(event) {
    if (isRecording || !visualizationHistory.length) return;

    // Calculate scroll amount based on wheel delta
    const delta = Math.sign(event.deltaX || event.deltaY);
    visualizerScrollPosition += delta * 2; // 2 bars at a time

    // Clamp to valid range
    const maxScrollPosition = Math.max(0, visualizationHistory.length - 1);
    visualizerScrollPosition = Math.min(
      Math.max(0, visualizerScrollPosition),
      maxScrollPosition
    );

    // Prevent default to avoid page scrolling
    event.preventDefault();
  }

  // Handle keyboard navigation for visualizer
  function handleVisualizerKeydown(event) {
    if (isRecording || !visualizationHistory.length) return;

    // Left/right arrow keys for scrolling
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const delta = event.key === 'ArrowLeft' ? -1 : 1;
      visualizerScrollPosition += delta * 5; // 5 bars at a time

      // Clamp to valid range
      const maxScrollPosition = Math.max(0, visualizationHistory.length - 1);
      visualizerScrollPosition = Math.min(
        Math.max(0, visualizerScrollPosition),
        maxScrollPosition
      );

      event.preventDefault();
    }
  }

  // Start timer
  function startTimer() {
    if (!browser) return;

    recordingTimer = 0;
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
      recordingTimer++;
    }, 1000);
  }

  // Stop timer
  function stopTimer() {
    if (!browser) return;

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // Format time for display (MM:SS)
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Update word count
  function updateWordCount() {
    const text = transcription.trim();
    if (text) {
      // Count words (split by whitespace and filter out empty strings)
      wordCount = text.split(/\s+/).filter(Boolean).length;
    } else {
      wordCount = 0;
    }
  }

  // Function to toggle recording
  function toggleRecording() {
    if (!browser || !isSupported) return;

    isRecording = !isRecording;

    if (isRecording) {
      isEditable = false;
      transcription = ''; // Clear previous transcription when starting new recording
      interimText = '';
      wordCount = 0;
      const transcriptElement = document.getElementById('transcript-text');
      if (transcriptElement) {
        transcriptElement.innerHTML = '';
        if (transcriptElement.hasAttribute('contenteditable')) {
          transcriptElement.removeAttribute('contenteditable');
        }
      }
      recognition.start();
      startVisualization();
      startTimer();
    } else {
      recognition.stop();
      stopVisualization();
      stopTimer();
      // isEditable will be set to true in onend event
    }
  }

  // Toggle filler word removal
  function toggleFillerWords() {
    removeFillerWords = !removeFillerWords;

    // Re-format existing transcription if we have one and we're not recording
    if (!isRecording && transcription) {
      // We need to completely reformat the text with the new setting
      // First, "undo" any formatting to get original-ish text
      // Store the original text to maintain line breaks and other context
      const originalText = transcription;

      // Apply a simplified "reverting" process that preserves more of the original structure
      let rawText = originalText;

      // We'll now clean the text slightly to avoid over-formatting
      rawText = rawText
        .replace(/\s{2,}/g, ' ')  // Remove extra spaces
        .trim();

      // Then reapply formatting with new settings
      transcription = formatTranscription(rawText);
      updateDisplayText();
      updateWordCount();
    }
  }

  // Function to copy transcription to clipboard
  function copyTranscription() {
    if (!browser) return;

    // If editable, get the text from the element
    let textToCopy = isEditable
      ? document.getElementById('transcript-text')?.innerText
      : transcription;

    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        // Create a temporary notification instead of alert
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.textContent = 'Copied to clipboard!';
        document.body.appendChild(notification);

        // Remove the notification after 2 seconds
        setTimeout(() => {
          notification.classList.add('fade-out');
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 300);
        }, 1700);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  }
</script>

<svelte:head>
  <title>Transcript</title>
  <meta name="description" content="Professional audio transcription app using SvelteKit" />
</svelte:head>

<main>
  <div id = 'svelte'>

    {#if !isSupported}
    <div class="error-message">
        <p>Speech recognition is not supported in your browser or microphone access was denied.</p>
        <p>Please use a modern browser like Chrome or Edge and allow microphone access.</p>
    </div>

    {:else}

    <div id = 'mast'>


        <h1>Audio Transcription</h1>
        <div class="controls-container">
            <button class="record-button {isRecording ? 'recording' : ''}" on:click={toggleRecording}>
            {isRecording ? `Stop Recording (${formatTime(recordingTimer)})` : 'Start Recording'}
            </button>

            <label class="toggle-container">
            <input
                type="checkbox"
                checked={removeFillerWords}
                on:change={toggleFillerWords}
                aria-label="Remove filler words"
            >
            <span class="toggle-text">Remove filler words</span>
            </label>
        </div>
    </div>



    <div id = 'content'>
      <div
        class="visualizer-container"
        class:active={isRecording}
        on:wheel={handleVisualizerScroll}
        on:keydown={handleVisualizerKeydown}
        tabindex="0"
        aria-label="Audio visualization - use left and right arrows to scroll through history"
      >
        <canvas id="visualizer" width="700" height="100"></canvas>
        <div class="visualizer-scroll-indicator" class:hidden={!visualizationHistory.length || visualizationHistory.length <= 20}>
          <div class="scroll-text">Scroll to view history →</div>
        </div>
        <div class="visualizer-patterns" aria-hidden="true">
          {#each Array(20) as _, i}
            <div class="pattern-line" style="left: {5 + i * 35}px"></div>
          {/each}
        </div>
      </div>

      <div class="transcript-container">
        <div class="transcript-header">
          <h2>Transcription {isEditable ? '(Editing Mode)' : ''}</h2>
          <button
            class="copy-button"
            on:click={copyTranscription}
            disabled={isRecording || !transcription}
            aria-label="Copy transcription to clipboard"
          >
            Copy
          </button>
        </div>
        <div
          class="transcript-content"
          id="transcript-text"
          aria-live="polite"
          aria-atomic="true"
        >
          {transcription}
        </div>
        <div class="word-count">
          Words: {wordCount}
        </div>
      </div>

</div>
{/if}


  </div>
</main>

<style lang="scss">
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
    color: #333;
  }


  h1 {
    text-align: center;
    margin-bottom: 2rem;
  }

  // Controls section
  .controls-container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .record-button {
    padding: 1rem 2rem;
    min-width: 200px;
    font-size: 1.2rem;
    font-weight: bold;
    border: none;
    border-radius: 50px;
    background-color: #3498db;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    font-weight: bold;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    transition: opacity 0.3s ease;
  }

  :global(.fade-out) {
    opacity: 0;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background-color: #2980b9;
    }

    &.recording {
      background-color: #e74c3c;
      animation: pulse 1.5s infinite;
    }

    &:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.5);
    }
  }


  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(231, 76, 60, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(231, 76, 60, 0);
    }
  }

  .toggle-container {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    color: #2c3e50;
    font-weight: 500;
    padding: 0.5rem;
    border-radius: 4px;

    &:hover {
      background-color: rgba(52, 152, 219, 0.1);
    }

    &:focus-within {
      outline: none;
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.5);
    }

    input {
      margin-right: 8px;
      cursor: pointer;
    }
  }

  // Visualizer
  .visualizer-container {
    width: 100%;
    height: 100px;
    background-color: rgb(240, 240, 240);
    border-radius: 8px;
    margin-bottom: 1.5rem;
    overflow: hidden;
    position: relative;
    transition: opacity 0.3s ease, box-shadow 0.3s ease;
    cursor: grab;
    outline: none;

    &:active {
      cursor: grabbing;
    }

    &.active {
      opacity: 1;
    }

    &:focus {
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.5);
    }

    .visualizer-scroll-indicator {
      position: absolute;
      top: 50%;
      right: 15px;
      transform: translateY(-50%);
      background-color: rgba(52, 152, 219, 0.2);
      padding: 5px 10px;
      border-radius: 15px;
      font-size: 0.75rem;
      color: #2c3e50;
      pointer-events: none;
      transition: opacity 0.3s ease;

      &.hidden {
        opacity: 0;
      }

      .scroll-text {
        white-space: nowrap;
      }
    }

    .visualizer-patterns {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;

      .pattern-line {
        position: absolute;
        top: 0;
        width: 1px;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.05);
      }
    }
  }


  .transcript-container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .transcript-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #eee;

    h2 {
      margin: 0;
      font-size: 1.2rem;
      color: #2c3e50;
    }
  }

  .copy-button {
    padding: 0.5rem 1rem;
    background-color: #2ecc71;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s ease;

    &:hover {
      background-color: #27ae60;
    }

    &:disabled {
      background-color: #95a5a6;
      cursor: not-allowed;
    }

    &:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(46, 204, 113, 0.5);
    }
  }

  .transcript-content {
    height: 300px;
    padding: 1.5rem;
    overflow-y: auto;
    line-height: 1.6;
    white-space: pre-wrap;

    font-size: 18px;
    font-weight: 500;
    letter-spacing: -0.3px;

    &[contenteditable="true"] {
      border: 1px solid #3498db;
      outline: none;

      &:focus {
        box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.3);
      }
    }
  }

  .interim-text {
    opacity: 0.5;
    color: #666;
    position: relative;
    padding-bottom: 2px;
    border-bottom: 1px dotted #666;
  }

  .word-count {
    text-align: right;
    padding: 0.5rem 1.5rem;
    color: #7f8c8d;
    font-size: 0.85rem;
    border-top: 1px solid #eee;
  }

  // Error message
  .error-message {
    text-align: center;
    background-color: #fff3f3;
    border: 1px solid #ffd7d7;
    border-radius: 8px;
    padding: 1rem;
    margin: 2rem 0;
    color: #e74c3c;
  }

  // Global notifications
  :global(.copy-notification) {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #2ecc71;
  }
  </style>