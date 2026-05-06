<script>
	import { onMount, tick } from 'svelte';
	import NovelBody from '$lib/content/novel.md';

	import NovelMap from '$lib/components/novel/NovelMap.svelte';
	import CharacterSidebar from '$lib/components/novel/CharacterSidebar.svelte';

	const sourceUrl =
		'https://ahnheewon.notion.site/668-Novel-1b67696bef164e83ae68cd3cb095d33b';

	let displayedYear = $state(632);
	let currentLocation = $state('silla');
	let layoutMode = $state('scroll');
	let darkMode = $state(true);
	let autoScrolling = $state(false);
	let autoScrollRaf = $state(0);
	let selectedCharacter = $state(/** @type {string | null} */ (null));
	let novelRoot = $state(/** @type {HTMLElement | null} */ (null));

	function toggleTheme() {
		darkMode = !darkMode;
	}

	function toggleAutoScroll() {
		autoScrolling = !autoScrolling;
		if (autoScrolling) {
			const step = () => {
				window.scrollBy(0, 1.2);
				if (autoScrolling && window.scrollY < document.body.scrollHeight - window.innerHeight) {
					autoScrollRaf = requestAnimationFrame(step);
				} else {
					autoScrolling = false;
				}
			};
			autoScrollRaf = requestAnimationFrame(step);
		} else {
			cancelAnimationFrame(autoScrollRaf);
		}
	}

	// ── TOC state ──
	/** @type {{ id: string, text: string, level: number }[]} */
	let tocItems = $state([]);
	let activeId = $state('');
	let tocOpen = $state(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

	function buildToc(root) {
		const heads = root.querySelectorAll('h1, h2');
		/** @type {{ id: string, text: string, level: number }[]} */
		const items = [];
		let idx = 0;
		for (const el of heads) {
			const text = el.textContent?.trim() || '';
			if (!text) continue;
			const tag = el.tagName.toLowerCase();
			const level = tag === 'h1' ? 1 : 2;
			const id = `toc-${idx++}`;
			el.id = id;
			items.push({ id, text, level });
		}
		tocItems = items;
	}

	function syncActiveFromScroll() {
		if (!tocItems.length) return;
		const line = window.scrollY + window.innerHeight * 0.2;
		let current = tocItems[0]?.id || '';
		for (const item of tocItems) {
			const el = document.getElementById(item.id);
			if (!el) continue;
			const top = el.getBoundingClientRect().top + window.scrollY;
			if (top <= line) current = item.id;
		}
		activeId = current;
	}

	// ── Tooltip state ──
	let tipVisible = $state(false);
	let tipData = $state({ title: '', era: '', kingdom: '', body: '' });
	let tipX = $state(0);
	let tipY = $state(0);
	let tipAbove = $state(true);

	const ANNOTATIONS = [
		{ patterns: ['Sunduk', 'Dukman'], title: 'Queen Sunduk 선덕여왕', era: 'r. 632–647', kingdom: 'Silla', body: 'First female ruler of Silla and 27th monarch. Built Cheomseongdae — the oldest surviving astronomical observatory in East Asia.' },
		{ patterns: ['Chunchu', 'Muyeol'], title: 'Kim Chunchu 김춘추 / King Muyeol 무열왕', era: '604–661', kingdom: 'Silla', body: 'True Bone prince who became king after the Sacred Bone bloodline died out. His daughter Gotaso was killed at Daeya Fortress, giving him a personal vendetta against Baekje.' },
		{ patterns: ['Yushin'], title: 'Kim Yushin 김유신', era: '595–673', kingdom: 'Silla', body: 'Greatest general in Silla history. Leader of the Hwarang. Central figure in all three unification wars.' },
		{ patterns: ['Bidam'], title: 'Bidam 비담', era: '?–647', kingdom: 'Silla', body: 'Rose to High Councillor under Queen Sunduk. Led a rebellion in January 647, claiming "a woman cannot rule." Defeated and executed by Kim Yushin.' },
		{ patterns: ['Alchun'], title: 'Alchun 알천', era: 'fl. 630s–650s', kingdom: 'Silla', body: 'Hwarang leader and later High Councillor. Declined the throne after Jinduk\'s death in favor of Chunchu.' },
		{ patterns: ['Jinduk', 'Seungman'], title: 'Queen Jinduk 진덕여왕', era: 'r. 647–654', kingdom: 'Silla', body: 'Last Sacred Bone monarch. Her death opened the throne to True Bone aristocrats.' },
		{ patterns: ['Munhee'], title: 'Lady Munhee 문희', era: 'fl. 610s–660s', kingdom: 'Silla', body: 'Younger sister of Kim Yushin. Married Kim Chunchu. Mother of Prince Bupmin (later King Munmu).' },
		{ patterns: ['Bupmin', 'Munmu'], title: 'Kim Bupmin / King Munmu 문무왕', era: '626–681', kingdom: 'Silla', body: 'Completed the conquest of Baekje and Goguryeo. Fought the Tang Expulsion War. Buried in the sea off Gyeongju.' },
		{ patterns: ['Gotaso'], title: 'Princess Gotaso 고타소', era: '?–642', kingdom: 'Silla', body: 'Daughter of Chunchu. Killed when Daeya Fortress fell to Baekje in 642.' },
		{ patterns: ['Pumsuk'], title: 'Kim Pumsuk 김품석', era: '?–642', kingdom: 'Silla', body: 'Young nobleman appointed fortress commander due to bone rank. Died defending Daeya after betrayal.' },
		{ patterns: ['Euija', 'Uija'], title: 'King Euija 의자왕', era: 'r. 641–660', kingdom: 'Baekje', body: 'Last king of Baekje. Captured at Sabi in 660, deported to Tang China, died in exile.' },
		{ patterns: ['Gyebek'], title: 'Gyebek 계백', era: '?–660', kingdom: 'Baekje', body: 'Baekje\'s most celebrated general. Fought with 5,000 against 50,000 at Hwangsanbul.' },
		{ patterns: ['King Mu'], title: 'King Mu 무왕', era: 'r. 600–641', kingdom: 'Baekje', body: 'Father of Euija. Built the largest Buddhist temple in East Asia.' },
		{ patterns: ['Pung', 'Pungjang'], title: 'Prince Pung 부여풍', era: 'fl. 640s–663', kingdom: 'Baekje', body: 'Son of Euija, sent to Yamato as a hostage. Returned as figurehead of the Baekje Revival. Defeated at Baekgang.' },
		{ patterns: ['Bokshin'], title: 'Gwishil Bokshin 귀실복신', era: '?–663', kingdom: 'Baekje', body: 'Organized the Baekje restoration movement. Murdered by Prince Pung after a power struggle.' },
		{ patterns: ['Gaesomun', 'Commander Yeon', 'Yeon Gesomun', 'Yeon Gaesomun'], title: 'Yeon Gaesomun 연개소문', era: '?–666', kingdom: 'Goguryeo', body: 'Military dictator of Goguryeo. Killed King Youngryu in a coup. Repelled Tang Taizong\'s 645 invasion. His three sons destroyed the kingdom after his death.' },
		{ patterns: ['Manchun'], title: 'Yang Manchun 양만춘', era: 'fl. 640s', kingdom: 'Goguryeo', body: 'Commander of Ansi Fortress. Held for 88 days against Taizong\'s siege. Struck the emperor\'s eye with an arrow.' },
		{ patterns: ['Namseng'], title: 'Yeon Namseng 연남생', era: '634–679', kingdom: 'Goguryeo', body: 'Eldest son of Yeon Gaesomun. Defected to Tang and guided the invasion that destroyed Goguryeo.' },
		{ patterns: ['Namgun'], title: 'Yeon Namgun 연남건', era: '?–after 668', kingdom: 'Goguryeo', body: 'Second son. Led the final defense of Pyongyang. Captured and deported to Tang China.' },
		{ patterns: ['Namsan'], title: 'Yeon Namsan 연남산', era: '?–after 668', kingdom: 'Goguryeo', body: 'Youngest son. Surrendered separately to Tang forces.' },
		{ patterns: ['Youngryu'], title: 'King Youngryu 영류왕', era: 'r. 618–642', kingdom: 'Goguryeo', body: 'Pursued peace with Tang. Murdered by Yeon Gaesomun in the 642 coup.' },
		{ patterns: ['Bojang'], title: 'King Bojang 보장왕', era: 'r. 642–668', kingdom: 'Goguryeo', body: 'Last king of Goguryeo, installed as a puppet by Yeon Gaesomun.' },
		{ patterns: ['Taizong'], title: 'Emperor Taizong 唐太宗', era: '598–649', kingdom: 'Tang', body: 'Second Tang emperor. Personally led the 645 invasion of Goguryeo — one of his rare failures.' },
		{ patterns: ['Gaozong'], title: 'Emperor Gaozong 唐高宗', era: '628–683', kingdom: 'Tang', body: 'Under his reign, Tang conquered Baekje (660) and Goguryeo (668).' },
		{ patterns: ['Su Dingfang'], title: 'Su Dingfang 蘇定方', era: '591–667', kingdom: 'Tang', body: 'The "Red Dragon." Led the naval invasion that destroyed Baekje in 660.' },
		{ patterns: ['Li Shiji'], title: 'Li Shiji 李勣', era: '594–669', kingdom: 'Tang', body: 'Commanded the final Tang army that besieged Pyongyang in 668.' },
		{ patterns: ['Consort Wu', 'Wu'], title: 'Wu Zetian 武則天', era: '624–705', kingdom: 'Tang', body: 'Would become the only woman in Chinese history to formally rule as emperor.' },
		{ patterns: ['Saimei'], title: 'Empress Saimei 斉明天皇', era: '594–661', kingdom: 'Yamato', body: 'Personally led an expedition to support the Baekje restoration. Died before the fleet reached Korea.' },
		{ patterns: ['Tenji', 'Naka-no-Ōe'], title: 'Emperor Tenji 天智天皇', era: '626–672', kingdom: 'Yamato', body: 'Continued the Baekje support campaign after his mother Saimei died. Defeated at Baekgang.' },
		{ patterns: ['Bone Rank', '골품제'], title: 'Bone Rank System 골품제', era: 'Silla institution', kingdom: 'Silla', body: 'Rigid hereditary caste system. Sacred Bone could rule; True Bone could hold office but not the throne.' },
		{ patterns: ['8 Great Clans', 'Great Clans', '대성팔족'], title: 'Eight Great Clans 대성팔족', era: 'Baekje institution', kingdom: 'Baekje', body: 'Eight aristocratic families who held real power in Baekje. The king ruled only to the extent the clans permitted.' },
		{ patterns: ['Hwarang'], title: 'Hwarang 화랑', era: 'Silla institution', kingdom: 'Silla', body: '"Flower Knights" — elite youth corps combining military training with Buddhist education.' },
		{ patterns: ['Harmony Council', '화백회의'], title: 'Harmony Council 화백회의', era: 'Silla institution', kingdom: 'Silla', body: 'Supreme deliberative council. All decisions required unanimity.' },
		{ patterns: ['Ansi'], title: 'Ansi Fortress 안시성', era: 'Goguryeo fortress', kingdom: 'Goguryeo', body: 'Site of the famous 88-day siege in 645 against Emperor Taizong.' },
		{ patterns: ['Daeya'], title: 'Daeya Fortress 대야성', era: 'Silla fortress', kingdom: 'Silla', body: 'Fell to Baekje in 642 after internal betrayal. Princess Gotaso died here.' },
		{ patterns: ['Hwangsanbul'], title: 'Battle of Hwangsanbul 황산벌', era: 'August 660', kingdom: 'Baekje', body: 'Gyebek\'s 5,000 vs. Yushin\'s 50,000. The final battle of Baekje.' },
		{ patterns: ['Baekgang'], title: 'Battle of Baekgang 백강', era: 'August 663', kingdom: 'Tang', body: 'Tang-Silla fleet destroyed 400+ Yamato ships. China, Korea, and Japan met as enemies for the first time.' },
		{ patterns: ['Pyongyang'], title: 'Pyongyang 평양', era: 'Goguryeo capital', kingdom: 'Goguryeo', body: 'Capital of Goguryeo from 427 AD. Fell to Tang-Silla in October 668.' },
		{ patterns: ['Cheomseongdae'], title: 'Cheomseongdae 첨성대', era: 'c. 633 AD', kingdom: 'Silla', body: 'Oldest surviving observatory in East Asia. Built during Queen Sunduk\'s reign.' },
		{ patterns: ['Seven-Branched Sword', '칠지도'], title: 'Seven-Branched Sword 칠지도', era: 'c. 369 AD', kingdom: 'Baekje', body: 'Iron sword bestowed by Baekje to the King of Wa (Japan). Currently in Nara.' },
		{ patterns: ['Gwanggaeto'], title: 'King Gwanggaeto 광개토대왕', era: 'r. 391–413', kingdom: 'Goguryeo', body: 'Goguryeo\'s greatest conqueror. Expanded from Manchuria to the Han River basin.' },
		{ patterns: ['Eulji Munduk'], title: 'Eulji Munduk 을지문덕', era: 'fl. 612', kingdom: 'Goguryeo', body: 'Destroyed the Sui invasion at the Battle of Salsu. Fewer than 2,700 Sui soldiers survived.' },
	];

	const KINGDOM_COLORS = {
		Silla: '#6b5ce7',
		Baekje: '#d4564e',
		Goguryeo: '#2e86ab',
		Tang: '#c9a227',
		Yamato: '#e07b53',
	};

	function matchAnnotation(text) {
		const cleaned = text.replace(/[\(\)\d\s,.*]+$/g, '').replace(/^[👑🌸🌼🟣🟡🟢🹀㊁㊂㊃㊄⚔️]+\s*/g, '').trim();
		for (const a of ANNOTATIONS) {
			for (const p of a.patterns) {
				if (cleaned === p || cleaned.endsWith(p) || cleaned.startsWith(p) || cleaned.includes(p)) {
					return a;
				}
			}
		}
		return null;
	}

	function positionTooltip(el) {
		const rect = el.getBoundingClientRect();
		const above = rect.top > 240;
		tipX = Math.min(Math.max(rect.left + rect.width / 2, 160), window.innerWidth - 160);
		tipY = above ? rect.top - 8 : rect.bottom + 8;
		tipAbove = above;
	}

	function showTip(el, annotation) {
		tipData = annotation;
		positionTooltip(el);
		tipVisible = true;
	}

	function hideTip() {
		tipVisible = false;
	}

	// ── Year ticker ──
	function parseHeadingYear(text) {
		const t = text.trim();
		if (/Unified Silla/i.test(t) || /King of Samhan/i.test(t)) return 669;
		const part = t.match(/Part\s+([IVX]+)/i);
		if (part) {
			const p = part[1].toUpperCase();
			if (p === 'I') return 632;
			if (p === 'II') return 645;
			if (p === 'III') return 658;
		}
		const yearLine = t.match(/^(\d{3,4})(?:[-–](\d+))?(?:\s|:)/);
		if (yearLine) return parseInt(yearLine[1], 10);
		return null;
	}

	function syncYearFromScroll() {
		if (typeof window === 'undefined') return;
		const root = novelRoot ?? document.querySelector('.novel__body');
		if (!root) return;
		const heads = root.querySelectorAll('h1, h2, h3');
		if (!heads.length) return;

		const line = window.scrollY + window.innerHeight * 0.14;
		let y = 632;
		let last = 632;

		for (const el of heads) {
			const parsed = parseHeadingYear(el.textContent || '');
			if (parsed != null) last = parsed;
			const top = el.getBoundingClientRect().top + window.scrollY;
			if (top <= line) y = last;
		}
		displayedYear = y;
	}

	function parseLocationFromText(text) {
		const t = text.toLowerCase();
		if (t.includes('baekgang') || t.includes('geum river') || t.includes('mouth of the geum')) return 'baekgang';
		if (t.includes('hwangsanbul') || (t.includes('nonsan') && !t.includes('silla'))) return 'hwangsanbul';
		if (t.includes('battle of sabi') || (t.includes('sabi') && t.includes('capital'))) return 'sabi';
		if (t.includes('ansi') && (t.includes('fortress') || t.includes('siege'))) return 'ansi';
		if (t.includes('battle of ansi')) return 'ansi';
		if (t.includes('daeya') && (t.includes('fortress') || t.includes('battle'))) return 'daeya';
		if (t.includes('mt. jupil') || t.includes('mount jupil') || t.includes('mt jupil') || t.includes('liao')) return 'mt_jupil';
		if (t.includes('sasu river') || t.includes('battle of sasu')) return 'sasu';
		if (t.includes('salsu') || t.includes('cheongcheon')) return 'salsu';
		if (t.includes('gwanggaeto') && t.includes('stele')) return 'stele';
		if (t.includes('pyongyang') || t.includes('fall of pyongyang')) return 'pyongyang';
		if (t.includes('yamato japan') || (t.includes('yamato') && !t.includes('baekje'))) return 'yamato';
		if (t.includes('tang china') || t.includes("chang'an") || t.includes('changan')) return 'tang';
		if (t.includes('tang') && t.includes('goguryeo')) return 'goguryeo';
		if (t.includes('goguryeo')) return 'goguryeo';
		if (t.includes('baekje')) return 'baekje';
		if (t.includes('silla')) return 'silla';
		return null;
	}

	function syncLocationFromScroll() {
		if (typeof window === 'undefined') return;
		const root = novelRoot ?? document.querySelector('.novel__body');
		if (!root) return;

		const ps = root.querySelectorAll('p, h3');
		const line = window.scrollY + window.innerHeight * 0.3;
		let loc = 'silla';

		for (const el of ps) {
			const top = el.getBoundingClientRect().top + window.scrollY;
			if (top > line) break;
			const text = el.textContent || '';
			const parsed = parseLocationFromText(text);
			if (parsed) loc = parsed;
		}

		currentLocation = loc;
	}

	// ── Movie mode: highlight nearest paragraph ──
	function syncMovieHighlight() {
		if (layoutMode !== 'movie') return;
		const root = novelRoot ?? document.querySelector('.novel__body');
		if (!root) return;

		const blocks = root.querySelectorAll('p, blockquote');
		const center = window.innerHeight / 2;

		let closest = null;
		let closestDist = Infinity;

		for (const el of blocks) {
			const rect = el.getBoundingClientRect();
			const mid = rect.top + rect.height / 2;
			const dist = Math.abs(mid - center);
			if (dist < closestDist) {
				closestDist = dist;
				closest = el;
			}
		}

		for (const el of blocks) {
			el.classList.toggle('novel-highlight', el === closest);
		}
	}

	onMount(async () => {
		await tick();

		const root0 = novelRoot ?? document.querySelector('.novel__body');
		if (root0) buildToc(root0);

		requestAnimationFrame(() => {
			syncYearFromScroll();
			syncActiveFromScroll();
			syncLocationFromScroll();
		});

		const onScroll = () => {
			syncYearFromScroll();
			syncActiveFromScroll();
			syncLocationFromScroll();
			syncMovieHighlight();
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);

		let ro, mo;
		const root = novelRoot ?? document.querySelector('.novel__body');

		if (root) {
			ro = new ResizeObserver(() => syncYearFromScroll());
			ro.observe(root);
			mo = new MutationObserver(() => requestAnimationFrame(syncYearFromScroll));
			mo.observe(root, { childList: true, subtree: true });

			// ── Tooltip wiring ──
			const strongs = root.querySelectorAll('strong');
			for (const el of strongs) {
				const text = el.textContent || '';
				const ann = matchAnnotation(text);
				if (ann) {
					el.classList.add('has-info');
					el.dataset.tipKey = ann.title;
				}
			}

			// ── Character image injection on h2 headings ──
			const heroImages = [
				'/samhan/x1.png', '/samhan/x2.png', '/samhan/x3.png', '/samhan/x4.png', '/samhan/x5.png',
				'/samhan/x6.png', '/samhan/x7.png', '/samhan/x8.png', '/samhan/x9.png', '/samhan/x10.png',
			];

			const h2s = root.querySelectorAll('h2');
			let heroIdx = 0;
			for (const h2 of h2s) {
				if (heroIdx >= heroImages.length) break;
				const text = h2.textContent?.trim() || '';
				if (/^epilogue$/i.test(text)) continue;

				const wrapper = document.createElement('div');
				wrapper.className = 'novel-section-hero';

				const imgEl = document.createElement('img');
				imgEl.src = heroImages[heroIdx];
				imgEl.alt = text;
				imgEl.className = 'novel-section-hero__img';
				imgEl.loading = 'lazy';

				h2.parentNode.insertBefore(wrapper, h2);
				wrapper.appendChild(imgEl);
				wrapper.appendChild(h2);

				heroIdx++;
			}

			// ── Character portrait injection on dialogue blockquotes ──
			const CHARACTER_AVATARS = {
				'Munhee': '/samhan/x1.png',
				'Chunchu': '/samhan/x2.png',
				'Yushin': '/samhan/x3.png',
				'Dukman': '/samhan/x1.png',
				'Bidam': '/samhan/x4.png',
				'Gyebek': '/samhan/x5.png',
				'Commander Yeon': '/samhan/x6.png',
				'Yeon Gaesomun': '/samhan/x6.png',
				'Yeon Gesomun': '/samhan/x6.png',
				'Commander Yang': '/samhan/x7.png',
				'Yang Manchun': '/samhan/x7.png',
				'Commander Lee': '/samhan/x6.png',
				'Yeon Namseng': '/samhan/x8.png',
				'Yeon Namgun': '/samhan/x8.png',
				'Yeon Namsan': '/samhan/x8.png',
				'King Euija': '/samhan/x5.png',
				'Emperor Taizong': '/samhan/x9.png',
				'Consort Wu': '/samhan/x9.png',
				'Emperor Gaozong': '/samhan/x9.png',
				'Empress Saimei': '/samhan/x10.png',
				'Su Dingfang': '/samhan/x9.png',
				'Li Shiji': '/samhan/x9.png',
				'Kim Bupmin': '/samhan/x2.png',
				'Alchun': '/samhan/x3.png',
				'Sunduk': '/samhan/x1.png',
				'Pumsuk': '/samhan/x3.png',
			};

			const blockquotes = root.querySelectorAll('blockquote');
			for (const bq of blockquotes) {
				const strongs = bq.querySelectorAll('strong');
				let foundCharacter = null;
				for (const s of strongs) {
					const txt = (s.textContent || '').replace(/^-\s*/, '').trim();
					if (CHARACTER_AVATARS[txt]) {
						foundCharacter = txt;
						break;
					}
				}
				if (foundCharacter && !bq.querySelector('.novel-dialogue-avatar')) {
					const avatar = document.createElement('img');
					avatar.src = CHARACTER_AVATARS[foundCharacter];
					avatar.alt = foundCharacter;
					avatar.className = 'novel-dialogue-avatar';
					avatar.loading = 'lazy';
					bq.style.position = 'relative';
					bq.appendChild(avatar);
				}
			}

			root.addEventListener('pointerenter', (e) => {
				const target = /** @type {HTMLElement} */ (e.target)?.closest?.('.has-info');
				if (!target) return;
				const ann = ANNOTATIONS.find((a) => a.title === target.dataset.tipKey);
				if (ann) showTip(target, ann);
			}, true);

			root.addEventListener('pointerleave', (e) => {
				const target = /** @type {HTMLElement} */ (e.target)?.closest?.('.has-info');
				if (target) hideTip();
			}, true);

			root.addEventListener('click', (e) => {
				const target = /** @type {HTMLElement} */ (e.target)?.closest?.('.has-info');
				if (!target) return;
				e.preventDefault();
				hideTip();
				const key = target.dataset.tipKey || '';
				const charKeys = ['Sunduk', 'Chunchu', 'Yushin', 'Gaesomun', 'Gyebek', 'Euija', 'Manchun', 'Bidam'];
				for (const ck of charKeys) {
					if (key.includes(ck)) {
						selectedCharacter = ck;
						return;
					}
				}
			}, true);
		}

		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			ro?.disconnect();
			mo?.disconnect();
		};
	});
