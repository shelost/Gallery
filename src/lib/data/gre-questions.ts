export type QuestionType = 'sentence-completion' | 'analogy' | 'antonym' | 'reading-comprehension';

export interface GREQuestion {
	id: string;
	type: QuestionType;
	section: number;
	prompt: string;
	choices: string[];
	correctIndex: number;
	explanation: string;
	passage?: string;
}

export interface GRETest {
	id: string;
	name: string;
	sections: GRESection[];
}

export interface GRESection {
	id: string;
	name: string;
	type: 'verbal' | 'quantitative' | 'analytical';
	timeMinutes: number;
	questions: GREQuestion[];
}

function q(
	id: string,
	type: QuestionType,
	section: number,
	prompt: string,
	choices: string[],
	correctIndex: number,
	explanation: string,
	passage?: string
): GREQuestion {
	return { id, type, section, prompt, choices, correctIndex, explanation, passage };
}

const verbalSection1: GREQuestion[] = [
	// --- SENTENCE COMPLETIONS ---
	q('t1-s1-1', 'sentence-completion', 1,
		'The novelist\'s reputation, once _______ by critics who dismissed her early work, was later restored when scholars recognized the _______ of her themes.',
		[
			'celebrated .. simplicity',
			'tarnished .. profundity',
			'bolstered .. irrelevance',
			'ignored .. brevity',
			'inflated .. redundancy'
		], 1,
		'"Tarnished" fits with "dismissed," and "profundity" (depth) logically explains why scholars later restored her reputation.'
	),
	q('t1-s1-2', 'sentence-completion', 1,
		'Although the professor\'s lectures were ostensibly about ancient history, her frequent _______ into contemporary politics made them feel more like _______ than scholarly presentations.',
		[
			'forays .. polemics',
			'retreats .. eulogies',
			'inquiries .. dissertations',
			'lapses .. monographs',
			'advances .. panegyrics'
		], 0,
		'"Forays" (ventures) into contemporary politics and "polemics" (controversial arguments) best capture the contrast with scholarly presentations.'
	),
	q('t1-s1-3', 'sentence-completion', 1,
		'The discovery was _______ because, while it answered one longstanding question, it simultaneously raised a host of new ones that proved even more _______.',
		[
			'gratifying .. trivial',
			'bittersweet .. intractable',
			'revolutionary .. predictable',
			'unfortunate .. comprehensible',
			'mundane .. perplexing'
		], 1,
		'"Bittersweet" captures both the positive (answered a question) and negative (raised new ones), and "intractable" (difficult to solve) logically intensifies the difficulty.'
	),
	q('t1-s1-4', 'sentence-completion', 1,
		'Far from being _______, the gaps in the historical record actually invite creative interpretation, allowing scholars to construct narratives that are both plausible and _______.',
		[
			'beneficial .. tedious',
			'detrimental .. illuminating',
			'unusual .. derivative',
			'apparent .. mundane',
			'significant .. redundant'
		], 1,
		'"Far from being detrimental" sets up a positive contrast, and "illuminating" completes the idea that gaps enable rich narrative construction.'
	),
	q('t1-s1-5', 'sentence-completion', 1,
		'The committee\'s report, though intended to _______ public concern about the project, inadvertently _______ the very fears it sought to address.',
		[
			'alleviate .. exacerbated',
			'dismiss .. confirmed',
			'generate .. suppressed',
			'amplify .. diminished',
			'articulate .. resolved'
		], 0,
		'"Alleviate" (reduce) concern is the intent, while "exacerbated" (worsened) is the ironic opposite result.'
	),
	q('t1-s1-6', 'sentence-completion', 1,
		'The author\'s prose style is best described as _______: she uses elaborate syntax and ornate diction where a simpler approach would suffice.',
		[
			'laconic',
			'pellucid',
			'florid',
			'austere',
			'perfunctory'
		], 2,
		'"Florid" means excessively ornate or elaborate, which matches "elaborate syntax and ornate diction."'
	),
	q('t1-s1-7', 'sentence-completion', 1,
		'The diplomat\'s _______ manner concealed a sharp intellect; those who mistook her courtesy for naiveté were invariably _______ in negotiations.',
		[
			'brusque .. vindicated',
			'affable .. outmaneuvered',
			'imperious .. rewarded',
			'diffident .. emboldened',
			'truculent .. disarmed'
		], 1,
		'"Affable" (friendly, courteous) fits the concealment idea, and "outmaneuvered" shows the consequence of underestimating her.'
	),

	// --- ANALOGIES ---
	q('t1-s1-8', 'analogy', 1,
		'SCALPEL : SURGEON ::',
		[
			'symptom : patient',
			'chisel : sculptor',
			'canvas : painter',
			'laboratory : chemist',
			'verdict : judge'
		], 1,
		'A scalpel is the primary precision tool of a surgeon, just as a chisel is the primary precision tool of a sculptor.'
	),
	q('t1-s1-9', 'analogy', 1,
		'PARSIMONIOUS : SPEND ::',
		[
			'garrulous : talk',
			'lethargic : move',
			'meticulous : err',
			'credulous : believe',
			'pugnacious : fight'
		], 1,
		'Someone parsimonious is reluctant to spend; someone lethargic is reluctant to move. The relationship is "reluctant to do X."'
	),
	q('t1-s1-10', 'analogy', 1,
		'ELEGY : SORROW ::',
		[
			'comedy : laughter',
			'anthem : patriotism',
			'novel : fiction',
			'preface : introduction',
			'lyric : music'
		], 1,
		'An elegy is a literary form that expresses sorrow; an anthem is a musical form that expresses patriotism.'
	),
	q('t1-s1-11', 'analogy', 1,
		'IMPERVIOUS : PENETRATE ::',
		[
			'obvious : detect',
			'immutable : change',
			'elastic : stretch',
			'portable : carry',
			'legible : read'
		], 1,
		'Something impervious cannot be penetrated; something immutable cannot be changed.'
	),
	q('t1-s1-12', 'analogy', 1,
		'BIBLIOGRAPHY : BOOKS ::',
		[
			'atlas : maps',
			'glossary : definitions',
			'almanac : predictions',
			'ledger : profits',
			'index : topics'
		], 0,
		'A bibliography is a compiled list of books; an atlas is a compiled collection of maps.'
	),
	q('t1-s1-13', 'analogy', 1,
		'DILETTANTE : SUPERFICIAL ::',
		[
			'connoisseur : discriminating',
			'zealot : impartial',
			'skeptic : credulous',
			'pragmatist : idealistic',
			'novice : experienced'
		], 0,
		'A dilettante is by definition superficial in their engagement; a connoisseur is by definition discriminating in their taste.'
	),

	// --- ANTONYMS ---
	q('t1-s1-14', 'antonym', 1,
		'EPHEMERAL:',
		[
			'tangible',
			'permanent',
			'visible',
			'fragile',
			'minute'
		], 1,
		'Ephemeral means lasting a very short time; permanent means lasting indefinitely — they are direct opposites.'
	),
	q('t1-s1-15', 'antonym', 1,
		'GARRULOUS:',
		[
			'reticent',
			'hostile',
			'generous',
			'perceptive',
			'frivolous'
		], 0,
		'Garrulous means excessively talkative; reticent means inclined to be silent — direct opposites.'
	),
	q('t1-s1-16', 'antonym', 1,
		'OBDURATE:',
		[
			'transparent',
			'compliant',
			'articulate',
			'adjacent',
			'plausible'
		], 1,
		'Obdurate means stubbornly unyielding; compliant means willing to conform or yield — direct opposites.'
	),
	q('t1-s1-17', 'antonym', 1,
		'PRODIGAL:',
		[
			'frugal',
			'talented',
			'repentant',
			'aggressive',
			'cautious'
		], 0,
		'Prodigal means wastefully extravagant; frugal means sparing or economical — direct opposites.'
	),
	q('t1-s1-18', 'antonym', 1,
		'AMELIORATE:',
		[
			'fabricate',
			'worsen',
			'predict',
			'abandon',
			'simplify'
		], 1,
		'Ameliorate means to make better; worsen means to make worse — direct opposites.'
	),
	q('t1-s1-19', 'antonym', 1,
		'SPECIOUS:',
		[
			'genuine',
			'curious',
			'elaborate',
			'partial',
			'mundane'
		], 0,
		'Specious means superficially plausible but actually wrong; genuine means truly what it appears to be.'
	),
	q('t1-s1-20', 'antonym', 1,
		'TURBID:',
		[
			'shallow',
			'rapid',
			'clear',
			'warm',
			'abundant'
		], 2,
		'Turbid means cloudy, opaque, or muddy; clear is its direct opposite.'
	),
];

