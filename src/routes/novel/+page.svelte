<script>
	import { onMount, tick } from 'svelte';
	import NovelBody from '$lib/content/novel.md';
	import NumberFlow from '@number-flow/svelte';

	const sourceUrl =
		'https://ahnheewon.notion.site/668-Novel-1b67696bef164e83ae68cd3cb095d33b';

	let displayedYear = $state(632);
	let novelRoot = $state(/** @type {HTMLElement | null} */ (null));

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
		// ── Silla ──
		{
			patterns: ['Sunduk', 'Dukman'],
			title: 'Queen Sunduk 선덕여왕',
			era: 'r. 632–647',
			kingdom: 'Silla',
			body: 'First female ruler of Silla and 27th monarch. Built Cheomseongdae — the oldest surviving astronomical observatory in East Asia. Commissioned the nine-story pagoda at Hwangnyongsa. Known for diplomatic cunning; her reign saw the first Silla–Tang overtures.',
		},
		{
			patterns: ['Chunchu', 'Muyeol'],
			title: 'Kim Chunchu 김춘추 / King Muyeol 무열왕',
			era: '604–661',
			kingdom: 'Silla',
			body: 'Grandson of the deposed King Jinji. True Bone — technically ineligible under Sacred Bone rules until the bloodline died out. Personally traveled to Goguryeo and Tang China to negotiate alliances. His daughter Gotaso was killed at Daeya Fortress in 642, giving him a personal vendetta against Baekje.',
		},
		{
			patterns: ['Yushin'],
			title: 'Kim Yushin 김유신',
			era: '595–673',
			kingdom: 'Silla',
			body: 'Greatest general in Silla history and descendant of the royal house of Geumgwan Gaya (conquered by Silla in 532). Leader of the Hwarang. His sister Munhee married Chunchu, binding the Kim and Gaya bloodlines. Central figure in all three unification wars. Died aged 78, the most decorated commander of the era.',
		},
		{
			patterns: ['Bidam'],
			title: 'Bidam 비담',
			era: '?–647',
			kingdom: 'Silla',
			body: 'Rose to High Councillor (Sangdaedeung) under Queen Sunduk. Led a rebellion in January 647, claiming "a woman cannot rule." Defeated by Kim Yushin and executed. According to the Samguk Sagi, a large star fell on the night of his uprising — Sunduk died the same month.',
		},
		{
			patterns: ['Alchun'],
			title: 'Alchun 알천',
			era: 'fl. 630s–650s',
			kingdom: 'Silla',
			body: 'Hwarang leader and later High Councillor (Sangdaedeung). Known for his modesty — the Harmony Council reportedly offered him the throne after Jinduk\'s death, but he declined in favor of Chunchu, saying the age demanded a war-king, not a gentleman.',
		},
		{
			patterns: ['Jinduk', 'Seungman'],
			title: 'Queen Jinduk 진덕여왕',
			era: 'r. 647–654',
			kingdom: 'Silla',
			body: 'Second and last female ruler of Silla. Last Sacred Bone (성골) monarch — with her death the bloodline restriction ended, opening the throne to True Bone aristocrats. Her reign formalized the Tang alliance and reformed Silla\'s bureaucracy along Chinese models.',
		},
		{
			patterns: ['Munhee'],
			title: 'Lady Munhee 문희',
			era: 'fl. 610s–660s',
			kingdom: 'Silla',
			body: 'Younger sister of Kim Yushin. Married Kim Chunchu in a match her brother engineered to bind the Gaya-descended Kim clan to the royal house. Mother of Prince Bupmin (later King Munmu) and Prince Inmun.',
		},
		{
			patterns: ['Bupmin', 'Munmu'],
			title: 'Kim Bupmin / King Munmu 문무왕',
			era: '626–681',
			kingdom: 'Silla',
			body: 'Son of Chunchu and Munhee. As King Munmu (r. 661–681), he completed the conquest of Baekje and Goguryeo and then fought the Tang Expulsion War (670–676) to prevent China from annexing the peninsula. His will requested sea burial — the underwater tomb off Gyeongju is a national treasure.',
		},
		{
			patterns: ['Gotaso'],
			title: 'Princess Gotaso 고타소',
			era: '?–642',
			kingdom: 'Silla',
			body: 'Daughter of Chunchu and Munhee, married to the fortress commander Kim Pumsuk. Killed when Daeya Fortress fell to Baekje in 642. Her death became Chunchu\'s personal motive for destroying Baekje — a vendetta that outlasted two decades of diplomacy.',
		},
		{
			patterns: ['Pumsuk'],
			title: 'Kim Pumsuk 김품석',
			era: '?–642',
			kingdom: 'Silla',
			body: 'Young Hwarang nobleman appointed commander of Daeya Fortress despite limited experience — a consequence of Silla\'s bone rank system, which privileged birth over merit. Died defending the fortress after betrayal from within.',
		},
		// ── Baekje ──
		{
			patterns: ['Euija', 'Uija'],
			title: 'King Euija 의자왕',
			era: 'r. 641–660',
			kingdom: 'Baekje',
			body: 'Last king of Baekje. Initially praised as a virtuous "Haedong Jeungja" (the Confucian Paragon of the East Sea). Later became increasingly despotic under pressure from the Eight Great Clans. Captured at Sabi in 660, deported to Tang China, and died in exile — the only Korean king to die on foreign soil.',
		},
		{
			patterns: ['Gyebek'],
			title: 'Gyebek 계백',
			era: '?–660',
			kingdom: 'Baekje',
			body: 'Baekje\'s most celebrated general. Before the Battle of Hwangsanbul, he killed his own family to prevent them being used as hostages — a decision that shocked even his enemies. Fought with 5,000 soldiers against Kim Yushin\'s 50,000, winning four engagements before being overwhelmed and killed.',
		},
		{
			patterns: ['King Mu'],
			title: 'King Mu 무왕',
			era: 'r. 600–641',
			kingdom: 'Baekje',
			body: 'Father of Euija. Built Mireuksa — the largest Buddhist temple complex in East Asia at the time. According to the Samguk Yusa, he married Princess Sunhwa of Silla (a rare cross-kingdom marriage). His reign represented Baekje\'s last golden age.',
		},
		{
			patterns: ['Pung', 'Pungjang'],
			title: 'Prince Pung / Pungjang 부여풍',
			era: 'fl. 640s–663',
			kingdom: 'Baekje',
			body: 'Son of Euija, sent to Yamato Japan as a diplomatic hostage before Baekje\'s fall. Returned in 661 as figurehead king of the Baekje Revival movement. Quarreled fatally with general Bokshin over command authority. Defeated at the Battle of Baekgang in 663; his fate afterward is unknown.',
		},
		{
			patterns: ['Bokshin'],
			title: 'Gwishil Bokshin 귀실복신',
			era: '?–663',
			kingdom: 'Baekje',
			body: 'Baekje general who organized the restoration movement after the kingdom\'s fall in 660. Rallied 200+ fortresses against Tang-Silla occupation. Murdered by Prince Pung after a power struggle — his death shattered the revival movement from within before the Battle of Baekgang.',
		},
		// ── Goguryeo ──
		{
			patterns: ['Gaesomun', 'Commander Yeon', 'Yeon Gesomun', 'Yeon Gaesomun'],
			title: 'Yeon Gaesomun 연개소문',
			era: '?–666',
			kingdom: 'Goguryeo',
			body: 'Military dictator of Goguryeo (Dae Magniji / 대막리지). In 642, killed King Youngryu and over 180 officials in a banquet coup, then installed the puppet King Bojang. Successfully repelled Tang Taizong\'s 645 invasion. Maintained absolute power until his death — after which his three sons destroyed each other and the kingdom.',
		},
		{
			patterns: ['Manchun'],
			title: 'Yang Manchun 양만춘',
			era: 'fl. 640s',
			kingdom: 'Goguryeo',
			body: 'Commander of Ansi Fortress. Held the fortress for 88 days against Emperor Taizong\'s personal siege in 645 — one of the most famous defensive actions in East Asian military history. According to tradition, shot an arrow that struck Taizong in the eye. Taizong reportedly saluted Ansi\'s walls as he retreated.',
		},
		{
			patterns: ['Namseng'],
			title: 'Yeon Namseng 연남생',
			era: '634–679',
			kingdom: 'Goguryeo',
			body: 'Eldest son of Yeon Gaesomun. Inherited the title of Supreme Commander (Dae Magniji) in 666. Ousted by his brothers Namgun and Namsan, he defected to Tang China and personally guided the invasion that destroyed his own kingdom — one of history\'s most consequential acts of fraternal betrayal.',
		},
		{
			patterns: ['Namgun'],
			title: 'Yeon Namgun 연남건',
			era: '?–after 668',
			kingdom: 'Goguryeo',
			body: 'Second son of Yeon Gaesomun. Seized power in Pyongyang after driving out Namseng. Led the final defense of Goguryeo against the Tang-Silla coalition. Captured when Pyongyang fell in 668 and deported to Tang China.',
		},
		{
			patterns: ['Namsan'],
			title: 'Yeon Namsan 연남산',
			era: '?–after 668',
			kingdom: 'Goguryeo',
			body: 'Youngest son of Yeon Gaesomun. Sided with Namgun against Namseng but eventually surrendered to Tang forces separately. Lived out his life in Tang China. His capitulation deprived Goguryeo\'s defense of its last organized southern force.',
		},
		{
			patterns: ['Youngryu'],
			title: 'King Youngryu 영류왕',
			era: 'r. 618–642',
			kingdom: 'Goguryeo',
			body: 'Goguryeo king who pursued peaceful coexistence with Tang — he even demolished the Sui war trophy monument as a goodwill gesture. Murdered by Yeon Gaesomun in the 642 coup, along with over 180 officials. His accommodationist policy was reversed overnight.',
		},
		{
			patterns: ['Bojang'],
			title: 'King Bojang 보장왕',
			era: 'r. 642–668',
			kingdom: 'Goguryeo',
			body: 'Last king of Goguryeo, installed by Yeon Gaesomun as a puppet after the 642 coup. Had no real power for the entire 26 years of his reign. After Pyongyang\'s fall in 668, deported to Tang China where he was given a hollow honorary title.',
		},
		// ── Tang ──
		{
			patterns: ['Taizong'],
			title: 'Emperor Taizong 唐太宗',
			era: '598–649',
			kingdom: 'Tang',
			body: 'Li Shimin. Second Tang emperor and one of the most celebrated rulers in Chinese history. Killed his brothers in the Xuanwu Gate Incident to seize the throne. Personally led the 645 invasion of Goguryeo — one of his rare military failures. Died in 649, obsessed with Korean conquest to the end.',
		},
		{
			patterns: ['Gaozong'],
			title: 'Emperor Gaozong 唐高宗',
			era: '628–683',
			kingdom: 'Tang',
			body: 'Third Tang emperor. Often portrayed as weak and dominated by his consort Wu Zetian. Under his reign, Tang conquered Baekje (660) and Goguryeo (668), achieving what his father could not. Suffered from chronic illness and headaches, gradually ceding power to Empress Wu.',
		},
		{
			patterns: ['Su Dingfang'],
			title: 'Su Dingfang 蘇定方',
			era: '591–667',
			kingdom: 'Tang',
			body: 'Tang general known as the "Red Dragon." Led the naval invasion that destroyed Baekje in 660, crossing the Yellow Sea with 130,000 troops. One of the most prolific conquerors of the Tang era — his campaigns spanned from the Western Turks to the Korean peninsula.',
		},
		{
			patterns: ['Li Shiji'],
			title: 'Li Shiji / Li Ji 李勣',
			era: '594–669',
			kingdom: 'Tang',
			body: 'One of Tang\'s greatest generals, originally named Xu Shiji. Key figure in the final conquest of Goguryeo in 668 — commanded the main Tang army that besieged Pyongyang. Served three Tang emperors across four decades of continuous warfare.',
		},
		{
			patterns: ['Consort Wu', 'Wu'],
			title: 'Wu Zetian 武則天',
			era: '624–705',
			kingdom: 'Tang',
			body: 'Originally a low-ranking concubine of Taizong, then consort and eventually empress regnant under Gaozong. Would become the only woman in Chinese history to formally rule as emperor (r. 690–705). During the Korean wars she was already accumulating influence behind the throne.',
		},
		// ── Yamato ──
		{
			patterns: ['Saimei'],
			title: 'Empress Saimei 斉明天皇',
			era: '594–661',
			kingdom: 'Yamato',
			body: 'Japanese empress who personally led an expedition to support the Baekje restoration — an extraordinary act for a 67-year-old monarch. Died of illness at Asakura Palace in Kyushu before the fleet reached Korea. Her death did not stop the campaign; her son (Emperor Tenji) continued it to its disastrous conclusion at Baekgang.',
		},
		{
			patterns: ['Tenji', 'Naka-no-Ōe'],
			title: 'Emperor Tenji 天智天皇',
			era: '626–672',
			kingdom: 'Yamato',
			body: 'As Prince Naka-no-Ōe, he led the Taika Reform that centralized Japanese government. After his mother Empress Saimei died, he continued the Baekje support campaign. The catastrophic defeat at Baekgang (663) led Japan to fortify its western coast against a Tang invasion that never came — and to withdraw from Korean affairs for centuries.',
		},
		// ── Places ──
		{
			patterns: ['Bone Rank', '골품제'],
			title: 'Bone Rank System 골품제',
			era: 'Silla institution',
			kingdom: 'Silla',
			body: 'Silla\'s rigid hereditary caste system. Sacred Bone (성골): royalty by both parents — eligible for the throne. True Bone (진골): royal by one parent — high offices but originally barred from kingship. Six head ranks below. Determined everything from house size to clothing color to the width of one\'s carriage.',
		},
		{
			patterns: ['8 Great Clans', 'Great Clans', '대성팔족'],
			title: 'Eight Great Clans 대성팔족',
			era: 'Baekje institution',
			kingdom: 'Baekje',
			body: 'The eight aristocratic families who held real power in Baekje: Satek (사택), Hae (해), Jin (진), Guk (국), Mokli (목리), Baek (백), Yunbi (연비), and Hyeop (협). Each controlled government posts, military units, and often one or more royal princes. The king ruled only to the extent the clans permitted.',
		},
		{
			patterns: ['Hwarang'],
			title: 'Hwarang 화랑',
			era: 'Silla institution',
			kingdom: 'Silla',
			body: '"Flower Knights" — Silla\'s elite youth corps. Combined rigorous military training with Buddhist and Confucian education. Governed by five secular commandments including loyalty to the king and never retreating in battle. Produced nearly every major Silla leader of the unification era, including Kim Yushin and Bidam.',
		},
		{
			patterns: ['Harmony Council', '화백회의'],
			title: 'Harmony Council 화백회의',
			era: 'Silla institution',
			kingdom: 'Silla',
			body: 'Silla\'s supreme deliberative council of high-ranking nobles. All decisions required unanimity — a single dissent could block royal policy. Met at sacred outdoor sites. Served as the key aristocratic check on royal power, and the arena where bone rank politics played out.',
		},
		{
			patterns: ['Ansi'],
			title: 'Ansi Fortress 안시성',
			era: 'Goguryeo fortress',
			kingdom: 'Goguryeo',
			body: 'Key Goguryeo fortress in modern Liaoning, China. Site of the famous 88-day siege in 645 where Yang Manchun held against Emperor Taizong\'s personal army of 100,000+. The failed siege forced Tang withdrawal and became a symbol of Goguryeo\'s resistance. Exact location debated among archaeologists.',
		},
		{
			patterns: ['Daeya'],
			title: 'Daeya Fortress 대야성',
			era: 'Silla fortress',
			kingdom: 'Silla',
			body: 'Strategic Silla fortress (modern Hapcheon, South Gyeongsang). Fell to Baekje in 642 after internal betrayal. The death of Princess Gotaso here gave Chunchu his vendetta against Baekje and set the political course for the Tang-Silla alliance.',
		},
		{
			patterns: ['Hwangsanbul'],
			title: 'Battle of Hwangsanbul 황산벌 전투',
			era: 'August 660',
			kingdom: 'Baekje',
			body: 'Final major battle of Baekje, fought on the plains of modern Nonsan. Gyebek\'s 5,000 troops faced Kim Yushin\'s 50,000. Despite winning four initial engagements, Gyebek was overwhelmed and killed. Silla\'s victory opened the road to the Baekje capital at Sabi.',
		},
		{
			patterns: ['Baekgang'],
			title: 'Battle of Baekgang 백강 전투',
			era: 'August 663',
			kingdom: 'Tang',
			body: 'Decisive naval battle at the mouth of the Geum River. A combined Tang-Silla fleet destroyed 400+ Yamato ships supporting the Baekje restoration. First (and for centuries, last) major military confrontation between China and Japan. Ended Baekje\'s revival and Japan\'s involvement in Korean affairs.',
		},
		{
			patterns: ['Pyongyang'],
			title: 'Pyongyang 평양',
			era: 'Goguryeo capital',
			kingdom: 'Goguryeo',
			body: 'Capital of Goguryeo from 427 AD onward (moved from the Yalu region). A major walled city with inner and outer fortifications. Withstood multiple Chinese sieges before falling to the Tang-Silla coalition in October 668. Tang established the Andong Protectorate here, but could not hold the region long-term.',
		},
		{
			patterns: ['Cheomseongdae'],
			title: 'Cheomseongdae 첨성대',
			era: 'c. 633 AD',
			kingdom: 'Silla',
			body: 'Astronomical observatory built during Queen Sunduk\'s reign in Gyeongju. Oldest surviving observatory in East Asia (possibly the world). Contains exactly 362 stones — roughly the number of days in a lunar year. Its construction demonstrated Silla\'s scientific ambition under female leadership.',
		},
		{
			patterns: ['Seven-Branched Sword', '칠지도'],
			title: 'Seven-Branched Sword 칠지도',
			era: 'c. 369 AD',
			kingdom: 'Baekje',
			body: 'Iron sword with six branch-like protrusions, bestowed by Baekje\'s King Geunchogo to the King of Wa (Japan). Currently held at Isonokami Shrine in Nara, Japan. Its inscription is the oldest known example of Korean writing on metal. Physical proof of the deep Baekje-Yamato relationship.',
		},
		{
			patterns: ['Gwanggaeto'],
			title: 'King Gwanggaeto 광개토대왕',
			era: 'r. 391–413',
			kingdom: 'Goguryeo',
			body: 'Goguryeo\'s greatest conqueror. Expanded the kingdom to its largest territorial extent — from Manchuria to the Han River basin. His massive memorial stele (erected 414) near modern Ji\'an, China, is one of the most important primary sources for early Korean and Japanese history.',
		},
		{
			patterns: ['Eulji Munduk'],
			title: 'Eulji Munduk 을지문덕',
			era: 'fl. 612',
			kingdom: 'Goguryeo',
			body: 'Goguryeo general who defeated the Sui Chinese invasion at the Battle of Salsu (612). Lured a 300,000-strong Sui army deep into Goguryeo territory, then destroyed it at the Salsu River (modern Cheongcheon River). Fewer than 2,700 Sui soldiers survived. The defeat contributed to the fall of the Sui dynasty.',
		},
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
		if (/Unified Silla/i.test(t)) return 669;
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

	onMount(async () => {
		await tick();

		const root0 = novelRoot ?? document.querySelector('.novel__body');
		if (root0) buildToc(root0);

		requestAnimationFrame(() => {
			syncYearFromScroll();
			syncActiveFromScroll();
		});

		const onScroll = () => {
			syncYearFromScroll();
			syncActiveFromScroll();
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
				'/samhan/x1.png',
				'/samhan/x2.png',
				'/samhan/x3.png',
				'/samhan/x4.png',
				'/samhan/x5.png',
				'/samhan/x6.png',
				'/samhan/x7.png',
				'/samhan/x8.png',
				'/samhan/x9.png',
				'/samhan/x10.png',
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

<div class="novel-sidebar">
	<div class="novel-year-ticker" aria-live="polite" title="Approximate year for the passage in view">
		<span class="novel-year-ticker__label">AD</span>
		<span class="novel-year-ticker__flow">
			<NumberFlow
				value={displayedYear}
				format={{ useGrouping: false, maximumFractionDigits: 0 }}
			/>
		</span>
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

<article class="novel">
	<header class="novel__header">
		<img src="/samhan.png" alt="668 Novel Cover" class="novel__cover" />
	</header>

	<div class="novel__body" bind:this={novelRoot}>
		<NovelBody />
	</div>
</article>

<style lang="scss">
	@import './novel.scss';
</style>
