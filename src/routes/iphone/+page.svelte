<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

  let container;
  let camera, scene, renderer, controls;
  let iPhoneGroup, screenMesh;
  let fileInput;
  let imagePreview = null;
  let isDragging = false;
  let isLoading = true;
  let loadingProgress = 0;

  onMount(() => {
    init();
    animate();

    // Cleanup on component unmount
    return () => {
      if (renderer) {
        renderer.dispose();
      }
      if (controls) {
        controls.dispose();
      }
      window.removeEventListener('resize', onWindowResize);
    };
  });

  function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f7);

    // Camera setup
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 500);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Controls setup
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 200;
    controls.maxDistance = 800;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    // Create the iPhone model
    createiPhone();

    // Handle window resizing
    window.addEventListener('resize', onWindowResize);
  }

  function createiPhone() {
    iPhoneGroup = new THREE.Group();
    scene.add(iPhoneGroup);

    // iPhone dimensions (approximate iPhone 14 Pro)
    const width = 71.5;
    const height = 147.5;
    const depth = 7.85;
    const screenWidth = 67;
    const screenHeight = 143;
    const borderRadius = 12;
    const notchWidth = 25;
    const notchHeight = 10;

    // Create the phone body
    const bodyGeometry = createRoundedRectangle(width, height, depth, borderRadius);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      specular: 0x111111,
      shininess: 30
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    iPhoneGroup.add(bodyMesh);

    // Create the phone screen
    const screenGeometry = new THREE.PlaneGeometry(screenWidth, screenHeight);
    const defaultTexture = new THREE.TextureLoader().load('/placeholder.png', () => {
      loadingProgress = 100;
      isLoading = false;
    },
    (xhr) => {
      loadingProgress = Math.round((xhr.loaded / xhr.total) * 100);
    });

    const screenMaterial = new THREE.MeshBasicMaterial({
      map: defaultTexture,
      color: 0xffffff
    });

    screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
    screenMesh.position.z = depth / 2 + 0.01; // Slightly in front of the body
    iPhoneGroup.add(screenMesh);

    // Create camera notch
    const notchGeometry = new THREE.BoxGeometry(notchWidth, notchHeight, 2);
    const notchMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000
    });
    const notchMesh = new THREE.Mesh(notchGeometry, notchMaterial);
    notchMesh.position.y = height / 2 - notchHeight / 2 - 2;
    notchMesh.position.z = depth / 2 + 1;
    iPhoneGroup.add(notchMesh);

    // Rotate the phone slightly to show it's 3D
    iPhoneGroup.rotation.y = -Math.PI / 12;
    iPhoneGroup.rotation.x = Math.PI / 24;
  }

  // Helper function to create a rounded rectangle geometry
  function createRoundedRectangle(width, height, depth, radius) {
    const shape = new THREE.Shape();

    const x = -width / 2;
    const y = -height / 2;

    shape.moveTo(x, y + radius);
    shape.lineTo(x, y + height - radius);
    shape.quadraticCurveTo(x, y + height, x + radius, y + height);
    shape.lineTo(x + width - radius, y + height);
    shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
    shape.lineTo(x + width, y + radius);
    shape.quadraticCurveTo(x + width, y, x + width - radius, y);
    shape.lineTo(x + radius, y);
    shape.quadraticCurveTo(x, y, x, y + radius);

    const extrudeSettings = {
      depth: depth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0,
      bevelThickness: 1
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.match('image.*')) {
      loadImage(file);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    isDragging = false;

    if (event.dataTransfer.items) {
      const item = event.dataTransfer.items[0];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file.type.match('image.*')) {
          loadImage(file);
        }
      }
    } else if (event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type.match('image.*')) {
        loadImage(file);
      }
    }
  }

  function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview = e.target.result;
      updateScreenTexture(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  function updateScreenTexture(imageUrl) {
    isLoading = true;
    loadingProgress = 0;

    // Load the new texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      imageUrl,
      (texture) => {
        // Update the screen material with the new texture
        screenMesh.material.map = texture;
        screenMesh.material.needsUpdate = true;
        isLoading = false;
      },
      (xhr) => {
        loadingProgress = Math.round((xhr.loaded / xhr.total) * 100);
      },
      (error) => {
        console.error('An error occurred loading the texture', error);
        isLoading = false;
      }
    );
  }

  function handleDragOver(event) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  function resetCamera() {
    // Reset to initial camera position
    camera.position.set(0, 0, 500);
    camera.lookAt(0, 0, 0);
    controls.reset();
  }
</script>

<svelte:head>
  <title>3D iPhone Image Preview</title>
</svelte:head>

<main>
  <div class="container">
    <h1>Upload an image to see it on a 3D iPhone</h1>

    <div
      class="upload-area"
      class:dragging={isDragging}
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      on:drop={handleDrop}
    >
      <input
        type="file"
        id="file-input"
        accept="image/*"
        on:change={handleFileSelect}
        bind:this={fileInput}
        style="display: none;"
      />
      <button on:click={() => fileInput.click()}>Choose an image</button>
      <p>or drag & drop an image here</p>
    </div>

    <div class="controls">
      <button class="reset-camera" on:click={resetCamera}>Reset Camera</button>
      <p class="instructions">Click and drag to rotate • Scroll to zoom</p>
    </div>

    <div class="preview-container" bind:this={container}>
      {#if isLoading}
        <div class="loading-overlay">
          <div class="loading-spinner"></div>
          <p>Loading... {loadingProgress}%</p>
        </div>
      {/if}
    </div>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f5f5f7;
    overflow-x: hidden;
  }

  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  h1 {
    margin-bottom: 2rem;
    text-align: center;
  }

  .upload-area {
    width: 100%;
    max-width: 500px;
    height: 150px;
    border: 2px dashed #ccc;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-bottom: 1.5rem;
    transition: all 0.3s ease;
  }

  .upload-area.dragging {
    border-color: #007aff;
    background-color: rgba(0, 122, 255, 0.05);
  }

  .upload-area button {
    background-color: #007aff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    margin-bottom: 10px;
    transition: background-color 0.3s ease;
  }

  .upload-area button:hover {
    background-color: #0062cc;
  }

  .upload-area p {
    color: #666;
    margin: 10px 0 0 0;
  }

  .preview-container {
    width: 100%;
    height: 500px;
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(245, 245, 247, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007aff;
    animation: spin 1s linear infinite;
    margin-bottom: 10px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .controls {
    width: 100%;
    max-width: 500px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .reset-camera {
    background-color: #333;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .reset-camera:hover {
    background-color: #555;
  }

  .instructions {
    color: #666;
    font-size: 14px;
    margin: 0;
  }

  @media (max-width: 768px) {
    .preview-container {
      height: 350px;
    }

    .controls {
      flex-direction: column;
      gap: 10px;
    }

    .instructions {
      text-align: center;
    }
  }
</style>