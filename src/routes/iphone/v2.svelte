<!-- src/routes/+page.svelte -->
<script>
    import { onMount } from 'svelte';
    import * as THREE from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
    import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

    let container;
    let canvas;
    let scene, camera, renderer, controls;
    let iphone, phoneScreen;
    let screenTexture;

    let rotationX = 0;
    let rotationY = 0;
    let rotationZ = 0;
    let naturalLighting = true;

    let uploadedImages = [];
    let currentImageIndex = 0;

    let loading = true;
    let error = null;

    $: if (iphone && typeof rotationX === 'number' && typeof rotationY === 'number' && typeof rotationZ === 'number') {
      updateRotation();
    }

    $: if (scene && naturalLighting !== undefined) {
      updateLighting();
    }

    $: if (uploadedImages.length > 0 && phoneScreen) {
      updateScreenTexture(uploadedImages[currentImageIndex]);
    }

    function updateRotation() {
      if (!iphone) return;

      iphone.rotation.x = THREE.MathUtils.degToRad(rotationX);
      iphone.rotation.y = THREE.MathUtils.degToRad(rotationY);
      iphone.rotation.z = THREE.MathUtils.degToRad(rotationZ);

      if (renderer) renderer.render(scene, camera);
    }

    function updateLighting() {
      if (!scene) return;

      // Clear existing lights
      scene.children = scene.children.filter(child => !(child instanceof THREE.Light));

      if (naturalLighting) {
        // Create ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // Create directional light (simulates sunlight)
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 5, 5);
        scene.add(dirLight);

        // Add some fill lights
        const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight1.position.set(-5, 0, -5);
        scene.add(fillLight1);

        const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight2.position.set(0, -5, 0);
        scene.add(fillLight2);
      } else {
        // Basic flat lighting for non-natural mode
        const flatLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(flatLight);
      }

      if (renderer) renderer.render(scene, camera);
    }

    function updateScreenTexture(imageFile) {
      if (!phoneScreen) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        if (screenTexture) {
          screenTexture.dispose();
        }

        const textureLoader = new THREE.TextureLoader();
        screenTexture = textureLoader.load(e.target.result, () => {
          if (phoneScreen.material) {
            phoneScreen.material.map = screenTexture;
            phoneScreen.material.needsUpdate = true;
            renderer.render(scene, camera);
          }
        });
      };
      reader.readAsDataURL(imageFile);
    }

    function handleDrop(e) {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer.files) {
        const files = Array.from(e.dataTransfer.files).filter(file =>
          file.type.startsWith('image/')
        );

        if (files.length > 0) {
          uploadedImages = [...uploadedImages, ...files];
          currentImageIndex = uploadedImages.length - 1;
        }
      }
    }

    function handleDragOver(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    function exportImage() {
      if (!renderer) return;

      // Set renderer to preserve alpha
      const originalClearAlpha = renderer.getClearAlpha();
      renderer.setClearAlpha(0);

      renderer.render(scene, camera);

      const dataURL = renderer.domElement.toDataURL('image/png');
      renderer.setClearAlpha(originalClearAlpha);

      // Create download link
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'iphone-15-mockup.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    function nextImage() {
      if (uploadedImages.length === 0) return;
      currentImageIndex = (currentImageIndex + 1) % uploadedImages.length;
    }

    function prevImage() {
      if (uploadedImages.length === 0) return;
      currentImageIndex = (currentImageIndex - 1 + uploadedImages.length) % uploadedImages.length;
    }

    function removeCurrentImage() {
      if (uploadedImages.length === 0) return;

      uploadedImages = [
        ...uploadedImages.slice(0, currentImageIndex),
        ...uploadedImages.slice(currentImageIndex + 1)
      ];

      if (uploadedImages.length > 0) {
        currentImageIndex = Math.min(currentImageIndex, uploadedImages.length - 1);
      } else {
        currentImageIndex = 0;
        // Reset screen texture
        if (phoneScreen && phoneScreen.material) {
          phoneScreen.material.map = null;
          phoneScreen.material.needsUpdate = true;
          renderer.render(scene, camera);
        }
      }
    }

    onMount(async () => {
      try {
        // Initialize Scene
        scene = new THREE.Scene();
        scene.background = null; // Transparent background

        // Initialize Camera
        camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 0, 15);

        // Initialize Renderer
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputEncoding = THREE.sRGBEncoding;

        // Initialize OrbitControls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Add event listener for control changes
        controls.addEventListener('change', () => {
          // Update the rotation values to match the current orientation
          if (iphone) {
            rotationX = THREE.MathUtils.radToDeg(iphone.rotation.x);
            rotationY = THREE.MathUtils.radToDeg(iphone.rotation.y);
            rotationZ = THREE.MathUtils.radToDeg(iphone.rotation.z);
          }
          renderer.render(scene, camera);
        });

        // Set up lights
        updateLighting();

        // Load iPhone model
        const loader = new GLTFLoader();
        loader.load(
          '3d/iphone15.glb', // You'll need to create this model file
          (gltf) => {
            iphone = gltf.scene;
            scene.add(iphone);

            // Find the screen mesh in the iPhone model
            iphone.traverse((child) => {
              if (child.isMesh && child.name === 'Screen') {
                phoneScreen = child;

                // Create material for the screen
                phoneScreen.material = new THREE.MeshBasicMaterial({
                  color: 0xffffff,
                  transparent: true
                });
              }
            });

            // Center the model
            const box = new THREE.Box3().setFromObject(iphone);
            const center = box.getCenter(new THREE.Vector3());
            iphone.position.sub(center);

            // Initial rotation
            updateRotation();

            loading = false;
            renderer.render(scene, camera);
          },
          undefined,
          (err) => {
            error = 'Failed to load iPhone model: ' + err;
            loading = false;
          }
        );

        // Handle window resize
        const handleResize = () => {
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
          renderer.render(scene, camera);
        };

        window.addEventListener('resize', handleResize);

        // Animation loop
        const animate = () => {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };

        animate();

        return () => {
          window.removeEventListener('resize', handleResize);

          // Cleanup resources
          if (screenTexture) screenTexture.dispose();
          renderer.dispose();

          // Remove all event listeners from controls
          controls.dispose();
        };
      } catch (err) {
        error = 'Error initializing 3D scene: ' + err.message;
        loading = false;
      }
    });
  </script>

  <div class="app-container">
    <div class="controls-sidebar">
      <h1>iPhone 15 Mockup Generator</h1>

      {#if loading}
        <div class="loading">Loading iPhone model...</div>
      {:else if error}
        <div class="error">{error}</div>
      {:else}
        <div class="rotation-controls">
          <h2>Rotation Controls</h2>
          <div class="slider-group">
            <label>X Rotation: {rotationX}°</label>
            <input type="range" min="-180" max="180" bind:value={rotationX} />
          </div>
          <div class="slider-group">
            <label>Y Rotation: {rotationY}°</label>
            <input type="range" min="-180" max="180" bind:value={rotationY} />
          </div>
          <div class="slider-group">
            <label>Z Rotation: {rotationZ}°</label>
            <input type="range" min="-180" max="180" bind:value={rotationZ} />
          </div>
        </div>

        <div class="lighting-controls">
          <h2>Lighting</h2>
          <label>
            <input type="checkbox" bind:checked={naturalLighting} />
            Natural Lighting
          </label>
        </div>

        <div class="image-controls">
          <h2>Screen Images</h2>
          <div
            class="dropzone"
            on:drop={handleDrop}
            on:dragover={handleDragOver}
          >
            Drag & Drop Images Here
          </div>

          {#if uploadedImages.length > 0}
            <div class="image-navigation">
              <button on:click={prevImage}>Previous</button>
              <span>{currentImageIndex + 1} of {uploadedImages.length}</span>
              <button on:click={nextImage}>Next</button>
              <button class="remove-btn" on:click={removeCurrentImage}>Remove</button>
            </div>
          {/if}
        </div>

        <button class="export-btn" on:click={exportImage}>Export as PNG</button>
      {/if}
    </div>

    <div class="preview-container" bind:this={container}>
      <canvas bind:this={canvas}></canvas>
    </div>
  </div>

  <style>
    .app-container {
      display: flex;
      height: 100vh;
      width: 100%;
    }

    .controls-sidebar {
      width: 300px;
      padding: 20px;
      background-color: #f5f5f5;
      overflow-y: auto;
    }

    h1 {
      font-size: 1.5rem;
      margin-bottom: 20px;
    }

    h2 {
      font-size: 1.2rem;
      margin: 15px 0 10px;
    }

    .preview-container {
      flex: 1;
      position: relative;
      background-color: transparent;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    .slider-group {
      margin-bottom: 10px;
    }

    input[type="range"] {
      width: 100%;
    }

    .dropzone {
      border: 2px dashed #aaa;
      border-radius: 5px;
      padding: 30px 10px;
      text-align: center;
      margin: 10px 0;
      cursor: pointer;
    }

    .image-navigation {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 10px 0;
    }

    .export-btn {
      background-color: #4CAF50;
      color: white;
      padding: 10px 15px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      width: 100%;
      margin-top: 20px;
    }

    .export-btn:hover {
      background-color: #45a049;
    }

    .loading, .error {
      padding: 20px;
      text-align: center;
    }

    .error {
      color: red;
    }

    button {
      padding: 5px 10px;
      background-color: #ddd;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }

    button:hover {
      background-color: #ccc;
    }

    .remove-btn {
      background-color: #f44336;
      color: white;
    }

    .remove-btn:hover {
      background-color: #d32f2f;
    }
  </style>