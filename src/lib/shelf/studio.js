import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Soft studio reflections for a scene, from three's built-in room environment.
 * Returns the cleanup.
 * @param {import('three').WebGLRenderer} renderer
 * @param {import('three').Scene} scene
 * @param {number} intensity
 */
export function studio(renderer, scene, intensity) {
	const pmrem = new PMREMGenerator(renderer);
	const room = new RoomEnvironment();
	const environment = pmrem.fromScene(room, 0.04).texture;
	room.dispose();
	scene.environment = environment;
	scene.environmentIntensity = intensity;
	return () => {
		scene.environment = null;
		environment.dispose();
		pmrem.dispose();
	};
}
