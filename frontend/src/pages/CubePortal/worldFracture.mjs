// Transient viewport geometry, independent from the original stone mesh.
// Rays deliberately terminate on the actual screen edges, including mobile.
export function worldFracturePaths({ width, height, x, y }) {
  if (![width, height, x, y].every(Number.isFinite) || width <= 0 || height <= 0) return []
  const origin = [Math.max(0, Math.min(width, x)), Math.max(0, Math.min(height, y))]
  const edges = [[0,0],[.29,0],[.73,0],[1,0],[1,.32],[1,.78],[1,1],[.64,1],[.21,1],[0,1],[0,.69],[0,.23]]
  const point = ([a,b]) => `${a.toFixed(2)} ${b.toFixed(2)}`
  const mix = (a,b,t) => [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]
  const rays = edges.map(([u,v], i) => {
    const end = [u*width,v*height]
    const dx = end[0]-origin[0], dy = end[1]-origin[1]
    const length = Math.hypot(dx,dy) || 1
    const amplitude = Math.min(length*.12, Math.min(width,height)*.055)
    const joints = [.23+(i%3)*.055,.53+(i%4)*.037,.81-(i%2)*.06].map((t,j) => {
      const p = mix(origin,end,t)
      const bend = amplitude * ((i+j)%2 ? -1 : 1) * (j===1 ? 1 : .55)
      return [Math.max(0,Math.min(width,p[0]-dy/length*bend)),Math.max(0,Math.min(height,p[1]+dx/length*bend))]
    })
    return {end,joints}
  })
  return rays.flatMap(({end,joints},i) => {
    const next = rays[(i+1)%rays.length]
    const fork = mix(joints[1],next.joints[1],.42+(i%3)*.09)
    const tip = mix(next.joints[1],next.joints[2],.3+(i%2)*.27)
    return [
      {id:`ray-${i}`,d:`M${point(origin)} L${joints.map(point).join(' L')} L${point(end)}`,branch:false,delay:(i%4)*7},
      {id:`fork-${i}`,d:`M${point(joints[1])} L${point(fork)} L${point(tip)}`,branch:true,delay:42+(i%4)*7},
    ]
  })
}
