<script lang="ts">
    import { onMount } from 'svelte';
    import * as THREE from 'three';

    let container: HTMLDivElement;
    let rows = 30;
    let tileHeight = 1.5;
    let isDraggingScrollbar = false;
    let startDragY = 0;
    let startScrollY = 0;

    onMount(() => {
      // Calculate the total height needed for scrolling
      const pageHeight = rows * tileHeight * 200 + 300;
      document.body.style.height = `${pageHeight}px`;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf8f8f8);

      const camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 5;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      // Create a camera-relative scene for UI elements that stay fixed in view
      const uiScene = new THREE.Scene();

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);

      // Create directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
      directionalLight.castShadow = true;

      // Improve shadow quality and softness
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
      directionalLight.shadow.camera.left = -20;
      directionalLight.shadow.camera.right = 20;
      directionalLight.shadow.camera.top = 20;
      directionalLight.shadow.camera.bottom = -20;

      // Add shadow radius for softer shadows
      directionalLight.shadow.radius = 8;

      // Create a target for the light to ensure consistent direction
      const lightTarget = new THREE.Object3D();
      scene.add(lightTarget);
      directionalLight.target = lightTarget;

      // Position the light at top-right corner relative to camera view
      directionalLight.position.set(4, 4, 5);
      scene.add(directionalLight);

      // Add a vertical plane behind the tiles to catch shadows
      const floorGeometry = new THREE.PlaneGeometry(100, 300);
      const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.25 });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.position.z = -0.06;
      floor.receiveShadow = true;
      scene.add(floor);

      const tiles: THREE.Mesh[] = [];
      const tileGeometry = new THREE.BoxGeometry(1.5, 1, 0.1);
      const tileMaterial = new THREE.MeshStandardMaterial({
        color: 0xfafafa,
        metalness: 0.2,
        roughness: 0.3
      });

      const cols = 3;
      for (let i = 0; i < rows * cols; i++) {
        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.castShadow = true;
        tile.receiveShadow = false;
        const row = Math.floor(i / cols);
        const col = i % cols;
        tile.position.set((col - 1) * 2, (1 - row) * tileHeight, 0);
        scene.add(tile);
        tiles.push(tile);
      }

      // Create custom 3D scrollbar in UI scene with increased visibility
      // Scrollbar track
      const trackHeight = 12;
      const trackWidth = 0.25; // Wider track
      const trackGeometry = new THREE.BoxGeometry(trackWidth, trackHeight, 0.1);
      const trackMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc, // Slightly lighter gray
        metalness: 0.1,
        roughness: 0.3,
        transparent: true,
        opacity: 0.9 // More opaque
      });
      const scrollTrack = new THREE.Mesh(trackGeometry, trackMaterial);
      // Position more prominently on the right side of the screen
      scrollTrack.position.set(3.5, 0, -1); // Moved closer to the camera and more into view
      uiScene.add(scrollTrack);

      // Add a subtle edge highlight to make the track more visible
      const trackEdgeGeometry = new THREE.BoxGeometry(trackWidth + 0.02, trackHeight + 0.02, 0.05);
      const trackEdgeMaterial = new THREE.MeshBasicMaterial({
        color: 0xdddddd,
        transparent: true,
        opacity: 0.5
      });
      const trackEdge = new THREE.Mesh(trackEdgeGeometry, trackEdgeMaterial);
      trackEdge.position.copy(scrollTrack.position);
      trackEdge.position.z -= 0.01;
      uiScene.add(trackEdge);

      // Scrollbar thumb with improved visibility
      // Calculate thumb height based on visible portion of content
      const thumbHeight = Math.max(1.5, trackHeight * (window.innerHeight / pageHeight)); // Minimum height increased
      const thumbWidth = 0.32; // Wider thumb
      const thumbGeometry = new THREE.BoxGeometry(thumbWidth, thumbHeight, 0.15); // Thicker thumb
      const thumbMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666, // Darker gray for better contrast
        metalness: 0.5, // More metallic for shine
        roughness: 0.2, // More reflective
        transparent: true,
        opacity: 1.0 // Fully opaque
      });
      const scrollThumb = new THREE.Mesh(thumbGeometry, thumbMaterial);
      // Position aligned with track but protruding outward slightly
      scrollThumb.position.set(3.5, trackHeight/2 - thumbHeight/2, -0.9);
      uiScene.add(scrollThumb);

      // Add a highlight effect to the thumb for better visibility
      const thumbHighlightGeometry = new THREE.BoxGeometry(thumbWidth * 0.8, thumbHeight * 0.9, 0.02);
      const thumbHighlightMaterial = new THREE.MeshBasicMaterial({
        color: 0x999999,
        transparent: true,
        opacity: 0.7
      });
      const thumbHighlight = new THREE.Mesh(thumbHighlightGeometry, thumbHighlightMaterial);
      thumbHighlight.position.copy(scrollThumb.position);
      thumbHighlight.position.z -= 0.1;
      uiScene.add(thumbHighlight);

      // Add lighting specific to UI scene for better scrollbar visibility
      const uiLight = new THREE.DirectionalLight(0xffffff, 1.5);
      uiLight.position.set(5, 5, 5); // Position for dramatic lighting on scrollbar
      uiScene.add(uiLight);

      const uiAmbient = new THREE.AmbientLight(0xffffff, 0.8);
      uiScene.add(uiAmbient);

      // Raycaster for scrollbar interaction
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      // Scrollbar interaction - mousedown
      renderer.domElement.addEventListener('mousedown', (event) => {
        // Convert mouse coordinates to normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Set up raycaster from camera
        raycaster.setFromCamera(mouse, camera);

        // Check for intersection with scrollbar thumb
        const intersects = raycaster.intersectObject(scrollThumb);
        if (intersects.length > 0) {
          isDraggingScrollbar = true;
          startDragY = event.clientY;
          startScrollY = window.scrollY;
          document.body.style.cursor = 'grabbing';
          event.preventDefault();
        } else {
          // Check if clicked on track
          const trackIntersects = raycaster.intersectObject(scrollTrack);
          if (trackIntersects.length > 0) {
            // Calculate relative position clicked on track
            const relativeY = trackIntersects[0].point.y;
            const scrollRatio = ((trackHeight/2) - relativeY) / trackHeight;

            // Set new scroll position
            window.scrollTo({
              top: scrollRatio * (pageHeight - window.innerHeight),
              behavior: 'smooth'
            });
            event.preventDefault();
          }
        }
      });

      // Scrollbar interaction - mousemove
      renderer.domElement.addEventListener('mousemove', (event) => {
        if (isDraggingScrollbar) {
          const deltaY = event.clientY - startDragY;
          // Convert pixel movement to scroll percentage based on track height
          const trackPixelHeight = trackHeight * (window.innerHeight / camera.position.z / 10);
          const scrollRatio = deltaY / trackPixelHeight;

          // Apply scroll position
          const newScrollY = startScrollY + scrollRatio * (pageHeight - window.innerHeight);
          window.scrollTo({ top: newScrollY });
          event.preventDefault();
        } else {
          // Update cursor when hovering over scrollbar
          mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
          mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObject(scrollThumb);
          if (intersects.length > 0) {
            document.body.style.cursor = 'grab';
          } else {
            const trackIntersects = raycaster.intersectObject(scrollTrack);
            if (trackIntersects.length > 0) {
              document.body.style.cursor = 'pointer';
            } else {
              document.body.style.cursor = 'auto';
            }
          }
        }
      });

      // Scrollbar interaction - mouseup and mouseleave
      const endDrag = () => {
        isDraggingScrollbar = false;
        document.body.style.cursor = 'auto';
      };

      renderer.domElement.addEventListener('mouseup', endDrag);
      renderer.domElement.addEventListener('mouseleave', endDrag);

      const animate = () => {
        requestAnimationFrame(animate);
        const scrollY = window.scrollY;

        // Move camera based on scroll position
        camera.position.y = -scrollY / 200;

        // Update light position to stay consistent with camera position
        // This keeps the light at the same position relative to the camera's view
        directionalLight.position.set(
          camera.position.x + 4,
          camera.position.y + 4,
          camera.position.z
        );

        // Update light target to maintain consistent lighting direction
        lightTarget.position.set(
          camera.position.x,
          camera.position.y,
          camera.position.z - 5
        );

        // Update scrollbar thumb position based on scroll
        const scrollRatio = scrollY / (pageHeight - window.innerHeight);
        const trackUsableHeight = trackHeight - thumbHeight;
        scrollThumb.position.y = (trackHeight/2) - thumbHeight/2 - (scrollRatio * trackUsableHeight);
        // Also update the highlight position
        thumbHighlight.position.y = scrollThumb.position.y;

        // Render both scenes
        renderer.render(scene, camera);
        renderer.autoClear = false;
        renderer.render(uiScene, camera);
        renderer.autoClear = true;
      };

      animate();

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Update scrollbar thumb size on window resize
        const newThumbHeight = Math.max(1.5, trackHeight * (window.innerHeight / pageHeight));
        scrollThumb.geometry.dispose();
        scrollThumb.geometry = new THREE.BoxGeometry(thumbWidth, newThumbHeight, 0.15);

        // Update highlight as well
        thumbHighlight.geometry.dispose();
        thumbHighlight.geometry = new THREE.BoxGeometry(thumbWidth * 0.8, newThumbHeight * 0.9, 0.02);
      };
      window.addEventListener('resize', onResize);

      return () => {
        window.removeEventListener('resize', onResize);
        renderer.domElement.removeEventListener('mousedown', () => {});
        renderer.domElement.removeEventListener('mousemove', () => {});
        renderer.domElement.removeEventListener('mouseup', endDrag);
        renderer.domElement.removeEventListener('mouseleave', endDrag);
        renderer.dispose();
      };
    });
  </script>

  <style lang="scss">
    :global(body) {
      margin: 0;
      overflow-y: scroll;
      scrollbar-width: none; /* Hide Firefox scrollbar */
      -ms-overflow-style: none; /* Hide IE/Edge scrollbar */
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #f8f8f8;
    }

    :global(body::-webkit-scrollbar) {
      display: none; /* Hide Chrome/Safari scrollbar */
    }

    .three-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: -1;
    }

    .content {
      position: relative;
      z-index: 1;
      padding: 4rem;
      max-width: 800px;
      margin: 0 auto;
      color: #333;

      h1 {
        margin-bottom: 2rem;
      }

      p {
        margin-bottom: 2rem;
      }

      .card {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
        margin-bottom: 2rem;
      }
    }
  </style>

  <div class="three-container" bind:this={container}></div>
  <div class="content">
    <h1>Welcome</h1>
    <p>This is a 2.5D skeuomorphic UI built with Three.js and SvelteKit.</p>
  </div>
