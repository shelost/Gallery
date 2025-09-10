<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

  let containerEl;
  let renderer;
  let scene;
  let camera;
  let controls;
  let iPhoneModel;
  let isLoading = true;
  let loadingProgress = 0;

  // Screen texture setup
  let canvasTexture;
  let screenMaterial;

  // Camera interaction setup
  let raycaster;
  let mouse;
  let isTransitioning = false;
  let isInSideView = false;
  let originalCameraPosition;
  let originalControlsTarget;
  let originalPhoneRotation;
  let originalPhonePosition;
  const transitionSpeed = 0.04; // Smooth transition speed

  onMount(() => {
    initThreeJS();
    // We will now call loadScreenTexture *after* the model is loaded.
    loadiPhoneModel();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    return () => {
      // Cleanup
      if (renderer) renderer.dispose();
      if (scene) scene.clear();
      window.removeEventListener('resize', onWindowResize);
      if (renderer && renderer.domElement) {
        renderer.domElement.removeEventListener('click', onPhoneClick, false);
      }
    };
  });

  function initThreeJS() {
    // Setup scene with light gray background for better contrast
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa);

    // Setup camera with wider field of view for full scene view
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(8, 12, 8); // Initial position - will be adjusted after model loads

    // Setup renderer for full screen
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerEl.appendChild(renderer.domElement);

    // Setup lighting system
    setupLighting();

    // Create the white table
    createTable();

    // Setup orbit controls for smooth interaction
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 3;
    controls.maxDistance = 25; // Allow more zoom out for the wider scene
    // Remove polar angle restriction to allow viewing from all angles
    controls.target.set(0, 0, 0); // Initial target - will be adjusted after model loads
    controls.update();

    // Setup screen texture
    canvasTexture = new THREE.Texture();
    canvasTexture.colorSpace = THREE.SRGBColorSpace;

    // CRITICAL: Create initial canvas with content (just like the working version)
    createInitialScreenTexture();

    screenMaterial = new THREE.MeshBasicMaterial({
      map: canvasTexture,
      color: 0xffffff,
      side: THREE.FrontSide
    });

    // Initialize interaction components
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Add click event listener for iPhone interaction
    renderer.domElement.addEventListener('click', onPhoneClick, false);

    // Start animation loop
    animate();
  }

  function setupLighting() {
    // Ambient light for overall soft illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Main directional light positioned above for natural lighting
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight1.position.set(6, 15, 6);
    directionalLight1.castShadow = true;
    directionalLight1.shadow.mapSize.width = 2048;
    directionalLight1.shadow.mapSize.height = 2048;
    directionalLight1.shadow.camera.near = 1;
    directionalLight1.shadow.camera.far = 50;
    directionalLight1.shadow.camera.left = -15;
    directionalLight1.shadow.camera.right = 15;
    directionalLight1.shadow.camera.top = 15;
    directionalLight1.shadow.camera.bottom = -15;
    directionalLight1.shadow.bias = -0.0001;
    scene.add(directionalLight1);

    // Fill light from opposite side for better balance
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-8, 8, -8);
    scene.add(directionalLight2);

    // Top light for glossy table reflections
    const topLight = new THREE.DirectionalLight(0xffffff, 0.3);
    topLight.position.set(0, 20, 0);
    scene.add(topLight);

    // Subtle rim light for iPhone definition
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
    rimLight.position.set(0, 5, -12);
    scene.add(rimLight);
  }

  function createInitialScreenTexture() {
    // Create initial canvas with dark background (just like the working version)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match iPhone aspect ratio (19.5:9)
    canvas.width = 1170;
    canvas.height = Math.round(canvas.width * (19.5/9));

    // Fill with dark background (like iPhone lock screen)
    ctx.fillStyle = '#202020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // CRITICAL: Assign the canvas to the texture immediately
    canvasTexture.image = canvas;
    canvasTexture.needsUpdate = true;
    canvasTexture.colorSpace = THREE.SRGBColorSpace;

    console.log("Initial screen texture created with canvas");
  }

  function createTable() {
    // Create a circular, smaller, taller light orange glossy table
    const tableRadius = 5; // Smaller radius for a more intimate setting
    const tableHeight = 0.5; // Taller/thicker table depth
    const tableGeometry = new THREE.CylinderGeometry(tableRadius, tableRadius, tableHeight, 64);
    
    const tableMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFC296, // Light orange color (Light Salmon)
      roughness: 0.5, // Low roughness for glossy finish
      metalness: 0.1, // Slight metalness for reflective properties
    });
    
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = -tableHeight / 2; // Position so top surface is at y=0
    table.receiveShadow = true; // Allow shadows to be cast on the table
    table.castShadow = true; // Table can cast shadows too
    table.name = 'table';
    scene.add(table);

    // Add a subtle decorative base ring for more elegance
    const baseRingGeometry = new THREE.CylinderGeometry(tableRadius + 0.1, tableRadius + 0.1, 0.05, 64);
    const baseRingMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff9966, // Slightly darker orange for the base
      roughness: 0.15,
      metalness: 0.15
    });
    const baseRing = new THREE.Mesh(baseRingGeometry, baseRingMaterial);
    baseRing.position.y = -tableHeight + 0.025; // Position at bottom of table
    baseRing.receiveShadow = true;
    baseRing.castShadow = true;
    scene.add(baseRing);
  }

  function loadScreenTexture() {
    console.log("Loading screen texture from /iphone-2.png");
    const img = new Image();
    
    img.onload = () => {
      console.log("Image loaded successfully, applying to screen texture");
      updateScreenTexture(img);
    };
    
    img.onerror = (err) => {
      console.error("Error loading screen texture '/iphone-2.png'. Falling back to default dark screen.", err);
      createDarkScreenTexture(); // Fallback to dark screen
    };
    
    img.src = '/iphone-2.png'; // Path for files in 'static' folder
  }

  function updateScreenTexture(img) {
    // Create a canvas to draw the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match iPhone aspect ratio (19.5:9)
    canvas.width = 1170;
    canvas.height = Math.round(canvas.width * (19.5/9)); // Approximately 2535

    // Fill with white background first
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate scale factors for cover mode (fill entire screen)
    const coverScale = Math.max(
      canvas.width / img.width,
      canvas.height / img.height
    );

    const scaledWidth = img.width * coverScale;
    const scaledHeight = img.height * coverScale;
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;

    console.log(`Updating screen texture: image=${img.width}x${img.height}, scaled=${scaledWidth}x${scaledHeight}, cover mode`);

    // Draw the image on the canvas according to calculated dimensions
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

    // Update the existing canvas texture - this affects all materials that use this texture
    canvasTexture.image = canvas;
    canvasTexture.needsUpdate = true;
    canvasTexture.colorSpace = THREE.SRGBColorSpace;

    console.log("Screen texture updated successfully");
  }

  function createDarkScreenTexture() {
    // Create a canvas with a default dark screen
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match iPhone aspect ratio (19.5:9)
    canvas.width = 1170;
    canvas.height = Math.round(canvas.width * (19.5/9));

    // Fill with dark background (like iPhone lock screen)
    ctx.fillStyle = '#1c1c1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add a subtle gradient for more realism
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#2c2c2e');
    gradient.addColorStop(1, '#1c1c1e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update the texture
    canvasTexture.image = canvas;
    canvasTexture.needsUpdate = true;
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
  }

  function loadiPhoneModel() {
    console.log("Loading iPhone 16 model...");
    const loader = new GLTFLoader();

    loader.load(
      '/3d/iphone_16.glb',
      (gltf) => {
        console.log("iPhone model loaded successfully");
        iPhoneModel = gltf.scene;

        // Scale and position the iPhone on the table - laying it horizontally
        iPhoneModel.scale.set(0.4, 0.4, 0.4);
        iPhoneModel.position.set(0, 0.2, 0); // Just above the table surface
        iPhoneModel.rotation.x = -Math.PI / 2; // Rotate to lay flat on the table
        iPhoneModel.rotation.z = Math.PI * 0.1; // Slight rotation for better composition
        iPhoneModel.castShadow = true;
        iPhoneModel.receiveShadow = true;

        // Enable shadows on all meshes
        iPhoneModel.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;

            if (node.name && (
              node.name.toLowerCase().includes('screen') ||
              node.name.toLowerCase().includes('display') ||
              node.name.toLowerCase().includes('glass') ||
              node.name.toLowerCase().includes('lcd')
            )) {
              console.log("Applying screen material to:", node.name);
              
              // Fix UVs for proper screen texture display (ESSENTIAL for canvas textures)
              if (node.geometry && node.geometry.attributes && node.geometry.attributes.uv) {
                console.log("Fixing UVs for iPhone screen");
                const uvAttribute = node.geometry.attributes.uv;
                const uvs = uvAttribute.array;
                const newUvs = new Float32Array(uvs.length);

                // Flip and adjust UVs
                for (let i = 0; i < uvs.length; i += 2) {
                  newUvs[i] = uvs[i]; // Keep U coordinate
                  newUvs[i + 1] = 1 - uvs[i + 1]; // Flip V coordinate
                }

                uvAttribute.array = newUvs;
                uvAttribute.needsUpdate = true;
                console.log("Applied UV fixes: vertical flip");
              }

              node.material = screenMaterial;
            }
          }
        });

        scene.add(iPhoneModel);
        isLoading = false;

        // CRITICAL FIX: Load the screen texture *after* the model is fully loaded and in the scene.
        // A small timeout ensures the model is rendered before texture update.
        setTimeout(() => {
            loadScreenTexture();
        }, 100);

        // Calculate optimal camera position to frame the entire iPhone with lots of space
        const boundingBox = new THREE.Box3().setFromObject(iPhoneModel);
        const size = boundingBox.getSize(new THREE.Vector3());
        const center = boundingBox.getCenter(new THREE.Vector3());
        
        // Get the maximum dimension for proper framing
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        
        // Multiply by a large factor to show lots of space around the iPhone
        cameraDistance *= 1.5; // Much more space around the phone
        
        // Position camera above and at an angle for optimal view of the horizontal iPhone
        camera.position.set(cameraDistance * 0.7, cameraDistance * 0.8, cameraDistance * 0.7);
        
        // Target the center of the iPhone (which is now laying flat)
        controls.target.copy(center);
        controls.update();

        console.log("iPhone model setup complete");
      },
      (progressEvent) => {
        if (progressEvent.lengthComputable) {
          loadingProgress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        }
      },
      (error) => {
        console.error("Error loading iPhone model:", error);
        isLoading = false;
      }
    );
  }

  // Handle iPhone click interaction
  function onPhoneClick(event) {
    if (isTransitioning) return;

    // If we're in side view, return to original view on any click
    if (isInSideView) {
      console.log("Returning to original view...");
      returnToOriginalView();
      return;
    }

    // Only check for iPhone intersection if not in side view
    if (!iPhoneModel) return;

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObject(iPhoneModel, true);

    if (intersects.length > 0) {
      console.log("iPhone clicked! Starting camera transition to side view...");
      startCameraTransition();
    }
  }

  // Start smooth camera transition to side view
  function startCameraTransition() {
    if (isTransitioning) return;

    // Store original camera position, target, iPhone rotation and position for potential reset
    originalCameraPosition = camera.position.clone();
    originalControlsTarget = controls.target.clone();
    if (iPhoneModel) {
      originalPhoneRotation = {
        x: iPhoneModel.rotation.x,
        y: iPhoneModel.rotation.y,
        z: iPhoneModel.rotation.z
      };
      originalPhonePosition = {
        x: iPhoneModel.position.x,
        y: iPhoneModel.position.y,
        z: iPhoneModel.position.z
      };
    }

    isTransitioning = true;
    
    // Disable orbit controls during transition
    controls.enabled = false;
  }

  // Return to the original camera view
  function returnToOriginalView() {
    if (isTransitioning || !originalCameraPosition) return;
    
    isTransitioning = true;
    controls.enabled = false;
  }

  // Get target positions for side view of the table (maintaining same distance)
  function getSideViewTargets() {
    // Calculate current distance from camera to scene center
    const sceneCenter = new THREE.Vector3(0, 0, 0);
    const currentDistance = originalCameraPosition.distanceTo(sceneCenter);
    
    // Position camera to the side at the same distance, focusing on the elevated iPhone
    const targetCameraPosition = new THREE.Vector3(
      currentDistance * 0.866, // X position (cos(30°) for angled side view)
      1.2, // Raised camera height slightly to see both phone and table
      currentDistance * 0.4 // Z position (sin(30°) for angled side view)
    );
    
    // Look at the elevated iPhone position
    const targetLookAt = new THREE.Vector3(0, 2.5, 0); // Focus between table and iPhone
    
    return { camera: targetCameraPosition, target: targetLookAt };
  }
  
  // Get target position and rotation for iPhone when activated
  function getPhoneTargetTransform(forSideView = false) {
    if (!iPhoneModel || !originalPhoneRotation) {
      return null;
    }
    
    if (!forSideView) {
      // Return to original horizontal position on table
      return {
        position: { x: 0, y: 0.1, z: 0 }, // Original position on table
        rotation: originalPhoneRotation
      };
    }
    
    // For side view: lift iPhone up and make it vertical facing the camera
    const sideViewTargets = getSideViewTargets();
    const elevatedPhonePosition = new THREE.Vector3(0, 1, 0); // Elevated iPhone position
    const cameraDirection = new THREE.Vector3()
      .subVectors(sideViewTargets.camera, elevatedPhonePosition)
      .normalize();
    
    // Calculate the Y rotation to face the camera (now that iPhone is vertical)
    const targetYRotation = Math.atan2(cameraDirection.x, cameraDirection.z);
    
    return {
      position: { 
        x: 0, 
        y: 4, // Lift iPhone up to float above table
        z: 0 
      },
      rotation: {
        x: 0, // Make iPhone vertical (no X rotation)
        y: targetYRotation, // Face the camera
        z: 0  // Keep Z rotation neutral
      }
    };
  }

  function animate() {
    requestAnimationFrame(animate);
    
    // Handle camera and iPhone transition animation
    if (isTransitioning && iPhoneModel) {
      let cameraTargets;
      let phoneTargetTransform;
      
      if (isInSideView) {
        // Transitioning back to original view
        cameraTargets = {
          camera: originalCameraPosition,
          target: originalControlsTarget
        };
        phoneTargetTransform = getPhoneTargetTransform(false);
      } else {
        // Transitioning to side view
        cameraTargets = getSideViewTargets();
        phoneTargetTransform = getPhoneTargetTransform(true);
      }
      
      // Smooth interpolation of camera position and target
      camera.position.lerp(cameraTargets.camera, transitionSpeed);
      controls.target.lerp(cameraTargets.target, transitionSpeed);
      
      // Smooth interpolation of iPhone position and rotation
      if (phoneTargetTransform) {
        // Animate position
        iPhoneModel.position.x += (phoneTargetTransform.position.x - iPhoneModel.position.x) * transitionSpeed;
        iPhoneModel.position.y += (phoneTargetTransform.position.y - iPhoneModel.position.y) * transitionSpeed;
        iPhoneModel.position.z += (phoneTargetTransform.position.z - iPhoneModel.position.z) * transitionSpeed;
        
        // Animate rotation
        iPhoneModel.rotation.x += (phoneTargetTransform.rotation.x - iPhoneModel.rotation.x) * transitionSpeed;
        iPhoneModel.rotation.y += (phoneTargetTransform.rotation.y - iPhoneModel.rotation.y) * transitionSpeed;
        iPhoneModel.rotation.z += (phoneTargetTransform.rotation.z - iPhoneModel.rotation.z) * transitionSpeed;
      }
      
      // Check if transition is complete
      const cameraDistance = camera.position.distanceTo(cameraTargets.camera);
      const targetDistance = controls.target.distanceTo(cameraTargets.target);
      
      // Also check iPhone position and rotation completion
      let transformComplete = true;
      if (phoneTargetTransform) {
        const posXDiff = Math.abs(phoneTargetTransform.position.x - iPhoneModel.position.x);
        const posYDiff = Math.abs(phoneTargetTransform.position.y - iPhoneModel.position.y);
        const posZDiff = Math.abs(phoneTargetTransform.position.z - iPhoneModel.position.z);
        const rotXDiff = Math.abs(phoneTargetTransform.rotation.x - iPhoneModel.rotation.x);
        const rotYDiff = Math.abs(phoneTargetTransform.rotation.y - iPhoneModel.rotation.y);
        const rotZDiff = Math.abs(phoneTargetTransform.rotation.z - iPhoneModel.rotation.z);
        
        transformComplete = (posXDiff < 0.01 && posYDiff < 0.01 && posZDiff < 0.01 && 
                           rotXDiff < 0.01 && rotYDiff < 0.01 && rotZDiff < 0.01);
      }
      
      if (cameraDistance < 0.05 && targetDistance < 0.05 && transformComplete) {
        isTransitioning = false;
        controls.enabled = true; // Re-enable orbit controls
        isInSideView = !isInSideView; // Toggle view state
        
        if (isInSideView) {
          console.log("Camera and iPhone transition to side view complete! iPhone is now floating and vertical. Click anywhere to return.");
          console.log("isInSideView is now:", isInSideView, "- Back button should be visible");
        } else {
          console.log("Camera and iPhone transition back to original view complete! iPhone is back on the table horizontally.");
          console.log("isInSideView is now:", isInSideView, "- Back button should be hidden");
        }
      }
    }
    
    // Update controls
    controls.update();
    
    // Render the scene
    renderer.render(scene, camera);
  }

  function onWindowResize() {
    // Update camera aspect ratio and renderer size
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
</script>

<svelte:head>
  <title>Scene</title>
  <link rel="icon" href="/orange-gradient.png" />
</svelte:head>

<div class="scene-container" bind:this={containerEl}>
  {#if isLoading}
    <div class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Loading iPhone model...</p>
        <div class="progress-bar">
          <div class="progress" style="width: {loadingProgress}%"></div>
        </div>
        <span class="progress-text">{loadingProgress}%</span>
      </div>
    </div>
  {/if}

  <!-- Back button - only visible in activated (side view) state -->
  {#if isInSideView && !isTransitioning}
    <button 
      class="back-button"
      on:click={returnToOriginalView}
      aria-label="Return to default view"
    >
      ← Back
    </button>
  {/if}

</div>

<style lang="scss">
  .scene-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #f8f9fa;

    :global(canvas) {
      display: block;
      outline: none;
      cursor: pointer; /* Indicate the scene is interactive */
    }
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(248, 249, 250, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
  }

  .loading-content {
    text-align: center;
    color: #333;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

    p {
      font-size: 18px;
      margin: 10px 0;
      font-weight: 500;
    }
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e0e0e0;
    border-top: 3px solid #007aff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px auto;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .progress-bar {
    width: 200px;
    height: 6px;
    background: #e0e0e0;
    border-radius: 3px;
    margin: 15px auto 10px auto;
    overflow: hidden;
  }

  .progress {
    height: 100%;
    background: linear-gradient(90deg, #007aff, #5856d6);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 14px;
    color: #666;
    font-weight: 400;
  }

  .back-button {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000; /* Much higher z-index to ensure it's above canvas */
    
    /* Button styling */
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border: none;
    border-radius: 25px;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 500;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    cursor: pointer;
    
    /* Subtle shadow for depth */
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    
    /* Smooth transitions */
    transition: all 0.3s ease;
    
    /* Animation entrance */
    animation: slideUp 0.4s ease-out;

    &:hover {
      background: rgba(0, 0, 0, 0.9);
      transform: translateX(-50%) translateY(-2px);
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
    }

    &:active {
      transform: translateX(-50%) translateY(0px);
      box-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0px);
    }
  }

  /* Responsive design for mobile */
  @media (max-width: 768px) {
    .back-button {
      bottom: 20px;
      padding: 10px 20px;
      font-size: 14px;
    }
  }

  .debug-info {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10001;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;

    p {
      margin: 2px 0;
    }
  }
</style>
