import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface WordEntry {
	word: string;
	definition: string;
	keywords: string[];
	partOfSpeech: string;
	example: string;
}

const words: WordEntry[] = [
	// --- User's original words ---
	{
		word: 'Stygian',
		definition: 'Extremely dark, gloomy, or forbidding',
		keywords: ['dark', 'gloomy', 'forbidding', 'shadowy', 'pitch-black', 'hellish'],
		partOfSpeech: 'adj.',
		example: 'The Stygian depths of the cave swallowed all light.'
	},
	{
		word: 'Mortuary',
		definition: 'A facility where dead bodies are kept and prepared for burial or cremation',
		keywords: ['dead', 'bodies', 'burial', 'facility', 'storing', 'corpse', 'death', 'funeral'],
		partOfSpeech: 'n.',
		example: 'The mortuary was quiet save for the hum of refrigeration units.'
	},
	{
		word: 'Augury',
		definition: 'The practice of predicting the future by interpreting omens or signs',
		keywords: ['predicting', 'future', 'omens', 'signs', 'prophecy', 'divination', 'foretelling'],
		partOfSpeech: 'n.',
		example: 'The flight of birds was once considered a reliable form of augury.'
	},
	{
		word: 'Evanescent',
		definition: 'Quickly fading or disappearing; fleeting',
		keywords: ['fading', 'disappearing', 'fleeting', 'vanishing', 'transient', 'ephemeral', 'brief'],
		partOfSpeech: 'adj.',
		example: 'The evanescent beauty of the sunset lasted only minutes.'
	},
	{
		word: 'Upbraid',
		definition: 'To scold or find fault with someone severely',
		keywords: ['scold', 'fault', 'criticize', 'rebuke', 'reprimand', 'berate', 'chide'],
		partOfSpeech: 'v.',
		example: 'The teacher upbraided the student for not completing the assignment.'
	},
	{
		word: 'Repine',
		definition: 'To feel or express discontent or unhappiness',
		keywords: ['discontent', 'unhappy', 'complain', 'fret', 'grumble', 'lament', 'dissatisfied'],
		partOfSpeech: 'v.',
		example: 'She repined at the loss of her former glory.'
	},
	{
		word: 'Inveterate',
		definition: 'Having a long-standing habit that is unlikely to change',
		keywords: ['habit', 'long-standing', 'habitual', 'chronic', 'ingrained', 'deep-rooted', 'entrenched'],
		partOfSpeech: 'adj.',
		example: 'He was an inveterate gambler who could not resist the casino.'
	},
	{
		word: 'Enervate',
		definition: 'To drain of energy or vitality; to weaken',
		keywords: ['drain', 'energy', 'weaken', 'exhaust', 'debilitate', 'tire', 'sap', 'fatigue'],
		partOfSpeech: 'v.',
		example: 'The oppressive heat enervated the workers by midday.'
	},
	{
		word: 'Lethargy',
		definition: 'A lack of energy and enthusiasm; sluggishness',
		keywords: ['lack', 'energy', 'sluggish', 'tired', 'drowsy', 'torpor', 'listless', 'apathy'],
		partOfSpeech: 'n.',
		example: 'A deep lethargy settled over the town during the heatwave.'
	},
	{
		word: 'Cogent',
		definition: 'Clear, logical, and convincing in argument or reasoning',
		keywords: ['clear', 'logical', 'convincing', 'persuasive', 'compelling', 'forceful', 'sound'],
		partOfSpeech: 'adj.',
		example: 'She presented a cogent argument that swayed the jury.'
	},
	{
		word: 'Pugnacious',
		definition: 'Eager or quick to argue, quarrel, or fight',
		keywords: ['fight', 'argue', 'aggressive', 'combative', 'belligerent', 'quarrelsome', 'hostile'],
		partOfSpeech: 'adj.',
		example: 'His pugnacious demeanor made him difficult to work with.'
	},
	{
		word: 'Opprobrious',
		definition: 'Expressing scorn, criticism, or harsh disapproval',
		keywords: ['scorn', 'criticism', 'harsh', 'abusive', 'contemptuous', 'disgraceful', 'shameful'],
		partOfSpeech: 'adj.',
		example: 'The politician faced opprobrious remarks from the opposition.'
	},
	{
		word: 'Untoward',
		definition: 'Unexpected and inappropriate or inconvenient',
		keywords: ['unexpected', 'inappropriate', 'inconvenient', 'unfavorable', 'adverse', 'improper'],
		partOfSpeech: 'adj.',
		example: 'Nothing untoward happened during the ceremony.'
	},
	{
		word: 'Blithe',
		definition: 'Showing a cheerful, casual indifference; carefree and happy',
		keywords: ['cheerful', 'carefree', 'happy', 'indifferent', 'lighthearted', 'unconcerned', 'joyful'],
		partOfSpeech: 'adj.',
		example: 'She showed a blithe disregard for the rules.'
	},
	{
		word: 'Meretricious',
		definition: 'Outwardly attractive but lacking real value or integrity; superficially appealing',
		keywords: ['attractive', 'no value', 'superficial', 'flashy', 'gaudy', 'showy', 'tawdry', 'insincere'],
		partOfSpeech: 'adj.',
		example: 'The meretricious advertisement lured many unsuspecting buyers.'
	},
	{
		word: 'Inefficacious',
		definition: 'Not producing the desired effect; ineffective',
		keywords: ['ineffective', 'useless', 'futile', 'unsuccessful', 'fruitless', 'unproductive'],
		partOfSpeech: 'adj.',
		example: 'The treatment proved inefficacious against the disease.'
	},
	{
		word: 'Specious',
		definition: 'Superficially plausible but actually wrong or misleading',
		keywords: ['plausible', 'wrong', 'misleading', 'deceptive', 'fallacious', 'false', 'sophistic'],
		partOfSpeech: 'adj.',
		example: 'His specious reasoning fooled no one on the committee.'
	},

	// --- Additional GRE words of similar difficulty ---
	{
		word: 'Truculent',
		definition: 'Eager to fight or argue; aggressively defiant',
		keywords: ['aggressive', 'defiant', 'fierce', 'hostile', 'belligerent', 'combative', 'savage'],
		partOfSpeech: 'adj.',
		example: 'The truculent protester refused to leave the building.'
	},
	{
		word: 'Querulous',
		definition: 'Complaining in a petulant or whining manner',
		keywords: ['complaining', 'whining', 'petulant', 'peevish', 'fretful', 'grumbling', 'irritable'],
		partOfSpeech: 'adj.',
		example: 'The querulous patient demanded constant attention from the nurses.'
	},
	{
		word: 'Obdurate',
		definition: 'Stubbornly refusing to change one\'s opinion or course of action',
		keywords: ['stubborn', 'unyielding', 'inflexible', 'immovable', 'intransigent', 'adamant', 'obstinate'],
		partOfSpeech: 'adj.',
		example: 'The obdurate negotiator would not budge on any terms.'
	},
	{
		word: 'Pellucid',
		definition: 'Translucently clear; easily understood',
		keywords: ['clear', 'transparent', 'lucid', 'limpid', 'crystalline', 'understandable'],
		partOfSpeech: 'adj.',
		example: 'Her pellucid prose made complex ideas accessible to all readers.'
	},
	{
		word: 'Pusillanimous',
		definition: 'Showing a lack of courage or determination; timid',
		keywords: ['cowardly', 'timid', 'fearful', 'spineless', 'weak', 'faint-hearted', 'craven'],
		partOfSpeech: 'adj.',
		example: 'His pusillanimous refusal to speak up cost the team dearly.'
	},
	{
		word: 'Calumny',
		definition: 'A false and malicious statement designed to injure someone\'s reputation',
		keywords: ['false', 'slander', 'defamation', 'libel', 'smear', 'malicious', 'reputation'],
		partOfSpeech: 'n.',
		example: 'The calumny spread about her was entirely baseless.'
	},
	{
		word: 'Abrogate',
		definition: 'To repeal or abolish a law, right, or formal agreement',
		keywords: ['repeal', 'abolish', 'revoke', 'annul', 'cancel', 'void', 'nullify'],
		partOfSpeech: 'v.',
		example: 'The new government abrogated the previous treaty.'
	},
	{
		word: 'Tendentious',
		definition: 'Expressing or promoting a particular cause or point of view, especially a controversial one',
		keywords: ['biased', 'partisan', 'one-sided', 'prejudiced', 'partial', 'slanted'],
		partOfSpeech: 'adj.',
		example: 'The documentary was criticized for its tendentious portrayal of events.'
	},
	{
		word: 'Excoriate',
		definition: 'To criticize severely; to censure',
		keywords: ['criticize', 'censure', 'denounce', 'condemn', 'lambaste', 'berate', 'rebuke'],
		partOfSpeech: 'v.',
		example: 'The editorial excoriated the mayor for his handling of the crisis.'
	},
	{
		word: 'Sanguine',
		definition: 'Optimistic or positive, especially in a difficult situation',
		keywords: ['optimistic', 'positive', 'hopeful', 'confident', 'cheerful', 'buoyant'],
		partOfSpeech: 'adj.',
		example: 'Despite the setbacks, she remained sanguine about the project\'s success.'
	},
	{
		word: 'Garrulous',
		definition: 'Excessively talkative, especially on trivial matters',
		keywords: ['talkative', 'chatty', 'verbose', 'loquacious', 'wordy', 'rambling'],
		partOfSpeech: 'adj.',
		example: 'The garrulous neighbor kept them at the door for an hour.'
	},
	{
		word: 'Laconic',
		definition: 'Using very few words; concise to the point of seeming rude',
		keywords: ['concise', 'brief', 'terse', 'succinct', 'few words', 'pithy', 'curt'],
		partOfSpeech: 'adj.',
		example: 'His laconic reply of "Fine" ended the conversation.'
	},
	{
		word: 'Perfidious',
		definition: 'Deceitful and untrustworthy; treacherous',
		keywords: ['treacherous', 'deceitful', 'disloyal', 'unfaithful', 'traitorous', 'duplicitous'],
		partOfSpeech: 'adj.',
		example: 'The perfidious ally betrayed them at the worst possible moment.'
	},
	{
		word: 'Quotidian',
		definition: 'Of or occurring every day; ordinary, commonplace',
		keywords: ['daily', 'everyday', 'ordinary', 'commonplace', 'mundane', 'routine', 'usual'],
		partOfSpeech: 'adj.',
		example: 'She found beauty in the quotidian rituals of morning coffee.'
	},
	{
		word: 'Vituperate',
		definition: 'To blame or insult someone in strong or violent language',
		keywords: ['insult', 'blame', 'berate', 'abuse', 'denounce', 'revile', 'vilify'],
		partOfSpeech: 'v.',
		example: 'The coach vituperated the referee after the controversial call.'
	},
	{
		word: 'Limpid',
		definition: 'Clear and transparent; easily understood',
		keywords: ['clear', 'transparent', 'lucid', 'pellucid', 'intelligible', 'pure'],
		partOfSpeech: 'adj.',
		example: 'The limpid waters of the mountain lake reflected the sky perfectly.'
	},
	{
		word: 'Surfeit',
		definition: 'An excessive amount of something; overindulgence',
		keywords: ['excess', 'overabundance', 'glut', 'surplus', 'overindulgence', 'too much'],
		partOfSpeech: 'n.',
		example: 'A surfeit of options left the consumer paralyzed by indecision.'
	},
	{
		word: 'Inimical',
		definition: 'Tending to obstruct or harm; hostile or unfriendly',
		keywords: ['hostile', 'harmful', 'adverse', 'unfriendly', 'antagonistic', 'detrimental'],
		partOfSpeech: 'adj.',
		example: 'The new policy was inimical to the interests of small businesses.'
	},
	{
		word: 'Recondite',
		definition: 'Little known; abstruse; dealing with obscure subject matter',
		keywords: ['obscure', 'abstruse', 'esoteric', 'arcane', 'little known', 'hidden', 'complex'],
		partOfSpeech: 'adj.',
		example: 'The professor\'s recondite lecture left most students confused.'
	},
	{
		word: 'Prodigal',
		definition: 'Spending money or resources freely and recklessly; wasteful',
		keywords: ['wasteful', 'extravagant', 'lavish', 'reckless', 'spendthrift', 'profligate'],
		partOfSpeech: 'adj.',
		example: 'His prodigal spending habits left him bankrupt within a year.'
	},
	{
		word: 'Contumacious',
		definition: 'Stubbornly or willfully disobedient to authority',
		keywords: ['disobedient', 'defiant', 'rebellious', 'insubordinate', 'unruly', 'stubborn'],
		partOfSpeech: 'adj.',
		example: 'The contumacious defendant ignored the judge\'s instructions.'
	},
	{
		word: 'Mendacious',
		definition: 'Not telling the truth; lying or false',
		keywords: ['lying', 'false', 'dishonest', 'untruthful', 'deceitful', 'deceptive'],
		partOfSpeech: 'adj.',
		example: 'The mendacious witness was eventually exposed during cross-examination.'
	},
	{
		word: 'Propitiate',
		definition: 'To win or regain the favor of someone by doing something that pleases them',
		keywords: ['appease', 'placate', 'pacify', 'conciliate', 'mollify', 'soothe', 'favor'],
		partOfSpeech: 'v.',
		example: 'He tried to propitiate his angry wife with flowers and apologies.'
	},
	{
		word: 'Insouciant',
		definition: 'Showing a casual lack of concern; carefree',
		keywords: ['carefree', 'unconcerned', 'nonchalant', 'indifferent', 'casual', 'blasé'],
		partOfSpeech: 'adj.',
		example: 'Her insouciant attitude toward deadlines frustrated her colleagues.'
	},
	{
		word: 'Didactic',
		definition: 'Intended to teach or instruct, often in a moralistic way',
		keywords: ['instructive', 'educational', 'teaching', 'moralistic', 'preachy', 'pedagogic'],
		partOfSpeech: 'adj.',
		example: 'The novel\'s didactic tone made it feel more like a lecture than a story.'
	},
	{
		word: 'Equivocate',
		definition: 'To use ambiguous language to conceal the truth or avoid commitment',
		keywords: ['ambiguous', 'vague', 'hedge', 'evasive', 'prevaricate', 'dodge', 'mislead'],
		partOfSpeech: 'v.',
		example: 'The senator equivocated when asked about her stance on the bill.'
	},
	{
		word: 'Fastidious',
		definition: 'Very attentive to detail; excessively particular or demanding',
		keywords: ['meticulous', 'particular', 'fussy', 'picky', 'exacting', 'scrupulous', 'detail'],
		partOfSpeech: 'adj.',
		example: 'His fastidious nature made him an excellent quality inspector.'
	},
	{
		word: 'Inchoate',
		definition: 'Just begun and so not fully formed or developed; rudimentary',
		keywords: ['undeveloped', 'rudimentary', 'beginning', 'nascent', 'embryonic', 'unformed'],
		partOfSpeech: 'adj.',
		example: 'The inchoate plan needed much more work before it could be implemented.'
	},
	{
		word: 'Penurious',
		definition: 'Extremely poor; unwilling to spend money; stingy',
		keywords: ['poor', 'stingy', 'miserly', 'impoverished', 'parsimonious', 'tight-fisted', 'cheap'],
		partOfSpeech: 'adj.',
		example: 'Despite his wealth, the penurious landlord refused to make repairs.'
	},
	{
		word: 'Opprobrium',
		definition: 'Harsh criticism or censure; public disgrace arising from shameful conduct',
		keywords: ['disgrace', 'shame', 'criticism', 'censure', 'infamy', 'dishonor', 'stigma'],
		partOfSpeech: 'n.',
		example: 'The scandal brought opprobrium upon the entire administration.'
	},
	{
		word: 'Execrate',
		definition: 'To feel or express great loathing for; to curse',
		keywords: ['loathe', 'detest', 'abhor', 'curse', 'despise', 'abominate', 'hate'],
		partOfSpeech: 'v.',
		example: 'The villagers execrated the tyrant who had oppressed them for years.'
	}
];

