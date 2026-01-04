<script>
  import { T } from '@threlte/core';
  import { Text, Float, Billboard } from '@threlte/extras';
  import { goto } from '$app/navigation';

  let { position = [0, 0, 0], color = '#ffffff', label = '', link = '' } = $props();
  
  let hovered = $state(false);
  let pointerDownTime = 0;
  let pointerDownPos = { x: 0, y: 0 };
  const CLICK_THRESHOLD = 200; // ms
  const MOVE_THRESHOLD = 5; // pixels

  const handlePointerDown = (e) => {
    pointerDownTime = Date.now();
    pointerDownPos = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    const timeDiff = Date.now() - pointerDownTime;
    const moveDiff = Math.sqrt(
      Math.pow(e.clientX - pointerDownPos.x, 2) + 
      Math.pow(e.clientY - pointerDownPos.y, 2)
    );

    // Only trigger click if it was quick and didn't move much (not a drag)
    if (timeDiff < CLICK_THRESHOLD && moveDiff < MOVE_THRESHOLD) {
      console.log('Navigating to:', link); // Debug log
      if (link.startsWith('http')) {
        window.location.href = link;
      } else {
        goto(link);
      }
    }
  };
</script>

<T.Group {position}>
  <!-- The Block with Float animation (rotation + vertical float) -->
  <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[0, 0.5]}>
    <T.Mesh
      on:pointerenter={() => (hovered = true)}
      on:pointerleave={() => (hovered = false)}
      on:pointerdown={handlePointerDown}
      on:pointerup={handlePointerUp}
      scale={hovered ? 1.1 : 1}
      castShadow
      receiveShadow
    >
      <T.BoxGeometry args={[1.5, 0.5, 1.5]} />
      <T.MeshStandardMaterial 
        {color} 
        roughness={0.1} 
        metalness={0.2}
        emissive={hovered ? color : '#000000'}
        emissiveIntensity={hovered ? 0.3 : 0}
      />
    </T.Mesh>
  </Float>

  <!-- Text Label - Billboard (floats vertically with block but always faces camera) -->
  <Float speed={2} rotationIntensity={0} floatIntensity={0.5} floatingRange={[0, 0.5]}>
    <Billboard position.y={1.2}>
      <Text
        text={label}
        fontSize={hovered ? 0.55 : 0.5}
        color="#030025"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="white"
      />
    </Billboard>
  </Float>
</T.Group>