const verbalSection2: GREQuestion[] = [
	q('t1-s2-1', 'sentence-completion', 2,
		'The artist\'s later works were criticized as _______, lacking the _______ that had characterized her earlier, more emotionally charged paintings.',
		[
			'derivative .. originality',
			'innovative .. banality',
			'pedestrian .. vitality',
			'provocative .. restraint',
			'accessible .. obscurity'
		], 2,
		'"Pedestrian" (dull, uninspired) fits "criticized," and "vitality" (energy, life) is what the earlier emotionally charged works had.'
	),
	q('t1-s2-2', 'sentence-completion', 2,
		'The memoir is notable for its _______ tone: the author recounts even the most painful episodes of her life without _______ or self-pity.',
		[
			'sardonic .. humor',
			'measured .. rancor',
			'strident .. conviction',
			'indifferent .. emotion',
			'nostalgic .. fondness'
		], 1,
		'"Measured" suggests calm composure, and "without rancor" (bitterness) explains the absence of negativity despite painful content.'
	),
	q('t1-s2-3', 'sentence-completion', 2,
		'Paradoxically, the most _______ politicians are often the least effective legislators, since their unwillingness to _______ prevents them from building the coalitions necessary to pass laws.',
		[
			'ambitious .. succeed',
			'principled .. compromise',
			'experienced .. deliberate',
			'eloquent .. communicate',
			'corrupt .. negotiate'
		], 1,
		'The paradox is that being principled (admirable) leads to inability to compromise, which undermines legislative effectiveness.'
	),
	q('t1-s2-4', 'sentence-completion', 2,
		'Though the book has been praised for its _______ research, critics note that the author\'s conclusions are often _______, going far beyond what the evidence supports.',
		[
			'superficial .. modest',
			'meticulous .. speculative',
			'sporadic .. definitive',
			'derivative .. cautious',
			'exhaustive .. restrained'
		], 1,
		'"Meticulous" (thorough) research contrasts with "speculative" (conjectural) conclusions that exceed the evidence.'
	),
	q('t1-s2-5', 'sentence-completion', 2,
		'The ruins, though _______ by centuries of neglect, still convey the _______ of the civilization that built them.',
		[
			'enhanced .. fragility',
			'concealed .. anonymity',
			'ravaged .. grandeur',
			'preserved .. decadence',
			'transformed .. simplicity'
		], 2,
		'"Ravaged" by neglect contrasts with the still-evident "grandeur" (splendor) of the original civilization.'
	),

	q('t1-s2-6', 'analogy', 2,
		'PREAMBLE : DOCUMENT ::',
		[
			'epilogue : novel',
			'overture : opera',
			'footnote : page',
			'index : textbook',
			'stanza : poem'
		], 1,
		'A preamble is an introduction to a document; an overture is an introduction to an opera.'
	),
	q('t1-s2-7', 'analogy', 2,
		'APATHY : ENTHUSIASM ::',
		[
			'anger : violence',
			'indolence : diligence',
			'curiosity : wonder',
			'fatigue : rest',
			'pride : vanity'
		], 1,
		'Apathy is the lack of enthusiasm; indolence is the lack of diligence. Both pairs are opposites.'
	),
	q('t1-s2-8', 'analogy', 2,
		'MITIGATE : SEVERITY ::',
		[
			'compile : collection',
			'erode : stability',
			'illuminate : clarity',
			'amplify : volume',
			'attenuate : intensity'
		], 4,
		'To mitigate is to reduce severity; to attenuate is to reduce intensity. Both mean "to lessen X."'
	),

	q('t1-s2-9', 'antonym', 2,
		'MUNIFICENT:',
		[
			'parsimonious',
			'elaborate',
			'invisible',
			'cautious',
			'artificial'
		], 0,
		'Munificent means extremely generous; parsimonious means extremely stingy — direct opposites.'
	),
	q('t1-s2-10', 'antonym', 2,
		'COGENT:',
		[
			'brief',
			'popular',
			'unconvincing',
			'original',
			'hostile'
		], 2,
		'Cogent means clear, logical, and convincing; unconvincing is its direct opposite.'
	),
	q('t1-s2-11', 'antonym', 2,
		'DIFFIDENCE:',
		[
			'boldness',
			'ignorance',
			'apathy',
			'cruelty',
			'eloquence'
		], 0,
		'Diffidence means shyness or lack of self-confidence; boldness is its direct opposite.'
	),
	q('t1-s2-12', 'antonym', 2,
		'EXONERATE:',
		[
			'convict',
			'examine',
			'praise',
			'release',
			'diminish'
		], 0,
		'Exonerate means to clear of blame; convict means to declare guilty — direct opposites.'
	),
	q('t1-s2-13', 'antonym', 2,
		'LOQUACIOUS:',
		[
			'intelligent',
			'taciturn',
			'generous',
			'somber',
			'diligent'
		], 1,
		'Loquacious means very talkative; taciturn means habitually silent — direct opposites.'
	),

	q('t1-s2-14', 'sentence-completion', 2,
		'The candidate\'s speech was so _______ that even her staunchest opponents found themselves nodding in agreement.',
		[
			'rambling',
			'tendentious',
			'persuasive',
			'incomprehensible',
			'perfunctory'
		], 2,
		'"Persuasive" is the only choice that logically explains why opponents would agree.'
	),
	q('t1-s2-15', 'sentence-completion', 2,
		'In an age of information overload, the ability to _______ essential facts from a mass of data has become an _______ skill.',
		[
			'fabricate .. obsolete',
			'distill .. indispensable',
			'obscure .. optional',
			'memorize .. antiquated',
			'generate .. superfluous'
		], 1,
		'"Distill" (extract the essential) from data, and "indispensable" (essential) correctly values the skill.'
	),
];

