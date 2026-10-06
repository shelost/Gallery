import { redirect } from '@sveltejs/kit';

/** Frames became the home page; old links land there. */
export function load() {
	redirect(308, '/');
}
