---
series: Stan
type: design
title: CUApts
description: University Housing Database
blurb: "As part of the Cornell Design & Tech Initiative (DTI), I designed the search engine for off-campus housing in Ithaca."
card: card-stan
banner: null
preview: bento-cuapts
rating: 3
color: FFD5D5
date: '2024-01-27'
author: 'Dantès'
tags:
  - university
categories:
  - Work
  - figma
published: true
---

<script>

  import Gallery from '$lib/components/Gallery.svelte'

  let images = [
    { url: 'stan-icons/ic=Dashboard', type: 'svg', caption: "Dashboard" },
    { url: 'stan-icons/ic=Home', type: 'svg', caption: "Home" },
    { url: 'stan-icons/ic=Smile', type: 'svg', caption: "Smile" },
    { url: 'stan-icons/ic=Store', type: 'svg', caption: "Store" },
    { url: 'stan-icons/ic=Heart', type: 'svg', caption: "Heart" },
    { url: 'stan-icons/ic=Clock', type: 'svg', caption: "Clock" },
    { url: 'stan-icons/ic=Funnel', type: 'svg', caption: "Funnel" },
    { url: 'stan-icons/ic=Settings', type: 'svg', caption: "Settings" },

    { url: 'stan-icons/ic=Chart', type: 'svg', caption: "Chart" },
    { url: 'stan-icons/ic=Wallet', type: 'svg', caption: "Wallet" },
    { url: 'stan-icons/ic=Integration', type: 'svg', caption: "Integration" },
    { url: 'stan-icons/ic=Check', type: 'svg', caption: "Check" },
    { url: 'stan-icons/ic=Calendar', type: 'svg', caption: "Calendar" },
    { url: 'stan-icons/ic=Course', type: 'svg', caption: "Course" },
    { url: 'stan-icons/ic=Download', type: 'svg', caption: "Download" },
    { url: 'stan-icons/ic=Webinar', type: 'svg', caption: "Webinar" },

    { url: 'stan-icons/ic=Person', type: 'svg', caption: "Person" },
    { url: 'stan-icons/ic=People', type: 'svg', caption: "People" },
    { url: 'stan-icons/ic=Send', type: 'svg', caption: "Send" },
    { url: 'stan-icons/ic=Image', type: 'svg', caption: "Image" },
    { url: 'stan-icons/ic=Edit', type: 'svg', caption: "Edit" },
    { url: 'stan-icons/ic=Lock', type: 'svg', caption: "Lock" },
    { url: 'stan-icons/ic=Copy', type: 'svg', caption: "Copy" },
    { url: 'stan-icons/ic=Back', type: 'svg', caption: "Back" },

    { url: 'stan-icons/ic=Stan', type: 'svg', caption: "Stan" },
    { url: 'stan-icons/ic=Money', type: 'svg', caption: "Money" },
    { url: 'stan-icons/ic=URL', type: 'svg', caption: "URL" },
    { url: 'stan-icons/ic=Box', type: 'svg', caption: "Box" },
    { url: 'stan-icons/ic=Product', type: 'svg', caption: "Product" },
    { url: 'stan-icons/ic=Design', type: 'svg', caption: "Design" },

    { url: 'stan-icons/ic=ArrowTopRight', type: 'svg', caption: "ArrowTopRight" },
    { url: 'stan-icons/ic=ArrowRight', type: 'svg', caption: "ArrowRight" },
    { url: 'stan-icons/ic=ArrowLeft', type: 'svg', caption: "ArrowLeft" },
    { url: 'stan-icons/ic=ArrowUp', type: 'svg', caption: "ArrowUp" },
    { url: 'stan-icons/ic=ArrowDown', type: 'svg', caption: "ArrowDown" },
    { url: 'stan-icons/ic=Publish', type: 'svg', caption: "ArrowPublish" },

    { url: 'stan-icons/ic=Bold', type: 'svg', caption: "Bold" },
    { url: 'stan-icons/ic=Italic', type: 'svg', caption: "Italic" },
    { url: 'stan-icons/ic=List', type: 'svg', caption: "List" },
    { url: 'stan-icons/ic=+', type: 'svg', caption: "+" },
    { url: 'stan-icons/ic=X', type: 'svg', caption: "X" },
    { url: 'stan-icons/ic=Cycle', type: 'svg', caption: "Cycle" },

    { url: 'stan-icons/ic=Increase', type: 'svg', caption: "Increase" },
    { url: 'stan-icons/ic=Decrease', type: 'svg', caption: "Decrease" },
    { url: 'stan-icons/ic=PointerUp', type: 'svg', caption: "PointerUp" },
    { url: 'stan-icons/ic=PointerDown', type: 'svg', caption: "PointerDown" },
    { url: 'stan-icons/ic=Visible', type: 'svg', caption: "Visible" },
    { url: 'stan-icons/ic=Hidden', type: 'svg', caption: "Hidden" },

    { url: 'stan-icons/ic=Dropdown', type: 'svg', caption: "Dropdown" },
    { url: 'stan-icons/ic=v', type: 'svg', caption: "Radio" },
    { url: 'stan-icons/ic=DangerCircle', type: 'svg', caption: "DangerCircle" },
    { url: 'stan-icons/ic=CheckCircle', type: 'svg', caption: "CheckCircle" },
    { url: 'stan-icons/ic=xCircle', type: 'svg', caption: "xCircle" },
    { url: 'stan-icons/ic=info', type: 'svg', caption: "Info" },

    { url: 'stan-icons/ic=Checkbox', type: 'svg', caption: "Checkbox" },
    { url: 'stan-icons/ic=Paragraph', type: 'svg', caption: "Paragraph" },
    { url: 'stan-icons/ic=Checkout', type: 'svg', caption: "Checkout" },
    { url: 'stan-icons/ic=Options', type: 'svg', caption: "Options" },
    { url: 'stan-icons/ic=Save', type: 'svg', caption: "Save" },
    { url: 'stan-icons/ic=Trash', type: 'svg', caption: "Trash" },

    { url: 'stan-icons/ic=Text', type: 'svg', caption: "Dropdown" },
    { url: 'stan-icons/ic=Phone', type: 'svg', caption: "Radio" },
    { url: 'stan-icons/ic=Video', type: 'svg', caption: "Dashboard" },
    { url: 'stan-icons/ic=Pointer', type: 'svg', caption: "Dashboard" },
    { url: 'stan-icons/ic=Bell', type: 'svg', caption: "Dashboard" },
    { url: 'stan-icons/ic=Message', type: 'svg', caption: "Dashboard" },

    { url: 'stan-icons/ic=Mail', type: 'svg', caption: "Dropdown" },
    { url: 'stan-icons/ic=MailArrow', type: 'svg', caption: "Radio" },
    { url: 'stan-icons/ic=Custom', type: 'svg', caption: "Dashboard" },
    { url: 'stan-icons/ic=Magnet', type: 'svg', caption: "Dashboard" },
    { url: 'stan-icons/ic=Traffic', type: 'svg', caption: "Dashboard" },
    { url: 'stan-icons/ic=Conversion', type: 'svg', caption: "Dashboard" },

  ]

</script>

The <a href = ''> Learning + Recursion Lab </a> is a


<Gallery images = {images} col = 8 />