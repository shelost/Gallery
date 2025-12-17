<script>
    let article = {
        title: "Heewon Ahn",
        subtitle: "American design engineer and software developer",
        infobox: {
            image: "/heewon9.png",
            caption: "Heewon in 2024",
            rows: [
                { label: "Born", value: "Seoul, South Korea" },
                { label: "Education", value: "Cornell University" },
                { label: "Occupations", value: "Design Engineer, Software Engineer" },
                { label: "Known for", value: "Stan, Platformr, ARC Research" },
                { label: "Website", value: "heewon.io" }
            ]
        },
        intro: [
            "<b>Heewon Ahn</b> is a design engineer and software developer based in Ithaca, New York. He is known for his work as a Founding Designer at Stan, as well as various independent projects in game development and artificial intelligence research.",
            "Ahn's work often explores the intersection of user interface design and generative AI, with a focus on creating \"ephemeral & magical\" interfaces that move beyond traditional grid layouts."
        ],
        toc: [
            { id: "early_life_and_education", title: "Early life and education" },
            { id: "career", title: "Career" },
            { id: "works", title: "Works" },
            { id: "research", title: "Research" },
            { id: "personal_life", title: "Personal life" }
        ],
        sections: [
            {
                id: "early_life_and_education",
                title: "Early life and education",
                content: [
                    "Ahn attended Cornell University, where he worked on the Abstraction and Reasoning Corpus (ARC) challenge with Professor Kevin Ellis. During high school, he created \"Math With Steve\", a website for his precalculus teacher."
                ]
            },
            {
                id: "career",
                title: "Career",
                content: [
                    "Ahn served as the Founding Designer at Stan, a platform helping creators monetize their content. He was the first designer at the company.",
                    "He has since worked as a freelancer for various early-stage startups and is currently focused on building new UI paradigms for generative AI applications."
                ]
            },
            {
                id: "works",
                title: "Works",
                subsections: [
                    {
                        title: "Games",
                        content: [
                            "Ahn has developed several web-based games, including:",
                            "<ul><li><b>Platformr</b> – A 2D platformer game with unique mechanics.</li><li><b>Wordchain</b> – A timed vocabulary puzzle game.</li><li><b>11 Rooms</b> – A mini RPG inspired by The Legend of Zelda.</li><li><b>Just Orbiting By</b> – A physics-based circular motion game.</li></ul>"
                        ]
                    },
                    {
                        title: "Comics",
                        content: [
                            "Ahn is also an illustrator and comic artist. His works include <i>Pandemonium</i> and <i>Kingdom</i>, a concept art series for a historical adventure."
                        ]
                    }
                ]
            },
            {
                id: "research",
                title: "Research",
                content: [
                    "In the field of artificial intelligence, Ahn has contributed to the ARC (Abstraction and Reasoning Corpus) challenge. He developed <b>MARC</b>, a research dataset based on ARC, and <b>Arcaide</b>, a web tool for annotating ARC tasks."
                ]
            },
            {
                id: "personal_life",
                title: "Personal life",
                content: [
                    "Ahn is based in Ithaca, NY. He maintains a blog where he writes about topics ranging from AI economics to history and film reviews."
                ]
            }
        ]
    };

    const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
</script>

