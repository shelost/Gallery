---
type: game
title: Platformr
description: 2D Platformer Game
blurb: "My personal favorite game, where you create your own platforms. 18 handcrafted levels."
url: https://shelost.github.io/platformr
banner: banner-platformr
card: card-platformr
preview: bento-platformr
video: platformr
rating: 2
color: FFF2C3
date: '2025-7-21'
author: 'Dantès'
categories:
  - HTML
  - JS
  - Canvas
tier: 1
published: true
---

<script>

  import Gallery from '$lib/components/Gallery.svelte'

  let images = [
    { url: 'platformr-1', caption: '' },
    { url: 'platformr-2', caption: '' },
    { url: 'platformr-3', caption: '' },
    { url: 'platformr-4', caption: '' },
    { url: 'platformr-5', caption: '' },
    { url: 'platformr-6', caption: '' },
    { url: 'platformr-7', caption: '' },
    { url: 'platformr-8', caption: '' },
  ]
</script>

<a href = 'https://shelost.github.io/platformr'>
  <button>
    Play
  </button>
</a>


# Introduction

**Platformr** is a twist on the classic 2D platformer genre, where you have to create your own platforms (from a limited number, based on the level) and
try to make it to the other side.

There are **18 levels** in total — each one hand-crafted with a special set of obstacles & enemies.

Platformr is by far my favorite game that I've created personally, if only because it was the most fun to create. I got to experience level design &
unique uses of the HTML Canvas in order to make the game look & feel as immersive as possible.


# Screenshots

There aren't a

<Gallery images = {images} col = 2 />

# Source Code

This entire game was created with **~1600** lines of JavaScript code, all in a single file.

&nbsp;

<!--
```ts
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
```
-->
