---
series: Canvas — Lesson 1
type: gallery
title: Team Ithaca
description: School Team Designs
card: card-scioly
banner: null
color: ffefef
date: '2021-01-27'
author: 'Dantès'
categories:
  - sveltekit
  - svelte
published: true
---

<script>

  import Gallery from '$lib/components/Gallery.svelte'

  let images = [
    { url: 'scioly-01', caption: '' },
    { url: 'scioly-02', caption: '' },
    { url: 'scioly-03', caption: '' },
    { url: 'scioly-04', caption: '' },
    { url: 'scioly-05', caption: '' },
    { url: 'scioly-06', caption: '' },
  ]

  let images2 = [
    { url: 'brainteam-ift', caption: 'Ithaca Fall Tournament (IFT)' },
    { url: 'brainteam-banner', caption: 'Ithaca Brain Team' },
    { url: 'brainteam-circle', caption: 'Circle Logo' },
    { url: 'brainteam-spring', caption: 'Trivia Night' },

  ]

</script>


# Science Olympiad

I created the team logo + branding for Ithaca's Science Olympiad team,

<Gallery images = {images} />

# Brain Team

**Brain Team** is Ithaca's own nationally-ranked Quiz Bowl team.

I was the captain of the team during our 2020-21 season, when I also created our team's visual branding as well as posters for our fundraising events.

<Gallery images = {images2} col = 2 />