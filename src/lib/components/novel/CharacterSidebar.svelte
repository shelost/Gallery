<script>
	let { character = null, onclose = () => {} } = $props();

	const CHARACTERS = {
		'Sunduk': {
			name: 'Queen Sunduk',
			nameKr: '선덕여왕 (김덕만)',
			era: 'r. 632–647',
			kingdom: 'Silla',
			image: '/samhan/x1.png',
			arc: 'From overlooked princess to beloved queen, Sunduk proved that wisdom mattered more than gender in a world that insisted otherwise. She spent fifteen years defending a throne that half her court believed she had no right to sit on.',
			timeline: [
				{ year: '595–610', event: 'Born Princess Deokman, eldest daughter of King Jinpyung.' },
				{ year: 'c. 620', event: 'Predicted peony flowers sent by Emperor Taizong would have no scent, noting the painting showed no butterflies — proven correct when planted.' },
				{ year: '632', event: 'Becomes 27th ruler of Silla and first queen regnant, after no Sacred Bone males remain.' },
				{ year: '633', event: 'Orders construction of Cheomseongdae observatory — 365 stones, 27 layers, one for each day and each ruler before her.' },
				{ year: '634', event: 'Builds Bunhwangsa temple. Begins diplomatic overtures to Tang China.' },
				{ year: '636', event: 'Samguk Sagi records she fell ill; predicted the date of her own death from Buddhist scripture.' },
				{ year: '642', event: 'Baekje captures Daeya Fortress. Princess Gotaso dies. Authorizes Chunchu\'s diplomatic missions.' },
				{ year: '644', event: 'Completes Hwangnyongsa nine-story pagoda on advice of monk Jajang.' },
				{ year: '645', event: 'Sees white frogs croaking at Yeongmyosa Temple in winter; sends 2,000 soldiers to Yeogeunguk Valley, where they find and destroy 500 Baekje infiltrators.' },
				{ year: '647 Jan', event: 'Bidam rebels, claiming "Women cannot rule." A star falls near the palace. Kim Yushin flies a flaming kite to counter the omen.' },
				{ year: '647 Feb', event: 'Dies shortly before Bidam\'s execution. Buried at Nangsan, fulfilling her prophecy that she would rest "below Tushita Heaven."' },
			],
			anecdotes: [
				{ source: 'Samguk Yusa', text: 'As a child, she was shown a painting of peonies sent by Tang Emperor Taizong. She remarked: "These flowers are beautiful, but they will have no scent." When asked how she knew, she said: "There are no butterflies or bees in the painting. If the flowers had fragrance, insects would be drawn to them." The seeds were planted; the flowers bloomed without any scent.' },
				{ source: 'Samguk Sagi', text: 'She once heard frogs croaking at the Jade Gate pond at Yeongmyosa Temple in the dead of winter. She immediately ordered 2,000 soldiers to Woman\'s Root Valley west of Gyeongju. They found 500 Baekje soldiers hiding in ambush. When asked how she knew, she said the frogs represented angry soldiers, and "Jade Gate" was a euphemism for a woman — so soldiers were near a woman\'s place.' },
				{ source: 'Samguk Yusa', text: 'Before her death, she told her court the exact day she would die and asked to be buried at Nangsan. When a Buddhist temple (Sacheonwangsa, the Temple of the Four Heavenly Kings) was later built directly below her tomb, courtiers realized it fulfilled her final prophecy: the Four Heavenly Kings reside below Tushita Heaven.' },
			],
			sources: [
				'Kim Busik, Samguk Sagi (1145), Volumes 5, 27',
				'Iryeon, Samguk Yusa (c. 1281), "Tale of Queen Seondeok"',
				'Lee Ki-baik, A New History of Korea (Harvard, 1984), pp. 73–78',
			],
		},
		'Chunchu': {
			name: 'Kim Chunchu / King Muyeol',
			nameKr: '무열왕 (김춘추)',
			era: '603–661',
			kingdom: 'Silla',
			image: '/samhan/x2.png',
			arc: 'Born a prince who should have been king but couldn\'t be — True Bone, not Sacred Bone. Became a loving father who lost his daughter to Baekje\'s invasion. Turned into a ruthless diplomat who befriended Tang China\'s emperor, traded away Goguryeo\'s future for Baekje\'s destruction, and died one year before seeing his revenge completed.',
			timeline: [
				{ year: '603', event: 'Born as grandson of dethroned King Jinji. True Bone rank — ineligible for the throne under bone rank rules.' },
				{ year: 'c. 625', event: 'Marries Munhee, younger sister of Kim Yushin — a strategic alliance binding two powerful families.' },
				{ year: '632', event: 'Named Crown Prince alongside Princess Seungman at Sunduk\'s coronation.' },
				{ year: '641', event: 'Daughter Gotaso (14) marries Hwarang Pumsuk. The couple moves to Daeya Fortress.' },
				{ year: '642 Aug', event: 'Baekje destroys Daeya Fortress. Gotaso and Pumsuk die. Samguk Sagi: "He stood leaning against a pillar all day, not blinking, and did not recognize people or objects passing in front of him."' },
				{ year: '642–643', event: 'Travels to Goguryeo seeking an alliance against Baekje. Yeon Gaesomun demands territory in exchange; Chunchu refuses and is nearly killed.' },
				{ year: '648', event: 'Sails to Tang China with son Munwang. Befriends future Emperor Gaozong. Adopts Tang court robes and calendar — critics call him a sellout. Secures the alliance.' },
				{ year: '654', event: 'Queen Jinduk dies. Sacred Bone bloodline extinct. Alchun declines the throne. Chunchu becomes King Muyeol — first True Bone king.' },
				{ year: '660', event: 'Combined Tang-Silla force destroys Baekje. Kim Bupmin confronts captured King Euija, saying: "Your father killed my sister."' },
				{ year: '661 Jun', event: 'Dies before seeing Goguryeo fall. Son Munmu completes the unification.' },
			],
			anecdotes: [
				{ source: 'Samguk Sagi, Vol. 5', text: 'When Chunchu heard of his daughter\'s death at Daeya, "he stood leaning against a pillar all day, not blinking, and he did not recognize people or objects passing in front of him." From that day, every diplomatic move he made was aimed at Baekje\'s destruction.' },
				{ source: 'Samguk Sagi, Vol. 41 (Kim Yushin)', text: 'Chunchu and Yushin sealed their alliance by biting their own fingers and sucking each other\'s blood as an oath. Chunchu said: "By this blood, our families are one."' },
				{ source: 'Samguk Sagi, Vol. 5', text: 'When Chunchu visited Goguryeo seeking help, Yeon Gaesomun demanded Silla cede territory north of the Han River. Chunchu refused. He was imprisoned and nearly executed before escaping with the help of a Goguryeo sympathizer.' },
			],
			sources: [
				'Kim Busik, Samguk Sagi (1145), Volumes 5, 41–43',
				'Iryeon, Samguk Yusa (c. 1281)',
				'Lee Ki-baik, A New History of Korea (Harvard, 1984), pp. 78–84',
			],
		},
		'Yushin': {
			name: 'Kim Yushin',
			nameKr: '김유신',
			era: '595–673',
			kingdom: 'Silla',
			image: '/samhan/x3.png',
			arc: 'Descended from conquered Gaya royalty, Yushin spent his entire life proving that loyalty to Silla mattered more than the bloodline that should have made him its enemy. He became the greatest general in Korean history and the architect of unification — then watched the kingdom he built betray the alliance he\'d forged.',
			timeline: [
				{ year: '595', event: 'Born into the royal house of Geumgwan Gaya, conquered by Silla in 532. Gaya blood in a Silla world.' },
				{ year: 'c. 612', event: 'Joins the Hwarang at 15. Spends four days meditating alone in a mountain cave, praying for a divine sword.' },
				{ year: '629', event: 'First major command at the Battle of Nangbi Fortress, age 34.' },
				{ year: 'c. 625', event: 'Engineers his sister Munhee\'s marriage to Kim Chunchu, permanently binding Gaya and Silla royal lines.' },
				{ year: '642', event: 'Recovers Pumsuk\'s body from Baekje in exchange for eight captured Baekje generals.' },
				{ year: '647', event: 'Crushes Bidam\'s rebellion in 10 days. Flies a flaming kite to counter the falling star omen.' },
				{ year: '654', event: 'Backs Chunchu for the throne when Alchun declines. Becomes the power behind the crown.' },
				{ year: '660', event: 'Commands 50,000 troops at Battle of Hwangsanbul. Defeats Gyebek. Conquers Baekje.' },
				{ year: '661', event: 'Delivers supplies to the Tang general Su Dingfang trapped in Goguryeo — saving the alliance.' },
				{ year: '668', event: 'Supports the final conquest of Goguryeo. Named High Councillor.' },
				{ year: '673', event: 'Dies at 78, the most decorated commander in Korean history. Posthumously named King Heungmu.' },
			],
			anecdotes: [
				{ source: 'Samguk Sagi, Vol. 41', text: 'As a young Hwarang, Yushin spent four days fasting and meditating alone in a cave on Jungak Mountain, praying to heaven for a sacred sword to protect Silla. On the fourth night, an old man appeared and gave him secret martial arts techniques.' },
				{ source: 'Samguk Sagi, Vol. 41', text: 'To bind himself to Chunchu, Yushin arranged for his sister Munhee to become pregnant by Chunchu before marriage — then publicly threatened to burn her alive for the scandal. Queen Sunduk intervened, the marriage was arranged, and the two most powerful families in Silla were joined.' },
				{ source: 'Samguk Sagi, Vol. 47', text: 'After Daeya fell, Yushin negotiated the return of Pumsuk\'s body by offering to exchange eight captured Baekje generals — an unprecedented show of respect for a fallen subordinate.' },
			],
			sources: [
				'Kim Busik, Samguk Sagi (1145), Volumes 41–43 (Biography of Kim Yushin)',
				'Iryeon, Samguk Yusa (c. 1281)',
				'Lee Ki-baik, A New History of Korea (Harvard, 1984), pp. 64–90',
			],
		},
		'Gaesomun': {
			name: 'Yeon Gaesomun',
			nameKr: '연개소문',
			era: '594–666',
			kingdom: 'Goguryeo',
			image: '/samhan/x6.png',
			arc: 'A military genius who saved Goguryeo from Tang China — and destroyed it by building a system that couldn\'t survive without him. He carried five swords, killed a king, repelled an emperor, and left three sons who turned on each other the moment he closed his eyes.',
			timeline: [
				{ year: '594', event: 'Born eldest son of Yeon Taejo, Magniji (prime minister) of Goguryeo.' },
				{ year: 'c. 630s', event: 'Becomes Western Governor. Oversees construction of the Cheolli Jangseong, a 1,000-li defensive wall against Tang.' },
				{ year: '642 winter', event: 'Discovers King Youngryu\'s plot to assassinate him. Hosts a banquet, ambushes and kills all 100 attending officials, then murders the king. Dismembers the body.' },
				{ year: '642', event: 'Installs nephew Bojang as puppet king. Declares himself Dae Magniji — supreme commander. Absolute power.' },
				{ year: '645', event: 'Emperor Taizong personally invades with 100,000+ troops. Yeon coordinates the defense. Yang Manchun holds Ansi Fortress for 88 days. Tang retreats.' },
				{ year: '655', event: 'Allied with Baekje, attacks Silla\'s northern border.' },
				{ year: '658–662', event: 'Repels multiple Tang-Silla invasions. Greatest victory at Sasu River (662) where his forces destroy a Tang column.' },
				{ year: '665–666', event: 'Dies of natural causes. Three sons immediately begin fighting over power.' },
			],
			anecdotes: [
				{ source: 'Samguk Sagi, Vol. 49', text: 'Tang and Silla sources say Yeon Gaesomun always carried five swords on his person. When mounting his horse, he made nobles and officials lie face-down on the ground and used their backs as stepping stones.' },
				{ source: 'Samguk Sagi, Vol. 20', text: 'When Yeon discovered King Youngryu\'s assassination plot, he did not flee. Instead, he organized a banquet celebrating his promotion to Eastern Governor, invited all 100 officials who had conspired against him, and had his soldiers kill every one of them before marching to the palace to murder the king.' },
				{ source: 'New Book of Tang', text: 'After the 642 coup, Yeon\'s soldiers "dismembered the king\'s body and cast it into a ditch." The Chinese historians recorded this with particular horror, as regicide was the ultimate Confucian sin.' },
				{ source: 'Funing County Annals (19th c.)', text: 'A local Chinese legend claims that during the 645 campaign, Emperor Taizong was so frightened by Yeon Gaesomun that he disguised himself as a commoner to escape. The legend is almost certainly false but reveals how deeply Yeon\'s reputation penetrated Chinese folk memory.' },
			],
			sources: [
				'Kim Busik, Samguk Sagi (1145), Volumes 20–22, 49',
				'Ouyang Xiu, New Book of Tang (1060), "Eastern Barbarians"',
				'Nihon Shoki (720), Year 1 of Empress Kogyoku (642)',
				'Lee Ki-baik, A New History of Korea (Harvard, 1984), pp. 46–52',
			],
		},
		'Gyebek': {
			name: 'Gyebek',
			nameKr: '계백',
			era: '?–660',
			kingdom: 'Baekje',
			image: '/samhan/x5.png',
			arc: 'A brilliant general born without a clan in a kingdom where clans were everything. Gyebek spent his whole career being told he wasn\'t good enough. When Baekje finally needed him, it was too late — and he knew it. He killed his own family so the clans couldn\'t use them, then fought outnumbered ten to one and won four times before the math caught up.',
			timeline: [
				{ year: 'c. 620', event: 'Born to unknown parents. No clan affiliation — a death sentence for ambition in Baekje.' },
				{ year: 'c. 640s', event: 'Rises through military ranks on pure talent. Repeatedly passed over for command positions in favor of clan-connected officers.' },
				{ year: '660 Aug', event: 'Given command of Baekje\'s last 5,000 soldiers when no one else will take the job.' },
				{ year: '660 Aug', event: 'Kills his own wife and children before marching. Tells his troops there will be no retreat.' },
				{ year: '660 Aug', event: 'Battle of Hwangsanbul: charges Yushin\'s 50,000 four times and breaks the Silla lines each time. On the fifth charge, overwhelmed and killed.' },
			],
			anecdotes: [
				{ source: 'Samguk Sagi, Vol. 47', text: 'Before the Battle of Hwangsanbul, Gyebek told his soldiers: "A nation that has survived since the reign of King Onjo for 680 years will end today. Baekje will be no more after this battle. I ask you to fight to the death."' },
				{ source: 'Samguk Sagi, Vol. 28', text: 'Gyebek killed his wife and children before marching to Hwangsanbul. The Samguk Sagi records this without commentary — a silence that speaks louder than any editorial. He understood that in Baekje, even a general\'s family was a negotiating tool for the clans.' },
				{ source: 'Samguk Sagi, Vol. 5', text: 'Yushin\'s army broke four times against Gyebek\'s charge. On the fourth retreat, Yushin\'s subordinate Gwanchang, a 16-year-old Hwarang, charged alone into Baekje lines and was captured. Gyebek sent him back alive, impressed by his courage. Gwanchang charged again and was killed. His body was returned to the Silla lines, which rallied for the final charge.' },
			],
			sources: [
				'Kim Busik, Samguk Sagi (1145), Volumes 5, 28, 47',
				'Lee Ki-baik, A New History of Korea (Harvard, 1984), pp. 85–87',
			],
		},
		'Euija': {
			name: 'King Euija',
			nameKr: '의자왕 (부여의자)',
			era: 'r. 641–660',
			kingdom: 'Baekje',
			image: '/samhan/x5.png',
			arc: 'Started as the "Paragon of the East Sea" — generous, filial, everything a king should be. Ended as a paranoid ruler, exiled and dying in a foreign country. The Eight Great Clans broke him, and he broke himself trying to break them back.',
			timeline: [
				{ year: '595?', event: 'Born eldest son of King Mu. According to Samguk Yusa, his mother may have been Princess Sunhwa of Silla.' },
				{ year: '632', event: 'Made crown prince.' },
				{ year: '641', event: 'Becomes 31st king. Early reforms earn him the title "Haedong Jeungja" — Confucian Paragon of the East Sea.' },
				{ year: '642', event: 'Conquers 40 Silla castles including Daeya Fortress. Peak of his military power.' },
				{ year: '655', event: 'Begins purging officials. Exiles loyal advisors who disagree. Promotes sycophants.' },
				{ year: '660 Aug', event: '130,000 Tang troops cross the sea. Gyebek makes his last stand. Su Dingfang crosses the Geum River. Sabi falls.' },
				{ year: '660', event: 'Captured and sent to Tang China in chains. Dies in exile — the only Korean king to die on foreign soil.' },
			],
			anecdotes: [
				{ source: 'Samguk Sagi, Vol. 28', text: 'Euija personally led the 642 campaign against Silla. He sent Pumseok\'s severed head to Sabi as a trophy, along with 1,000 captured Silla men and women. The gesture was as political as it was military — proving to the clans that he could deliver victories.' },
				{ source: 'Samguk Sagi, Vol. 28', text: 'In his final years, Euija promoted his favored concubine\'s relatives to high positions, alienating the very clans whose support he needed. The Samguk Sagi notes he "indulged in wine and pleasure and did not attend to affairs of state."' },
			],
			sources: [
				'Kim Busik, Samguk Sagi (1145), Volume 28',
				'Iryeon, Samguk Yusa (c. 1281), "Tale of King Mu"',
				'Nihon Shoki (720)',
			],
		},
		'Manchun': {
			name: 'Yang Manchun',
			nameKr: '양만춘',
			era: 'fl. 640s',
			kingdom: 'Goguryeo',
			image: '/samhan/x7.png',
			arc: 'A frontier commander who didn\'t care about politics — only about walls. Held Ansi Fortress for 88 days against the most powerful emperor in the world, then watched him ride away. The only man on the Great Heroes list who was still alive when they added his name.',
			timeline: [
				{ year: 'c. 630s', event: 'Becomes Commander of Ansi Fortress (Western Commandery) in modern Liaoning.' },
				{ year: '645 summer', event: 'Emperor Taizong arrives with 100,000+ troops. Expects Ansi to fall in days.' },
				{ year: '645', event: '88-day siege. Tang engineers build a massive earth ramp; Manchun launches a night sortie and captures it. Tang sappers dig tunnels; Manchun floods them.' },
				{ year: '645', event: 'Reportedly strikes Taizong\'s eye with an arrow. The emperor loses sight in one eye.' },
				{ year: '645 Oct', event: 'Taizong orders withdrawal. Salutes Ansi\'s walls as he rides away. Sends silk as a gift to the defender he could not beat.' },
			],
			anecdotes: [
				{ source: 'Samguk Sagi, Vol. 21', text: 'When Tang general Li Daozong built a 60-day earth ramp against Ansi\'s walls, the fortress defenders added to their own wall height each night to match. When the ramp was finally completed and Tang officer Fu Fu\'ai abandoned his post for unknown reasons, Manchun\'s troops stormed out and captured the entire ramp, turning it into part of Ansi\'s defenses.' },
				{ source: 'Samguk Sagi, Vol. 21', text: 'The name "Yang Manchun" may be a later folk invention — the Samguk Sagi records that "the defending general\'s name has been lost." But Korean tradition has universally adopted the name.' },
				{ source: 'New Book of Tang', text: 'Upon withdrawing, Emperor Taizong "saluted the fortress" and sent 100 bolts of silk to its unnamed commander — an extraordinary gesture of respect from a defeated emperor to the man who defeated him.' },
			],
			sources: [
				'Kim Busik, Samguk Sagi (1145), Volume 21',
				'Ouyang Xiu, New Book of Tang (1060)',
				'Zizhi Tongjian, Vol. 198 (Siege of Ansi, 645)',
			],
		},
		'Bidam': {
			name: 'Bidam',
			nameKr: '비담',
			era: '?–647',
			kingdom: 'Silla',
			image: '/samhan/x4.png',
			arc: 'Rose to the highest civilian office in Silla and used it to try to tear the system down. His mother Mishil filled his head with visions of a "New Gaya," and when he saw a star fall, he saw his chance. It lasted ten days.',
			timeline: [
				{ year: 'c. 620', event: 'Born to Mishil, a Noble woman with ambitions of creating "New Gaya."' },
				{ year: '645', event: 'Appointed Sangdaedeung (High Councillor) — the most powerful civilian office in Silla.' },
				{ year: '647 Jan', event: 'Queen Sunduk is dying. A great star falls near the palace. Bidam declares: "Women cannot rule the country."' },
				{ year: '647 Jan', event: 'Rallies nobles and soldiers. Claims the falling star proves the queen will fall too.' },
				{ year: '647 Feb', event: 'Rebellion crushed by Kim Yushin in 10 days. Bidam and 30 followers executed.' },
			],
			anecdotes: [
				{ source: 'Samguk Sagi, Vol. 5', text: 'On the night of Bidam\'s rebellion, a large star fell near the queen\'s residence. Bidam used this as propaganda, telling his followers it was a sign the queen would fall. Kim Yushin responded by flying a flaming kite into the sky the next night, announcing that "the queen\'s star has risen again." The psychological counter-move broke Bidam\'s superstitious followers\' morale.' },
			],
			sources: [
				'Kim Busik, Samguk Sagi (1145), Volume 5',
				'Hwarang Segi (disputed authenticity)',
			],
		},
	};

	const data = $derived(character ? (CHARACTERS[character] || null) : null);