const verbalSection3: GREQuestion[] = [
	q('t2-s1-1', 'sentence-completion', 1,
		'The philosopher\'s arguments, though _______ on the surface, revealed fundamental _______ upon closer examination.',
		[
			'complex .. simplicity',
			'coherent .. contradictions',
			'novel .. agreements',
			'obscure .. clarity',
			'weak .. strengths'
		], 1,
		'"Coherent on the surface" but "contradictions upon closer examination" captures the idea of hidden logical flaws.'
	),
	q('t2-s1-2', 'sentence-completion', 1,
		'The new evidence did not _______ the original theory so much as _______ it, requiring significant modifications but not wholesale abandonment.',
		[
			'confirm .. extend',
			'disprove .. qualify',
			'support .. undermine',
			'challenge .. vindicate',
			'bolster .. diminish'
		], 1,
		'"Did not disprove but qualified" captures the nuance of requiring modification without complete rejection.'
	),
	q('t2-s1-3', 'sentence-completion', 1,
		'The composer\'s final symphony is a _______ work, bringing together themes from all her previous compositions into a single, unified statement.',
		[
			'derivative',
			'synoptic',
			'fragmentary',
			'didactic',
			'whimsical'
		], 1,
		'"Synoptic" means providing a general overview or summary — fitting for a work that unifies previous themes.'
	),
	q('t2-s1-4', 'sentence-completion', 1,
		'The new regulations, far from being _______, actually provided considerable _______ for individual interpretation and adaptation.',
		[
			'rigid .. latitude',
			'lenient .. restriction',
			'complex .. clarity',
			'arbitrary .. justification',
			'effective .. resistance'
		], 0,
		'"Far from being rigid" sets up a contrast with "latitude" (freedom, flexibility) for interpretation.'
	),
	q('t2-s1-5', 'sentence-completion', 1,
		'Her public persona was one of unshakable confidence, but in private she was _______ by doubts that she carefully _______ from her colleagues.',
		[
			'liberated .. shared',
			'beset .. concealed',
			'untroubled .. withheld',
			'comforted .. broadcast',
			'defined .. revealed'
		], 1,
		'"Beset" (troubled) by doubts and "concealed" them fits the public/private contrast.'
	),

	q('t2-s1-6', 'analogy', 1,
		'MERCURIAL : MOOD ::',
		[
			'static : position',
			'volatile : temperament',
			'rigid : structure',
			'sluggish : pace',
			'constant : devotion'
		], 1,
		'Mercurial describes rapidly changing mood; volatile describes rapidly changing temperament. Both mean "subject to rapid change in X."'
	),
	q('t2-s1-7', 'analogy', 1,
		'FAMINE : FOOD ::',
		[
			'drought : water',
			'flood : damage',
			'epidemic : cure',
			'harvest : grain',
			'feast : celebration'
		], 0,
		'A famine is a severe shortage of food; a drought is a severe shortage of water.'
	),
	q('t2-s1-8', 'analogy', 1,
		'PROLOGUE : PLAY ::',
		[
			'movement : symphony',
			'preface : book',
			'chorus : song',
			'coda : composition',
			'scene : act'
		], 1,
		'A prologue is introductory material at the start of a play; a preface is introductory material at the start of a book.'
	),

	q('t2-s1-9', 'antonym', 1,
		'VACILLATE:',
		[
			'resolve',
			'accumulate',
			'distribute',
			'investigate',
			'celebrate'
		], 0,
		'Vacillate means to waver indecisively; resolve means to decide firmly — direct opposites.'
	),
	q('t2-s1-10', 'antonym', 1,
		'SANGUINE:',
		[
			'pessimistic',
			'energetic',
			'verbose',
			'reckless',
			'humble'
		], 0,
		'Sanguine means optimistic; pessimistic is its direct opposite.'
	),
	q('t2-s1-11', 'antonym', 1,
		'COPIOUS:',
		[
			'expensive',
			'meager',
			'artificial',
			'gradual',
			'complex'
		], 1,
		'Copious means abundant; meager means insufficient in quantity — direct opposites.'
	),
	q('t2-s1-12', 'antonym', 1,
		'ACRIMONIOUS:',
		[
			'harmonious',
			'conspicuous',
			'voluntary',
			'temporary',
			'significant'
		], 0,
		'Acrimonious means bitter and angry; harmonious means free from conflict — direct opposites.'
	),
	q('t2-s1-13', 'antonym', 1,
		'TEMERITY:',
		[
			'prudence',
			'generosity',
			'ignorance',
			'patience',
			'eloquence'
		], 0,
		'Temerity means reckless boldness; prudence means careful caution — direct opposites.'
	),

	q('t2-s1-14', 'sentence-completion', 1,
		'What distinguishes her criticism from that of her peers is not its _______ — she makes errors like anyone else — but its consistent _______.',
		[
			'originality .. conventionality',
			'infallibility .. integrity',
			'severity .. leniency',
			'popularity .. obscurity',
			'brevity .. verbosity'
		], 1,
		'She is not infallible (makes errors) but has consistent integrity (honesty, principled approach).'
	),
	q('t2-s1-15', 'sentence-completion', 1,
		'The archaeological site yielded artifacts of such remarkable _______ that researchers revised their assumptions about the _______ of the ancient culture.',
		[
			'fragility .. resilience',
			'simplicity .. primitiveness',
			'sophistication .. development',
			'antiquity .. modernity',
			'scarcity .. abundance'
		], 2,
		'Remarkably sophisticated artifacts would cause researchers to revise their views about the culture\'s level of development upward.'
	),
];

export const greTests: GRETest[] = [
	{
		id: 'practice-1',
		name: 'Practice Test 1',
		sections: [
			{
				id: 'p1-v1',
				name: 'Verbal — Section 1',
				type: 'verbal',
				timeMinutes: 30,
				questions: verbalSection1,
			},
			{
				id: 'p1-v2',
				name: 'Verbal — Section 2',
				type: 'verbal',
				timeMinutes: 30,
				questions: verbalSection2,
			},
		],
	},
	{
		id: 'practice-2',
		name: 'Practice Test 2',
		sections: [
			{
				id: 'p2-v1',
				name: 'Verbal — Section 1',
				type: 'verbal',
				timeMinutes: 30,
				questions: verbalSection3,
			},
		],
	},
];

export function getAllQuestions(): GREQuestion[] {
	return greTests.flatMap(t => t.sections.flatMap(s => s.questions));
}

export function getQuestionsByType(type: QuestionType): GREQuestion[] {
	return getAllQuestions().filter(q => q.type === type);
}

export const questionTypeLabels: Record<QuestionType, string> = {
	'sentence-completion': 'Sentence Completion',
	'analogy': 'Analogy',
	'antonym': 'Antonym',
	'reading-comprehension': 'Reading Comprehension',
};
