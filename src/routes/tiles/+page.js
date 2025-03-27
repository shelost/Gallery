// Disable server-side rendering entirely for this route
// This prevents 500 errors when the server tries to render Three.js/Threlte components
export const ssr = false;

// Optionally, you can also preload data here if needed
// export function load() { ... }