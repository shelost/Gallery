---
series: Essay
type: blog
title: A Visual Interface for Thought
description: An essay on iconic programming and the future of AI interfaces
blurb: "Revisiting David Canfield Smith's 1975 Pygmalion thesis to imagine what comes after chat."
card: null
banner: null
preview: null
rating: 5
date: '2025-12-16'
author: 'Heewon Ahn'
categories:
  - essay
  - design
published: true
---

## Introduction

> The computer is an obvious candidate because its output is generative, as opposed to being fixed or static as in a filmstrip. A computer's output can be changed according to the input. If the user is to establish a cause-effect relationship, the medium must be interactive so that changes are immediately observable. It must give the user the feeling of participating in an experience. An active medium must also be inherently positive. If a computer is to act as a laboratory for experimenting with ideas, it must not give negative feedback of the form: "You did that incorrectly." Instead something consistent with the situation should happen. If the result is not what was anticipated, it is up to the user to figure out why. Contrast this with conventional computer-aided instruction, in which a child is asked to answer questions and is told that he is either right or wrong. There is little potential in such instruction for a child to experiment with a subject in depth until he is finally satisfied he understands it.
>
> — *David Canfield Smith, Pygmalion: A Creative Programming Environment, 1975*

In 1975, David Canfield Smith published his PhD thesis at Stanford, titled "Pygmalion: A Creative Programming Environment." The 198-page paper, which went mostly unnoticed at the time, was a thorough analysis of the the state of the industry at the time.

Among other things, Smith first redefined the word "icon" — which up to that point had only meant religious imagery.

Fast forward 50 years, and the "iconic programming" concept has absolutely conquered the world. When an average user drags an app icon into another folder on their desktop, they do not make any distinction between the icon and the actual concept it is representing (i.e. an executable application made up of thousands of lines of code).

Instead, as far as they are concerned, the icon is the app, and they are actually dragging the app into another folder.

With the popularization of large language models (LLMs) as consumer products, that same gap between symbol and substance has only widened.

> I don't know why we call it a mouse...
>
> — *Douglas Engelbart, Mother of All Demos*

> Good tools make it clear how they should be *used*. And more importantly, how they should not be used. If we think about a good pair of gloves, it's immediately obvious how we should use them. They're hand-shaped! We put them on our hands. And the specific material tells us more: metal mesh gloves are for preventing physical harm, rubber gloves are for preventing chemical harm, and leather gloves are for looking cool on a motorcycle. Compare that to looking at a typical chat interface. The only clue we receive is that we should type characters into the textbox. The interface looks the same as a Google search box, a login form, and a credit card field.
>
> — *Amelia Wattenberger, Chatbots are not the future, https://wattenberger.com/thoughts/boo-chatbots*

## Innovations

User interface is a broad term, and a more powerful one than most people assume.

Many intellectual innovations have come about due to a change in the interface through which ideas are accessed.

When intelligent people are given access to a more representative medium, they unlock entirely new modes of thought, which may have been prohibitively difficult or impossible to understand in the previous paradigm.

The following are just a select few examples of this category.

### Arabic Numerals

What we now know as "Arabic numerals" were based on an earlier Hindu numerological system, transmitted to Europe through the Arab world — hence the name.

Roman numerals were prohibitively difficult to work with in higher forms of mathematics — try doing long division with them sometime. Because they were *additive* (CCXLVII means 247), there was no fixed column in which to carry or borrow, and no symbol for zero to hold an empty place.

The Hindu-Arabic system replaced this with *place value*: the same ten symbols mean different things depending on where they sit. This single change to the notation — the interface through which numbers are written and manipulated — made columnar arithmetic, long division, and eventually algebra tractable for ordinary people, not just specialists. The underlying thought had not changed; the medium for expressing it had.

### Cartesian Coordinate System

Before René Descartes, algebra and geometry were largely separate disciplines — one symbolic, the other visual. The Cartesian plane fused them. By assigning every point a pair of numbers, an equation like *y = x²* could suddenly be *seen* as a curve, and a curve could be written back as an equation.

This is the move from the *symbolic* to the *iconic* — from manipulating opaque strings of variables to manipulating shapes the eye can follow. Calculus, classical physics, and most of modern engineering are downstream of this one interface.

*From abstract... to iconic.*

## Metaphors