</script>

{#if data}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="char-overlay" onclick={onclose}></div>
	<aside class="char-sidebar">
		<button class="char-sidebar__close" onclick={onclose} aria-label="Close">&times;</button>

		<div class="char-sidebar__hero">
			<img src={data.image} alt={data.name} class="char-sidebar__img" />
			<div class="char-sidebar__header">
				<span class="char-sidebar__kingdom" style="--kc: {data.kingdom === 'Silla' ? '#6b5ce7' : data.kingdom === 'Baekje' ? '#d4564e' : data.kingdom === 'Goguryeo' ? '#2e86ab' : '#c9a227'}">{data.kingdom}</span>
				<h2 class="char-sidebar__name">{data.name}</h2>
				<p class="char-sidebar__name-kr">{data.nameKr}</p>
				<p class="char-sidebar__era">{data.era}</p>
			</div>
		</div>

		<p class="char-sidebar__arc">{data.arc}</p>

		<h3 class="char-sidebar__section">Timeline</h3>
		<ol class="char-timeline">
			{#each data.timeline as evt}
				<li class="char-timeline__item">
					<span class="char-timeline__year">{evt.year}</span>
					<span class="char-timeline__text">{evt.event}</span>
				</li>
			{/each}
		</ol>

		{#if data.anecdotes?.length}
			<h3 class="char-sidebar__section">From the Sources</h3>
			{#each data.anecdotes as an}
				<div class="char-anecdote">
					<span class="char-anecdote__source">{an.source}</span>
					<p class="char-anecdote__text">{an.text}</p>
				</div>
			{/each}
		{/if}

		{#if data.sources?.length}
			<h3 class="char-sidebar__section">Bibliography</h3>
			<ul class="char-sources">
				{#each data.sources as src}
					<li>{src}</li>
				{/each}
			</ul>
		{/if}
	</aside>
{/if}

<style lang="scss">
	.char-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 200;
		animation: fadeIn 0.2s ease;
	}

	.char-sidebar {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: min(420px, 90vw);
		z-index: 201;
		background: var(--novel-bg, #0c0b14);
		border-left: 1px solid rgba(255, 255, 255, 0.08);
		overflow-y: auto;
		padding: 24px;
		animation: slideIn 0.25s ease-out;
		font-family: 'Zhi Mang Xing', 'Crimson Pro', Georgia, serif;
		color: var(--novel-body, rgba(226, 223, 240, 0.85));
	}

	.char-sidebar__close {
		position: absolute;
		top: 16px;
		right: 16px;
		width: 32px;
		height: 32px;
		border: none;
		background: rgba(255, 255, 255, 0.06);
		color: var(--novel-text, #e2dff0);
		font-size: 1.2rem;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		&:hover { background: rgba(255, 255, 255, 0.12); }
	}

	.char-sidebar__hero {
		display: flex;
		gap: 16px;
		align-items: flex-start;
		margin-bottom: 20px;
	}

	.char-sidebar__img {
		width: 80px;
		height: 80px;
		border-radius: 12px;
		object-fit: cover;
		flex-shrink: 0;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
	}

	.char-sidebar__header {
		flex: 1;
		min-width: 0;
	}

	.char-sidebar__kingdom {
		display: inline-block;
		font-family: 'DM Sans', 'Inter', sans-serif;
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 2px 6px;
		border-radius: 4px;
		background: var(--kc);
		color: #fff;
		margin-bottom: 4px;
	}

	.char-sidebar__name {
		font-family: 'DM Serif Text', Georgia, serif;
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--novel-text, #e2dff0);
		margin: 4px 0 0;
		line-height: 1.2;
	}

	.char-sidebar__name-kr {
		font-family: 'Noto Sans KR', sans-serif;
		font-size: 0.78rem;
		color: var(--novel-muted, rgba(226, 223, 240, 0.4));
		margin: 2px 0 0;
	}

	.char-sidebar__era {
		font-family: 'DM Sans', 'Inter', sans-serif;
		font-size: 0.7rem;
		color: var(--novel-muted, rgba(226, 223, 240, 0.4));
		margin: 2px 0 0;
	}

	.char-sidebar__arc {
		font-size: 0.92rem;
		line-height: 1.6;
		color: var(--novel-body, rgba(226, 223, 240, 0.85));
		margin: 0 0 24px;
		font-style: italic;
		padding-left: 12px;
		border-left: 3px solid rgba(120, 105, 255, 0.3);
	}

	.char-sidebar__section {
		font-family: 'DM Sans', 'Inter', sans-serif;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--novel-muted, rgba(226, 223, 240, 0.4));
		margin: 24px 0 12px;
	}

	.char-timeline {
		list-style: none;
		padding: 0;
		margin: 0;
		position: relative;
		padding-left: 16px;
		border-left: 2px solid rgba(255, 255, 255, 0.06);
	}

	.char-timeline__item {
		margin-bottom: 12px;
		position: relative;
		padding-left: 8px;

		&::before {
			content: '';
			position: absolute;
			left: -21px;
			top: 6px;
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background: rgba(120, 105, 255, 0.5);
			border: 2px solid var(--novel-bg, #0c0b14);
		}
	}

	.char-timeline__year {
		display: block;
		font-family: 'DM Sans', 'Inter', sans-serif;
		font-size: 0.65rem;
		font-weight: 700;
		color: rgba(120, 105, 255, 0.7);
		letter-spacing: 0.04em;
		margin-bottom: 2px;
	}

	.char-timeline__text {
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--novel-body, rgba(226, 223, 240, 0.85));
	}

	.char-anecdote {
		margin-bottom: 16px;
		padding: 12px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.char-anecdote__source {
		display: block;
		font-family: 'DM Sans', 'Inter', sans-serif;
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: rgba(120, 105, 255, 0.6);
		margin-bottom: 6px;
	}

	.char-anecdote__text {
		font-size: 0.82rem;
		line-height: 1.55;
		margin: 0;
		color: var(--novel-body, rgba(226, 223, 240, 0.85));
	}

	.char-sources {
		list-style: none;
		padding: 0;
		margin: 0;

		li {
			font-family: 'DM Sans', 'Inter', sans-serif;
			font-size: 0.72rem;
			color: var(--novel-muted, rgba(226, 223, 240, 0.4));
			margin-bottom: 6px;
			padding-left: 12px;
			position: relative;

			&::before {
				content: '—';
				position: absolute;
				left: 0;
			}
		}
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideIn {
		from { transform: translateX(100%); }
		to { transform: translateX(0); }
	}
</style>
