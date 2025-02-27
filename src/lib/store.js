import { writable } from 'svelte/store'

export const expandedPost = writable(null)
export const showPreview = writable(false)
export const showHeader = writable(true)
export const hoverCard = writable(false)
export const themeColor = writable('f0f0f0');

export const activeImage = writable(null)

// export const screen = { w: 900}