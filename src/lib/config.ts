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
    },
    {
        title: 'Stan',
        subtitle: 'All-in-one business solution for Creators',
    },
    {
        title: 'CornellApts',
        subtitle: 'All-in-one business solution for Creators',
    },
    {
        title: 'Soteria',
        subtitle: 'All-in-one business solution for Creators',
    },
    {
        title: 'NYBC',
        subtitle: 'All-in-one business solution for Creators',
    },
    {
        title: 'Team Ithaca',
        subtitle: 'All-in-one business solution for Creators',
    },
    {
        title: 'Rebrands',
        subtitle: 'All-in-one business solution for Creators',
    },
    {
        title: 'Paintball',
        subtitle: 'All-in-one business solution for Creators',
    },

    {
        title: 'Platformr',
        subtitle: 'All-in-one business solution for Creators',
    },
    {
        title: 'Wordchain',
        subtitle: 'All-in-one business solution for Creators',
    },
    {
        title: 'Rooms',
        subtitle: 'All-in-one business solution for Creators',
    },
    {
        title: 'Just Orbiting by',
        subtitle: 'All-in-one business solution for Creators',
    },
    {
        title: 'Trails',
        subtitle: 'All-in-one business solution for Creators',
    },
]
