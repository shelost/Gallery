---
type: gallery
series: Samhan
title: NYBC
description: Posters & Marketing
card: card-nybc
banner: null
color: e0e0e0
date: '2025-01-27'
author: 'Dantès'
categories:
  - procreate
  - figma
tier: 1
published: false
---

<script>
  export let data
  import Gallery from '$lib/components/Gallery.svelte'

  let images = [
    { url: 'nybc-card2', caption: 'Concert' },
    { url: 'nybc-2025', caption: '2025' },
    { url: 'nybc-2024', caption: '2024' },
    { url: 'nybc-2023', caption: '2023' },
    { url: 'nybc-2022', caption: '2022' },
    { url: 'nybc-2021', caption: '2021' },
    { url: 'nybc-2025c', caption: '2025 (Concert)'},
    { url: 'nybc-2020c', caption: '2020 (Concert)' },
    { url: 'nybc', caption: '2020 (Concert)' },
  ]

  let images2 = [
    { url: 'nybc-2021c', caption: '2021 (Concert)' },
    { url: 'nybc-1', caption: 'Tickets' },
  ]

   let images4 = [
    { url: 'nybc-2025a', caption: '2025 (Albany)' },
    { url: 'nybc-2025b', caption: '2021 (Buffalo)' },
    { url: 'nybc-2025s', caption: '2021 (Syracuse)' },
    { url: 'nybc-2025i', caption: '2021 (Ithaca)' },
  ]



</script>


This is a collection of early drawings / concept art for the **King of Samhan**, a comic project that I'm currently working on.

The story is based on the 7th-century Unification Wars in Korea, when

[a relative link](platformr)


<Gallery images = {images} col = 3 />
<Gallery images = {images2} col = 2 />
<Gallery images = {images4} col = 4 />

