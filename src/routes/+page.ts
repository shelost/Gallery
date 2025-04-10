import type { PageLoad } from './$types';

// We don't need to load posts here since they're loaded in the layout
export const load: PageLoad = async ({ parent }) => {
	// Get the data from the parent (layout)
	const { posts } = await parent();

	// Simply return the posts that were loaded in the layout
	return { posts };
};
