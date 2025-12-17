<script>
  import { T } from '@threlte/core';
  import { Text, Float, Billboard } from '@threlte/extras';
  import { goto } from '$app/navigation';

  export let position = [0, 0, 0];
  export let color = '#ffffff';
  export let label = '';
  export let link = '';
  
  let hovered = false;

  const handleClick = () => {
    if (link.startsWith('http')) {
      window.location.href = link;
    } else {
      goto(link);
    }
  };
</script>

<T.Group {position}>
  <!-- The Block with Float animation (rotation + vertical float) -->
  <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[0, 0.5]}>
    <T.Mesh
      on:pointerenter={() => (hovered = true)}
      on:pointerleave={() => (hovered = false)}
      on:click={handleClick}
      scale={hovered ? 1.1 : 1}
      castShadow
      receiveShadow
    >
      <T.BoxGeometry args={[1.5, 0.5, 1.5]} />
      <T.MeshStandardMaterial {color} roughness={0.1} metalness={0.2} />
    </T.Mesh>
  </Float>

  <!-- Text Label - Billboard (floats vertically with block but always faces camera) -->
  <Float speed={2} rotationIntensity={0} floatIntensity={0.5} floatingRange={[0, 0.5]}>
    <Billboard position.y={1.2}>
      <Text
        text={label}
        fontSize={0.5}
        color="#030025"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="white"
      />
    </Billboard>
  </Float>
</T.Group>

