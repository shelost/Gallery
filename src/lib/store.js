import { writable } from 'svelte/store'

export const expandedPost = writable(null)
export const showPreview = writable(false)
export const showHeader = writable(true)

export const hoverCard = writable(false)
export const themeColor = writable('f0f0f0');

export const activeImage = writable(null)
export const activeElem = writable(null)
export const activeObject = writable(null)
export const loading = writable(true)

export const openDrawer = writable(false)

export const Posts = writable([])

export const currentContentCategoryStore = writable(null);
export const animationsEnabled = writable(false)

// export const screen = { w: 900}
