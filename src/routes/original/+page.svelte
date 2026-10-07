<script>
  import { onMount } from "svelte";
  import { pushState } from "$app/navigation";
  import Gallery from "$lib/components/Gallery.svelte";
  import Battery from "$lib/components/Battery.svelte";
  import PostPeek from "$lib/components/PostPeek.svelte";
  import { isPeekableSlug, slugFromHref } from "$lib/postPeek";

  export let data;

  // Completion percentages for each route/project
  const routeCompletion = {
    "/stan": 95,
    "/marc": 50,
    "/arcaide": 90,
    "/pandemonium": 80,
    "/kingdom": 45,
    "/palace": 70,
    "/persia": 75,
    "/timeline": 100,
    "/mario": 100,
    "/movies": 25,
    "/gapyear": 80,
    "/anorexia": 100,
    "/canvas": 85,
    "/phone": 90,
    "/orange": 75,
    "/dido": 70,
    "/mathwsteve": 100,
  };

  let pandemonium = [
    [
      { url: "p1", caption: "" },
      { url: "p20", caption: "" },
      { url: "p28", caption: "" },
    ],
    [
      { url: "px-1", caption: "" },
      { url: "px-5", caption: "" },
    ],
    [{ url: "banner-pandemonium", caption: "" }],
  ];

  let samhan = [
    [
      { url: "img-253", caption: "" },
      { url: "img-240", caption: "" },
      { url: "img-234", caption: "" },
    ],
    [{ url: "samhan", caption: "" }],
  ];

  let stanley = [{ url: "banner-stanley", caption: "" }];

  let marc = [{ url: "MARC-1", caption: "" }];

  const featured = [
    {
      id: "ovid",
      title: "Ovid",
      kicker: "App",
      blurb: "Visual UX for AI",
      href: "https://ovid.computer",
    },
    {
      id: "king",
      title: "Kingforall",
      kicker: "Webnovel",
      blurb: "Historical Fiction",
      href: "https://kingforall.com",
    },
    {
      id: "chancellor",
      title: "Chancellor",
      kicker: "Blog",
      blurb: "Tech, History, Current Events",
      href: "https://chancellorax.substack.com",
    },
  ];

  const games = [
    {
      title: "Platformr",
      icon: "icon-platformr.png",
      blurb:
        "A creator economy platform for digital products and personal storefronts.",
      href: "https://platformr.xyz",
      video: "video/platformr.mp4",
    },
    {
      title: "11 Rooms",
      icon: "icon-rooms.png",
      blurb: "An atmospheric puzzle game set across 11 mysterious rooms.",
      href: "https://shelost.github.io/11rooms",
      video: "video/rooms.mp4",
    },
    {
      title: "Just Orbiting By",
      icon: "icon-orbiting.png",
      blurb: "A physics-based space game about orbital gravity and planetary motion.",
      href: "https://shelost.github.io/orbiting",
      video: "video/orbiting.mp4",
    },
    {
      title: "Wordchain",
      icon: "icon-wordchain.png",
      blurb:
        "A word puzzle where every answer begins with the last letter of the previous one.",
      href: "https://shelost.github.io/wordchain",
      video: "video/wordchain.mp4",
    },
    {
      title: "Trails",
      icon: "icon-trails.png",
      blurb: "A particle art game where gravity and motion create colorful trails.",
      href: "https://shelost.github.io/trails",
      video: "video/trails.mp4",
    },
    {
      title: "Super Pong",
      icon: "icon-pong.png",
      blurb: "A high-speed, particle-charged remake of the classic Pong arcade game.",
      href: "https://shelost.github.io/superpong",
      video: "video/pong.mp4",
    },
  ];

  const navItems = [
    { id: "building", label: "Building", icon: "🔨" },
    { id: "education", label: "Education", icon: "🎓" },
    { id: "writing", label: "Writing", icon: "✍️" },
    { id: "experience", label: "Design", icon: "🎨" },
    { id: "games", label: "Games", icon: "🎮" },
    { id: "videos", label: "Videos", icon: "🎬" },
    { id: "webdev", label: "Webdev", icon: "🖥️" },
    { id: "comics", label: "Comics", icon: "📚" },
    { id: "research", label: "Research", icon: "🔬" },
  ];

  let activeIndex = 0;
  let navRefs = Array(navItems.length).fill(null);
  let indicatorLeft = 0;
  let indicatorWidth = 0;
  let navElement;
  let isNavigating = false;
  let scrollTimeout;
  let selectedSlug = null;

  function openPeek(slug) {
    if (!isPeekableSlug(slug, data.posts ?? [])) return;
    selectedSlug = slug;
    try {
      pushState(`/?post=${encodeURIComponent(slug)}`, { postSlug: slug });
    } catch {
      /* overlay still opens from local state */
    }
  }

  function closePeek() {
    selectedSlug = null;
    try {
      pushState("/", {});
    } catch {
      /* overlay still closes from local state */
    }
  }

  /** The page is prerendered, so `?post=` only exists in the browser, after mount. */
  function syncPeek() {
    const next = new URL(location.href).searchParams.get("post");
    selectedSlug = isPeekableSlug(next, data.posts ?? []) ? next : null;
  }

  function onHomeClick(event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const anchor = event.target.closest?.("a");
    if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
      return;
    }
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
    const slug = slugFromHref(anchor.href, location.origin);
    if (!isPeekableSlug(slug, data.posts ?? [])) return;
    event.preventDefault();
    openPeek(slug);
  }

  $: selectedPost =
    data.posts?.find((post) => post.slug === selectedSlug) ?? null;

  function scrollToSection(id, targetIndex) {
    isNavigating = true;
    activeIndex = targetIndex;
    updateIndicator();

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Re-enable scroll tracking after scroll completes
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isNavigating = false;
    }, 1000);
  }

  function updateActiveSection() {
    // Don't update if user is actively navigating
    if (isNavigating) return;

    const scrollPos = window.scrollY + 200;

    for (let i = navItems.length - 1; i >= 0; i--) {
      const element = document.getElementById(navItems[i].id);
      if (element && element.offsetTop <= scrollPos) {
        if (activeIndex !== i) {
          activeIndex = i;
          updateIndicator();
        }
        break;
      }
    }
  }

  function updateIndicator() {
    if (navRefs[activeIndex] && navElement) {
      const activeBtn = navRefs[activeIndex];
      const navRect = navElement.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();

      indicatorLeft = btnRect.left - navRect.left + 4;
      indicatorWidth = btnRect.width - 8;
    }
  }

  onMount(() => {
    syncPeek();

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      updateIndicator();
      updateActiveSection();
    }, 100);

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateIndicator);

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateIndicator);
    };
  });