function normalizeText(text: string): string {
	return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function checkAnswer(userAnswer: string, entry: WordEntry): { correct: boolean; score: number } {
	const normalized = normalizeText(userAnswer);
	if (!normalized) return { correct: false, score: 0 };

	const userWords = normalized.split(/\s+/);

	let matchCount = 0;
	for (const keyword of entry.keywords) {
		const normalizedKeyword = normalizeText(keyword);
		if (userWords.some(w => w === normalizedKeyword || normalizedKeyword.includes(w) || w.includes(normalizedKeyword))) {
			matchCount++;
		}
	}

	const normalizedDef = normalizeText(entry.definition);
	const defWords = normalizedDef.split(/\s+/).filter(w => w.length > 3);
	for (const dw of defWords) {
		if (userWords.some(uw => uw === dw)) {
			matchCount += 0.5;
		}
	}

	const score = matchCount;
	const correct = score >= 1;
	return { correct, score };
}

export const POST: RequestHandler = async ({ request }) => {
	const { word, answer } = await request.json();

	const entry = words.find(w => w.word.toLowerCase() === word.toLowerCase());
	if (!entry) {
		return json({ error: 'Word not found' }, { status: 404 });
	}

	const { correct, score } = checkAnswer(answer, entry);

	let feedback: string;
	if (score >= 2) {
		feedback = 'Excellent! You clearly know this word.';
	} else if (correct) {
		feedback = 'Good! You got the gist of it.';
	} else if (score >= 0.5) {
		feedback = 'Close, but not quite. You\'re on the right track.';
	} else {
		feedback = 'Not quite. Let\'s learn this one.';
	}

	return json({
		correct,
		score,
		feedback,
		definition: entry.definition,
		partOfSpeech: entry.partOfSpeech,
		example: entry.example
	});
};

export const GET: RequestHandler = async () => {
	const wordList = words.map(w => ({
		word: w.word,
		partOfSpeech: w.partOfSpeech
	}));
	return json(wordList);
};
