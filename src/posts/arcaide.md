---
type: web
title: Arcaide
description: ARC Annotation Web App
url: https://shelost.github.io/arcaide2
banner: banner-platformr
card: card-arcaide
rating: 5
color: E7F7FF
date: '2025-7-21'
author: 'Dantès'
categories:
  - HTML
  - JS
  - Canvas
published: true
---

[button url="http://www.google.com"]


# Introduction

**Platformr** is a twist on the classic 2D platformer genre, where you have to create your own platforms (from a limited number, based on the level) and
try to make it to the other side.

There are **18 levels** in total — each one hand-crafted with a special set of obstacles & enemies.

Platformr is by far my favorite game that I've created personally, if only because it was the most fun to create. I got to experience level design &
unique uses of the HTML Canvas in order to make the game look & feel as immersive as possible.


# Screenshots

There aren't a


# Source Code

This entire game was created with **~1600** lines of JavaScript code, all in a single file.



&nbsp;

```ts
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
```

```ts
function Squircle(x, y, w, h, r, strokeOnly) {

    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.r = r

    if (r > w / 2) {
        this.r = w/2
    }
    if (r > h / 2) {
        this.r = h/2
    }

    this.ix = x
    this.iy = y
    this.iw = w
    this.ih = h
    this.strokeOnly = strokeOnly
    this.xspeed = 0
    this.yspeed = 0
    this.playerOn = false

    this.draw = function(){
        ctx.beginPath()
        ctx.moveTo(this.x+this.r, this.y)
        ctx.lineTo(this.x+this.w-this.r, this.y)
        ctx.arc(this.x+this.w-this.r, this.y+this.r, this.r, Math.PI*3/2, Math.PI*2)
        ctx.lineTo(this.x+this.w, this.y+this.h-this.r)
        ctx.arc(this.x+this.w-this.r, this.y+this.h-this.r,this.r, 0, Math.PI/2)
        ctx.lineTo(this.x+this.r, this.y+this.h)
        ctx.arc(this.x+this.r, this.y+this.h-this.r, this.r, Math.PI/2, Math.PI)
        ctx.lineTo(this.x, this.y+this.r)
        ctx.arc(this.x+this.r, this.y+this.r, this.r, Math.PI, Math.PI*3/2)
        if (this.strokeOnly){
            ctx.stroke()
        }else{
            ctx.fill()
        }
        ctx.closePath()
    }
}
```

