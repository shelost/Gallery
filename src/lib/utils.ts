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

	switch (val.toLowerCase()) {
		case 'design':
			return 'Design'
		case 'games':
			return 'Games'
		default:
			return null

	}

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
		case 'html':
			return 'logo-html'
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

// Viewport Animation Action
export function viewportAnimate(node: HTMLElement, options: {
	y?: number;
	x?: number;
	scale?: number;
	duration?: number;
	delay?: number;
	threshold?: number;
	easing?: string;
	once?: boolean;
	rootMargin?: string;
} = {}) {
	const {
		y = 50,
		x = 0,
		scale = 1,
		duration = 600,
		delay = 0,
		threshold = 0.01, // Much more sensitive - triggers when just 1% is visible
		easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
		once = true,
		rootMargin = '100px 0px' // Triggers 100px before element enters viewport
	} = options;

	let hasAnimated = false;
	let animationFrameId: number;

	// Set initial state with better performance
	node.style.opacity = '0';
	node.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale === 1 ? 0.96 : scale})`;
	node.style.transition = `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`;
	node.style.willChange = 'opacity, transform';
	node.style.backfaceVisibility = 'hidden'; // Better performance on mobile

	const animate = () => {
		node.style.opacity = '1';
		node.style.transform = 'translate3d(0px, 0px, 0) scale(1)';

		// Clean up will-change after animation for better performance
		setTimeout(() => {
			node.style.willChange = 'auto';
			node.style.backfaceVisibility = 'visible';
		}, duration + 50);
	};

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && (!once || !hasAnimated)) {
					hasAnimated = true;

					if (delay > 0) {
						setTimeout(() => {
							animationFrameId = requestAnimationFrame(animate);
						}, delay);
					} else {
						animationFrameId = requestAnimationFrame(animate);
					}

					// Disconnect observer after animation if once is true
					if (once) {
						observer.disconnect();
					}
				} else if (!entry.isIntersecting && !once && hasAnimated) {
					// Reset animation if once is false and element leaves viewport
					if (animationFrameId) {
						cancelAnimationFrame(animationFrameId);
					}
					node.style.opacity = '0';
					node.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale === 1 ? 0.96 : scale})`;
					hasAnimated = false;
				}
			});
		},
		{
			threshold,
			rootMargin
		}
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		},
		update(newOptions: typeof options) {
			// Handle option updates
			const updatedOptions = { ...options, ...newOptions };
			// You could re-initialize with new options here if needed
		}
	};
}