</script>

<svelte:head>
	<title>668 Novel — Heewon</title>
	<meta
		name="description"
		content="668 Novel — Three Kingdoms of Korea (632–668), full draft."
	/>
</svelte:head>

<div class="novel-page" class:novel-page--light={!darkMode}>
	<div class="novel-sidebar">
		<div class="novel-mode-switcher">
			<button
				class="novel-mode-btn"
				class:novel-mode-btn--active={layoutMode === 'scroll'}
				onclick={() => (layoutMode = 'scroll')}
			>Scroll</button>
			<button
				class="novel-mode-btn"
				class:novel-mode-btn--active={layoutMode === 'script'}
				onclick={() => (layoutMode = 'script')}
			>Script</button>
			<button
				class="novel-mode-btn"
				class:novel-mode-btn--active={layoutMode === 'movie'}
				onclick={() => (layoutMode = 'movie')}
			>Movie</button>
		</div>

		<button
			class="novel-toc-toggle"
			class:novel-toc-toggle--open={tocOpen}
			onclick={() => (tocOpen = !tocOpen)}
			aria-label="Toggle table of contents"
		>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
				<rect x="1" y="2" width="14" height="1.5" rx="0.75" fill="currentColor"/>
				<rect x="1" y="7.25" width="10" height="1.5" rx="0.75" fill="currentColor"/>
				<rect x="1" y="12.5" width="14" height="1.5" rx="0.75" fill="currentColor"/>
			</svg>
		</button>

		{#if tocOpen}
			<nav class="novel-toc" aria-label="Table of contents">
				<ol class="novel-toc__list">
					{#each tocItems as item}
						<li
							class="novel-toc__item"
							class:novel-toc__item--h1={item.level === 1}
							class:novel-toc__item--h2={item.level === 2}
							class:novel-toc__item--active={item.id === activeId}
						>
							<a
								href="#{item.id}"
								onclick={(e) => {
									e.preventDefault();
									document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
									tocOpen = false;
								}}
							>
								{item.text}
							</a>
						</li>
					{/each}
				</ol>
			</nav>
		{/if}
	</div>

	{#if tipVisible}
		<div
			class="novel-tip"
			class:novel-tip--above={tipAbove}
			class:novel-tip--below={!tipAbove}
			style="left:{tipX}px; top:{tipY}px;"
		>
			<div class="novel-tip__inner">
				<span
					class="novel-tip__kingdom"
					style="background:{KINGDOM_COLORS[tipData.kingdom] || '#666'};"
				>
					{tipData.kingdom}
				</span>
				<p class="novel-tip__title">{tipData.title}</p>
				<p class="novel-tip__era">{tipData.era}</p>
				<p class="novel-tip__body">{tipData.body}</p>
			</div>
		</div>
	{/if}

	{#if layoutMode !== 'script'}
		<NovelMap location={currentLocation} year={displayedYear} />
	{/if}

	<article
		class="novel"
		class:novel--script={layoutMode === 'script'}
		class:novel--movie={layoutMode === 'movie'}
	>
		<header class="novel__header">
			<img src="/samhan.png" alt="668 Novel Cover" class="novel__cover" />
		</header>

		<div class="novel__body" bind:this={novelRoot}>
			<NovelBody />
		</div>
	</article>

	<button
		class="novel-theme-toggle"
		onclick={toggleTheme}
		aria-label="Toggle light/dark mode"
	>
		{darkMode ? '☀' : '☽'}
	</button>

	{#if layoutMode === 'movie'}
		<div class="novel-player">
			<button class="novel-player__play" onclick={toggleAutoScroll} aria-label={autoScrolling ? 'Pause auto-scroll' : 'Play auto-scroll'}>
				{autoScrolling ? '⏸' : '▶'}
			</button>
			<span class="novel-player__track">Samhan OST</span>
			<div class="novel-player__bar">
				<div class="novel-player__progress"></div>
			</div>
		</div>
	{/if}

	<CharacterSidebar character={selectedCharacter} onclose={() => selectedCharacter = null} />
</div>

<style lang="scss">
	@import './novel.scss';
</style>
