import { createSubscriber } from 'svelte/reactivity';

/** Where I live, for the clock and the weather. */
export const HOME = { place: 'Ithaca, NY', zone: 'America/New_York', latitude: 42.444, longitude: -76.5019 };

/** I was born on 23 August 2003 in Daejeon. */
export const BIRTHDAY = { label: '23 Aug 2003', year: 2003 };

/** Midnight on my birthday in Daejeon (UTC+9), in a given year. @param {number} year */
function birthday(year) {
	return Date.UTC(year, 7, 22, 15);
}

/** Two digits, the way clocks and dates show them. @param {number} value */
export function pad(value) {
	return String(value).padStart(2, '0');
}

/**
 * The current time, as a reactive value. Reading `current` in an effect or the template starts a
 * timer, which stops once nothing reads it. It stays null on the server and until the first tick,
 * so prerendered HTML and hydration agree on a placeholder.
 */
export class Now {
	/** @type {number | null} */
	#time = null;
	#subscribe;

	/** @param {number} interval milliseconds between ticks */
	constructor(interval) {
		this.#subscribe = createSubscriber((update) => {
			const tick = () => {
				this.#time = Date.now();
				update();
			};
			const first = requestAnimationFrame(tick);
			const timer = setInterval(tick, interval);
			return () => {
				cancelAnimationFrame(first);
				clearInterval(timer);
			};
		});
	}

	get current() {
		this.#subscribe();
		return this.#time;
	}
}

/**
 * My age in years, counting the fraction of the current year of life.
 * @param {number} time
 */
export function age(time) {
	let year = new Date(time).getUTCFullYear();
	if (birthday(year) > time) year -= 1;
	const last = birthday(year);
	const next = birthday(year + 1);
	return {
		years: year - BIRTHDAY.year + (time - last) / (next - last),
		turning: year + 1 - BIRTHDAY.year,
		daysLeft: Math.ceil((next - time) / 864e5)
	};
}

/** @param {number} time */
export function fractionalYear(time) {
	const year = new Date(time).getUTCFullYear();
	const start = Date.UTC(year, 0, 1);
	return year + (time - start) / (Date.UTC(year + 1, 0, 1) - start);
}

/** @type {Map<string, Intl.DateTimeFormat>} */
const formats = new Map();

/** @param {string} zone */
function formatIn(zone) {
	let format = formats.get(zone);
	if (!format) {
		format = new Intl.DateTimeFormat('en-US', {
			timeZone: zone,
			hourCycle: 'h23',
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric',
			weekday: 'short',
			timeZoneName: 'short'
		});
		formats.set(zone, format);
	}
	return format;
}

/**
 * The wall clock in a time zone, with the zone's offset from UTC in minutes.
 * @param {number} time
 * @param {string} zone
 */
export function wallClock(time, zone) {
	/** @type {Record<string, string>} */
	const parts = {};
	for (const part of formatIn(zone).formatToParts(time)) parts[part.type] = part.value;
	const year = Number(parts.year);
	const month = Number(parts.month);
	const day = Number(parts.day);
	const hour = Number(parts.hour) % 24;
	const minute = Number(parts.minute);
	const second = Number(parts.second);
	const wall = Date.UTC(year, month - 1, day, hour, minute, second);
	return {
		year,
		month,
		day,
		hour,
		minute,
		second,
		weekday: parts.weekday,
		zone: parts.timeZoneName,
		offset: Math.round((wall - Math.floor(time / 1000) * 1000) / 60000)
	};
}

/**
 * How a zone's clock compares with the visitor's own.
 * @param {number} offset the zone's minutes east of UTC
 * @param {number} time
 */
