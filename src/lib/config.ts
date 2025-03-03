import { dev } from '$app/environment'

export const title = 'Heewon'
export const description = 'Portfolio Site'
export const url = dev ? 'http://localhost:5173' : 'https://ahnheewon.com'

export const LINKS =  [
    { text: 'Design', route: '/design', icon: 'palette', color: '#F959FF' },
    { text: 'Games', route: '/games', icon: 'sports_esports', color: '#6355FF' },
    { text: 'Blog', route: '/blog', icon: 'article', color: '#FF2E65' },
    { text: 'Comics', route: '/comics', icon: 'question_answer', color: '#FF7559' },
    { text: 'Apps', route: '/apps', icon: 'apps', color: '#0C75ED' }
];

export const SECTIONS = [
    {
        title: 'UX',
        type: 'header'
    },
    {
        title: 'Stan',
        subtitle: 'All-in-one business solution for Creators',
        slug: 'stan',
        blurb: ``,
        type: 'design',
        rating: 5.0,
    },
    {
        title: 'CornellApts',
        subtitle: 'University housing search engine',
        slug: 'apts',
        blurb: ``,
        type: 'design',
        rating: 5.0,
    },
    {
        title: 'Soteria',
        subtitle: 'Consumer fintech app',
        slug: 'soteria',
        blurb: ``,
        type: 'design',
        rating: 5.0,
    },

    {
        title: 'Design',
        type: 'header'
    },
    {
        title: 'NYBC',
        subtitle: 'Marketing posters',
        slug: 'nybc',
        blurb: ``,
        type: 'game',
        rating: 5.0,
    },
    {
        title: 'Team Ithaca',
        subtitle: 'School team branding',
        slug: 'ithaca',
        blurb: ``,
        type: 'game',
        rating: 5.0,
    },
    {
        title: 'Rebrands',
        subtitle: 'Design exercise of famous brands',
        slug: 'rebrands',
        blurb: ``,
        type: 'game',
        rating: 5.0,
    },
    {
        title: 'Paintball',
        subtitle: 'Local business marketing + branding',
        slug: 'paintball',
        blurb: ``,
        type: 'game',
        rating: 5.0,
    },

    {
        title: 'Games',
        type: 'header'
    },
    {
        title: 'Platformr',
        subtitle: '2D Platformer game, with a twist',
        slug: 'platformr',
        blurb: ``,
        type: 'game',
        rating: 5.0,
    },
    {
        title: 'Wordchain',
        subtitle: 'Timed vocabulary brain game',
        slug: 'wordchain',
        blurb: ``,
        type: 'game',
        rating: 5.0,
    },
    {
        title: 'Rooms',
        subtitle: 'Mini Zelda-like RPG',
        slug: 'rooms',
        blurb: ``,
        type: 'game',
        rating: 5.0,
    },
    {
        title: 'Just Orbiting by',
        subtitle: 'All-in-one business solution for Creators',
        slug: 'orbiting',
        blurb: ``,
        type: 'game',
        rating: 5.0,
    },
    {
        title: 'Trails',
        subtitle: 'All-in-one business solution for Creators',
        slug: 'trails',
        blurb: ``,
        type: 'game',
        rating: 5.0,
    },
]