Humans have a unique ability to form mental symbols — i.e. understanding and representing concepts, to terms or other concepts. Studies have shown that humans' ability to reason through problems is greatly enhanced whenever it is presented in terms of another concept they already easily understand, which is why so many high-abstraction fields make such frequent uses of metaphors.

In computer science, branching data structures are called "trees;" Path algorithms are presented as a problem involving a "traveling salesman."

Even the idea of the "neural network" is a metaphor. Although most everyday users will never see the structure of the artificial neural network (ANN) that powers their favorite AI products, the defining breakthrough in the past 50 years of machine learning research was based on a metaphor to the human brain, i.e. how the structures that enable biological intelligence may inform the development of artificial intelligence.

### Icon

It has been too long since we talked about Pygmalion, so let's go back to our roots.

As aforementioned, Smith's most lasting legacy has been his introduction of the "icon" as a computing concept. Up to that point, the word "icon" originally referred to religious depictions of holy figures, such as those commissioned by the Orthodox Church, which were said to embody some of the holiness of the depicted individual. This was a major reason why iconoclasm, the destruction of religious monuments, was such a controversial issue during the Protestant Reformation in the 16th century.

An icon is not literally the figure it represents, but it provides a medium of interacting with the actual figure.

![Figure to Icon to Human diagram](/pygmalion/galatea-17.png)

According to biblica, the ancient Indian mathematician Bhaskara II would demonstrate mathematical proofs exclusively through an "iconic" visual method, appending each proof with the word "Behold!"

