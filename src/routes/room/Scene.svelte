<script>
  import { T } from '@threlte/core';
  import { ContactShadows, OrbitControls, Float, GLTF } from '@threlte/extras';
  import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
  import Item from './Item.svelte';

  // Initialize RectAreaLight uniforms
  RectAreaLightUniformsLib.init();

  const items = [
    { label: 'Stan', link: 'https://www.stan.store', category: 'Experience', color: '#c084fc' },
    { label: 'MARC', link: '/marc', category: 'Research', color: '#60a5fa' },
    { label: 'Arcaide', link: 'https://shelost.github.io/arcaide2', category: 'Research', color: '#38bdf8' },
    { label: 'Platformr', link: '/platformr', category: 'Games', color: '#4ade80' },
    { label: 'Wordchain', link: 'https://shelost.github.io/wordchain', category: 'Games', color: '#86efac' },
    { label: 'Pandemonium', link: '/pandemonium', category: 'Comics', color: '#fb923c' },
    { label: 'Kingdom', link: '/kingdom', category: 'Comics', color: '#fbbf24' },
    { label: 'AI Palace', link: '/palace', category: 'Blog', color: '#f87171' },
    { label: 'AI Canvas', link: 'https://www.sketchdreamer.com/canvas', category: 'Random', color: '#fde047' },
  ];

  const radius = 8;
</script>

<!-- Orthographic Camera for Isometric view -->
<T.OrthographicCamera
  makeDefault
  position={[-10, 10, 10]}
  zoom={20}
  near={-50}
  far={200}
  on:create={({ ref }) => {
    ref.lookAt(0, 0, 0);
  }}
>
  <OrbitControls 
    enableZoom={true} 
    enableDamping
    enablePan={false}
    minPolarAngle={Math.atan(1.5)} 
    maxPolarAngle={Math.atan(1.5)}
  />
</T.OrthographicCamera>

<!-- Lighting -->
<T.AmbientLight intensity={1.8} color="#ffffff" />
<T.DirectionalLight position={[-10, 20, 10]} intensity={0.5} color="#ffffff" />
<T.DirectionalLight position={[10, 15, -10]} intensity={0.5} color="#ffffff" />
<T.DirectionalLight position={[0, 20, 0]} intensity={0.4} color="#ffffff" />

<!-- Overhead Diagonal Plane Light -->
<T.RectAreaLight
  width={30}
  height={30}
  intensity={5}
  position={[10, 15, 10]}
  color="#ffffff"
  on:create={({ ref }) => ref.lookAt(0, 0, 0)}
/>

<!-- Central Element: iPhone 16 -->
<Float
  speed={2} 
  rotationIntensity={0.5} 
  floatIntensity={0.8}
  floatingRange={[2.0, 3.0]}
>
  <GLTF url="/3d/iphone_16.glb" scale={1.0} position={[0, 6, 0]} />
</Float>

<!-- Room Platform -->
<T.Group position.y={-0.5}>
  <!-- Floor Surface -->
  <T.Mesh rotation.x={-Math.PI / 2} position.y={0}>
    <T.PlaneGeometry args={[30, 30]} />
    <T.MeshStandardMaterial color="#ffffff" roughness={0.1} metalness={0} emissive="#ffffff" emissiveIntensity={0.1} />
  </T.Mesh>
  
  <!-- Base (Thickness) -->
  <T.Mesh position.y={-0.5}>
    <T.BoxGeometry args={[30, 1, 30]} />
    <T.MeshStandardMaterial color="#ffffff" roughness={0.1} metalness={0} emissive="#ffffff" emissiveIntensity={0.1} />
  </T.Mesh>

  <!-- Walls -->
  <T.Group position.y={0}>
    <!-- Wall 1 (Right X+) -->
    <T.Mesh position={[14.5, 1, 0]}>
        <T.BoxGeometry args={[1, 2, 30]} />
        <T.MeshStandardMaterial color="#ffffff" roughness={0.1} metalness={0} emissive="#ffffff" emissiveIntensity={0.1} />
    </T.Mesh>
    
    <!-- Wall 2 (Left X-) -->
    <T.Mesh position={[-14.5, 1, 0]}>
        <T.BoxGeometry args={[1, 2, 30]} />
        <T.MeshStandardMaterial color="#ffffff" roughness={0.1} metalness={0} emissive="#ffffff" emissiveIntensity={0.1} />
    </T.Mesh>

    <!-- Wall 3 (Back Z-) -->
    <T.Mesh position={[0, 1, -14.5]}>
        <T.BoxGeometry args={[30, 2, 1]} />
        <T.MeshStandardMaterial color="#ffffff" roughness={0.1} metalness={0} emissive="#ffffff" emissiveIntensity={0.1} />
    </T.Mesh>

    <!-- Wall 4 (Front Z+) -->
    <T.Mesh position={[0, 1, 14.5]}>
        <T.BoxGeometry args={[30, 2, 1]} />
        <T.MeshStandardMaterial color="#ffffff" roughness={0.1} metalness={0} emissive="#ffffff" emissiveIntensity={0.1} />
    </T.Mesh>
  </T.Group>

  <ContactShadows scale={30} blur={2} far={2} opacity={0.15} color="#ffffff" position.y={0.02} />
</T.Group>

<!-- Portfolio Items -->
{#each items as item, i}
  {@const angle = (i / items.length) * Math.PI * 2}
  {@const x = Math.cos(angle) * radius}
  {@const z = Math.sin(angle) * radius}
  <Item
    position={[x, 0, z]}
    color={item.color}
    label={item.label}
    link={item.link}
  />
{/each}

