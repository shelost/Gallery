<script>
  import { onMount } from 'svelte';
  import { spring } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  //import { format } from '@number-flow/format';

  // State management
  let displayValue = '0';
  let formula = '';
  let memory = 0;
  let history = [];
  let isAnimating = false;
  let lastOperation = null;
  let shouldResetDisplay = false;
  let isInScientificMode = false;
  let degreeMode = true; // true for degrees, false for radians
  let showHistory = false;

  // Theme management
  let isDarkMode = true;

  // For animations
  const displayScale = spring(1, {
    stiffness: 0.1,
    damping: 0.4,
    easing: cubicOut
  });

  // Format settings
  const formatOptions = {
    maximumFractionDigits: 10,
    useGrouping: true
  };

  // Sound effects
  let clickSound;

  onMount(() => {
    // Check system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      isDarkMode = true;
    }

    // Set up sound
    clickSound = new Audio('/click.mp3');
    clickSound.volume = 0.2;

    // Set up keyboard shortcuts
    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });

  function handleKeydown(event) {
    const key = event.key;

    // Prevent default behavior for calculator keys
    if (/^[0-9+\-*/()=.,]$/.test(key) ||
        key === 'Enter' ||
        key === 'Backspace' ||
        key === 'Escape') {
      event.preventDefault();
    }

    if (/^[0-9]$/.test(key)) {
      handleNumber(key);
    } else if (key === '+') {
      handleOperation('+');
    } else if (key === '-') {
      handleOperation('-');
    } else if (key === '*') {
      handleOperation('×');
    } else if (key === '/') {
      handleOperation('÷');
    } else if (key === '=' || key === 'Enter') {
      calculate();
    } else if (key === '.') {
      handleDecimal();
    } else if (key === 'Backspace') {
      handleDelete();
    } else if (key === 'Escape') {
      handleClear();
    }
  }

  function playClickSound() {
    if (clickSound) {
      clickSound.currentTime = 0;
      clickSound.play().catch(err => console.log('Audio play failed:', err));
    }
  }

  function animateDisplay() {
    isAnimating = true;
    displayScale.set(0.98);
    setTimeout(() => {
      displayScale.set(1);
      isAnimating = false;
    }, 50);
  }

  function formatDisplay(value) {
    try {
      // Handle error state
      if (value === 'Error') return 'Error';

      // Parse value to number and format
      const numValue = parseFloat(value);

      // Check for special cases
      if (isNaN(numValue)) return '0';
      if (!isFinite(numValue)) return numValue > 0 ? '∞' : '-∞';

      // Format number using @number-flow
      return numValue;
      return format(numValue, formatOptions);

    } catch (err) {
      console.error('Formatting error:', err);
      return value;
    }
  }

  function handleNumber(num) {
    playClickSound();
    animateDisplay();

    if (displayValue === '0' || shouldResetDisplay) {
      displayValue = num;
      shouldResetDisplay = false;
    } else {
      displayValue += num;
    }
  }

  function handleDecimal() {
    playClickSound();
    animateDisplay();

    if (shouldResetDisplay) {
      displayValue = '0.';
      shouldResetDisplay = false;
    } else if (!displayValue.includes('.')) {
      displayValue += '.';
    }
  }

  function handleOperation(op) {
    playClickSound();
    animateDisplay();

    // If there's a pending operation, calculate it first
    if (formula && !shouldResetDisplay) {
      calculate();
    }

    formula = displayValue + ' ' + op + ' ';
    shouldResetDisplay = true;
    lastOperation = op;
  }

  function handleEquals() {
    playClickSound();
    calculate();
  }

  function calculate() {
    try {
      if (!formula) return;

      const fullExpression = formula + displayValue;
      let result;

      // Parse the expression
      const sanitizedExpression = fullExpression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/sin\(/g, `Math.${degreeMode ? 'sin' : 'sin'}(${degreeMode ? 'Math.PI/180*' : ''}`)
        .replace(/cos\(/g, `Math.${degreeMode ? 'cos' : 'cos'}(${degreeMode ? 'Math.PI/180*' : ''}`)
        .replace(/tan\(/g, `Math.${degreeMode ? 'tan' : 'tan'}(${degreeMode ? 'Math.PI/180*' : ''}`)
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/√\(/g, 'Math.sqrt(')
        .replace(/π/g, 'Math.PI');

      // Evaluate the expression
      result = eval(sanitizedExpression);

      // Add to history
      history = [{ expression: fullExpression, result: result.toString() }, ...history].slice(0, 10);

      // Update the display
      displayValue = result.toString();
      formula = '';
      shouldResetDisplay = true;

      animateDisplay();
    } catch (error) {
      displayValue = 'Error';
      formula = '';
      console.error('Calculation error:', error);
    }
  }

  function handleClear() {
    playClickSound();
    animateDisplay();
    displayValue = '0';
    formula = '';
    lastOperation = null;
  }

  function handleDelete() {
    playClickSound();
    animateDisplay();

    if (displayValue.length === 1 || displayValue === 'Error') {
      displayValue = '0';
    } else {
      displayValue = displayValue.slice(0, -1);
    }
  }

  function handleMemoryAdd() {
    memory += parseFloat(displayValue);
    shouldResetDisplay = true;
  }

  function handleMemorySubtract() {
    memory -= parseFloat(displayValue);
    shouldResetDisplay = true;
  }

  function handleMemoryRecall() {
    displayValue = memory.toString();
    animateDisplay();
  }

  function handleMemoryClear() {
    memory = 0;
  }

  function toggleScientificMode() {
    isInScientificMode = !isInScientificMode;
  }

  function toggleDegreeMode() {
    degreeMode = !degreeMode;
  }

  function handleScientificOperation(op) {
    playClickSound();
    animateDisplay();

    try {
      const value = parseFloat(displayValue);
      let result;

      switch (op) {
        case 'square':
          result = value * value;
          break;
        case 'sqrt':
          if (value < 0) throw new Error('Cannot take square root of negative number');
          result = Math.sqrt(value);
          break;
        case 'sin':
          result = degreeMode ?
            Math.sin(value * Math.PI / 180) :
            Math.sin(value);
          break;
        case 'cos':
          result = degreeMode ?
            Math.cos(value * Math.PI / 180) :
            Math.cos(value);
          break;
        case 'tan':
          result = degreeMode ?
            Math.tan(value * Math.PI / 180) :
            Math.tan(value);
          break;
        case 'log10':
          if (value <= 0) throw new Error('Cannot take log of non-positive number');
          result = Math.log10(value);
          break;
        case 'ln':
          if (value <= 0) throw new Error('Cannot take ln of non-positive number');
          result = Math.log(value);
          break;
        case 'factorial':
          if (value < 0 || !Number.isInteger(value)) throw new Error('Factorial requires non-negative integer');
          result = factorial(value);
          break;
        case 'percent':
          result = value / 100;
          break;
        case '1/x':
          if (value === 0) throw new Error('Cannot divide by zero');
          result = 1 / value;
          break;
        case 'pi':
          result = Math.PI;
          break;
        case 'e':
          result = Math.E;
          break;
        default:
          return;
      }

      displayValue = result.toString();
      shouldResetDisplay = true;
    } catch (error) {
      displayValue = 'Error';
      console.error('Scientific operation error:', error);
    }
  }

  function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode;
  }

  function toggleHistory() {
    showHistory = !showHistory;
  }

  function clearHistory() {
    history = [];
  }

  function selectHistoryItem(item) {
    displayValue = item.result;
    showHistory = false;
  }

  $: formattedDisplay = formatDisplay(displayValue);
</script>

<svelte:head>
  <title>Calculator</title>
</svelte:head>

<div class="calculator-container" class:dark-mode={isDarkMode}>
  <div class="calculator">
    <div class="display-container">
      <div class="theme-toggle" on:click={toggleTheme}>
        {#if isDarkMode}
          <span>☀️</span>
        {:else}
          <span>🌙</span>
        {/if}
      </div>

      <div class="history-toggle" on:click={toggleHistory}>
        <span>⏱</span>
      </div>

      <div class="formula-display">
        {formula}
      </div>

      <div class="main-display" style="transform: scale({$displayScale})">
        {formattedDisplay}
      </div>
    </div>

    <div class="keypad-container">
      {#if isInScientificMode}
        <div class="scientific-keypad">
          <button class="function-key" on:click={() => toggleDegreeMode()}>
            {degreeMode ? 'DEG' : 'RAD'}
          </button>
          <button class="function-key" on:click={() => handleScientificOperation('sin')}>sin</button>
          <button class="function-key" on:click={() => handleScientificOperation('cos')}>cos</button>
          <button class="function-key" on:click={() => handleScientificOperation('tan')}>tan</button>
          <button class="function-key" on:click={() => handleScientificOperation('log10')}>log</button>
          <button class="function-key" on:click={() => handleScientificOperation('ln')}>ln</button>
          <button class="function-key" on:click={() => handleScientificOperation('sqrt')}>√</button>
          <button class="function-key" on:click={() => handleScientificOperation('square')}>x²</button>
          <button class="function-key" on:click={() => handleScientificOperation('factorial')}>x!</button>
          <button class="function-key" on:click={() => handleScientificOperation('1/x')}>¹/ₓ</button>
          <button class="function-key" on:click={() => handleScientificOperation('pi')}>π</button>
          <button class="function-key" on:click={() => handleScientificOperation('e')}>e</button>
        </div>
      {/if}

      <div class="main-keypad">
        <div class="keypad-row">
          <button class="function-key" on:click={handleClear}>AC</button>
          <button class="function-key" on:click={handleDelete}>⌫</button>
          <button class="function-key" on:click={() => handleScientificOperation('percent')}>%</button>
          <button class="operation-key" on:click={() => handleOperation('÷')}>÷</button>
        </div>

        <div class="keypad-row">
          <button class="numeric-key" on:click={() => handleNumber('7')}>7</button>
          <button class="numeric-key" on:click={() => handleNumber('8')}>8</button>
          <button class="numeric-key" on:click={() => handleNumber('9')}>9</button>
          <button class="operation-key" on:click={() => handleOperation('×')}>×</button>
        </div>

        <div class="keypad-row">
          <button class="numeric-key" on:click={() => handleNumber('4')}>4</button>
          <button class="numeric-key" on:click={() => handleNumber('5')}>5</button>
          <button class="numeric-key" on:click={() => handleNumber('6')}>6</button>
          <button class="operation-key" on:click={() => handleOperation('-')}>−</button>
        </div>

        <div class="keypad-row">
          <button class="numeric-key" on:click={() => handleNumber('1')}>1</button>
          <button class="numeric-key" on:click={() => handleNumber('2')}>2</button>
          <button class="numeric-key" on:click={() => handleNumber('3')}>3</button>
          <button class="operation-key" on:click={() => handleOperation('+')}>+</button>
        </div>

        <div class="keypad-row">
          <button class="mode-toggle" on:click={toggleScientificMode}>
            {isInScientificMode ? 'BASIC' : 'SCI'}
          </button>
          <button class="numeric-key" on:click={() => handleNumber('0')}>0</button>
          <button class="numeric-key" on:click={handleDecimal}>.</button>
          <button class="equals-key" on:click={handleEquals}>=</button>
        </div>
      </div>
    </div>

    <div class="memory-keys">
      <button on:click={handleMemoryClear}>MC</button>
      <button on:click={handleMemoryRecall}>MR</button>
      <button on:click={handleMemoryAdd}>M+</button>
      <button on:click={handleMemorySubtract}>M−</button>
    </div>
  </div>

  {#if showHistory}
    <div class="history-panel" transition:slide={{ duration: 300 }}>
      <div class="history-header">
        <h3>History</h3>
        <button on:click={clearHistory}>Clear History</button>
      </div>

      {#if history.length === 0}
        <p class="no-history">No history available</p>
      {:else}
        <ul class="history-list">
          {#each history as item, i}
            <li on:click={() => selectHistoryItem(item)}>
              <div class="history-expression">{item.expression}</div>
              <div class="history-result">{item.result}</div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f5f5f7;
    transition: background-color 0.3s ease;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  :global(body.dark) {
    background-color: #121212;
  }

  .calculator-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    position: relative;
    max-width: 100%;

    &.dark-mode {
      :global(body) {
        background-color: #121212;
      }

      .calculator {
        background-color: #1a1a1a;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);

        .display-container {
          background-color: #1e1e1e;
        }

        .main-display {
          color: #ffffff;
        }

        .formula-display {
          color: #a0a0a0;
        }

        button {
          background-color: #2c2c2c;
          color: #ffffff;

          &:hover {
            background-color: #3a3a3a;
          }

          &.operation-key {
            background-color: #ff9f0a;

            &:hover {
              background-color: #ffb340;
            }
          }

          &.equals-key {
            background-color: #ff9f0a;

            &:hover {
              background-color: #ffb340;
            }
          }

          &.function-key {
            background-color: #505050;

            &:hover {
              background-color: #626262;
            }
          }

          &.numeric-key {
            background-color: #505050;

            &:hover {
              background-color: #626262;
            }
          }

          &.mode-toggle {
            background-color: #383838;

            &:hover {
              background-color: #454545;
            }
          }
        }

        .memory-keys button {
          background-color: #2c2c2c;
          color: #ff9f0a;

          &:hover {
            background-color: #3a3a3a;
          }
        }

        .history-panel {
          background-color: #1a1a1a;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);

          .history-header {
            border-bottom: 1px solid #333;
          }

          .history-list li {
            border-bottom: 1px solid #333;

            &:hover {
              background-color: #2a2a2a;
            }
          }
        }
      }
    }
  }

  .calculator {
    width: 350px;
    max-width: calc(100vw - 30px);
    background-color: #ffffff;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;

    @media (max-height: 700px) {
      transform: scale(0.9);
    }

    @media (max-width: 400px) {
      width: 100%;
      max-width: none;
      height: 100vh;
      border-radius: 0;
    }
  }

  .display-container {
    background-color: #f9f9f9;
    padding: 20px;
    position: relative;
    transition: background-color 0.3s ease;

    .theme-toggle, .history-toggle {
      position: absolute;
      top: 10px;
      cursor: pointer;
      font-size: 16px;
      opacity: 0.7;
      transition: opacity 0.3s ease;

      &:hover {
        opacity: 1;
      }
    }

    .theme-toggle {
      left: 15px;
    }

    .history-toggle {
      right: 15px;
    }
  }

  .main-display {
    font-size: 48px;
    font-weight: 300;
    text-align: right;
    margin-top: 10px;
    min-height: 60px;
    color: #000000;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: transform 0.15s ease-out;
  }

  .formula-display {
    font-size: 16px;
    text-align: right;
    color: #777;
    min-height: 20px;
    margin-top: 20px;
  }

  .keypad-container {
    display: flex;
    flex-direction: column;
    padding: 15px;
  }

  .keypad-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  button {
    border: none;
    border-radius: 50%;
    width: 70px;
    height: 70px;
    font-size: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
    -webkit-tap-highlight-color: transparent;

    @media (max-width: 400px) {
      width: 60px;
      height: 60px;
    }

    &:active {
      transform: scale(0.95);
    }

    &.operation-key {
      background-color: #ff9f0a;
      color: white;
      font-size: 28px;

      &:hover {
        background-color: #ffb340;
      }
    }

    &.equals-key {
      background-color: #ff9f0a;
      color: white;

      &:hover {
        background-color: #ffb340;
      }
    }

    &.function-key {
      background-color: #e0e0e0;
      color: #000000;

      &:hover {
        background-color: #d0d0d0;
      }
    }

    &.numeric-key {
      background-color: #f1f1f1;
      color: #000000;

      &:hover {
        background-color: #e5e5e5;
      }
    }

    &.mode-toggle {
      background-color: #e0e0e0;
      color: #000000;
      font-size: 16px;

      &:hover {
        background-color: #d0d0d0;
      }
    }
  }

  .scientific-keypad {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 15px;

    button {
      width: 100%;
      height: 50px;
      border-radius: 10px;
      font-size: 16px;
    }
  }

  .memory-keys {
    display: flex;
    justify-content: space-between;
    padding: 0 15px 15px;

    button {
      background: none;
      border: none;
      color: #ff9f0a;
      font-size: 16px;
      padding: 5px;
      cursor: pointer;
      border-radius: 5px;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: rgba(255, 159, 10, 0.1);
      }
    }
  }

  .history-panel {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 300px;
    max-height: 80vh;
    background-color: white;
    border-radius: 15px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    z-index: 10;

    @media (max-width: 768px) {
      width: 90%;
      max-height: 70vh;
      top: 15%;
      left: 50%;
      transform: translateX(-50%);
    }
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-bottom: 1px solid #eee;

    h3 {
      margin: 0;
      font-weight: 500;
    }

    button {
      background: none;
      border: none;
      color: #ff9f0a;
      cursor: pointer;
      font-size: 14px;
      padding: 5px 10px;
      border-radius: 5px;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: rgba(255, 159, 10, 0.1);
      }
    }
  }

  .history-list {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    flex: 1;

    li {
      padding: 15px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #f9f9f9;
      }

      .history-expression {
        font-size: 14px;
        color: #777;
        margin-bottom: 5px;
      }

      .history-result {
        font-size: 18px;
        font-weight: 500;
      }
    }
  }

  .no-history {
    padding: 20px;
    text-align: center;
    color: #999;
  }
</style>