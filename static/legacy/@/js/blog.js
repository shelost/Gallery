window.onscroll = () => {

    for (let i = 0; i < coords.length; i++){
        let coord = coords[i]
        if (i < coords.length - 1) {
            let next = coords[i + 1]
            if (coord < window.scrollY && window.scrollY < next) {
                for (let i = 0; i < Class('menu_item').length; i++){
                    let item = Class('menu_item')[i]
                    item.classList.remove('active')
                }
                Class('menu_item')[i].classList.add('active')
            }
        } else {
            if (coord < window.scrollY) {
                for (let i = 0; i < Class('menu_item').length; i++){
                    let item = Class('menu_item')[i]
                    item.classList.remove('active')
                }
                Class('menu_item')[i].classList.add('active')
            }
        }
    }
}

let coords = []

for (i = 0; i < Class('anchor').length; i++){
    let title = Class('anchor')[i]
    let menu = Class('menu_item')[i]

    coords.push(title.getBoundingClientRect().top + window.scrollY)

    menu.onclick = () => {

        let id = menu.id.substring(1)

        console.log(title, title.getBoundingClientRect())

        console.log(title)

        window.scrollTo({
            left: 0,
            top: title.getBoundingClientRect().top + window.scrollY,
            behavior: 'smooth'
        })
    }
}

let mx, my, scale = 0
let cx = 1200
let cy = 900

window.addEventListener('mousemove', e => {
    mx = e.clientX
    my = e.clientY
})

for (let i = 0; i < Class('tlcanvas').length; i++){

    let c = Class('tlcanvas')[i],
        ctx = c.getContext('2d'),
        rect = c.getBoundingClientRect()

    c.width = cx
    c.height = cy

    let ex = 0

    scale = cx / rect.width

    const loop = () => {

        ex = (mx - rect.left)*scale
        ctx.clearRect(0, 0, c.width, c.height)

        ctx.beginPath()
        ctx.strokeStyle = 'white'
        ctx.moveTo(ex, 0)

        ctx.lineTo(ex, cy)

        ctx.stroke()
        ctx.closePath()

        window.requestAnimationFrame(loop)
    }
    window.requestAnimationFrame(loop)
}

window.addEventListener('resize', Recalibrate)

function Recalibrate() {
    for (let i = 0; i < Class('tlcanvas').length; i++) {

        let c = Class('tlcanvas')[i],
            ctx = c.getContext('2d'),
            rect = c.getBoundingClientRect()

            scale = cx / rect.width
    }
}



const NAV =
`
`