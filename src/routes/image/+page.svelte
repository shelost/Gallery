<!-- src/routes/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  // Application state
  let originalImage = null;
  let processedImage = null;
  let loadingImage = false;
  let maskIntensity = 0.5; // 0 to 1
  let maskSoftness = 0.5; // 0 to 1
  let canvas;
  let ctx;
  let canvasWidth = 600;
  let canvasHeight = 450;

  // References to DOM elements
  let fileInput;

  onMount(() => {
    // Initialize canvas
    ctx = canvas.getContext('2d');
  });

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show loading state
    loadingImage = true;

    // Load original image
    originalImage = await loadImage(file);

    // Process the image (remove background)
    try {
      processedImage = await removeBackground(file);

      // Reset adjustments
      maskIntensity = 0.5;
      maskSoftness = 0.5;

      // Render the processed image
      renderProcessedImage();
    } catch (error) {
      console.error('Error removing background:', error);
      alert('Failed to remove background. Please try again.');
    } finally {
      loadingImage = false;
    }
  }

  function loadImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function removeBackground(file) {
    // In a real application, you would call the remove.bg API here
    // For this example, we'll use a simulated approach

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For demo purposes, we'll just load the original image
      // and pretend we've removed the background
      const img = await loadImage(file);

      // Create a canvas to modify the image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');

      // Draw the original image
      tempCtx.drawImage(img, 0, 0);

      // Create a simple simulated transparency effect
      // This is just for demonstration - it doesn't actually remove the background
      // but creates an effect we can work with
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;

      // Create a simple mask - in a real app this would be done by the remove.bg API
      // This just creates a circular mask in the center as a placeholder
      const centerX = tempCanvas.width / 2;
      const centerY = tempCanvas.height / 2;
      const radius = Math.min(tempCanvas.width, tempCanvas.height) * 0.4;

      for (let y = 0; y < tempCanvas.height; y++) {
        for (let x = 0; x < tempCanvas.width; x++) {
          const idx = (y * tempCanvas.width + x) * 4;

          // Calculate distance from center
          const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

          // If outside the "subject" circle, make transparent
          if (distance > radius) {
            // Keep RGB values but make fully transparent
            data[idx + 3] = 0; // Alpha channel
          }
        }
      }

      // Put the modified image data back
      tempCtx.putImageData(imageData, 0, 0);

      // Convert canvas to image
      const resultImage = new Image();
      return new Promise((resolve) => {
        resultImage.onload = () => resolve(resultImage);
        resultImage.src = tempCanvas.toDataURL('image/png');
      });

    } catch (error) {
      console.error('Error in removeBackground:', error);
      throw new Error('Failed to remove background');
    }

    /*
    // Example of how to call remove.bg API
    const formData = new FormData();
    formData.append('image_file', file);

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': 'YOUR_API_KEY',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to remove background');
    }

    const blob = await response.blob();
    return await loadImage(blob);
    */
  }

  function renderProcessedImage() {
    if (!processedImage) return;

    // Adjust canvas size based on image dimensions
    const imgAspect = processedImage.width / processedImage.height;
    if (imgAspect > canvasWidth / canvasHeight) {
      // Image is wider
      canvasWidth = Math.min(600, processedImage.width);
      canvasHeight = canvasWidth / imgAspect;
    } else {
      // Image is taller
      canvasHeight = Math.min(450, processedImage.height);
      canvasWidth = canvasHeight * imgAspect;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw the processed image
    ctx.drawImage(
      processedImage,
      0, 0,
      processedImage.width, processedImage.height,
      0, 0,
      canvasWidth, canvasHeight
    );

    // Apply mask adjustments (in a real app, you would use the alpha channel)
    // This is simplified for demonstration
    applyMaskAdjustments();
  }

  function applyMaskAdjustments() {
    // Get the current image data
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imageData.data;

    // Create a temporary array to store the modified alpha values
    // This prevents issues when we're modifying values in place
    const tempAlpha = new Uint8ClampedArray(data.length / 4);

    // First pass: extract all alpha values
    for (let i = 0; i < data.length; i += 4) {
      tempAlpha[i/4] = data[i+3];
    }

    // Second pass: apply intensity adjustment
    for (let i = 0; i < data.length; i += 4) {
      // Only modify semi-transparent pixels (part of the mask)
      if (data[i+3] < 255 && data[i+3] > 0) {
        // Adjust alpha based on intensity (0.5 = original, 0 = more transparent, 1 = less transparent)
        if (maskIntensity < 0.5) {
          // Make more transparent
          data[i+3] = data[i+3] * (maskIntensity * 2);
        } else if (maskIntensity > 0.5) {
          // Make less transparent
          data[i+3] = Math.min(255, data[i+3] * (1 + (maskIntensity - 0.5)));
        }
      }
    }

    // Third pass: apply softness/blur to mask edges
    if (maskSoftness > 0) {
      const width = canvasWidth;
      const blurRadius = Math.ceil(maskSoftness * 8); // Scale softness to a pixel radius

      // Only process if we have a meaningful blur radius
      if (blurRadius > 0) {
        // Simple box blur on the alpha channel for edges
        for (let y = 0; y < canvasHeight; y++) {
          for (let x = 0; x < canvasWidth; x++) {
            const idx = (y * width + x) * 4;

            // Only blur pixels that are at edges (where there's partial transparency)
            if (data[idx+3] > 0 && data[idx+3] < 255) {
              let alphaSum = 0;
              let count = 0;

              // Apply box blur by averaging nearby alpha values
              for (let ky = -blurRadius; ky <= blurRadius; ky++) {
                for (let kx = -blurRadius; kx <= blurRadius; kx++) {
                  const nx = x + kx;
                  const ny = y + ky;

                  // Skip if out of bounds
                  if (nx < 0 || nx >= width || ny < 0 || ny >= canvasHeight) {
                    continue;
                  }

                  const nidx = (ny * width + nx) * 4;
                  alphaSum += data[nidx+3];
                  count++;
                }
              }

              // Calculate the average alpha value
              if (count > 0) {
                data[idx+3] = alphaSum / count;
              }
            }
          }
        }
      }
    }

    // Apply the modified image data back to the canvas
    ctx.putImageData(imageData, 0, 0);
  }

  function handleIntensityChange(event) {
    maskIntensity = parseFloat(event.target.value);
    renderProcessedImage();
  }

  function handleSoftnessChange(event) {
    maskSoftness = parseFloat(event.target.value);
    renderProcessedImage();
  }

  function downloadImage() {
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'background-removed.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function resetApp() {
    originalImage = null;
    processedImage = null;
    if (fileInput) fileInput.value = '';

    // Clear canvas
    if (ctx) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }
  }
