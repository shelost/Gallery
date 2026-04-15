import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

interface WordEntry {
	word: string;
	definition: string;
	partOfSpeech: string;
	example: string;
	nearNeighbors?: string;
	roots: string;
}

const words: WordEntry[] = [
	{
		word: 'Stygian',
		definition: 'Extremely dark, gloomy, or forbidding',
		partOfSpeech: 'adj.',
		example: 'The Stygian depths of the cave swallowed all light.',
		roots: 'Greek Styx (Στύξ) — the river of the underworld in Greek mythology. Stygios = "of the Styx," hence hellish, dark.'
	},
	{
		word: 'Mortuary',
		definition: 'A facility where dead bodies are kept and prepared for burial or cremation',
		partOfSpeech: 'n.',
		example: 'The mortuary was quiet save for the hum of refrigeration units.',
		roots: 'Latin mortuārius, from mortuus = "dead," from morī = "to die." Same root as mortal, mortality, moribund.'
	},
	{
		word: 'Augury',
		definition: 'The practice of predicting the future by interpreting omens or signs',
		partOfSpeech: 'n.',
		example: 'The flight of birds was once considered a reliable form of augury.',
		nearNeighbors: 'divination, portent, prophecy',
		roots: 'Latin augurium, from augur = "a diviner who reads bird signs." Related to auspice (avis = "bird" + specere = "to look").'
	},
	{
		word: 'Evanescent',
		definition: 'Quickly fading or disappearing; fleeting',
		partOfSpeech: 'adj.',
		example: 'The evanescent beauty of the sunset lasted only minutes.',
		nearNeighbors: 'ephemeral, transient, fugacious',
		roots: 'Latin ēvanēscere: ē- = "out" + vanēscere = "to vanish," from vānus = "empty, vain." Same root as vanish.'
	},
	{
		word: 'Upbraid',
		definition: 'To scold or find fault with someone severely',
		partOfSpeech: 'v.',
		example: 'The teacher upbraided the student for not completing the assignment.',
		nearNeighbors: 'rebuke, chide, reprimand',
		roots: 'Old English ūpbregdan: up + bregdan = "to pull, snatch, weave." Sense evolved from "to pull up (faults)" → "to reproach."'
	},
	{
		word: 'Repine',
		definition: 'To feel or express discontent or unhappiness',
		partOfSpeech: 'v.',
		example: 'She repined at the loss of her former glory.',
		roots: 'Re- = "again, intensely" + pine (from Old English pīnian = "to torment, suffer"). To pine intensely = to grieve, fret.'
	},
	{
		word: 'Inveterate',
		definition: 'Having a long-standing habit that is unlikely to change',
		partOfSpeech: 'adj.',
		example: 'He was an inveterate gambler who could not resist the casino.',
		nearNeighbors: 'habitual, chronic, ingrained',
		roots: 'Latin inveterātus, from in- = "in" + vetus (veteris) = "old." Literally "made old within" — a habit aged into permanence. Same root as veteran.'
	},
	{
		word: 'Enervate',
		definition: 'To drain of energy or vitality; to weaken',
		partOfSpeech: 'v.',
		example: 'The oppressive heat enervated the workers by midday.',
		nearNeighbors: 'debilitate, sap, exhaust',
		roots: 'Latin ēnervāre: ē- = "out of" + nervus = "sinew, nerve." Literally "to remove the sinews from" — to weaken. (Not to energize!)'
	},
	{
		word: 'Lethargy',
		definition: 'A lack of energy and enthusiasm; sluggishness',
		partOfSpeech: 'n.',
		example: 'A deep lethargy settled over the town during the heatwave.',
		nearNeighbors: 'torpor, languor, listlessness',
		roots: 'Greek lēthē = "forgetfulness" (as in the river Lethe) + argos = "idle." Literally "forgetful idleness" — drowsy inaction.'
	},
	{
		word: 'Cogent',
		definition: 'Clear, logical, and convincing in argument or reasoning',
		partOfSpeech: 'adj.',
		example: 'She presented a cogent argument that swayed the jury.',
		nearNeighbors: 'compelling, persuasive, sound',
		roots: 'Latin cōgēns, from cōgere: co- = "together" + agere = "to drive." Literally "driving together" — an argument that drives points home.'
	},
	{
		word: 'Pugnacious',
		definition: 'Eager or quick to argue, quarrel, or fight',
		partOfSpeech: 'adj.',
		example: 'His pugnacious demeanor made him difficult to work with.',
		nearNeighbors: 'belligerent, combative, truculent',
		roots: 'Latin pugnāx, from pugnāre = "to fight," from pugnus = "fist." Same root as pugilist (boxer), impugn.'
	},
	{
		word: 'Opprobrious',
		definition: 'Expressing scorn, criticism, or harsh disapproval',
		partOfSpeech: 'adj.',
		example: 'The politician faced opprobrious remarks from the opposition.',
		roots: 'Latin opprobrium: ob- = "against" + probrum = "reproach, infamy." Literally "a reproach thrown against someone."'
	},
	{
		word: 'Untoward',
		definition: 'Unexpected and inappropriate or inconvenient',
		partOfSpeech: 'adj.',
		example: 'Nothing untoward happened during the ceremony.',
		roots: 'Un- = "not" + toward (Middle English = "favorable, compliant"). Literally "not favorable" — hence unexpected and unwelcome.'
	},
	{
		word: 'Blithe',
		definition: 'Showing a cheerful, casual indifference; carefree and happy',
		partOfSpeech: 'adj.',
		example: 'She showed a blithe disregard for the rules.',
		nearNeighbors: 'insouciant, nonchalant, lighthearted',
		roots: 'Old English blīðe = "joyous, cheerful, kind." Germanic origin. Related to bliss.'
	},
	{
		word: 'Meretricious',
		definition: 'Outwardly attractive but lacking real value or integrity; superficially appealing',
		partOfSpeech: 'adj.',
		example: 'The meretricious advertisement lured many unsuspecting buyers.',
		nearNeighbors: 'tawdry, gaudy, specious',
		roots: 'Latin meretrīcius, from meretrix = "prostitute," from merēre = "to earn." Literally "of a prostitute" — flashy allure without substance.'
	},
	{
		word: 'Inefficacious',
		definition: 'Not producing the desired effect; ineffective',
		partOfSpeech: 'adj.',
		example: 'The treatment proved inefficacious against the disease.',
		roots: 'In- = "not" + efficāx (from efficere = "to accomplish"): ex- = "out" + facere = "to make/do." Not able to accomplish the task.'
	},
	{
		word: 'Specious',
		definition: 'Superficially plausible but actually wrong or misleading',
		partOfSpeech: 'adj.',
		example: 'His specious reasoning fooled no one on the committee.',
		nearNeighbors: 'fallacious, sophistic, casuistic',
		roots: 'Latin speciōsus = "beautiful, fair-seeming," from speciēs = "appearance." Looks good on the surface but is false underneath.'
	},
	{
		word: 'Truculent',
		definition: 'Eager to fight or argue; aggressively defiant',
		partOfSpeech: 'adj.',
		example: 'The truculent protester refused to leave the building.',
		nearNeighbors: 'pugnacious, belligerent, combative',
		roots: 'Latin truculentus = "fierce, savage," from trux (trucis) = "fierce, wild." Related to ferocity of manner.'
	},
	{
		word: 'Querulous',
		definition: 'Complaining in a petulant or whining manner',
		partOfSpeech: 'adj.',
		example: 'The querulous patient demanded constant attention from the nurses.',
		nearNeighbors: 'peevish, petulant, fractious',
		roots: 'Latin querulus = "complaining," from querī = "to complain." Same root as quarrel.'
	},
	{
		word: 'Obdurate',
		definition: 'Stubbornly refusing to change one\'s opinion or course of action',
		partOfSpeech: 'adj.',
		example: 'The obdurate negotiator would not budge on any terms.',
		nearNeighbors: 'intransigent, adamant, obstinate',
		roots: 'Latin obdūrāre: ob- = "against" + dūrāre = "to harden," from dūrus = "hard." Literally "hardened against" — unyielding. Same root as durable, endure.'
	},
	{
		word: 'Pellucid',
		definition: 'Translucently clear; easily understood',
		partOfSpeech: 'adj.',
		example: 'Her pellucid prose made complex ideas accessible to all readers.',
		nearNeighbors: 'limpid, lucid, crystalline',
		roots: 'Latin pellūcidus: per- = "through" + lūcidus = "bright, clear," from lūx = "light." Literally "shining through." Same root as lucid, translucent.'
	},
	{
		word: 'Pusillanimous',
		definition: 'Showing a lack of courage or determination; timid',
		partOfSpeech: 'adj.',
		example: 'His pusillanimous refusal to speak up cost the team dearly.',
		nearNeighbors: 'craven, cowardly, faint-hearted',
		roots: 'Latin pusillanimis: pusillus = "very small" + animus = "spirit, mind." Literally "small-spirited" — lacking courage.'
	},
	{
		word: 'Calumny',
		definition: 'A false and malicious statement designed to injure someone\'s reputation',
		partOfSpeech: 'n.',
		example: 'The calumny spread about her was entirely baseless.',
		nearNeighbors: 'slander, defamation, libel',
		roots: 'Latin calumnia = "false accusation, trickery," from calvī = "to deceive." A deliberate deception to damage.'
	},
	{
		word: 'Abrogate',
		definition: 'To repeal or abolish a law, right, or formal agreement',
		partOfSpeech: 'v.',
		example: 'The new government abrogated the previous treaty.',
		nearNeighbors: 'annul, revoke, rescind',
		roots: 'Latin abrogāre: ab- = "away" + rogāre = "to ask, propose (a law)." Literally "to ask away" a law — to formally cancel it.'
	},
	{
		word: 'Tendentious',
		definition: 'Expressing or promoting a particular cause or point of view, especially a controversial one',
		partOfSpeech: 'adj.',
		example: 'The documentary was criticized for its tendentious portrayal of events.',
		nearNeighbors: 'biased, partisan, slanted',
		roots: 'From tendency, from Latin tendere = "to stretch, aim." Writing that "stretches toward" a particular bias.'
	},
	{
		word: 'Excoriate',
		definition: 'To criticize severely; to censure',
		partOfSpeech: 'v.',
		example: 'The editorial excoriated the mayor for his handling of the crisis.',
		nearNeighbors: 'lambaste, denounce, castigate',
		roots: 'Latin excoriāre: ex- = "off" + corium = "skin, hide." Literally "to strip the skin off" — figuratively, to flay with words.'
	},
	{
		word: 'Sanguine',
		definition: 'Optimistic or positive, especially in a difficult situation',
		partOfSpeech: 'adj.',
		example: 'Despite the setbacks, she remained sanguine about the project\'s success.',
		nearNeighbors: 'buoyant, hopeful, confident',
		roots: 'Latin sanguineus = "of blood," from sanguis = "blood." Medieval medicine linked "blood" temperament to optimism and cheerfulness.'
	},
	{
		word: 'Garrulous',
		definition: 'Excessively talkative, especially on trivial matters',
		partOfSpeech: 'adj.',
		example: 'The garrulous neighbor kept them at the door for an hour.',
		nearNeighbors: 'loquacious, verbose, voluble',
		roots: 'Latin garrulus = "chattering," from garrīre = "to chatter, prattle." Imitative origin — the sound of babbling.'
	},
	{
		word: 'Laconic',
		definition: 'Using very few words; concise to the point of seeming rude',
		partOfSpeech: 'adj.',
		example: 'His laconic reply of "Fine" ended the conversation.',
		nearNeighbors: 'terse, succinct, pithy',
		roots: 'Greek Lakōnikos = "of Laconia (Sparta)." Spartans were famously terse. Philip II: "If I invade, I shall destroy." Spartans\' reply: "If."'
	},
	{
		word: 'Perfidious',
		definition: 'Deceitful and untrustworthy; treacherous',
		partOfSpeech: 'adj.',
		example: 'The perfidious ally betrayed them at the worst possible moment.',
		nearNeighbors: 'treacherous, duplicitous, disloyal',
		roots: 'Latin perfidus: per- = "through, to destruction" + fidēs = "faith." Literally "through-faith" (faith broken). Same root as fidelity.'
	},
	{
		word: 'Quotidian',
		definition: 'Of or occurring every day; ordinary, commonplace',
		partOfSpeech: 'adj.',
		example: 'She found beauty in the quotidian rituals of morning coffee.',
		nearNeighbors: 'mundane, routine, workaday',
		roots: 'Latin quotīdiānus, from quotidie = "every day": quot = "how many" + diēs = "day."'
	},
	{
		word: 'Vituperate',
		definition: 'To blame or insult someone in strong or violent language',
		partOfSpeech: 'v.',
		example: 'The coach vituperated the referee after the controversial call.',
		nearNeighbors: 'revile, vilify, berate',
		roots: 'Latin vituperāre: vitium = "fault, vice" + parāre = "to prepare, make." Literally "to make fault" — to blame viciously.'
	},
	{
		word: 'Limpid',
		definition: 'Clear and transparent; easily understood',
		partOfSpeech: 'adj.',
		example: 'The limpid waters of the mountain lake reflected the sky perfectly.',
		nearNeighbors: 'pellucid, lucid, crystalline',
		roots: 'Latin limpidus = "clear, transparent." Possibly related to lympha = "clear water." (Not related to limp.)'
	},
	{
		word: 'Surfeit',
		definition: 'An excessive amount of something; overindulgence',
		partOfSpeech: 'n.',
		example: 'A surfeit of options left the consumer paralyzed by indecision.',
		nearNeighbors: 'glut, excess, plethora',
		roots: 'Old French surfait = "excess," from surfaire: sur- = "over" + faire = "to do" (Latin facere). Literally "overdone."'
	},
	{
		word: 'Inimical',
		definition: 'Tending to obstruct or harm; hostile or unfriendly',
		partOfSpeech: 'adj.',
		example: 'The new policy was inimical to the interests of small businesses.',
		nearNeighbors: 'adverse, antagonistic, detrimental',
		roots: 'Latin inimīcālis, from inimīcus: in- = "not" + amīcus = "friend." Literally "unfriendly." Same root as enemy.'
	},
	{
		word: 'Recondite',
		definition: 'Little known; abstruse; dealing with obscure subject matter',
		partOfSpeech: 'adj.',
		example: 'The professor\'s recondite lecture left most students confused.',
		nearNeighbors: 'esoteric, arcane, abstruse',
		roots: 'Latin reconditus = "hidden away," from recondere: re- = "back" + condere = "to put away, store." Knowledge hidden from plain view.'
	},
	{
		word: 'Prodigal',
		definition: 'Spending money or resources freely and recklessly; wasteful',
		partOfSpeech: 'adj.',
		example: 'His prodigal spending habits left him bankrupt within a year.',
		nearNeighbors: 'profligate, spendthrift, extravagant',
		roots: 'Latin prōdigus = "wasteful," from prōdigere: prōd- = "forth" + agere = "to drive." Literally "driving forth" wealth — squandering it.'
	},
	{
		word: 'Contumacious',
		definition: 'Stubbornly or willfully disobedient to authority',
		partOfSpeech: 'adj.',
		example: 'The contumacious defendant ignored the judge\'s instructions.',
		nearNeighbors: 'insubordinate, rebellious, recalcitrant',
		roots: 'Latin contumāx = "obstinate, insolent," from con- = "with" + tumēre = "to swell." Literally "swelling with pride" — puffed-up defiance.'
	},
	{
		word: 'Mendacious',
		definition: 'Not telling the truth; lying or false',
		partOfSpeech: 'adj.',
		example: 'The mendacious witness was eventually exposed during cross-examination.',
		nearNeighbors: 'dishonest, deceitful, untruthful',
		roots: 'Latin mendāx (mendācis) = "lying," from mendum = "fault, defect." A person with "faults" in their truth-telling.'
	},
	{
		word: 'Propitiate',
		definition: 'To win or regain the favor of someone by doing something that pleases them',
		partOfSpeech: 'v.',
		example: 'He tried to propitiate his angry wife with flowers and apologies.',
		nearNeighbors: 'appease, placate, mollify',
		roots: 'Latin propitiāre = "to make favorable," from propitius = "favorable, gracious." Pro- = "forward" + petere = "to seek."'
	},
	{
		word: 'Insouciant',
		definition: 'Showing a casual lack of concern; carefree',
		partOfSpeech: 'adj.',
		example: 'Her insouciant attitude toward deadlines frustrated her colleagues.',
		nearNeighbors: 'nonchalant, blithe, blasé',
		roots: 'French insouciant: in- = "not" + souciant = "worrying," from soucier = "to worry" (Latin sollicitāre). Literally "not worried."'
	},
	{
		word: 'Didactic',
		definition: 'Intended to teach or instruct, often in a moralistic way',
		partOfSpeech: 'adj.',
		example: 'The novel\'s didactic tone made it feel more like a lecture than a story.',
		nearNeighbors: 'pedagogic, instructive, preachy',
		roots: 'Greek didaktikos = "apt at teaching," from didaskein = "to teach." Same root as autodidact (self-taught).'
	},
	{
		word: 'Equivocate',
		definition: 'To use ambiguous language to conceal the truth or avoid commitment',
		partOfSpeech: 'v.',
		example: 'The senator equivocated when asked about her stance on the bill.',
		nearNeighbors: 'prevaricate, hedge, waffle',
		roots: 'Latin aequivocāre: aequi- = "equal" + vocāre = "to call." Literally "to call equally" — speaking in two voices to avoid clarity.'
	},
	{
		word: 'Fastidious',
		definition: 'Very attentive to detail; excessively particular or demanding',
		partOfSpeech: 'adj.',
		example: 'His fastidious nature made him an excellent quality inspector.',
		nearNeighbors: 'meticulous, scrupulous, exacting',
		roots: 'Latin fastīdium = "loathing, squeamishness," from fastus = "arrogance" + taedium = "disgust." Originally "easily disgusted" → now picky.'
	},
	{
		word: 'Inchoate',
		definition: 'Just begun and so not fully formed or developed; rudimentary',
		partOfSpeech: 'adj.',
		example: 'The inchoate plan needed much more work before it could be implemented.',
		nearNeighbors: 'nascent, embryonic, fledgling',
		roots: 'Latin inchoāre = "to begin, start work on." In- = "upon" + a root related to starting. Just getting underway.'
	},
	{
		word: 'Penurious',
		definition: 'Extremely poor; unwilling to spend money; stingy',
		partOfSpeech: 'adj.',
		example: 'Despite his wealth, the penurious landlord refused to make repairs.',
		nearNeighbors: 'parsimonious, miserly, tight-fisted',
		roots: 'Latin penūria = "want, need, scarcity." Related to paene = "almost" — almost having nothing.'
	},
	{
		word: 'Opprobrium',
		definition: 'Harsh criticism or censure; public disgrace arising from shameful conduct',
		partOfSpeech: 'n.',
		example: 'The scandal brought opprobrium upon the entire administration.',
		nearNeighbors: 'infamy, ignominy, stigma',
		roots: 'Latin opprobrium: ob- = "against" + probrum = "reproach, infamy." Same family as opprobrious.'
	},
	{
		word: 'Execrate',
		definition: 'To feel or express great loathing for; to curse',
		partOfSpeech: 'v.',
		example: 'The villagers execrated the tyrant who had oppressed them for years.',
		nearNeighbors: 'abhor, detest, abominate',
		roots: 'Latin exsecrāre: ex- = "out" + sacrāre = "to make sacred/cursed." Literally "to put out of the sacred" — to curse, banish.'
	},
	{
		word: 'Descry',
		definition: 'To catch sight of something, often distant or hard to see; to discover by looking carefully',
		partOfSpeech: 'v.',
		example: 'From the hill, they descried the coast in the distance.',
		nearNeighbors: 'espy, discern, spot',
		roots: 'Old French descrier = "to proclaim, cry out" (what you shout when you spot something far away). Evolved into "to catch sight of."'
	},
	{
		word: 'Encomium',
		definition: 'A formal speech or piece of writing that praises someone or something lavishly; a glowing tribute',
		partOfSpeech: 'n.',
		example: 'The retiring professor received a heartfelt encomium from her colleagues.',
		nearNeighbors: 'panegyric, eulogy, tribute',
		roots: 'Greek enkōmion: en- = "in" + kōmos = "revel, celebration." Originally a song performed at a victory celebration.'
	},
	{
		word: 'Diatribe',
		definition: 'A long, forceful, bitter verbal attack; an angry tirade or rant',
		partOfSpeech: 'n.',
		example: 'The senator launched a diatribe against the proposed legislation.',
		nearNeighbors: 'tirade, harangue, polemic',
		roots: 'Greek diatribē = "a wearing away, a pastime," from dia- = "through" + tribein = "to rub." Originally a philosophical discourse; sense shifted to hostile speech.'
	},
	{
		word: 'Panacea',
		definition: 'A supposed cure-all; a remedy for all difficulties or diseases',
		partOfSpeech: 'n.',
		example: 'There is no panacea for the complex problem of poverty.',
		nearNeighbors: 'cure-all, elixir, nostrum',
		roots: 'Greek panakeia: pan- = "all" + akos = "remedy, cure." Panakeia was also a Greek goddess of universal healing.'
	},
	{
		word: 'Bowdlerize',
		definition: 'To censor a text by removing parts deemed offensive, indecent, or improper — often making it weaker or distorted',
		partOfSpeech: 'v.',
		example: 'The publisher bowdlerized the novel to make it suitable for younger readers.',
		nearNeighbors: 'expurgate, sanitize, censor',
		roots: 'Eponymous — from Thomas Bowdler, who published a "family-friendly" edition of Shakespeare in 1818, cutting anything he deemed improper.'
	},
	{
		word: 'Placate',
		definition: 'To appease or pacify someone, especially to calm someone who is angry or soothe resentment',
		partOfSpeech: 'v.',
		example: 'She tried to placate the angry customer with a full refund.',
		nearNeighbors: 'mollify, conciliate, propitiate',
		roots: 'Latin placāre = "to calm, soothe," from placēre = "to please." Same root as placid, complacent, please.'
	},
	{
		word: 'Impugn',
		definition: 'To attack the truth, honesty, or validity of something; to call into question or discredit',
		partOfSpeech: 'v.',
		example: 'The lawyer attempted to impugn the credibility of the witness.',
		nearNeighbors: 'challenge, dispute, question',
		roots: 'Latin impugnāre: in- = "against" + pugnāre = "to fight." Literally "to fight against" — same root as pugnacious, pugilist.'
	},
	{
		word: 'Perfunctory',
		definition: 'Done carelessly or mechanically, with minimal attention or interest; going through the motions',
		partOfSpeech: 'adj.',
		example: 'He gave a perfunctory nod and returned to his work.',
		nearNeighbors: 'cursory, half-hearted, desultory',
		roots: 'Latin perfunctōrius, from perfungī: per- = "through" + fungī = "to perform." Literally "getting through it" — doing just enough to be done.'
	},
	{
		word: 'Vacillate',
		definition: 'To oscillate or waver between options, opinions, or courses of action; to be indecisive',
		partOfSpeech: 'v.',
		example: 'She vacillated between accepting the job offer and staying put.',
		nearNeighbors: 'waver, fluctuate, dither',
		roots: 'Latin vacillāre = "to sway, totter, waver." (Not from vacuus/vacuum — despite the sound.) Think: teetering back and forth.'
	},
	{
		word: 'Obsequious',
		definition: 'Excessively eager to please or obey; fawning and servile in a sycophantic way',
		partOfSpeech: 'adj.',
		example: 'The obsequious assistant agreed with everything the boss said.',
		nearNeighbors: 'sycophantic, fawning, servile',
		roots: 'Latin obsequiōsus, from obsequī: ob- = "toward" + sequī = "to follow." Literally "following toward" someone — trailing at their heels to please.'
	},
	{
		word: 'Munificent',
		definition: 'Extremely generous; lavish in giving',
		partOfSpeech: 'adj.',
		example: 'The munificent donor funded the construction of an entire library.',
		nearNeighbors: 'bountiful, liberal, philanthropic',
		roots: 'Latin mūnificus: mūnus = "gift, duty" + facere = "to make/do." Literally "gift-making" — one who makes gifts freely.'
	}
];