export function relativeTo(offset, time) {
	const difference = offset + new Date(time).getTimezoneOffset();
	if (difference === 0) return 'Same time as you';
	const hours = Math.abs(difference) / 60;
	return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${difference > 0 ? 'ahead of' : 'behind'} you`;
}

/** @param {{ year: number, month: number, day: number }} date */
export function dayOfYear({ year, month, day }) {
	const start = Date.UTC(year, 0, 1);
	return {
		day: (Date.UTC(year, month - 1, day) - start) / 864e5 + 1,
		of: (Date.UTC(year + 1, 0, 1) - start) / 864e5
	};
}

const SYNODIC_DAYS = 29.530588853;
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const PHASES = [
	'New moon',
	'Waxing crescent',
	'First quarter',
	'Waxing gibbous',
	'Full moon',
	'Waning gibbous',
	'Last quarter',
	'Waning crescent'
];

/**
 * The moon's phase (0 is new, 0.5 is full), how much of it is lit, and the lit part of its disc
 * as an SVG path in a unit circle.
 * @param {number} time
 */
export function moon(time) {
	const phase = ((((time - NEW_MOON) / 864e5 / SYNODIC_DAYS) % 1) + 1) % 1;
	const waxing = phase < 0.5;
	const gibbous = phase > 0.25 && phase < 0.75;
	const terminator = Math.abs(Math.cos(phase * 2 * Math.PI));
	return {
		phase,
		name: PHASES[Math.round(phase * 8) % 8],
		lit: (1 - Math.cos(phase * 2 * Math.PI)) / 2,
		path: `M0 -1A1 1 0 0 ${waxing ? 1 : 0} 0 1A${terminator} 1 0 0 ${waxing === gibbous ? 1 : 0} 0 -1Z`
	};
}

/** @typedef {{ year: string, text: string, href?: string }} Fact */

const GRIM =
	/\b(kill|murder|massacr|bomb(s|ed|er|ers|ing|ings)?\b|attack|terror|shoot|shot\b|gun(s|man|men|fire)?\b|crash|explo(de|ded|des|ding|sion|sions|sive|sives)\b|disaster|earthquake|tsunami|hurricane|cyclone|flood|fire\b|fires\b|burn(ed|ing|t|s)?\b|riot|execut|assassin|genocid|hostage|hijack|kidnap|abduct|captiv|hang(ed|ing)\b|forced|behead|tortur|poison|coup\b|sank\b|sink|sunk|wound|injur|die\b|died|dies\b|death|dead(ly)?\b|abus|slave|famine|epidemic|pandemic|police|arrest|prison|siege|rebel|conquer|captur|army|armies|troop|militar|soldier|nazi|weapon|nuclear|missile|crime|criminal|trial\b|convict|sentenc|suicid|war\b|wars\b|warfare|battle|invad|invasion|landslide|collaps|deport|persecut|protest|strike\b|occup|annex|fascis|revolt|revolution|raid|pogrom|lynch|torpedo|casualt|victim|tragedy|surrender|defeat|overthr|depos(ed|ing|ition)\b|independence|dictator|regime|martial|sectarian|ethnic|crisis)/i;

const BRIGHT =
	/\b(discover|first\b|launch|releas|premier|invent|publish|founded|unveil|debut|introduc|patent|landed|landing|flight|orbit|broadcast|record|award|prize|museum|music|film|album|novel|game|computer|internet|web\b|telescope|planet|comet|crater|satellite|spacecraft|probe|opera|symphony|painting|opened)/i;

/** @param {string} text */
function tidy(text) {
	return text
		.replace(/\s*\((?:pictured|depicted|shown|illustrated)[^)]*\)/gi, '')
		.replace(/\s+([.,;:])/g, '$1')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * The day's anniversaries worth a smile: grim ones dropped, discoveries and premieres first.
 * @param {{ year: number, text: string, pages?: { content_urls?: { desktop?: { page?: string } } }[] }[]} events
 * @returns {Fact[]}
 */
export function pleasant(events) {
	const seen = new Set();
	const kept = [];
	for (const event of events) {
		if (GRIM.test(event.text) || seen.has(event.text)) continue;
		seen.add(event.text);
		kept.push({ event, bright: BRIGHT.test(event.text) });
	}
	return kept
		.sort((a, b) => Number(b.bright) - Number(a.bright))
		.map(({ event }) => ({
			year: String(event.year),
			text: tidy(event.text),
			href: event.pages?.[0]?.content_urls?.desktop?.page
		}));
}

const FEED = 'https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected';

/** @template T @param {string} key @returns {T | null} */
function readCache(key) {
	try {
		const value = sessionStorage.getItem(key);
		return value ? JSON.parse(value) : null;
	} catch {
		return null;
	}
}

/** @param {string} key @param {unknown} value */
function writeCache(key, value) {
	try {
		sessionStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Storage can be full or blocked; the value is refetched next time.
	}
}

/**
 * Pleasant anniversaries of a date from Wikipedia's "On this day", cached for the session.
 * @param {number} month 1 to 12
 * @param {number} day
 * @param {AbortSignal} [signal]
 * @returns {Promise<Fact[]>}
 */
export async function loadFacts(month, day, signal) {
	const date = `${pad(month)}/${pad(day)}`;
	const key = `on-this-day:${date}`;
	/** @type {Fact[] | null} */
	const cached = readCache(key);
	if (cached) return cached;
	const response = await fetch(`${FEED}/${date}`, {
		signal,
		headers: { 'Api-User-Agent': 'Heewon Ahn portfolio (ahnheewon823@gmail.com)' }
	});
	if (!response.ok) throw new Error(`On this day: ${response.status}`);
	const { selected = [] } = await response.json();
	const facts = pleasant(selected);
	writeCache(key, facts);
	return facts;
}

/** WMO weather interpretation codes, grouped the way a person would say them. */
const SKIES = /** @type {[number[], string, string][]} */ ([
	[[0], 'Clear', '☀'],
	[[1, 2], 'Partly cloudy', '⛅'],
	[[3], 'Overcast', '☁'],
	[[45, 48], 'Fog', '🌫'],
	[[51, 53, 55, 56, 57], 'Drizzle', '🌦'],
	[[61, 63, 65, 66, 67, 80, 81, 82], 'Rain', '🌧'],
	[[71, 73, 75, 77, 85, 86], 'Snow', '❄'],
	[[95, 96, 99], 'Thunderstorm', '⛈']
]);

/** @param {number} code */
function sky(code) {
	const match = SKIES.find(([codes]) => codes.includes(code));
	return { label: match?.[1] ?? 'Unsettled', icon: match?.[2] ?? '☁' };
}

/**
 * @typedef {{ temperature: number, feels: number, high: number, low: number, wind: number, label: string, icon: string, day: boolean }} Weather
 */

const FORECAST = 'https://api.open-meteo.com/v1/forecast';

/**
 * The weather at home right now, from Open-Meteo, cached for half an hour of the session.
 * Temperatures are in Celsius and wind in km/h.
 * @param {AbortSignal} [signal]
 * @returns {Promise<Weather>}
 */
export async function loadWeather(signal) {
	const key = `weather:${Math.floor(Date.now() / 18e5)}`;
	/** @type {Weather | null} */
	const cached = readCache(key);
	if (cached) return cached;
	const query = new URLSearchParams({
		latitude: String(HOME.latitude),
		longitude: String(HOME.longitude),
		current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
		daily: 'temperature_2m_max,temperature_2m_min',
		timezone: HOME.zone,
		forecast_days: '1'
	});
	const response = await fetch(`${FORECAST}?${query}`, { signal });
	if (!response.ok) throw new Error(`Weather: ${response.status}`);
	const { current, daily } = await response.json();
	const weather = {
		temperature: current.temperature_2m,
		feels: current.apparent_temperature,
		high: daily.temperature_2m_max[0],
		low: daily.temperature_2m_min[0],
		wind: current.wind_speed_10m,
		day: current.is_day === 1,
		...sky(current.weather_code)
	};
	writeCache(key, weather);
	return weather;
}