</script>

<svelte:window on:popstate={syncPeek} />

<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=call_made"
/>

<main on:click|capture={onHomeClick}>
  <nav bind:this={navElement}>
    <div
      class="indicator"
      style="left: {indicatorLeft}px; width: {indicatorWidth}px;"
    ></div>
    {#each navItems as item, i}
      <button
        class="navbtn"
        class:active={activeIndex === i}
        on:click={() => scrollToSection(item.id, i)}
        bind:this={navRefs[i]}
      >
        <span class="icon">{item.icon}</span>
        <span class="label">{item.label}</span>
      </button>
    {/each}
  </nav>

  <aside class="toc" aria-label="Table of contents">
    <div class="toc-label">Contents</div>
    <ul>
      {#each navItems as item, i}
        <li>
          <button
            class="toc-item"
            class:active={activeIndex === i}
            on:click={() => scrollToSection(item.id, i)}
          >
            <span class="marker"></span>
            <span class="label">{item.label}</span>
          </button>
        </li>
      {/each}
    </ul>
  </aside>

  <div class="container">
    <div class="mast">
      <div class="expo">
        <img src="smiley.png" alt="Smiley" class="avatar" />
        <h1>
          Hi! My name is Heewon. <br />
          I'm a <a href="#experience">designer</a>,
          <a href="#games">engineer</a>, and occasional
          <a href="#comics">artist.</a>
        </h1>
        <p>
          I really like the <a
            href="https://www.w3schools.com/html/html5_canvas.asp"
          >
            <code> &lt;canvas&gt; </code>
          </a>
          element. <br /> <br />
          Currently, I'm interested in building a new
          <a href="https://x.com/karpathy/status/1917920257257459899?lang=en"
            >UX paradigm</a
          >
          for generative AI applications. <br /> <br />
          Let's collaborate! Reach out anytime at
          <a href="mailto:ahnheewon823@gmail.com">ahnheewon823@gmail.com</a>.
        </p>

        <div class="batteries flex">
          <div class="battery">
            <Battery percentage={100} />
            <h3>Complete!</h3>
          </div>
          <div class="battery">
            <Battery percentage={50} />
            <h3>In Progress</h3>
          </div>
          <div class="battery">
            <Battery percentage={25} />
            <h3>Working on it...</h3>
          </div>
        </div>
      </div>
    </div>

    <div class="title" id="building">
      <h2>
        Building<span class="ellipsis" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
      </h2>
    </div>

    <section class="featured" aria-label="Building">
      {#each featured as item (item.id)}
        <a class="feature {item.id}" href={item.href}>
          <span class="feature-kicker">{item.kicker}</span>
          <h2>{item.title}</h2>
          <p>{item.blurb}</p>
          <span class="feature-go">
            Visit
            <img src="arrow_top_right.svg" alt="" />
          </span>
        </a>
      {/each}
    </section>

    <div class="title" id="education">
      <h2>Education</h2>
    </div>

    <ul>
      <li>
        <a href="https://www.cornell.edu">Cornell<span class="date">2021–22</span></a>
        <span class="dropout">Dropped out</span>
      </li>
    </ul>

    <div class="title" id="writing">
      <h2>Writing</h2>
    </div>

    <ul>
      <li class = 'hidden'>
        <a href="/movies">Favorite Movies<span class="date">2026</span></a>
        <Battery percentage={routeCompletion["/movies"]} />
      </li>
      <li>
        <a href="/gapyear">My Gap Year<span class="date">2025</span></a>
        <Battery percentage={routeCompletion["/gapyear"]} />
      </li>
      <li>
        <a href="/palace">The AI Palace Economy<span class="date">2025</span></a
        >
        <Battery percentage={routeCompletion["/palace"]} />
      </li>
      <li>
        <a href="/persia"
          >The Roman-Persian Wars<span class="date">2025</span></a
        >
        <Battery percentage={routeCompletion["/persia"]} />
      </li>
      <li>
        <a href="/timeline"
          >The Civilization Timeline<span class="date">2024</span></a
        >
        <Battery percentage={routeCompletion["/timeline"]} />
      </li>
      <li>
        <a href="/mario"
          >The Super Mario Bros. Movie Review<span class="date">2023</span></a
        >
        <Battery percentage={routeCompletion["/mario"]} />
      </li>
    </ul>

    <div class="title" id="experience">
      <h2>Design</h2>
      <p>
        Can you really call it <i>experience</i> if there's only one company on the
        list?
      </p>
    </div>

    <ul>
      <div class="elem">
        <div class="header">
          <img src="stan.svg" alt="Stan" class="logo horizontal" />
          <div class="title-row">
            <h3>Stan</h3>
          </div>
          <div class="expo">
            <p>
              I was the <b>Founding Designer @ Stan,</b> dropping out of college
              at 19 to help build the future of work.
            </p>
            <p>
              Stan allows you to set up a custom mobile store in minutes,
              allowing you to focus on what you do best (Creating!) while we
              take care of the business logistics.
            </p>
            <p>
              We scaled from <b>0 to $30M ARR</b> in 3 years, led by the mega duo
              of John & Vitalii.
            </p>
          </div>
          <div class="tags">
            <a href="https://stan.store" class="noud">
              <div class="tag stan">
                <h2>Homepage</h2>
              </div>
            </a>
            <a href="https://gmv.stan.store" class="noud">
              <div class="tag">
                <h2>GMV (Live)</h2>
              </div>
            </a>
          </div>
        </div>
        <div class="space">
          <img class="banner" src="stan4.svg" alt="" />
        </div>
      </div>
    </ul>

    <div class="grid">
      <div class="video">
        <a href="https://gmv.stan.store">
          <video src="/video/stan_gmv.mov" autoplay loop muted playsinline
          ></video>
        </a>
        <h4>
          Stan GMV Tracker
          <span class="date">2024</span>
          <Battery percentage={100} />
        </h4>
        <p>
          A live, public-facing dashboard tracking Stan's <a
            href="https://gmv.stan.store">Gross Merchandise Value</a
          > in realtime.
        </p>
      </div>
      <div class="video">
        <a href="https://stan.store">
          <video src="/video/stan_remix.mov" autoplay loop muted playsinline
          ></video>
        </a>
        <h4>
          Stan Remix
          <span class="date">2024</span>
          <Battery percentage={100} />
        </h4>
        <p>A promotional video showcasing the Stan creator experience.</p>
      </div>
    </div>

    <div class="title" id="games">
      <h2>Games</h2>
      <p>
        Fun web games I built in the pre-AI era — graphics and code all
        hand-created!
      </p>
    </div>

    <div class="grid games">
      {#each games as game (game.href)}
        <div class="video">
          <a href={game.href} class="noud" aria-label={game.title}>
            <video src={game.video} autoplay loop muted playsinline></video>
          </a>
          <div class="game-meta">
            <img class="app" src={game.icon} alt="" />
            <div>
              <h4>{game.title}</h4>
              <p>{game.blurb}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <div class="title" id="videos">
      <h2>Videos</h2>
      <p>A few videos I appear in.</p>
    </div>

    <div class="row">
      <div class="video">
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/stjPRf0Iogg?si=Jz-rUe4w8KKS6pYv"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
        <p class="caption">
          This is John's video, but I appear at around the <b>7:32</b> mark!
        </p>
      </div>
      <div class="video">
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/yHSWJty8QgI"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
        <p class="caption">My personal game portfolio video</p>
      </div>
      <div class="video">
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/0kI-Q1683nI"
          title="The Future of UI in the AI Era (Inflection Fellowship 2026)"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
        <p class="caption">
          The Future of UI in the AI Era (Inflection Fellowship 2026)
        </p>
      </div>
      <div class="video">
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/u4ABhgrZAq4"
          title="King for All (AI Teaser Trailer)"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
        <p class="caption">King for All (AI Teaser Trailer)</p>
      </div>
    </div>

    <div class="title" id="webdev">
      <h2>Webdev</h2>
      <p>Apps and tools I've built more recently.</p>
    </div>

    <div class="grid">
      <div class="video">
        <a href="https://www.sketchdreamer.com/canvas">
          <video src="realtime 3.mov" autoplay loop muted playsinline></video>
        </a>
        <h4>
          AI Canvas
          <span class="date">2025</span>
          <Battery percentage={routeCompletion["/canvas"]} />
        </h4>
        <p>
          Realtime AI image generation, based on Tldraw's <a
            href="https://drawfast.tldraw.com/">Drawfast</a
          >
        </p>
      </div>
      <div class="video">
        <a href="https://www.sketchdreamer.com/phone">
          <video src="iphone3d.mov" autoplay loop muted playsinline></video>
        </a>
        <h4>
          iPhone 3D Creator
          <span class="date">2025</span>
          <Battery percentage={routeCompletion["/canvas"]} />
        </h4>
        <p>A helper tool for UX designers</p>
      </div>
      <div class="video">
        <a href="https://dido-ui.vercel.app/">
          <video src="dido.mov" autoplay loop muted playsinline></video>
        </a>
        <h4>
          Dido UI
          <span class="date">2025</span>
          <Battery percentage={50} />
        </h4>
        <p>A minimalistic UI library</p>
      </div>
      <div class="video">
        <a href="https://shelost.github.io/scioly">
          <video src="scioly.mov" autoplay loop muted playsinline></video>
        </a>
        <h4>
          Science Olympiad
          <span class="date">2020</span>
          <Battery percentage={50} />
        </h4>
        <p>Website for Ithaca's Science Olympiad team</p>
      </div>
    </div>

    <div class="title" id="comics">
      <h2>Comics</h2>
      <p>
        My childhood dream was to become a comic artist, and I'm getting there
        one day at a time!
      </p>
    </div>

    <ul>
      <div class="elem">
        <div class="header">
          <img src="title-cheonha.png" alt="Pandemonium" class="logo square" />
          <div class="title-row">
            <h3>Pandemonium<span class="date">2024</span></h3>
            <Battery percentage={routeCompletion["/pandemonium"]} />
          </div>
          <div class="expo">
            <p>
              This was my first real comics chapter, based on a combination of
              classic Eastern novels such as "Three Kingdoms" and "Journey to
              the West."
            </p>
            <p>
              I only ended up writing one chapter so far — but the full
              <a
                href="https://ahnheewon.notion.site/All-Nations-b63d9a85eb1147cd8ae4545bf0f98627?pvs=143"
                >story outline</a
              > can be found below!
            </p>
          </div>
          <div class="tags">
            <a
              href="https://www.webtoons.com/en/canvas/cheonha/the-girl/viewer?title_no=1112025&episode_no=1"
              class="noud"
            >
              <div class="tag naver">
                <img src="/naver.svg" alt="Naver Logo" />
                <h2>Naver Webtoon</h2>
              </div>
            </a>
            <a
              href="https://comic.naver.com/challenge/detail?titleId=846439&no=1"
              class="noud"
            >
              <div class="tag naver">
                <img src="/naver.svg" alt="Naver Logo" />
                <h2>네이버 도전만화</h2>
              </div>
            </a>
            <a
              href="https://ahnheewon.notion.site/All-Nations-b63d9a85eb1147cd8ae4545bf0f98627?pvs=143"
              class="noud"
            >
              <div class="tag notion">
                <img src="/notion.svg" alt="Naver Logo" />
                <h2>Story Outline</h2>
              </div>
            </a>
            <a href="/pandemonium-art" class="noud">
              <div class="tag">
                <h2>Character Sheets</h2>
              </div>
            </a>
          </div>
        </div>
        <a href="/pandemonium">
          <div class="space">
            <Gallery images={pandemonium[0]} col={3} />
            <Gallery images={pandemonium[1]} col={2} />
            <Gallery images={pandemonium[2]} col={1} />
          </div>
        </a>
      </div>

      <div class="elem">
        <div class="header">
          <img
            src="title-samhan.png"
            alt="King of Samhan"
            class="logo horizontal"
          />
          <div class="title-row">
            <h3>The King of Samhan<span class="date">2025</span></h3>
            <Battery percentage={routeCompletion["/kingdom"]} />
          </div>
          <div class="expo">
            <p>
              This is my concept for a historical adventure series, loosely
              based on the 2009 historical K-Drama
              <a href="https://en.wikipedia.org/wiki/Queen_Seondeok_(TV_series)"
                >Queen Seondeok</a
              > set in 7th-century Korea.
            </p>
            <p>
              I did a lot of research for this project, which may one day
              materialize.
            </p>
          </div>
          <div class="tags">
            <a
              href="https://notion.so/668-Novel-1b67696bef164e83ae68cd3cb095d33b?pvs=74&assetsVersion=23.13.20251208.1257&cookie_sync_completed=true"
              class="noud"
            >
              <div class="tag notion">
                <img src="/notion.svg" alt="Naver Logo" />
                <h2>Story Outline</h2>
              </div>
            </a>
            <a href="/kingdom" class="noud">
              <div class="tag">
                <h2>Concept Art</h2>
              </div>
            </a>
          </div>
        </div>
        <div class="space">
          <Gallery images={samhan[0]} col={3} />
          <Gallery images={samhan[1]} col={1} />
        </div>
      </div>
    </ul>

    <div class="title" id="research">
      <h2>Research</h2>
      <p>
        While in school, I worked on solving the ARC challenge with <a
          href="https://www.cs.cornell.edu/~ellisk/">Prof. Kevin Ellis</a
        >.
      </p>
    </div>

    <ul>
      <div class="elem">
        <div class="header">
          <img src="logo-arcaide.png" alt="Arcaide" class="logo square" />
          <div class="title-row">
            <h3>Arcaide</h3>
            <Battery percentage={routeCompletion["/arcaide"]} />
          </div>
          <p>
            An extremely cleverly named ARC annotation web tool, which generates
            JSON files with specially annotated objects from raw ARC data.
          </p>
          <div class="tags">
            <a href="https://shelost.github.io/arcaide2/" class="noud">
              <div class="tag link">
                <img
                  src="arrow_top_right.svg"
                  class="arrow_top_right"
                  alt="Link"
                />
                <h2>View App</h2>
              </div>
            </a>
            <a href="https://github.com/shelost/arcaide2" class="noud">
              <div class="tag github">
                <img src="logo-github.svg" alt="GitHub" />
                <h2>GitHub</h2>
              </div>
            </a>
            <a href="https://arcprize.org/arcaide" class="noud">
              <div class="tag">
                <h2>Beta Version</h2>
              </div>
            </a>
          </div>
        </div>
        <div class="space">
          <img class="banner" src="arcaide.png" alt="Arcaide" />
        </div>
      </div>

      <div class="elem">
        <div class="header">
          <img src="logo-marc.svg" alt="MARC" class="logo horizontal" />
          <div class="title-row">
            <h3>MARC</h3>
            <Battery percentage={routeCompletion["/marc"]} />
          </div>
          <p>
            The Markings Analysis & Reasoning Corpus (MARC) is a visual
            reasoning dataset, inspired by François Chollet's <a
              href="https://arcprize.org/arc-agi">ARC Challenge.</a
            >
            Instead of grid-based datasets, it consists of stroke- and drawing-based
            data.
          </p>
          <div class="tags">
            <a href="/marc" class="noud">
              <div class="tag">
                <h2>View Dataset</h2>
              </div>
            </a>
          </div>
        </div>
        <a href="/marc">
          <div class="space">
            <Gallery images={marc} col={1} />
          </div>
        </a>
      </div>
    </ul>
  </div>
</main>

{#if selectedSlug}
  {#key selectedSlug}
    <PostPeek
      post={selectedPost ?? { slug: selectedSlug, content: null, meta: {} }}
      onClose={closePeek}
    />
  {/key}
{/if}

<style lang="scss">
  @import url("https://fonts.googleapis.com/css2?family=Akt:wght@100..900&display=swap");

  $default: "Akt", sans-serif;
  $w-body: 300;
  $w-heading: 550;
  $w-subtitle: 500;

  h1,
  h2,
  h3,
  h4 {
    font-family: $default;
    letter-spacing: -0.04em;
    font-weight: $w-heading;
  }

  p,
  span,
  li,
  button,
  a {
    font-family: $default;
    letter-spacing: -0.04em;
    font-weight: $w-body;
  }

  main {
    padding-bottom: 280px;
  }

  .batteries {
    display: none !important;
  }

  .grid.games {
    .game-meta {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-top: 16px;
    }

    .app {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      flex-shrink: 0;
      filter: drop-shadow(-2px 8px 16px rgba(black, 0.1));
    }

    h4 {
      margin: 0 0 4px;
    }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 32px 40px;
    margin: 40px 0;

    .video {
      width: 100%;
      margin-bottom: 24px;
      video {
        width: 100%;
        border-radius: 12px;
        border: 2px solid rgba(white, 1);
        box-shadow: -4px 24px 36px rgba(#030025, 0.12);
      }
      h4 {
        margin: 24px 0 6px 0;

        font-size: 24px;
        font-weight: $w-heading;
        letter-spacing: -0.4px;

        span {
          font-size: 16px;
          font-weight: $w-body;
          letter-spacing: -0.5px;
          color: rgba(black, 0.4);
          margin-right: 4px;
          margin-left: 1px;
          display: none;
        }
      }
      p {
        font-size: 16px;
        font-weight: $w-body;
        letter-spacing: -0px;
        color: rgba(black, 0.36);
        margin: 0;
        a {
          font-weight: $w-body;
          color: rgba(black, 0.5) !important;
        }
      }
    }
  }

  nav {
    z-index: 10;
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 28px;
    height: 44px;
    background: rgba(black, 0.9);
    border: 1px solid rgba(white, 0.1);
    backdrop-filter: blur(16px);
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    overflow: hidden;
    box-shadow: -12px 32px 48px rgba(black, 0.9);
  }

  .toc {
    display: none;
    position: fixed;
    top: 50%;
    left: 40px;
    transform: translateY(-50%);
    z-index: 5;
    max-width: 200px;

    .toc-label {
      font-family: $default;
      font-size: 11px;
      font-weight: $w-body;
      text-transform: uppercase;
      letter-spacing: 1.8px;
      color: rgba(#030025, 0.35);
      margin-bottom: 14px;
      padding-left: 18px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
      border-left: 1px solid rgba(#030025, 0.12);
    }

    li {
      margin: 0;
      padding: 0;
      width: auto;
      font-size: inherit;
      letter-spacing: 0;
      display: block;
    }

    .toc-item {
      position: relative;
      background: transparent;
      border: none;
      cursor: pointer;
      margin: 0 0 0 -1px;
      padding: 7px 0 7px 18px;
      width: 100%;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 0;
      border-left: 2px solid transparent;
      border-radius: 0;
      box-shadow: none;
      transition:
        color 0.25s ease,
        border-color 0.25s ease,
        transform 0.25s ease;

      .marker {
        display: none;
      }

      .label {
        font-family: $default;
        font-size: 17px;
        font-weight: $w-body;
        letter-spacing: -0.4px;
        color: rgba(#030025, 0.4);
        line-height: 1.2;
        transition:
          color 0.25s ease,
          font-weight 0.25s ease,
          transform 0.25s ease;
      }

      &:hover .label {
        color: rgba(#030025, 0.75);
      }

      &.active {
        border-left: 2px solid #5200ff;

        .label {
          color: #030025;
          font-weight: $w-body;
          transform: translateX(2px);
        }
      }
    }
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    margin: 40px 0;
    .video {
      flex: 1 1 calc(50% - 12px);
      min-width: 280px;
      iframe {
        aspect-ratio: 18/9;
        width: 100%;
        border-radius: 8px;
        box-shadow: -4px 18px 40px rgba(black, 0.2);
      }
    }
    .caption {
      margin-top: 16px;
    }
  }

  .indicator {
    position: absolute;
    top: 8px;
    bottom: 4px;
    background: white;
    height: 36px;
    border-radius: 22px;
    transition:
      left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 0;
    box-shadow: 0 2px 8px rgba(black, 0.25);
  }

  .battery {
    display: flex;
    align-items: center;
    gap: 12px;
    h3 {
      font-size: 16px;
      font-weight: $w-body;
      letter-spacing: -0.5px;
      margin: 0;
    }
  }

  .navbtn {
    position: relative;
    z-index: 1;
    background: transparent;
    border: none;
    border-radius: 40px;
    padding: 10px 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: $default;
    font-size: 14px;
    font-weight: $w-body;
    color: rgba(white, 0.6);
    white-space: nowrap;
    box-shadow: none;

    .icon {
      font-size: 20px;
      line-height: 1;
      display: none;
    }

    .label {
      font-size: 15px;
      font-weight: $w-body;
      letter-spacing: -0.03em;
      color: rgba(white, 0.6);
      transition: color 0.2s ease;
    }

    &:hover .label {
      color: white;
    }

    &.active .label {
      color: #030025;
      font-weight: $w-body;
    }
  }

  .logo {
    margin: 8px 0;
    height: 120px;
    filter: drop-shadow(-4px 12px 8px rgba(black, 0.1));
    &.horizontal {
      height: 80px;
    }
  }

  .elem {
    display: flex;
    gap: 60px;

    .header {
      flex: 1;
      margin: 48px 0 12px 0;
      flex-shrink: 0;

      .expo {
        p {
          color: rgba(black, 0.6);
        }
      }
    }

    .space {
      width: 440px;
      margin: 40px auto;
      padding: 12px 12px 0 12px;
      border-radius: 8px;
      background: white;
      height: fit-content;
      box-shadow: -12px 24px 60px rgba(black, 0.1);
    }
  }

  .flex {
    width: 90%;
    display: flex;
    flex-wrap: wrap;
    justify-content: left;
    gap: 40px;
    margin: 60px 0 100px 0;
    .icon {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: none;
      gap: 8px;
      .app {
        width: 120px;
        border-radius: 24px;
        filter: drop-shadow(-4px 16px 16px rgba(black, 0.05));
        background: none;
        transition: 0.2s ease;
        &:hover {
          transform: translateY(-4px);
        }
      }
      h4 {
        font-weight: $w-body;
        font-size: 18px;
        letter-spacing: -0.3px;
        margin: 12px;
        text-align: center;
      }
    }
  }

  .ellipsis span {
    animation: ellipsis 1.4s infinite;
    opacity: 0;
  }

  .ellipsis span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .ellipsis span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes ellipsis {
    0% {
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
    80% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ellipsis span {
      animation: none;
      opacity: 1;
    }
  }

  .dropout {
    flex-shrink: 0;
    font-size: 16px;
    font-weight: $w-body;
    letter-spacing: -0.04em;
    color: rgba(#030025, 0.4);
  }

  .featured {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin: 0 0 40px;
  }

  .feature {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-height: 320px;
    padding: 36px;
    border-radius: 24px;
    text-decoration: none;
    color: #030025;
    box-shadow: -8px 28px 56px rgba(black, 0.08);
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease;

    &:hover {
      transform: translateY(-6px);
      box-shadow: -12px 36px 64px rgba(black, 0.12);
    }

    &.ovid {
      background:
        radial-gradient(
          90% 80% at 100% 0%,
          rgba(#ff2453, 0.34),
          transparent 62%
        ),
        #fff4f6;
    }

    &.king {
      background:
        radial-gradient(
          90% 80% at 0% 100%,
          rgba(#c9a227, 0.42),
          transparent 58%
        ),
        #fff7e4;
    }

    &.chancellor {
      background:
        radial-gradient(
          90% 80% at 100% 100%,
          rgba(#3a4a7a, 0.22),
          transparent 58%
        ),
        #f4f6fb;
    }

    h2 {
      font-size: 42px;
      font-weight: $w-heading;
      letter-spacing: -0.06em;
      line-height: 0.92;
      margin: 10px 0 14px;
      color: #030025;
      text-shadow: -0.5px 0 0 #030025;
    }

    p {
      max-width: 28ch;
      margin: 0;
      font-size: 18px;
      font-weight: $w-body;
      letter-spacing: -0.03em;
      line-height: 1.35;
      color: rgba(#030025, 0.52);
    }
  }

  .feature-kicker {
    font-size: 15px;
    font-weight: $w-body;
    letter-spacing: -0.03em;
    color: rgba(#030025, 0.45);
  }

  .feature-go {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 28px;
    width: fit-content;
    padding: 10px 16px;
    border-radius: 40px;
    background: #030025;
    color: white;
    font-size: 15px;
    font-weight: $w-body;
    letter-spacing: -0.03em;

    img {
      height: 14px;
      filter: invert(1);
    }
  }

  .mast {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 18px;
    margin: 24px 0 48px 0;

    img {
      width: 120px;
      border-radius: 4px;
      border: 1px solid white;
    }

    h1 {
      a {
        background: rgba(black, 0.05);
        border-radius: 8px;
        &:hover {
          background: rgba(black, 0.1);
        }
      }
    }
  }

  .container {
    padding: 100px 0 0px 0;
    max-width: 1000px;
    margin: auto;
  }

  a {
    color: black;
    font-weight: $w-body;
    border-bottom: none !important;
  }

  .title {
    margin: 200px 0 80px 0;
    box-sizing: border-box;

    width: 80%;

    h2 {
      font-family: $default;
      font-size: 40px;
      font-weight: $w-heading;
      letter-spacing: -0.06em;
      line-height: 1;
      margin-bottom: 8px;
      color: #030025;
      text-shadow: -0.35px 0 0 #030025;
    }

    p {
      font-family: $default;
      text-align: left;
      font-size: 34px;
      font-weight: $w-subtitle;
      letter-spacing: -0.05em;
      line-height: 100%;
      margin: 0;
      color: rgba(#030025, 0.36);
    }
  }

  h1 {
    font-family: $default;
    text-align: left;
    font-size: 40px;
    font-weight: $w-heading;
    letter-spacing: -0.06em;
    line-height: 110%;
    margin-bottom: 32px;
    color: #030025;
    text-shadow: -0.35px 0 0 #030025;

    a {
      font-weight: $w-heading;
      border-bottom: 3px solid rgba(black, 0.15);
    }
  }

  h3 {
    font-family: $default;
    font-size: 36px;
    font-weight: $w-heading;
    letter-spacing: -0.055em;
    line-height: 1.5;
    margin-bottom: 0px;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 0px;
    .date {
      font-size: 24px;
      font-weight: $w-body;
      letter-spacing: -0.8px;
      color: rgba(black, 0.4);
      margin-right: 4px;
      margin-left: 1px;
      display: none;
    }
  }

  .banner {
    width: 100%;
    border-radius: 4px;
  }

  .noud {
    border: none;
  }

  .tags {
    margin: 24px 0 24px 0;
    display: flex;
    flex-wrap: wrap;
    gap: 12px 8px;
    border-bottom: none;
    .tag {
      background: rgba(black, 0.1);
      color: black;
      font-weight: $w-body;
      border-radius: 40px;
      padding: 10px 16px;
      width: fit-content;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: 0.2s ease;

      .arrow_top_right {
        height: 14px;
      }

      &.stan {
        background: #6355ff;
        h2 {
          color: white;
        }
      }
      &.naver {
        background: #00d05c;
        h2 {
          color: white;
        }
      }
      &.link {
        background: black;
        h2 {
          color: white;
          border: none;
        }
      }
      &.notion {
        background: #f0f0f0;
      }
      img {
        height: 18px;
      }
      h2 {
        color: black;
        font-family: $default;
        font-weight: $w-body;
        font-size: 16px;
        margin: 0;
        letter-spacing: -0.2px;
        white-space: nowrap;
      }
      &:hover {
        transform: translateY(-2px);
      }
    }
  }

  p,
  li {
    font-family: $default;
    font-size: 16px;
    font-weight: $w-body;
    letter-spacing: -0.04em;
    line-height: 1.5;
    margin: 0;
    color: #030025;
    list-style: none;
    width: fit-content;
    b {
      font-weight: 400;
    }
    span {
      font-family: $default;
      font-size: 16px;
      color: rgba(#030025, 0.4);
      font-weight: $w-body;
      margin-left: 5px;
      letter-spacing: -0.04em;
    }
    a {
      width: fit-content;
      //border-bottom: 1.5px solid rgba(black, .1);
      border-radius: 8px;
    }
  }

  p {
    margin: 12px 0;
    line-height: 1.3;
  }

  li {
    font-size: 22px;
    font-weight: $w-body;
    letter-spacing: -0.05em;
    margin: 4px 0;
    display: flex;
    align-items: center;
    gap: 32px;
    justify-content: space-between;

    a {
      font-weight: $w-body;
      flex: 1;
    }

    :global(.battery) {
      flex-shrink: 0;
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }

    &:hover :global(.battery) {
      opacity: 1;
    }
  }

  ul {
    padding-inline-start: 0px;
  }

  @media (max-width: 1280px) {
    .toc {
      display: none;
    }
  }

  @media (max-width: 768px) {
    :global(html) {
      scroll-snap-type: y proximity;
    }

    .mast {
      min-height: 100svh;
      scroll-snap-align: start;
    }

    .title {
      scroll-snap-align: start;
      scroll-snap-stop: always;
    }

    main {
      padding-bottom: 100px;
    }

    .container {
      width: 100%;
      box-sizing: border-box;
      padding: 20px 16px 0 16px;
    }

    nav {
      bottom: 8px;
      height: 56px;
      padding: 3px;
      gap: 2px;
      border-radius: 28px;
    }

    .navbtn {
      padding: 4px 8px;
      font-size: 12px;

      .icon {
        font-size: 16px;
      }

      .label {
        font-size: 11px;
      }
    }

    .indicator {
      top: 6px;
      bottom: 6px;
      height: calc(100% - 12px);
    }

    .featured {
      grid-template-columns: 1fr;
      gap: 16px;
      margin: 0 0 48px;
    }

    .feature {
      min-height: 320px;
      padding: 24px;

      h2 {
        font-size: 44px;
      }

      p {
        font-size: 16px;
      }
    }

    .mast {
      flex-direction: column;
      align-items: flex-start;
      margin: 24px 0 48px 0;
      gap: 24px;

      img {
        width: 120px;
      }
    }

    .expo {
      .app {
        width: 120px;
        border-radius: 24px;
      }
      h1 {
        font-size: 32px;
        letter-spacing: -1.5px;
        margin-bottom: 24px;
      }

      p {
        font-size: 18px;
        letter-spacing: -0.5px;
      }
    }

    .flex {
      width: 100%;
      gap: 24px;
      margin: 40px 0 60px 0;

      .icon {
        .app {
          width: 100px;
          border-radius: 24px;
        }

        h4 {
          font-size: 14px;
          margin: 8px;
        }
      }
    }

    .flex .battery {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .battery {
      h3 {
        font-size: 14px;
      }
    }

    .title {
      margin: 120px 0 40px 0;
      width: 100%;

      h2 {
        font-size: 32px;
        letter-spacing: -1px;
      }

      p {
        font-size: 20px;
        letter-spacing: -0.8px;
        margin-top: 8px;
      }
    }

    .grid {
      grid-template-columns: 1fr;
      gap: 24px;
      margin: 24px 0;

      .video {
        margin-bottom: 16px;

        h4 {
          font-size: 18px;
          margin: 16px 0 6px 0;

          span {
            font-size: 14px;
          }
        }

        p {
          font-size: 14px;
        }
      }
    }

    .row {
      flex-direction: column;
      gap: 24px;
      margin: 24px 0;

      .video {
        iframe {
          aspect-ratio: 16/9;
        }
      }

      .caption {
        font-size: 14px;
        margin-top: 12px;
      }
    }

    .elem {
      flex-direction: column;
      gap: 24px;

      .header {
        margin: 24px 0 12px 0;
      }

      .space {
        width: 100%;
        margin: 24px 0;
        padding: 8px;
      }
    }

    .logo {
      height: 80px;

      &.horizontal {
        height: 60px;
      }

      &.square {
        height: 80px;
      }
    }

    h3 {
      font-size: 24px;
      letter-spacing: -1px;
    }

    .title-row {
      gap: 8px;
    }

    .tags {
      margin: 16px 0;
      gap: 8px;

      .tag {
        padding: 8px 12px;

        h2 {
          font-size: 14px;
        }

        img {
          height: 14px;
        }
      }
    }

    p,
    li {
      font-size: 14px;

      span {
        font-size: 14px;
      }
    }

    li {
      font-size: 16px;
      letter-spacing: -0.5px;
      margin: 6px 0;
    }

    .expo {
      p {
        margin: 12px 0;
      }
    }
  }
</style>
