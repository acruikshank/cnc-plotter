const p = require('./plotter')(1000, -0.8, 0.8)
const perlin = require('./perlin').noise

const cx = 200
const cy = 180
const dtheta = 0.03
const drad = .0005
const dnoise = .00008
let theta = 0
let rad = 50
let noise = 0
let N = 50000

p.header()
p.pendown()
p.quick(cx+rad*Math.cos(theta), cy+rad*Math.sin(theta))
for (let i=0; i<N; i++) {
  let nx = .015*rad*Math.cos(theta), ny = .015*rad*Math.sin(theta)
  let nrad = rad + Math.pow(noise,4)*perlin.perlin2(nx, ny)
  p.move(cx+nrad*Math.cos(theta), cy+nrad*Math.sin(theta))
  theta += dtheta
  rad += drad
  noise += dnoise
}
p.penup()
p.quick(0,0)
p.footer()
