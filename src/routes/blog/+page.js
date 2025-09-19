// This page uses onMount/transitions, so enable client-side rendering
export const csr = true;

// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
export const prerender = true;

// Get the posts data from the parent layout
export async function load({ parent }) {
    const { posts } = await parent();
    return { posts };
}