async function evaluateWithAI(word: string, definition: string, userAnswer: string, example: string, nearNeighbors?: string): Promise<{
	correct: boolean;
	feedback: string;
}> {
	const apiKey = env.OPENAI_API_KEY;
	if (!apiKey) {
		return evaluateLocally(word, definition, userAnswer);
	}

	const systemPrompt = `You are a GRE vocabulary tutor. A student is quizzed on vocabulary words and gives a short answer (could be a single word, a phrase, or "idk"/"I don't know").

Your job:
1. Determine if their answer captures the core meaning (be generous — partial credit counts, synonyms count, rough paraphrases count).
2. Give a SHORT, helpful 1-3 sentence response in a conversational, direct tone — like a knowledgeable tutor.

Rules for your feedback:
- If correct or close: Affirm briefly, then add a nuance or tighter phrasing if helpful. Example: "Yes. Diatribe is a long, forceful attack—a bitter verbal tirade or rant."
- If partially correct (right direction but imprecise): Say "Right direction" or "Close" and explain the precise meaning. Contrast their answer with the real meaning. Example: "Right direction, tighter sense: placate is to appease or pacify—especially to calm someone who is angry."
- If wrong: Don't be harsh. Say the real definition clearly. If their guess reveals a logical confusion (like confusing roots), point it out helpfully. Example: "Not empty. You might be hearing vacate/vacuum in vacillate, but the sense is wavering."
- If they say "idk" or "I don't know" or leave it blank: Just teach the word directly. Give the definition and a brief memorable note.
- Keep responses concise. No bullet points. Plain text only. 1-3 sentences max.

Respond as JSON: {"correct": true/false, "feedback": "your response"}
"correct" should be true if the student got the core meaning right or very close (even if imprecise). Be generous but honest.`;

	const userPrompt = `Word: ${word}
Correct definition: ${definition}
Example: ${example}${nearNeighbors ? `\nNear neighbors: ${nearNeighbors}` : ''}

Student's answer: "${userAnswer}"`;

	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				temperature: 0.3,
				max_tokens: 200
			})
		});

		if (!response.ok) {
			console.error('OpenAI API error:', response.status);
			return evaluateLocally(word, definition, userAnswer);
		}

		const data = await response.json();
		const content = data.choices?.[0]?.message?.content;

		if (!content) {
			return evaluateLocally(word, definition, userAnswer);
		}

		const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		const parsed = JSON.parse(cleaned);
		return {
			correct: Boolean(parsed.correct),
			feedback: parsed.feedback || ''
		};
	} catch (err) {
		console.error('AI evaluation failed:', err);
		return evaluateLocally(word, definition, userAnswer);
	}
}