<svelte:head>
    <title>{article.title} - Wikipedia</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Linux+Libertine:wght@400;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="wiki-wrapper">
    <div class="wiki-header">
        <div class="wiki-logo">
            <img src="https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Wikipedia-logo-v2.svg/1200px-Wikipedia-logo-v2.svg.png" alt="Wikipedia Logo" />
        </div>
        <div class="wiki-search">
            <input type="text" placeholder="Search Wikipedia" />
            <button>Search</button>
        </div>
        <div class="wiki-user-tools">
            <span>Create account</span>
            <span>Log in</span>
        </div>
    </div>

    <div class="wiki-container">
        <div class="wiki-sidebar">
            <div class="sidebar-section">
                <div class="sidebar-header">Contents</div>
                <ul>
                    <li><a href="#top">(Top)</a></li>
                    {#each article.toc as item}
                        <li><a href="#{item.id}">{item.title}</a></li>
                    {/each}
                </ul>
            </div>
        </div>

        <div class="wiki-main-content">
            <div class="article-header">
                <div class="article-tabs">
                    <div class="tab active">Article</div>
                    <div class="tab">Talk</div>
                </div>
                <div class="article-tools">
                    <div class="tab active">Read</div>
                    <div class="tab">Edit</div>
                    <div class="tab">View history</div>
                    <div class="tab">Tools</div>
                </div>
            </div>

            <h1 id="top" class="firstHeading">{article.title}</h1>
            <div class="siteSub">From Wikipedia, the free encyclopedia</div>

            <div class="mw-parser-output">
                <div class="infobox">
                    <div class="infobox-title">{article.title}</div>
                    <div class="infobox-image">
                        <img src={article.infobox.image} alt={article.infobox.caption} />
                        <div class="infobox-caption">{article.infobox.caption}</div>
                    </div>
                    <table>
                        <tbody>
                            {#each article.infobox.rows as row}
                                <tr>
                                    <th scope="row">{row.label}</th>
                                    <td>{row.value}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                {#each article.intro as para}
                    <p>{@html para}</p>
                {/each}

                <div class="toc" role="navigation" aria-labelledby="mw-toc-heading">
                    <input type="checkbox" role="button" id="toctogglecheckbox" class="toctogglecheckbox" style="display:none">
                    <div class="toctitle" lang="en" dir="ltr">
                        <h2 id="mw-toc-heading">Contents</h2>
                        <span class="toctogglespan"><label class="toctogglelabel" for="toctogglecheckbox"></label></span>
                    </div>
                    <ul>
                        {#each article.toc as item, i}
                            <li class="toclevel-1 tocsection-{i+1}">
                                <a href="#{item.id}"><span class="tocnumber">{i+1}</span> <span class="toctext">{item.title}</span></a>
                            </li>
                        {/each}
                    </ul>
                </div>

                {#each article.sections as section, i}
                    <h2 id={section.id}>
                        <span class="mw-headline">{section.title}</span>
                        <span class="mw-editsection"><span class="mw-editsection-bracket">[</span><a href="#">edit</a><span class="mw-editsection-bracket">]</span></span>
                    </h2>
                    {#if section.content}
                        {#each section.content as para}
                            <p>{@html para}</p>
                        {/each}
                    {/if}
                    {#if section.subsections}
                        {#each section.subsections as subsection}
                            <h3>
                                <span class="mw-headline">{subsection.title}</span>
                                <span class="mw-editsection"><span class="mw-editsection-bracket">[</span><a href="#">edit</a><span class="mw-editsection-bracket">]</span></span>
                            </h3>
                            {#each subsection.content as subpara}
                                <p>{@html subpara}</p>
                            {/each}
                        {/each}
                    {/if}
                {/each}
                
            </div>
             <div class="catlinks">
                Categories: <a href="#">Designers</a> | <a href="#">Software Engineers</a> | <a href="#">Living people</a> | <a href="#">Cornell University alumni</a>
            </div>
             <div class="footer-info">
                This page was last edited on {currentDate}, at 12:00 (UTC).
            </div>
        </div>
    </div>
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        background-color: #f8f9fa; /* Sidebar bg */
    }

    /* Reset and Wrapper */
    .wiki-wrapper {
        font-family: sans-serif;
        font-size: 14px; /* Wikipedia default is often 14px */
        line-height: 1.6;
        color: #202122;
        background-color: #ffffff;
        text-align: left;
    }
    
    /* Header */
    .wiki-header {
        display: flex;
        align-items: center;
        padding: 10px 20px;
        background-color: #ffffff;
        border-bottom: 1px solid #a7d7f9; /* Legacy vector style */
        /* In modern vector, header is sticky or separate. Sticking to a simple top bar representation */
        height: 50px;
    }
    
    .wiki-logo img {
        height: 40px;
        margin-right: 20px;
    }

    .wiki-search {
        flex-grow: 1;
        display: flex;
        max-width: 400px;
    }

    .wiki-search input {
        width: 100%;
        padding: 5px 10px;
        border: 1px solid #a2a9b1;
        border-radius: 2px 0 0 2px;
    }
    
    .wiki-search button {
        padding: 5px 10px;
        border: 1px solid #a2a9b1;
        border-left: none;
        background-color: #f8f9fa;
        cursor: pointer;
        font-weight: bold;
    }

    .wiki-user-tools {
        margin-left: auto;
        font-size: 12px;
    }
    
    .wiki-user-tools span {
        margin-left: 10px;
        color: #3366cc;
        cursor: pointer;
    }

    /* Layout */
    .wiki-container {
        display: flex;
        max-width: 100%; /* Full width */
        background-color: #ffffff;
    }

    /* Sidebar */
    .wiki-sidebar {
        width: 176px;
        padding: 20px 16px;
        background-color: #f8f9fa;
        border-right: 1px solid #a2a9b1;
        flex-shrink: 0;
        display: none; /* Hidden on small screens, or by default in new skin if not toggled */
    }

    @media (min-width: 1000px) {
        .wiki-sidebar {
            display: block;
        }
    }

    .sidebar-header {
        font-weight: bold;
        margin-bottom: 10px;
        color: #54595d;
    }
    
    .wiki-sidebar ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    
    .wiki-sidebar li {
        margin-bottom: 6px;
        font-size: 13px;
    }
    
    .wiki-sidebar a {
        color: #0645ad;
        text-decoration: none;
    }
    
    .wiki-sidebar a:hover {
        text-decoration: underline;
    }

    /* Main Content */
    .wiki-main-content {
        flex-grow: 1;
        padding: 24px;
        max-width: 960px; /* Standard article width */
        margin: 0 auto; /* Centered if sidebar is hidden/separate, or next to it */
        background: white;
    }

    /* Article Header (Tabs) */
    .article-header {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid #a2a9b1;
        margin-bottom: 1em;
    }

    .article-tabs, .article-tools {
        display: flex;
        gap: 4px;
    }

    .tab {
        padding: 8px 14px;
        color: #0645ad;
        cursor: pointer;
        font-size: 13px;
    }
    
    .tab.active {
        color: #202122;
        border: 1px solid #a2a9b1;
        border-bottom: 1px solid #ffffff;
        background: #ffffff;
        margin-bottom: -1px;
        font-weight: bold;
    }

    /* Typography */
    h1.firstHeading {
        font-family: 'Linux Libertine', 'Georgia', 'Times', serif;
        font-size: 1.8em;
        border-bottom: 1px solid #a2a9b1;
        margin-bottom: 0.25em;
        font-weight: 400;
        padding-bottom: 0;
        margin-top: 0;
    }
    
    .siteSub {
        font-size: 13px;
        color: #54595d;
        margin-bottom: 1em;
    }

    h2 {
        font-family: 'Linux Libertine', 'Georgia', 'Times', serif;
        font-weight: 400;
        border-bottom: 1px solid #a2a9b1;
        margin: 1em 0 0.5em 0;
        padding-bottom: 3px;
        font-size: 1.5em;
    }
    
    h3 {
        font-weight: bold;
        font-size: 1.2em;
        margin: 0.5em 0;
    }

    p {
        margin: 0.5em 0 1em 0;
        text-align: justify; /* Wikipedia often justifies */
        font-family: sans-serif;
        font-size: 14px;
        line-height: 1.6;
    }
    
    a {
        color: #0645ad;
        text-decoration: none;
    }
    
    a:hover {
        text-decoration: underline;
    }

    /* Infobox */
    .infobox {
        border: 1px solid #a2a9b1;
        background-color: #f8f9fa;
        color: black;
        margin: 0.5em 0 0.5em 1em;
        padding: 0.2em;
        float: right;
        clear: right;
        width: 22em;
        font-size: 88%;
        line-height: 1.5em;
    }
    
    .infobox-title {
        text-align: center;
        font-size: 125%;
        font-weight: bold;
        padding: 0.2em;
        background-color: #b0c4de; /* Often styled depending on person type, generic is often pale */
        background-color: #f0f0f0; /* Generic */
    }

    .infobox-image {
        text-align: center;
        padding: 10px 0;
    }
    
    .infobox-image img {
        max-width: 200px;
        height: auto;
    }
    
    .infobox-caption {
        padding-top: 5px;
        line-height: 1.2;
    }

    .infobox table {
        width: 100%;
        border-spacing: 0;
        border-collapse: collapse;
    }
    
    .infobox th {
        text-align: left;
        vertical-align: top;
        padding: 0.2em 0.4em;
        font-weight: bold;
    }
    
    .infobox td {
        vertical-align: top;
        padding: 0.2em 0.4em;
    }

    /* TOC */
    .toc {
        background-color: #f8f9fa;
        border: 1px solid #a2a9b1;
        padding: 10px;
        display: table;
        margin-bottom: 1em;
        min-width: 200px;
    }
    
    .toctitle {
        text-align: center;
        margin-bottom: 5px;
    }
    
    .toctitle h2 {
        font-family: sans-serif;
        font-size: 100%;
        border: none;
        margin: 0;
        display: inline;
    }

    .toc ul {
        list-style: none;
        margin: 0;
        padding: 0;
    }
    
    .toc li {
        margin-bottom: 3px;
    }
    
    .tocnumber {
        color: #202122;
    }

    .mw-editsection {
        font-size: small;
        font-family: sans-serif;
        margin-left: 10px;
        vertical-align: baseline;
        line-height: 1em;
    }
    
    .mw-editsection a {
        color: #0645ad;
    }
    
    .catlinks {
        border: 1px solid #a2a9b1;
        background-color: #f8f9fa;
        padding: 5px;
        margin-top: 2em;
        clear: both;
        font-size: 0.9em;
    }
    
    .footer-info {
        margin-top: 1em;
        font-size: 0.85em;
        color: #202122;
    }
    
    ul {
         list-style-type: disc;
         padding-left: 20px;
         margin: 0.3em 0 0 1.6em;
    }
    li {
        margin-bottom: 0.1em;
    }
    
    b {
        font-weight: bold;
    }

    @media (max-width: 720px) {
        .infobox {
            float: none;
            width: 100%;
            margin: 0 0 1em 0;
        }
    }
</style>





