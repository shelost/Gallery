type DateStyle = Intl.DateTimeFormatOptions['dateStyle']

export function formatDate(date: string, dateStyle: DateStyle = 'medium', locales = 'en') {
	const formatter = new Intl.DateTimeFormat(locales, { dateStyle })
	return formatter.format(new Date(date))
}

export function formatYear(date) {
	return date.slice(-4);
}

export function hexToRgba(hex, alpha) {
	let r = parseInt(hex.substring(1, 3), 16);
	let g = parseInt(hex.substring(3, 5), 16);
	let b = parseInt(hex.substring(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function titleCase(val) {
	return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function Id(tag) {
	return document.getElementById(tag)
}

export function Class(tag) {
	return document.getElementsByClassName(tag)
}

export function tagType(val) {
	const links = [
		{ text: 'Design', route: '/design', icon: 'palette', color: '#F959FF' },
		{ text: 'Games', route: '/games', icon: 'sports_esports', color: '#6355FF' },
		{ text: 'Blog', route: '/blog', icon: 'article', color: '#FF2E65' },
		{ text: 'Comics', route: '/comics', icon: 'question_answer', color: '#FF7559' },
		{ text: 'Apps', route: '/apps', icon: 'apps', color: '#0C75ED' }
	];
}

export function tagIcon(val) {
	switch (val.toLowerCase()) {
		case 'figma':
			return 'logo-figma'
		case 'js':
			return 'logo-js'
		case 'javascript':
			return 'logo-js'
		case 'sass':
			return 'logo-sass'
		case 'svelte':
			return 'logo-svelte'
		case 'vue':
			return 'logo-vue'
		case 'react':
			return 'logo-react'
		case 'procreate':
			return 'logo-procreate'
		case 'photoshop':
			return 'logo-ps'
		case 'illustrator':
			return 'logo-ai'
		default:
			return null
	}
}