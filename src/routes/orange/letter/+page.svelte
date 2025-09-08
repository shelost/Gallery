<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
  import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let cardMesh: THREE.Mesh;
  let textMeshes: THREE.Mesh[] = [];
  let rayMeshes: THREE.Mesh[] = [];
  let mouseX = 0;
  let mouseY = 0;
  let targetRotation = { x: 0, y: 0 };
  let mousePosition = new THREE.Vector3();
  const dummy = new THREE.Object3D();

  const textContent = [
    "Orange is built on a simple idea: who you are is found",
    "in what you do. Not in the boxes you check, but in the",
    "choices you make when the stakes are real.",
    "",
    "We believe personality isn’t a static label. It’s a",
    "living system, an unfolding story.",
    "",
    "This is not a personality test. It is a series of small",
    "worlds, simulations designed to be played.",
    "",
    "The result is not a score, but a reflection. A new way to",
    "see the judgment, creativity and taste that makes you,",
    "you."
  ];

  async function createTextMeshes(font: any) {
    const textMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      roughness: 0,
      metalness: 0.0
    });
    
    const meshes: THREE.Mesh[] = [];
    let yPosition = 1.0; // Start position for text (adjusted)
    const lineHeight = 0.2; // Space between lines (adjusted)
    
    textContent.forEach((line) => {
      if (line.trim() === '') {
        yPosition -= lineHeight; // Add space for empty lines
        return;
      }
      
      const textGeometry = new TextGeometry(line, {
        font: font,
        size: 0.1, // Smaller text size for better fit
        depth: 0.01, // Slightly more depth for visibility
        curveSegments: 12,
        bevelEnabled: false
      });
      
      // Center the text horizontally
      textGeometry.computeBoundingBox();
      if (textGeometry.boundingBox) {
        const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
        textGeometry.translate(-textWidth / 2, yPosition, 0.5); // Final Z-offset
      } else {
        textGeometry.translate(0, yPosition, 0.06); // Final Z-offset
      }
      
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.castShadow = true;
      meshes.push(textMesh);
      
      yPosition -= lineHeight;
    });
    
    return meshes;
  }

  function initializeRays() {
    const gridSize = 25;
    const spacing = 1.2;
    const rayGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
    rayGeometry.rotateX(Math.PI / 2); // Align with Z-axis

    const rayMaterial = new THREE.MeshBasicMaterial({
      color: 0xF97316
    });

    const centralClearanceRadius = 4;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i - gridSize / 2) * spacing;
        const y = (j - gridSize / 2) * spacing;

        if (Math.sqrt(x * x + y * y) < centralClearanceRadius) {
          continue;
        }

        const ray = new THREE.Mesh(rayGeometry, rayMaterial);
        ray.position.set(x, y, -5);
        ray.receiveShadow = true;
        
        scene.add(ray);
        rayMeshes.push(ray);
      }
    }
  }

  function createRoundedRectShape(width: number, height: number, radius: number) {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;

    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    return shape;
  }


  onMount(() => {
    let onMouseMove: (event: MouseEvent) => void;
    let onWindowResize: () => void;

    const init = async () => {
      // Initialize scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000); // Light yellow-orange background

      // Initialize camera
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;

      // Initialize renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace; // Correct color space for white
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.VSMShadowMap; // Better support for blur and radius
      container.appendChild(renderer.domElement);

      // Add a background plane to receive shadows
      const planeGeometry = new THREE.PlaneGeometry(50, 50);
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFF5E6,
        side: THREE.DoubleSide
      });
      const backgroundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
      backgroundPlane.position.z = -6;
      backgroundPlane.receiveShadow = false; // Basic material does not receive shadows
      scene.add(backgroundPlane);

      // Add a shadow-only plane for enhanced shadow effects
      const shadowMaterial = new THREE.ShadowMaterial({ 
        color: 0x000000, 
        opacity: 0.35, // Increased opacity for a more pronounced shadow
        side: THREE.DoubleSide
      });
      const shadowPlane = new THREE.Mesh(planeGeometry.clone(), shadowMaterial);
      shadowPlane.position.z = -5.9; // Slightly in front of background plane
      shadowPlane.receiveShadow = true;
      scene.add(shadowPlane);

      initializeRays();

      // Load font and create card with text
      const fontLoader = new FontLoader();
      
      try {
        // Load Lora font from static directory
        const font = await new Promise((resolve, reject) => {
          fontLoader.load(
            '/Lora_Regular.json',
            resolve,
            undefined,
            reject
          );
        });
        
        // Create card background
        const roundedRectShape = createRoundedRectShape(5, 4, 0.1);
        const extrudeSettings = {
            steps: 2,
            depth: 0.1,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelOffset: 0,
            bevelSegments: 8
        };
        
        const geometry = new THREE.ExtrudeGeometry(roundedRectShape, extrudeSettings);
        
        const cardMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff, // Ensure card color is pure white
          roughness: 0.4,
          metalness: 0.1,
        });

        cardMesh = new THREE.Mesh(geometry, cardMaterial);
        cardMesh.castShadow = true;
        scene.add(cardMesh);
        
        // Create text meshes
        textMeshes = await createTextMeshes(font);
        textMeshes.forEach(mesh => {
          cardMesh.add(mesh); // Add text as children of the card
        });
      } catch (error) {
        console.error('Failed to load font:', error);
        
        // Try alternative font URL as fallback
        try {
          const fallbackFont = await new Promise((resolve, reject) => {
            fontLoader.load(
              'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
              resolve,
              undefined,
              reject
            );
          });
          
          // Create card with fallback font
          const roundedRectShape = createRoundedRectShape(6, 4.5, 0.2);
          const extrudeSettings = {
              steps: 2,
              depth: 0.1,
              bevelEnabled: true,
              bevelThickness: 0.05,
              bevelSize: 0.05,
              bevelOffset: 0,
              bevelSegments: 8
          };
          
          const geometry = new THREE.ExtrudeGeometry(roundedRectShape, extrudeSettings);
          const cardMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, // Ensure card color is pure white
            roughness: 0.4,
            metalness: 0.1,
          });

          cardMesh = new THREE.Mesh(geometry, cardMaterial);
          cardMesh.castShadow = true;
          scene.add(cardMesh);
          
          // Create text with fallback font
          textMeshes = await createTextMeshes(fallbackFont);
          textMeshes.forEach((mesh) => {
            cardMesh.add(mesh);
          });
          
        } catch (fallbackError) {
          console.error('Fallback font also failed:', fallbackError);
          // Final fallback: just create card without text
          const roundedRectShape = createRoundedRectShape(6, 4.5, 0.2);
          const extrudeSettings = {
              steps: 2,
              depth: 0.1,
              bevelEnabled: true,
              bevelThickness: 0.05,
              bevelSize: 0.05,
              bevelOffset: 0,
              bevelSegments: 8
          };
          
          const geometry = new THREE.ExtrudeGeometry(roundedRectShape, extrudeSettings);
          const cardMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, // Ensure card color is pure white
            roughness: 0.4,
            metalness: 0.1,
          });

          cardMesh = new THREE.Mesh(geometry, cardMaterial);
          cardMesh.castShadow = true;
          scene.add(cardMesh);
        }
      }
      
      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 2.0); // Increased intensity
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0); // Increased intensity
      directionalLight.castShadow = true;
      directionalLight.position.set(4, 8, 15); // Moved light further away for a larger shadow
      scene.add(directionalLight);
      
      // Reduce shadow map size for softer, more blurred shadows
      directionalLight.shadow.mapSize.width = 256; // Further reduced for more blur
      directionalLight.shadow.mapSize.height = 256; // Further reduced for more blur
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
      // Larger shadow camera frustum for bigger shadow area
      directionalLight.shadow.camera.left = -30;
      directionalLight.shadow.camera.right = 30;
      directionalLight.shadow.camera.top = 30;
      directionalLight.shadow.camera.bottom = -30;
      directionalLight.shadow.radius = 20; // Increased radius for softer edges
      directionalLight.shadow.blurSamples = 30; // Increased blur samples

      // Add a second shadow-casting light for more diffuse shadow effect
      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight2.castShadow = true;
      directionalLight2.position.set(-4, 10, 15); // Moved light further away
      scene.add(directionalLight2);
      
      // Configure second light's shadow for additional softness
      directionalLight2.shadow.mapSize.width = 128; // Further reduced for more blur
      directionalLight2.shadow.mapSize.height = 128; // Further reduced for more blur
      directionalLight2.shadow.camera.near = 0.5;
      directionalLight2.shadow.camera.far = 50;
      directionalLight2.shadow.camera.left = -25;
      directionalLight2.shadow.camera.right = 25;
      directionalLight2.shadow.camera.top = 25;
      directionalLight2.shadow.camera.bottom = -25;
      directionalLight2.shadow.radius = 15; // Increased radius
      directionalLight2.shadow.blurSamples = 20; // Increased blur samples

      // Add fill light (no shadows)
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
      fillLight.position.set(-8, -8, 8);
      scene.add(fillLight);

      // Handle mouse movement
      onMouseMove = (event: MouseEvent) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      };

      window.addEventListener('mousemove', onMouseMove);

      // Handle window resize
      onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('resize', onWindowResize);
      
      animate();
    };

    init();

    // Cleanup
    return () => {
      if (onMouseMove) window.removeEventListener('mousemove', onMouseMove);
      if (onWindowResize) window.removeEventListener('resize', onWindowResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  });

  const animate = () => {
    requestAnimationFrame(animate);

    if (camera) {
      const vector = new THREE.Vector3(mouseX, mouseY, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = (-5 - camera.position.z) / dir.z;
      mousePosition.copy(camera.position).add(dir.multiplyScalar(distance));
    }

    if (cardMesh) {
      targetRotation.y = mouseX * 0.5;
      targetRotation.x = mouseY * 0.3;
      
      cardMesh.rotation.y += (targetRotation.y - cardMesh.rotation.y) * 0.05;
      cardMesh.rotation.x += (targetRotation.x - cardMesh.rotation.x) * 0.05;
    }

    rayMeshes.forEach(ray => {
      dummy.position.copy(ray.position);
      dummy.lookAt(mousePosition);
      ray.quaternion.slerp(dummy.quaternion, 0.03);
    });

    renderer.render(scene, camera);
  };
</script>

<div class="scene-container" bind:this={container}></div>

<style>
  .scene-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  .scene-container :global(canvas) {
    display: block;
  }
</style>