![Bhaskara's visual proof of the Pythagorean theorem — Pygmalion, page 26](/pygmalion/galatea-16.png)

Smith was directly inspired by this method of *drawing* rather than *describing* geometric proofs, and would go on to implement many of these concepts into his Pygmalion system in 1975.

![Smith's Pygmalion programming environment](/pygmalion/galatea-15.png)

### Desktop

Arguably the most successful computing metaphor of the past half century, the desktop paradigm was pioneered by researchers at Xerox PARC in the 1970s and brought into the mainstream by the Macintosh (1984) and Windows (1985).

In using the term "desktop," I am including many of the following corollary metaphors:

- Folders
- Windows
- Trashcan
- Documents

Early desktop prototypes literally had a 3D representation of a desk on the screen, with a trashcan on the floor and a mailbox on a nearby table.

![MacOS Big Sur and Windows 11 desktops](/pygmalion/galatea-14.png)

![Desktop to Screen to Human diagram](/pygmalion/galatea-13.png)

### Scroll

Scroll interfaces have existed from the advent of desktop computing. The Apple LISA (1983) already had the window scrollbar, which were mainly used in applications such as text editors (MacWrite, Word) and spreadsheets (VisiCalc, Excel).

However, it was not until the advent of the Web in the 1990s that scrolling pages began to eclipse the desktop metaphor as the primary navigation mechanism for consumer products. On web browsers, instead of opening applications on a desktop, the user instantly teleports to their desired destination via the URL bar, and then vertically scrolls to view the page's content.

The infinite scroll, pioneered by social media and news feeds in the early 2000s, has been a decisive factor in the popularization of scroll. Platforms such as Facebook and YouTube have greatly increased their engagement metrics by allowing the user to continuously scroll for as long as the algorithm has new videos to recommend, giving rise to addictive feedback cycles and "doomscrolling."

![The New York Times website and Windows 11](/pygmalion/galatea-12.png)

![Scroll to Human diagram](/pygmalion/galatea-11.png)

### Chat

The release of ChatGPT in November 2022 changed how the world talks to computers.

Of course, OpenAI's GPT series models had already been making waves in the research community for several years up to that point. However, the key innovation in 2022 was the incredible resonance of the "chat" metaphor. Users instantly started to talk to the LLM as if they were texting a human friend.

There were:

- Chat history
- Speech bubbles
- Personal references

Of course, there is no physical robot typing away at the other end of an LLM interface. Even the per-token "streaming" is somewhat of an illusion.

![ChatGPT and Claude interfaces](/pygmalion/galatea-10.png)

![AI to Chat to Human diagram](/pygmalion/galatea-9.png)

## Requirements

### 1) Fully *capture* the space covered by LLMs

LLMs have been notable for their emergent properties, i.e. capabilities that were not explicitly programmed into the training set. Notable examples include how researches at OpenAI discovered that their GPT-4 model could speak a Bangladeshi language that they had not officially considered in the training set.

As Geoffrey Hinton has stated, these models were not directly "created" by humans. Instead, humans designed the learning algorithms, which is similar to designing the mechanism of evolution. However, once the learning algorithm is implemented, exactly how it will interact with the training dataset is mostly a black box even to the most advanced researchers.

Unlike most software programs, there is no "purpose" that most general-purpose LLMs were designed for, and yet it can perform any number of tasks, such as writing essays, answering questions, and talking with a human in specific styles.

This is a notable difference between 1975 and 2025 — whereas every computer program used to be designed for a specific purpose and had clearly predefined boundaries, today's LLMs are capable of generating ideas and concepts that even their creators have no way of predicting.

### 2) Offer both *static* and *ephemeral* elements

> "Chatting" with LLM feels like using an 80s computer terminal. The GUI hasn't been invented, yet but imo some properties of it can start to be predicted.
> [...]
> a little bit more of an open question - the degree of procedural. On one end of the axis you can imagine one big diffusion model dreaming up the entire output canvas. On the other, a page filled with (procedural) React components or so (think: images, charts, animations, diagrams, ...). I'd guess a mix, with the latter as the primary skeleton.
>
> — *Andrej Karpathy, via X, May 1, 2025, https://x.com/karpathy/status/1917920257257459899*

In Pygmalion, Smith pointed out how the traditional command-line computers of the era forced the user to store many concepts in their short-term memory, as the entire interface was entirely ephemeral and command-based.

He offers the example of a simulation involving a rocket, in which the user would need to remember objects such as ROCKET and commands such as THRUST and BOOSTER. Since there were no static elements on the page, it was up to the user to manually remember these concepts (often with the assistance of a user manual) in order to interact with this environment.

### 3) Enable *incremental* collaboration

> An active medium must also be inherently positive. If a computer is to act as a laboratory for experimenting with ideas, it must not give negative feedback of the form: "You did that incorrectly." Instead something consistent with the situation should happen. If the result is not what was anticipated, it is up to the user to figure out why.
>
> Contrast this with conventional computer-aided instruction, in which a child is asked to answer questions and is told that he is either right or wrong. There is little potential in such instruction for a child to experiment with a subject in depth until he is finally satisfied he understands it.
>
> — *David Canfield Smith, Pygmalion: A Creative Programming Environment, 1975*

## Approaches

Early childhood learning is predominantly *enactive*, i.e. babies naturally acquire and imitate actions rather than concrete concepts.

Jerome S. Bruner's cognitive model from 1964: the **enactive**, the **iconic**, and the **symbolic**.

1. **Enactive** — Recreates the concept through motor response (e.g. walking to a destination)
2. **Iconic** — Selectively represents elements of the concept (e.g. a map of the route)
3. **Symbolic** — Neither recreates nor resembles the underlying concept (e.g. verbal directions)

![Enactive, Iconic, and Symbolic representations of directions](/pygmalion/galatea-6.png)

Bruner also mentions that the reason abstraction is so hard is that it pulls us away from the physical world we evolved to understand.

Mathematics begins with simple numerical concepts, before climbing up the abstraction ladder until the mind is forced to deal with almost exclusively symbolic concepts that cannot easily be connected to the concrete physical world.

Words are similarly composable into sentences that make semantic sense to the user, but bear little to no relationship with the real world.

This presents the dilemma of user interface design: the more composable an interface is, the less bearing it has on reality, and is therefore more difficult to understand for the average user.

![Compositionality versus relationship to reality](/pygmalion/galatea-5.png)

Children love to play "pretend."

Adults have a harder time playing pretend, and we assign fancy words to this concept by saying that we need to enter a **"suspension of disbelief"** in order to immerse ourselves in a scenario.

What is this mystery logic?

### Noah's Ark

Every week at Sunday School, I get the wonderful opportunity to look after the toddlers' class, made up of children ages 3-5.

The story of Joseph in Egypt, Moses and the burning bush, etc.

However, there was one notable exception — the story of Noah's Ark.

For those unfamiliar, the story of Noah is one of the few that extensively involves animals. The children were incredibly excited and engaged in naming each animal one by one, even spotting animals in the background that I never would have caught otherwise.

What's more surprising is that after the lesson, the children went into an unprompted play session where they would act out some of the scenes they saw, each pretending to be an animal that had to run onto Noah's Ark before the "rain" came.

![Struggling to learn from a video, then pretending to be a lion](/pygmalion/galatea-4.png)

It seems obvious at first glance — *of course* young children would respond better to lions and tigers, as opposed to the logistics behind Bronze Age grain storage in the story of Joseph.

However, using Bruner's model, we can begin to break down exactly why children would be so much more receptive to stories of animals. Animals:

1. Have associated actions
2. Are visually distinct
3. Come with easy labels

In other words, animals perfectly embody all three of Bruner's cognitive stages.

![Enactive, Iconic, and Symbolic representations of a tiger](/pygmalion/galatea-3.png)

![Tiger, Cat, and Dog with their sounds](/pygmalion/galatea-2.png)

This intuitively applies to LLMs as well. Most LLM system prompts begin with an instruction for the model to embody a concrete category (usually a human profession), so it can be pointed toward the examples of tasks carried out by that profession in its training dataset.

![LLM system prompts assigning concrete professions](/pygmalion/galatea-1.png)

## Previous Work

### Flowcharts

> Every graphical language suffers from one or more of the following:
> (1) They use static representations for dynamic processes.
> (2) They lack detail suppression mechanisms. Consequently, pictures quickly increase in complexity beyond the ability of the eye and short term memory to assimilate. (GRAIL is an exception.)
> (3) They operate on formal representations of data, one level removed from actual information.
> (4) They lack image-defining capabilities. The programmer cannot draw his own images; he must use the images of others.
>
> *\*Note: by "pictures" and "images," Smith was referring to visual flowcharts that represent algorithms*
>
> — *David Canfield Smith, Pygmalion: A Creative Programming Environment, 1975*

The first thing that most people think of when they hear "visual programming" is typically a flowchart, a diagram in which users can view the logical connections between nodes and "follow" the journey of the algorithm in a visual way.

OpenAI's own Agent Builder relies on flowcharts, giving a sense of how ubiquitous this metaphor is throughout the AI community at large. Platforms such as n8n and Zapier have also been pioneers of this "workflow" concept.

FLORA, a leading integrated AI design application, is also based on the flowchart architecture, with users connecting nodes between images and videos similar to how one would pass "props" into a React component. This approach certainly allows for more creative layouts than a normal image generator would; for example, a user can create a workflow that automatically generates alternative views (front, back, left, right, 3/4, etc.) of a single character image.

And yet, for all their utility, flowcharts were never truly *iconic*. They were simply a different way of depicting linear thought processes — text programs arranged in a 2-dimensional space. The nodes are still symbols; the connections between them are still logic. The eye follows the diagram, but the thinking happens in the same old symbolic register. A flowchart shows you the *shape* of a program without ever letting you manipulate the program *as* a shape.

Smith himself diagnosed *why* graphical languages stalled. In the four-point critique above, he listed the failures that every visual programming language of his era suffered from — and for fifty years, those four limitations held. They are the reason node graphs in tools like n8n and Zapier devolve into unreadable "spaghetti" the moment a workflow outgrows a dozen steps.

But read his list again, this time from 2025. Each failure is not a permanent flaw of visual interfaces — it is a gap that the language model now fills.

1. **Static representations for dynamic processes.** A 1975 flowchart was a frozen drawing of something that moved. A canvas built from live, procedural components dissolves this — it can show the process *as it runs*, not a lifeless diagram of it.
2. **No detail-suppression mechanism.** This is the spaghetti problem: pictures growing past what the eye and short-term memory can hold. Smith flagged a single exception, GRAIL, that could hide and reveal detail on demand. The model is GRAIL for everything — it can collapse a hundred nodes into one, expand the one you point at, and re-spatialize the entire canvas at whatever altitude you actually need.
3. **Formal representations, one level removed from actual information.** A node labeled `Customer` is not a customer; it is a symbol standing in for one — the very gap between icon and substance we opened with. A model can render the *actual* thing on the canvas: the real avatar, the real document, the real image. For the first time, the icon can *contain* the substance instead of merely pointing at it.
4. **No image-defining capability.** In 1975 you were stuck with a fixed palette of boxes and diamonds — "the images of others." Generative models hand that capability back to the user: you can draw, or describe, any element you want, and the model produces it. FLORA's character turntables are an early taste of exactly this.

But notice what those four fixes actually prove: that *visual* interfaces can work — not that *node graphs* are the form they should take. And here Smith's critique runs deeper than its four bullet points.

A node graph, however gracefully the model manages it, still asks the user to think about the wrong layer. The boxes are nouns borrowed from the program's *internals*; the arrows are its *control flow*. You are arranging plumbing — the order of operations, the routing of data — not the domain you actually came to explore. You can pour a real avatar into a box and fix point three, and you are still reading a wiring diagram. This is why node graphs feel like *programming* even when they are dressed up as drawing: the thing under your hands is the logic, and logic is irreducibly symbolic.

So the industry's instinct in the LLM era has been precisely backwards. OpenAI's Agent Builder, n8n, Zapier, FLORA — each answered the model's arrival by inviting users to draw *more* wires, on the theory that the model would finally keep the spaghetti from tangling. But the model's real gift was never that it makes us better at drawing connections. It is that it can *infer* them. And the moment the connections become the model's job, the user has no reason left to draw them at all.

That is the alternate lesson. Smith was right that node-based *programming* interfaces are a poor medium for ordinary thought — and after fifty years and a language model, they still are. The way out is not a smarter graph. It is to let the model hold the graph invisibly, so the human is left holding only the *picture*: the people, places, and events they actually care about, arranged in space, with the logic running silently underneath. The node graph is not rescued. It is absorbed — and disappears.

None of this is to say that flowcharts are *incomplete*, or that they are going away. Where control flow genuinely *is* the task — wiring an automation pipeline, chaining a sequence of API calls — the wires are not a costume; they are the point. Those tools are among the most successful AI applications on the market today, are loved by many users (including yours truly), and will thrive for a very long time. The node graph disappears only where the user came to *think*, not to *automate*.

Rather, the point is that the space is ripe for a successor to the original Pygmalion paper — an "iconic programming" approach to AI applications, in which users do not merely *read* a visual representation of their intent, but *act* on the canvas directly, and watch the system respond in kind.

![A flowchart of nodes branching into two paths](/pygmalion/galatea-8.png)

![OpenAI Agent Builder and Figma Weave](/pygmalion/galatea-7.png)

### Voice

> Every so often, a new interface emerges that redefines how we interact with computers. The keyboard. The mouse. The touchscreen. Today, we believe we're at the start of the next great shift—where voice becomes a primary interface to AI.
>
> — *Sequoia Blog, Partnering with Sesame: A New Era for Voice, October 21, 2023, https://www.sequoiacap.com/article/partnering-with-sesame-a-new-era-for-voice/*

I do not believe voice represents a new interface paradigm.

Voice UX is functionally identical to text-based chat. It is more convenient and more *natural* — real humans primarily communicate through speech, and it is the first notable skill a toddler acquires — but naturalness is not the same as expressiveness. Underneath, voice is still a linear stream of language fed into a model, exactly like chat. It changes the *input device*, not the *interface paradigm*.

Worse, speech is **ephemeral and unrevisable** in a way that text is not. Once a word leaves your mouth it is gone; you cannot scroll back through it, select a phrase, or rewrite a clause. This makes voice a poor medium for the kind of incremental, collaborative refinement that real thinking requires:

1. **It becomes less usable as context length increases.** A 1-line and a 100-line prompt can be edited with equal ease in a text box. Spoken aloud, a 100-line request is unholdable — there is nothing to scroll back to and nothing to point at.
2. **It requires the entire thought to be formalized up front.** Text lets you draft badly and fix it later; you can type a rough first pass and revise. Speech demands that you know what you mean *before* you say it, because there is no draft to return to.
3. **It cannot be easily edited in real time.** When the user wants to amend a request, phrases like "cancel that last part" or "actually, replace the first line with this" are hopelessly inexact. The model must *guess* what "the first line" refers to, because there is no shared, persistent artifact for both parties to point at.
4. **It requires highly ideal conditions.** One does not simply speak aloud to Siri in public. Voice typically assumes you are at home (Amazon Echo, Google Home) or have found an open private room — which, as any office worker knows, is a non-trivial task.

Audio-based interfaces will always exist, and they are wonderful for hands-free and accessibility contexts. But a more convenient way to *speak* to a linear chat is not a new way to *think* with a computer.

### Sidebar

The most successful AI consumer applications have all converged on what we will call the "sidebar" approach, in which the chat remains the primary driver but a secondary panel renders the model's output in a richer form. ChatGPT's Canvas, Claude's side panel, and Perplexity's answer view are all variations on this theme — the conversation lives on the left, and the *product of that conversation* lives on the right.

This is a genuine improvement over pure chat. It satisfies our second requirement by introducing **static elements** that persist across turns: a document you can re-read, a chart you can keep referring to, a block of code that does not scroll away the moment the next message arrives.

But the sidebar only solves *display*. The panel is something the model writes *to*; it is not something the user can write *from*. To change what is in the sidebar, you must return to the chat box and describe your edit in words — "make the title bigger," "change the second paragraph" — and hope the model resolves your reference correctly. The output is iconic, but the *control* is still symbolic. We are back to the rocket simulation, naming objects we cannot touch.

### Artifact

The first and most notable attempt at providing a more *interactive* environment for LLM output was what we will be referring to as an "artifact," a term popularized by Anthropic's Claude Artifacts feature. This approach is very similar to the sidebar, except the panel is no longer a static rendering — it is a live, running program. The model writes a React component or a small web app, and the user can immediately click the buttons, drag the sliders, and watch it respond.

This is the closest the mainstream has come to *iconic programming*. For the first time, the thing on screen is not a description of behavior but the behavior itself.

And yet the artifact inherits the sidebar's fundamental limitation: it is **chat-controlled and turn-bound**. The user can interact with the running program, but they cannot *edit* it by acting on it. Drag a box to a new position inside an artifact and nothing is remembered — the next time the model regenerates the component, your change is gone, because the source of truth was never the canvas. It was always the conversation. The artifact is a window you can press your hands against but never reach through.

## Proposal

We now have everything we need to describe the missing interface.

Recall our three requirements. The interface must (1) **capture the full space** of what an LLM can produce, (2) offer both **static and ephemeral** elements, and (3) enable **incremental collaboration**. Chat fails the second and third. The sidebar fixes the second. The artifact gestures at the third but takes it back the moment a new turn begins.

The common failure runs through all of them: in every existing paradigm, the **canvas is an output and the chat is the input**. The user thinks in the symbolic register — typing sentences — and the model translates those sentences into something iconic. The visual layer is always downstream of the language layer, and so the user never actually *thinks* in pictures. They think in words *about* pictures.

Mapping this onto Bruner makes the gap obvious:

1. **Chat** is purely **symbolic**. You manipulate strings; the meaning lives elsewhere.
2. **The sidebar and artifact** are **iconic in display, symbolic in control**. You see a picture, but you change it by describing it.
3. The interface we are missing is **iconic *and* enactive**: a canvas the user can *act on directly*, where dragging, drawing, grouping, and connecting are themselves the program — and where the model treats those actions as first-class input, not noise to be re-described in chat.

This is what Smith was reaching for in 1975, and what Karpathy described fifty years later: a page filled with *"(procedural) React components"* forming the skeleton, with *"one big diffusion model dreaming up the... canvas"* on top. The model generates the iconic skeleton; the user rearranges it by hand; the model reads the rearrangement and generates the next layer. The canvas becomes the shared, persistent artifact that both parties can point at — solving the exact problem that doomed voice, where there was *"nothing to scroll back to and nothing to point at."*

Concretely: imagine asking about *Edge Esmeralda*. Chat returns three paragraphs you must read top to bottom. The sidebar returns the same three paragraphs in a nicer font. But an iconic canvas would *spatialize* the answer — people as avatars you can drag into groups, events as cards you can place on a timeline, locations pinned to a map — and the moment you drag a person next to an event, the model fills in *how* they are connected. You are no longer reading *about* the information. You are thinking *with* it, the way a child rearranges animals onto Noah's Ark.

And notice what is *not* on this canvas: wires. There are no arrows to route, no nodes to connect, no execution graph to debug. This is the payoff of letting the model absorb the graph. You drag a person beside an event and the connection simply *appears* in prose, because inferring that link is the one thing the model does better than any diagram. The plumbing has gone silent and underground; what remains in your hands is only the picture — the people, places, and events you actually came to think about. The node graph hasn't been improved. It has dissolved into the model, leaving the canvas free for content.

The chat box does not disappear. It recedes to where it belongs — as one tool among many on a canvas you can finally touch. After fifty years of describing our intentions to the machine in words, we can begin, once again, to *draw* them.
