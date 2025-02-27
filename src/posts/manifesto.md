---
series: Manifesto
type: blog
title: Why We Started Hackerdash
description: Second post.
date: '2023-7-22'
author: 'Dantès'
categories:
  - sveltekit
  - svelte
published: false
---

<script>
  import Counter from './counter.svelte'
</script>


I believe Indie Hacking is the future of developer work.

This assumes you know the basics of how HTML works — if you don't, W3Schools has an <a href='https://www.w3schools.com/html/'> excellent course </a> on how you can get started with the basics.

Alright, let's get into it:

&nbsp;
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <canvas id = 'canvas'></canvas>
</body>
</html>
```

&nbsp;
```css
/* style.css */
canvas{
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: black;
}
```

^ This means that the canvas should take up the entire screen, with a black background!

^^ This works well for fullscreen games, especially. We'll discuss "small-screen" canvas implementation later.


```js
// script.js
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
```

^ T

## Counter

<Counter />
