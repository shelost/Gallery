<script lang="ts">
	import { T, useFrame, useThrelte } from '@threlte/core';
	import { RoundedBoxGeometry, interactivity } from '@threlte/extras';
	import * as THREE from 'three';
	import { spring } from 'svelte/motion';

	export let position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
	export let scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);
	export let rotationY = 0; // Add rotation prop
	export let visible = true; // Control visibility for smooth transitions

	const cardDepth = 0.05; // Subtle depth for the slab
	const cardRadius = 0.05; // Rounded corners radius (adjust based on scale)
	const cardBevelSegments = 4; // Smoothness of corners

	let mesh: THREE.Mesh<RoundedBoxGeometry, THREE.MeshStandardMaterial>;

	// Spring animation for hover effect
	const hoverScale = spring(1, { stiffness: 0.1, damping: 0.5 });
	const hoverRotationX = spring(0, { stiffness: 0.1, damping: 0.5 });
	const hoverRotationY = spring(rotationY, { stiffness: 0.1, damping: 0.5 }); // Use initial rotation

	const handlePointerEnter = () => {
		hoverScale.set(1.03);
        hoverRotationX.set(-0.05); // Slight tilt up
		document.body.style.cursor = 'pointer';
	};

	const handlePointerLeave = () => {
		hoverScale.set(1);
        hoverRotationX.set(0);
        hoverRotationY.set(rotationY); // Return to base rotation (including mouse follow)
		document.body.style.cursor = 'auto';
	};

	// Subtle reaction to global mouse movement
	const { size } = useThrelte();
	let mouseX = 0;
	let mouseY = 0;

	if (typeof window !== 'undefined') {
		window.addEventListener('mousemove', (event) => {
			mouseX = (event.clientX / window.innerWidth) * 2 - 1;
			mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
		});
	}

	useFrame(() => {
		if (!mesh || !visible) return;

		// Apply global mouse follow rotation (subtle)
		const targetRotX = hoverRotationX.get() + mouseY * 0.02; // Reduced effect
		const targetRotY = hoverRotationY.get() + mouseX * 0.04; // Reduced effect

        // Interpolate rotation smoothly
        mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.1;
        mesh.rotation.y += (targetRotY - mesh.rotation.y) * 0.1;

		// Apply hover scale
		mesh.scale.set($hoverScale, $hoverScale, $hoverScale);

        // Apply base scale prop
        mesh.scale.multiply(scale);

        // Ensure position updates reactively
        if (!mesh.position.equals(position)) {
             mesh.position.lerp(position, 0.2); // Smooth position change
        }
	});

</script>

{#if visible}
	<T.Mesh
		bind:ref={mesh}
		{position}
		castShadow
		{...interactivity()}
		on:pointerenter={handlePointerEnter}
		on:pointerleave={handlePointerLeave}
		rotation.y={rotationY} <!-- Set initial Y rotation -->
	>
		<!-- Use RoundedBoxGeometry -->
		<RoundedBoxGeometry args={[1, 1, cardDepth]} radius={cardRadius} smoothness={cardBevelSegments} />

		<!-- Muji/Apple-esque material: Light gray/silver, slightly metallic -->
		<T.MeshStandardMaterial
			color="#E0E0E0"
			metalness={0.6}
			roughness={0.4}
		/>
	</T.Mesh>
{/if}