function evaluateLocally(word: string, definition: string, userAnswer: string): { correct: boolean; feedback: string } {
	const normalized = userAnswer.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

	if (!normalized || normalized === 'idk' || normalized === 'i dont know' || normalized === 'i don\'t know') {
		return { correct: false, feedback: `${word} means: ${definition}.` };
	}

	const defWords = definition.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
	const answerWords = normalized.split(/\s+/);

	let matches = 0;
	for (const dw of defWords) {
		if (answerWords.some(aw => aw === dw || aw.includes(dw) || dw.includes(aw))) {
			matches++;
		}
	}

	const correct = matches >= 1;
	const feedback = correct
		? `Yes. ${word} means: ${definition}.`
		: `Not quite. ${word} means: ${definition}.`;

	return { correct, feedback };
}

export const POST: RequestHandler = async ({ request }) => {
	const { word, answer } = await request.json();

	const entry = words.find(w => w.word.toLowerCase() === word.toLowerCase());
	if (!entry) {
		return json({ error: 'Word not found' }, { status: 404 });
	}

	const isBlank = !answer || !answer.trim() || /^(idk|i don'?t know|no idea|skip|\?+|dunno|not sure)$/i.test(answer.trim());

	let correct: boolean;
	let feedback: string;

	if (isBlank) {
		correct = false;
		feedback = `${entry.word} means: ${entry.definition}.${entry.nearNeighbors ? ` Near neighbors: ${entry.nearNeighbors}.` : ''}`;
	} else {
		const result = await evaluateWithAI(entry.word, entry.definition, answer, entry.example, entry.nearNeighbors);
		correct = result.correct;
		feedback = result.feedback;
	}

	return json({
		correct,
		feedback,
		definition: entry.definition,
		partOfSpeech: entry.partOfSpeech,
		example: entry.example,
		nearNeighbors: entry.nearNeighbors || null,
		roots: entry.roots
	});
};

export const GET: RequestHandler = async () => {
	const wordList = words.map(w => ({
		word: w.word,
		partOfSpeech: w.partOfSpeech
	}));
	return json(wordList);
};
