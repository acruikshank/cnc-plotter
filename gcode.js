fs = require('fs')

module.exports = function(config, stream) {
  let lx = 0
  let ly = 0
  const draw = (x, y) => stream.write(`X${x.toFixed(3)} Y${y.toFixed(3)} Z${depth(lx, ly, config).toFixed(3)}\n`)
  const quick = (x, y) => stream.write(`G0 X${x.toFixed(3)} Y${y.toFixed(3)}\n`)
  let movement = quick

  return {
    header: () => stream.write(`%\nG90 G94\nG17\nG21\n\nG54\nG1 Z${retract(lx,ly,config).toFixed(3)} F${config.drawRate}\n`),
    footer: () => stream.write('G0 Z30\nG0 X0 Y0\nM9\nM30\n%\n'),
    penup: () => { movement = quick; stream.write(`G0 Z${retract(lx,ly,config).toFixed(3)}\n`) },
    pendown: () => { movement = draw; stream.write(`G0 Z${depth(lx, ly, config).toFixed(3)}\n`) },
    move: (x, y) => { lx=x; ly=y; movement(x, y) }
  }
}

function depth(x, y, config) {
  return config.depth + levelz(x, y, config)
}

function retract(x, y, config) {
  return config.retraction + levelz(x, y, config)
}

function levelz(x, y, config) {
  if (!config.depthMap)
    return 0

  const bounds = config.bounds
  const depthMap = config.depthMap
  const lenx = depthMap.length
  const leny = depthMap[0].length
  const xsize = bounds[1][0]-bounds[0][0]
  const ysize = bounds[1][1]-bounds[0][1]
  const xseg = xsize/(lenx-1)
  const yseg = ysize/(leny-1)

  // find relevant square and fraction within it.
  // the .99999s keeps us from finding the far edge
  const xindex = parseInt((x-bounds[0][0])*(lenx-1) / xsize)
  const yindex = parseInt((y-bounds[0][1])*(leny-1) / ysize)

  // compute the location (t,u) within the square as a fractions between (0,0) and (1,1)
  const t = ((x-bounds[0][0]) % xseg) / xseg
  const u = ((y-bounds[0][1]) % yseg) / yseg

  // lerp the offsets
  let z1 = xindex < lenx-1
    ? lerp(t, depthMap[xindex][yindex], depthMap[xindex+1][yindex])
    : depthMap[xindex][yindex]

  if (yindex == leny-1)
    return z1

  let z2 = xindex < lenx-1
    ? lerp(t, depthMap[xindex][yindex+1], depthMap[xindex+1][yindex+1])
    : depthMap[xindex][yindex+1]

  return lerp(u, z1, z2)
}

function lerp(x,a,b) { return a + x*(b-a) }
