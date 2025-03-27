<script lang="ts">
    import { T, useLoader, useFrame } from '@threlte/core';
    import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
    import * as THREE from 'three';
    import { spring } from 'svelte/motion';
    import { interactivity } from '@threlte/extras';

    const svgUrl = '/ahnheewon.svg'; // Path to your SVG file

    const svgData = useLoader(SVGLoader).load(svgUrl);

    const shapes: THREE.Shape[] = [];
    let group: THREE.Group;
    let centerOffset = new THREE.Vector3(); // To center the geometry

    $: if ($svgData) {
        shapes.length = 0; // Clear previous shapes if any
        const paths = $svgData.paths;

        paths.forEach((path) => {
            const pathShapes = SVGLoader.createShapes(path);
            pathShapes.forEach((shape) => {
                shapes.push(shape);
            });
        });

        // Calculate bounding box to center the logo
        const geometryForBounds = new THREE.ShapeGeometry(shapes);
        geometryForBounds.computeBoundingBox();
        if (geometryForBounds.boundingBox) {
            geometryForBounds.boundingBox.getCenter(centerOffset).multiplyScalar(-1);
        }
		geometryForBounds.dispose(); // Clean up temporary geometry
    }

	// Animation states
	const baseColor = new THREE.Color("#FFFFFF"); // White like Apple products
	const hoverColor = new THREE.Color("#AAAAAA"); // Slightly darker on hover
	const currentColor = spring(baseColor, { stiffness: 0.1, damping: 0.7 });
	const scale = spring(1, { stiffness: 0.1, damping: 0.5 });

	const handlePointerEnter = () => {
		currentColor.set(hoverColor);
		scale.set(1.1);
		document.body.style.cursor = 'pointer';
	};

	const handlePointerLeave = () => {
		currentColor.set(baseColor);
		scale.set(1);
		document.body.style.cursor = 'auto';
	};

	// Subtle floating/rotation animation
    useFrame(({ clock }) => {
        if (group) {
			const elapsedTime = clock.getElapsedTime();
            group.rotation.y = Math.sin(elapsedTime * 0.5) * 0.1;
            group.position.y = Math.sin(elapsedTime * 0.7) * 0.05; // Subtle bobbing
			group.scale.set($scale, $scale, $scale);
        }
    });

</script>

{#if shapes.length > 0}
    <T.Group bind:ref={group} position={[centerOffset.x, centerOffset.y, centerOffset.z]} rotation.x={Math.PI * 0.05}>
        {#each shapes as shape}
            <T.Mesh
				castShadow receiveShadow
				{...interactivity()}
				on:pointerenter={handlePointerEnter}
				on:pointerleave={handlePointerLeave}
			>
                <T.ExtrudeGeometry args={[shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }]} />
                <T.MeshStandardMaterial
					color={$currentColor}
					metalness={0.2}
					roughness={0.6}
				/>
            </T.Mesh>
        {/each}
    </T.Group>
{/if}