</script>

<svelte:head>
  <title>SvelteKit Background Remover</title>
  <meta name="description" content="Remove image backgrounds and adjust mask boundaries" />
</svelte:head>

<div class="app">
  <header>
    <h1>Background Remover</h1>
  </header>

  <main>
    <div class="container">
      {#if !processedImage}
        <div class="upload-section" in:fade>
          <div class="upload-container">
            <input
              type="file"
              accept="image/*"
              bind:this={fileInput}
              on:change={handleFileUpload}
              id="file-input"
              class="hidden-input"
            />
            <label for="file-input" class="upload-button">
              {#if loadingImage}
                <div class="loader"></div>
                <span>Processing image...</span>
              {:else}
                <span>Select an image</span>
              {/if}
            </label>
          </div>
        </div>
      {:else}
        <div class="editor-section" in:fade>
          <div class="editor-controls">
            <div class="adjustment-control">
              <label for="intensity">Mask Intensity</label>
              <input
                type="range"
                id="intensity"
                min="0"
                max="1"
                step="0.01"
                value={maskIntensity}
                on:input={handleIntensityChange}
              />
            </div>

            <div class="adjustment-control">
              <label for="softness">Edge Softness</label>
              <input
                type="range"
                id="softness"
                min="0"
                max="1"
                step="0.01"
                value={maskSoftness}
                on:input={handleSoftnessChange}
              />
            </div>
          </div>

          <div class="canvas-container">
            <canvas bind:this={canvas}></canvas>
          </div>

          <div class="action-buttons">
            <button class="btn btn-primary" on:click={downloadImage}>
              Download PNG
            </button>
            <button class="btn btn-secondary" on:click={resetApp}>
              Start Over
            </button>
          </div>
        </div>
      {/if}
    </div>
  </main>

  <footer>
    <p>© {new Date().getFullYear()} Background Remover App</p>
  </footer>
</div>

<style lang="scss">
  /* Variables */
  $primary-color: #4a6cf7;
  $primary-color-dark: #3a5de7;
  $secondary-color: #f0f0f0;
  $text-color: #333;
  $background-color: #f9f9f9;
  $border-color: #ccc;
  $border-radius: 8px;
  $box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  $transition: all 0.2s ease;

  /* Global styles */
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: $background-color;
    color: $text-color;
  }

  :global(*) {
    box-sizing: border-box;
  }

  /* App layout */
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  header {
    padding: 1rem;
    background-color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    h1 {
      margin: 0;
      text-align: center;
      font-size: 1.8rem;
      color: $text-color;
    }
  }

  main {
    flex: 1;
    padding: 2rem 1rem;
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
  }

  footer {
    padding: 1rem;
    text-align: center;
    font-size: 0.8rem;
    color: #666;
    border-top: 1px solid #eee;
    background-color: white;
  }

  /* Upload section */
  .upload-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    border: 2px dashed $border-color;
    border-radius: $border-radius;
    margin-bottom: 2rem;
    padding: 2rem;
    background-color: white;
  }

  .upload-container {
    text-align: center;

    .hidden-input {
      display: none;
    }

    .upload-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 1rem 2rem;
      background-color: $primary-color;
      color: white;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      transition: $transition;
      min-width: 200px;
      min-height: 50px;

      &:hover {
        background-color: $primary-color-dark;
      }
    }
  }

  .loader {
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 3px solid white;
    width: 20px;
    height: 20px;
    animation: spin 1s linear infinite;
    margin-right: 10px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Editor section */
  .editor-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    background-color: white;
    padding: 1.5rem;
    border-radius: $border-radius;
    box-shadow: $box-shadow;
  }

  .editor-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .adjustment-control {
    flex: 1;
    min-width: 200px;

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: $text-color;
    }

    input[type="range"] {
      width: 100%;
      height: 6px;
      -webkit-appearance: none;
      background: #e0e0e0;
      border-radius: 3px;
      outline: none;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: $primary-color;
        cursor: pointer;
      }

      &::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: $primary-color;
        cursor: pointer;
        border: none;
      }
    }
  }

  .canvas-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f5f5f5;
    border-radius: $border-radius;
    padding: 1rem;
    overflow: hidden;

    canvas {
      max-width: 100%;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
  }

  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1rem;

    .btn {
      padding: 0.75rem 1.5rem;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
      transition: $transition;
      border: none;

      &.btn-primary {
        background-color: $primary-color;
        color: white;

        &:hover {
          background-color: $primary-color-dark;
        }
      }

      &.btn-secondary {
        background-color: $secondary-color;
        color: $text-color;

        &:hover {
          background-color: darken($secondary-color, 5%);
        }
      }
    }
  }

  /* Responsive adjustments */
  @media (max-width: 576px) {
    .editor-controls {
      flex-direction: column;
    }

    .action-buttons {
      flex-direction: column;

      .btn {
        width: 100%;
      }
    }
  }
</style>