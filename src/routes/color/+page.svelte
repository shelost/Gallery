<script>
  import { onMount } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import Header from '$lib/components/Header.svelte';
  // Create stores for our color values
  const rgb = writable({ r: 255, g: 87, b: 51, a: 1 });
  const hsl = writable({ h: 14, s: 100, l: 60 });

  // Create derived stores for different color formats
  const hexValue = derived(rgb, $rgb => rgbToHex($rgb.r, $rgb.g, $rgb.b));
  const rgbValue = derived(rgb, $rgb =>
    `rgb(${Math.round($rgb.r)}, ${Math.round($rgb.g)}, ${Math.round($rgb.b)})`
  );
  const hslValue = derived(hsl, $hsl =>
    `hsl(${Math.round($hsl.h)}, ${Math.round($hsl.s)}%, ${Math.round($hsl.l)}%)`
  );

  // Variables for color square interaction
  let colorSquare;
  let huePicker;
  let squareThumb;
  let hueThumb;
  let isDraggingSquare = false;
  let isDraggingHue = false;

  // Toast notification
  let showToast = false;

  // Color conversion utilities
  function rgbToHex(r, g, b) {
    r = Math.round(r);
    g = Math.round(g);
    b = Math.round(b);
    return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`.toUpperCase();
  }

  function componentToHex(c) {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }

      h /= 6;
    }

    return {
      h: h * 360,
      s: s * 100,
      l: l * 100
    };
  }

  function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    // Special case for white
    if (l === 1 && s === 0) {
      return { r: 255, g: 255, b: 255 };
    }

    // Special case for black
    if (l === 0) {
      return { r: 0, g: 0, b: 0 };
    }

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  // Conversion between HSL and SV (for color square)
  function hslToSV(h, s, l) {
    s = s/100;
    l = l/100;

    // In our color square:
    // - Top-left is white (s=0, v=1)
    // - Bottom-left is black (s=0, v=0)
    // - Top-right is pure hue (s=1, v=1)
    // - Bottom-right is pure hue with black (s=1, v=0)

    // Special case for white (s=0, l=100%)
    if (s === 0 && l === 1) {
      return { s: 0, v: 1 }; // Top-left corner
    }

    // Special case for black (s=0, l=0%)
    if (s === 0 && l === 0) {
      return { s: 0, v: 0 }; // Bottom-left corner
    }

    // For grayscale (s=0)
    if (s === 0) {
      return { s: 0, v: l }; // Left edge of square, v = lightness
    }

    // For all other colors
    // Map HSL to square position
    const v = l + s * Math.min(l, 1 - l);
    const s2 = 2 * (1 - l / v);

    return {
      s: Math.min(1, Math.max(0, s2)),
      v: Math.min(1, Math.max(0, v))
    };
  }

  function svToHsl(h, squareS, squareV) {
    // Convert square coordinates to HSL

    // Special case for the top-left corner (white)
    if (squareS === 0 && squareV === 1) {
      return { h, s: 0, l: 100 };
    }

    // Special case for the left edge (grayscale)
    if (squareS === 0) {
      return { h, s: 0, l: squareV * 100 };
    }

    // Special case for the bottom edge (black)
    if (squareV === 0) {
      return { h, s: 0, l: 0 };
    }

    // Formula to convert from SV to HSL
    const l = squareV * (1 - squareS / 2);
    const s = (squareV - l) / Math.min(l, 1 - l);

    return {
      h,
      s: Math.min(100, Math.max(0, s * 100)),
      l: Math.min(100, Math.max(0, l * 100))
    };
  }

  // Update functions to keep RGB and HSL in sync
  function updateFromRGB() {
    rgb.update(currentRgb => {
      const newHsl = rgbToHsl(currentRgb.r, currentRgb.g, currentRgb.b);
      hsl.set(newHsl);

      // Update color square position based on saturation and lightness
      if (squareThumb) {
        // Convert HSL to color square coordinates
        const sv = hslToSV(newHsl.h, newHsl.s, newHsl.l);
        squareThumb.style.left = `${sv.s * 100}%`;
        squareThumb.style.top = `${(1 - sv.v) * 100}%`;
      }

      return currentRgb;
    });
  }

  function updateFromHSL() {
    hsl.update(currentHsl => {
      // Ensure values are within valid ranges
      currentHsl.h = Math.min(360, Math.max(0, currentHsl.h));
      currentHsl.s = Math.min(100, Math.max(0, currentHsl.s));
      currentHsl.l = Math.min(100, Math.max(0, currentHsl.l));

      const newRgb = hslToRgb(currentHsl.h, currentHsl.s, currentHsl.l);
      rgb.update(val => ({...val, r: newRgb.r, g: newRgb.g, b: newRgb.b}));

      // Update hue slider position
      if (hueThumb) {
        hueThumb.style.left = `${(currentHsl.h / 360) * 100}%`;
      }

      return currentHsl;
    });
  }

  // Event handlers for square picker
  function handleSquareMouseDown(e) {
    isDraggingSquare = true;
    handleSquareMove(e);

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleSquareMove);
      window.addEventListener('mouseup', handleSquareMouseUp);
      window.addEventListener('touchmove', handleSquareMove);
      window.addEventListener('touchend', handleSquareMouseUp);
    }
  }

  function handleSquareMove(e) {
    if (!isDraggingSquare || typeof window === 'undefined') return;

    e.preventDefault();
    const rect = colorSquare.getBoundingClientRect();

    // Handle both mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    if (clientX === undefined || clientY === undefined) return;

    // Calculate saturation and value from position
    let squareS = (clientX - rect.left) / rect.width;
    let squareV = 1 - (clientY - rect.top) / rect.height;

    // Clamp values
    squareS = Math.max(0, Math.min(1, squareS));
    squareV = Math.max(0, Math.min(1, squareV));

    // Update thumb position
    squareThumb.style.left = `${squareS * 100}%`;
    squareThumb.style.top = `${(1 - squareV) * 100}%`;

    // Convert square coordinates (SV) to HSL
    const newHsl = svToHsl($hsl.h, squareS, squareV);

    // Update HSL store
    hsl.update(val => ({...val, s: newHsl.s, l: newHsl.l}));
    updateFromHSL();
  }

  function handleSquareMouseUp() {
    isDraggingSquare = false;

    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', handleSquareMove);
      window.removeEventListener('mouseup', handleSquareMouseUp);
      window.removeEventListener('touchmove', handleSquareMove);
      window.removeEventListener('touchend', handleSquareMouseUp);
    }
  }

  // Event handlers for hue slider
  function handleHueMouseDown(e) {
    isDraggingHue = true;
    handleHueMove(e);

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleHueMove);
      window.addEventListener('mouseup', handleHueMouseUp);
      window.addEventListener('touchmove', handleHueMove);
      window.addEventListener('touchend', handleHueMouseUp);
    }
  }

  function handleHueMove(e) {
    if (!isDraggingHue || typeof window === 'undefined') return;

    e.preventDefault();
    const rect = huePicker.getBoundingClientRect();

    // Handle both mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);

    if (clientX === undefined) return;

    // Calculate hue from position
    let h = ((clientX - rect.left) / rect.width) * 360;

    // Clamp values
    h = Math.max(0, Math.min(360, h));

    // Update thumb position
    hueThumb.style.left = `${(h / 360) * 100}%`;

    // Update HSL
    hsl.update(val => ({...val, h}));
    updateFromHSL();
  }

  function handleHueMouseUp() {
    isDraggingHue = false;

    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', handleHueMove);
      window.removeEventListener('mouseup', handleHueMouseUp);
      window.removeEventListener('touchmove', handleHueMove);
      window.removeEventListener('touchend', handleHueMouseUp);
    }
  }

  // Handlers for RGB sliders
  function handleRgbChange(channel, value) {
    value = parseInt(value);
    value = Math.max(0, Math.min(255, value));
    rgb.update(val => ({...val, [channel]: value}));
    updateFromRGB();
  }

  // Handler for alpha slider (no longer used, but kept for reference)
  function handleAlphaChange(value) {
    // Removed alpha slider functionality
  }

  // Handlers for HSL sliders
  function handleHslChange(channel, value) {
    value = parseInt(value);
    const max = channel === 'h' ? 360 : 100;
    value = Math.max(0, Math.min(max, value));

    // Update HSL store
    hsl.update(val => ({...val, [channel]: value}));

    // Convert new HSL to RGB and update RGB store
    const newHsl = {...$hsl, [channel]: value};
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    rgb.update(val => ({...val, r: newRgb.r, g: newRgb.g, b: newRgb.b}));

    // Update color square position for hsl changes
    if (squareThumb) {
      // Convert HSL to color square coordinates
      const sv = hslToSV(newHsl.h, newHsl.s, newHsl.l);
      squareThumb.style.left = `${sv.s * 100}%`;
      squareThumb.style.top = `${(1 - sv.v) * 100}%`;
    }

    // Update hue slider position for hue changes
    if (hueThumb && channel === 'h') {
      hueThumb.style.left = `${(newHsl.h / 360) * 100}%`;
    }
  }

  // Handler for hex code input
  function handleHexChange(hexInput) {
    // Trim whitespace
    hexInput = hexInput.trim();

    // Remove # if present
    if (hexInput.charAt(0) === '#') {
      hexInput = hexInput.slice(1);
    }

    // Check for valid hex format (3 or 6 digits)
    let r, g, b;

    if (hexInput.length === 3) {
      // Expand 3-digit hex (#RGB) to 6-digit (#RRGGBB)
      r = parseInt(hexInput.charAt(0) + hexInput.charAt(0), 16);
      g = parseInt(hexInput.charAt(1) + hexInput.charAt(1), 16);
      b = parseInt(hexInput.charAt(2) + hexInput.charAt(2), 16);
    } else if (hexInput.length === 6) {
      // Standard 6-digit hex
      r = parseInt(hexInput.slice(0, 2), 16);
      g = parseInt(hexInput.slice(2, 4), 16);
      b = parseInt(hexInput.slice(4, 6), 16);
    } else {
      // Invalid format, return without updating
      return;
    }

    // Check if the conversion was successful and values are valid
    if (
      isNaN(r) || isNaN(g) || isNaN(b) ||
      r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255
    ) {
      return; // Invalid color values
    }

    // Update RGB store
    rgb.update(val => ({...val, r, g, b}));

    // Update from RGB will take care of updating HSL and other values
    updateFromRGB();
  }

  // Clipboard functionality
  function copyToClipboard(text) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast = true;
        setTimeout(() => {
          showToast = false;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    }
  }

  // Get current values for reactive updates
  $: currentRgb = $rgb;
  $: currentHsl = $hsl;
  $: currentHex = $hexValue;
  $: currentRgbStr = $rgbValue;
  $: currentHslStr = $hslValue;

  // Initialize color square gradient with the current hue
  $: colorSquareStyle = `background: linear-gradient(to right,
      white,
      hsl(${currentHsl.h}, 100%, 50%))`;
  $: colorSquareOverlayStyle = `background: linear-gradient(to bottom,
      rgba(0,0,0,0),
      black)`;

  // Update color pickers when values change
  $: {
    // Only run this code in the browser
    if (typeof window !== 'undefined') {
      // Update square background when hue changes
      if (colorSquare) {
        colorSquare.style.background = `linear-gradient(to right,
          white,
          hsl(${currentHsl.h}, 100%, 50%))`;
      }

      // Update saturation-lightness slider background color
      const hslSliders = document.querySelectorAll('.saturation-slider input[type="range"]');
      if (hslSliders && hslSliders.length) {
        document.documentElement.style.setProperty('--current-color', `hsl(${currentHsl.h}, 100%, 50%)`);
      }
    }
  }

  onMount(() => {
    // This code only runs in the browser

    // Set initial positions for color square and hue picker thumbs
    if (squareThumb && hueThumb) {
      // Convert HSL to square positions
      const sv = hslToSV(currentHsl.h, currentHsl.s, currentHsl.l);
      squareThumb.style.left = `${sv.s * 100}%`;
      squareThumb.style.top = `${(1 - sv.v) * 100}%`;

      hueThumb.style.left = `${(currentHsl.h / 360) * 100}%`;
    }

    // Set initial color for saturation slider
    document.documentElement.style.setProperty('--current-color', `hsl(${currentHsl.h}, 100%, 50%)`);
  });
</script>

<svelte:head>
  <title>Color Picker</title>
  <meta name="description" content="Professional color picker using SvelteKit" />
</svelte:head>


<!-- Prevent errors by only rendering the interactive UI on the client side -->
{#if typeof window !== 'undefined'}
<main>
  <div id = 'container'>

    <div id = 'left' class = 'content-card'>


      <h1>
        Color Picker
      </h1>
      <h2>
        Precisely select and extract colors for your design projects
      </h2>

      <div class="color-display" style="background-color: {$hexValue}"></div>



    </div>

    <div id = 'content'>

      <div class = 'content-card'>
        <div class="interactive-area">
        <!-- Color Selection Square -->
        <div class="color-square-container">
          <div
            class="color-square"
            bind:this={colorSquare}
            style={colorSquareStyle}
            on:mousedown={handleSquareMouseDown}
            on:touchstart={handleSquareMouseDown}
          >
            <div class="color-square-overlay" style={colorSquareOverlayStyle}></div>
            <div class="square-thumb" bind:this={squareThumb}></div>
          </div>

          <!-- Hue Slider -->
          <div
            class="hue-picker"
            bind:this={huePicker}
            on:mousedown={handleHueMouseDown}
            on:touchstart={handleHueMouseDown}
          >
            <div class="hue-thumb" bind:this={hueThumb}></div>
          </div>




        </div>

        <div class="controls-container">


          <div class="control-group">
            <h3>RGB Controls</h3>
            <div class="sliders rgb-slider">
              <div class="slider-control red-slider">
                <label>R</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={currentRgb.r}
                  on:input={(e) => handleRgbChange('r', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={currentRgb.r}
                  on:change={(e) => handleRgbChange('r', e.target.value)}
                />
              </div>
              <div class="slider-control green-slider">
                <label>G</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={currentRgb.g}
                  on:input={(e) => handleRgbChange('g', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={currentRgb.g}
                  on:change={(e) => handleRgbChange('g', e.target.value)}
                />
              </div>
              <div class="slider-control blue-slider">
                <label>B</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={currentRgb.b}
                  on:input={(e) => handleRgbChange('b', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={currentRgb.b}
                  on:change={(e) => handleRgbChange('b', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div class="control-group">
            <h3>HSL Controls</h3>
            <div class="sliders hsl-slider">
              <div class="slider-control hue-slider">
                <label>H</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={currentHsl.h}
                  on:input={(e) => handleHslChange('h', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={currentHsl.h}
                  on:change={(e) => handleHslChange('h', e.target.value)}
                />
              </div>
              <div class="slider-control saturation-slider">
                <label>S</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentHsl.s}
                  on:input={(e) => handleHslChange('s', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentHsl.s}
                  on:change={(e) => handleHslChange('s', e.target.value)}
                />
              </div>
              <div class="slider-control lightness-slider">
                <label>L</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentHsl.l}
                  on:input={(e) => handleHslChange('l', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentHsl.l}
                  on:change={(e) => handleHslChange('l', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <div id = 'right' class = 'content-card'>


        <!-- Color Code Sections -->
        <div class="color-codes-compact">
          <div class="code-item">
            <span class="code-label">HEX</span>
            <div class="code-value">{currentHex}</div>
            <button class="copy-icon-btn" on:click={() => copyToClipboard(currentHex)} title="Copy HEX value">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
          <div class="code-item">
            <span class="code-label">RGB</span>
            <div class="code-value">{currentRgbStr}</div>
            <button class="copy-icon-btn" on:click={() => copyToClipboard(currentRgbStr)} title="Copy RGB value">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
          <div class="code-item">
            <span class="code-label">HSL</span>
            <div class="code-value">{currentHslStr}</div>
            <button class="copy-icon-btn" on:click={() => copyToClipboard(currentHslStr)} title="Copy HSL value">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>


  </div>

   </div>

  <div class="toast" class:show={showToast}>Copied to clipboard!</div>

  <footer>
    Designed with ♥ for your creative projects
  </footer>

</main>
{:else}
<div class="loading">
  <p>Loading color picker...</p>
</div>
{/if}

<style lang="scss">
  :global(:root) {
    --app-background: #f5f5f7;
    --card-background: #ffffff;
    --text-primary: #1d1d1f;
    --text-secondary: #86868b;
    --accent: #0071e3;
    --border-radius: 12px;
    --shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont;
  }


  main {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }


  header {
    text-align: center;
    padding: 2rem;
    background: linear-gradient(to right, #f2f2f2, #ffffff);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);

    h1 {
      font-size: 1.8rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    p {
      color: var(--text-secondary);
      font-size: 1rem;
    }
  }

  .color-display {
    height: 100px;
    width: 200px;
    margin: 30px 0 10px 0;
    transition: background-color 0s ease;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 5px 5px 20px rgba(0, 0, 0, 0.1);
  }

  .interactive-area {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    padding: 16px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .color-square-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .color-codes-compact {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1rem;

    .code-item {
      flex: 1;
      display: flex;
      align-items: center;
      background-color: #f5f5f7;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.875rem;

      .code-label {
        font-weight: 600;
        color: var(--text-secondary);
        margin-right: 0.5rem;
      }

      .code-value {
        flex: 1;
        font-family: "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono",
          "Courier New", monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .copy-icon-btn {
        background: transparent !important;
        color: var(--text-secondary) !important;
        padding: 4px !important;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s, background-color 0.2s;

        &:hover {
          color: var(--accent) !important;
          background-color: rgba(0, 0, 0, 0.05) !important;
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }
  }

  .color-square {
    position: relative;
    width: 300px;
    padding-bottom: 100%; // Square aspect ratio
    border-radius: 16px;
    //border: 8px solid white;
    cursor: crosshair;
    overflow: hidden;
    //box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
    box-shadow: 10px 20px 40px rgba(#030025, 0.25);
  }

  .color-square-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }

  .square-thumb {
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    border: 2px solid white;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), 0 2px 5px rgba(0, 0, 0, 0.2);
    pointer-events: none;
  }

  .hue-picker {
    position: relative;
    width: 100%;
    height: 32px;
    background: linear-gradient(
      to right,
      #f00,
      #ff0,
      #0f0,
      #0ff,
      #00f,
      #f0f,
      #f00
    );
    border-radius: 8px;
    cursor: pointer;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
  }

  .hue-thumb {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 24px;
    border-radius: 6px;
    transform: translate(-50%, -50%);
    background: white;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), 0 2px 5px rgba(0, 0, 0, 0.2);
    pointer-events: none;
  }

  .controls-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .control-group {
    h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      margin-bottom: 12px;
      color: var(--text-primary);
    }
  }

  .sliders {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  input[type="range"] {
      -webkit-appearance: none;
      width: 100%;
      height: 32px;
      padding: 0 2px;

     // border: 4px solid white;
      border-radius: 10px;

      outline: none;
      box-shadow: 4px 8px 12px rgba(black, .15);

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 28px;
        border-radius: 12px;
        background: rgba(white, .75);
        cursor: pointer;
        border: 1.5px solid rgba(white, .9);
        box-shadow: 2px 4px 12px rgba(black, 0.5);
        backdrop-filter: blur(10px);
        transition: .2s ease;

        &:hover{
          transform: scale(1.08);
        }
      }
    }


  .slider-control {
    display: grid;
    grid-template-columns: 30px 1fr 60px;
    align-items: center;
    gap: 18px;

    label {
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      color: var(--text-secondary);
    }


    input[type="number"] {
      width: 100%;
      border-radius: 6px;
      padding: 0.4rem;
      font-size: 0.875rem;
      text-align: left;
    }
  }

  .hex-control {
    display: grid;
    grid-template-columns: 30px 1fr;
    align-items: center;
    gap: 18px;

    label {
      font-size: 0.875rem;
      font-weight: 600;
      text-align: center;
      color: var(--text-secondary);
    }

  }

  .rgb-slider {
    :global(.red-slider input[type="range"]) {
      background: linear-gradient(to right, #000, #f00);
    }

    :global(.green-slider input[type="range"]) {
      background: linear-gradient(to right, #000, #0f0);
    }

    :global(.blue-slider input[type="range"]) {
      background: linear-gradient(to right, #000, #00f);
    }
  }

  .hsl-slider {
    :global(.hue-slider input[type="range"]) {
      background: linear-gradient(
        to right,
        #f00,
        #ff0,
        #0f0,
        #0ff,
        #00f,
        #f0f,
        #f00
      );
    }

    :global(.saturation-slider input[type="range"]) {
      background: linear-gradient(to right, #808080, var(--current-color, #f00));
    }

    :global(.lightness-slider input[type="range"]) {
      background: linear-gradient(to right, #000, #fff);
    }
  }

  .toast {
    position: fixed;
    top: -50px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #333;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 100px;
    font-size: 0.875rem;
    transition: top 0.3s ease;
    pointer-events: none;
    z-index: 1000;

    &.show {
      top: 20px;
    }
  }


  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 1.5rem;
    color: var(--text-secondary);
  }

</style>