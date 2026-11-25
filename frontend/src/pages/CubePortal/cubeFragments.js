// The seven polygons tile the source image; its alpha preserves the stone silhouette.
// Shared boundaries keep the original artwork intact when the fragments converge.
export const LEGACY_CUBE_FRAGMENTS = Object.freeze([
  {id:'crown-left',d:'M0 0H390L510 240 335 465 153 356 0 268Z',dx:-145,dy:-135,angle:-12},
  {id:'crown-center',d:'M390 0H875L760 260 880 490 627 637 335 465 510 240Z',dx:5,dy:-220,angle:5},
  {id:'crown-right',d:'M875 0H1254V253L1090 354 880 490 760 260Z',dx:160,dy:-110,angle:13},
  {id:'west-upper',d:'M0 268L153 356 335 465 627 637 660 815 420 850 260 720 0 765Z',dx:-205,dy:5,angle:-9},
  {id:'east-upper',d:'M627 637L880 490 1090 354 1254 253V730L1015 760 840 820 660 815Z',dx:210,dy:5,angle:10},
  {id:'west-lower',d:'M0 765L260 720 420 850 660 815 627 960 640 1254H0Z',dx:-135,dy:155,angle:9},
  {id:'east-lower',d:'M660 815L840 820 1015 760 1254 730V1254H640L627 960Z',dx:130,dy:180,angle:-8},
])

// Unequal, seeded angular cuts, rather than an evenly spaced Voronoi grid.
// A piece is finished only when BOTH size bounds are satisfied.
const SIZE = 1254
export const FRACTURE_LIMITS = Object.freeze({maxArea:65000,maxSpan:390})
export const DEFAULT_FRACTURE_SEED = 123

export function polygonArea(polygon) {
  return Math.abs(polygon.reduce((sum,p,i)=>{
    const q=polygon[(i+1)%polygon.length]
    return sum+p[0]*q[1]-q[0]*p[1]
  },0))/2
}
function farthestPair(polygon) {
  let pair=[polygon[0],polygon[1]], distance=0
  for(const a of polygon) for(const b of polygon) {
    const d=Math.hypot(a[0]-b[0],a[1]-b[1])
    if(d>distance) {pair=[a,b];distance=d}
  }
  return {pair,distance}
}
export const polygonSpan=polygon=>farthestPair(polygon).distance

function seededRandom(seed) {
  let state=seed>>>0
  return ()=>{
    state=(Math.imul(state,1664525)+1013904223)>>>0
    return state/4294967296
  }
}
function cut(polygon,nx,ny,limit) {
  const sides=[[],[]]
  for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length]
    const da=a[0]*nx+a[1]*ny-limit,db=b[0]*nx+b[1]*ny-limit
    sides[da<=0?0:1].push(a)
    if((da<=0)!==(db<=0)){
      const t=da/(da-db)
      const shared=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]
      sides[0].push(shared);sides[1].push(shared)
    }
  }
  return sides
}
const rounded=n=>Math.round(n*1000)/1000
export function fractureCells(seed=DEFAULT_FRACTURE_SEED) {
  const random=seededRandom(seed)
  const split=polygon=>{
    const {pair,distance}=farthestPair(polygon)
    if(polygonArea(polygon)<=FRACTURE_LIMITS.maxArea && distance<=FRACTURE_LIMITS.maxSpan)return [polygon]
    const [a,b]=pair
    // Vary angle and position so the split produces both chips and slabs.
    const angle=Math.atan2(b[1]-a[1],b[0]-a[0])+(random()-.5)*1.3
    const nx=Math.cos(angle),ny=Math.sin(angle)
    const projection=polygon.map(p=>p[0]*nx+p[1]*ny)
    const lo=Math.min(...projection),hi=Math.max(...projection)
    const limit=lo+(hi-lo)*(.28+.44*random())
    return cut(polygon,nx,ny,limit).flatMap(split)
  }
  return split([[0,0],[SIZE,0],[SIZE,SIZE],[0,SIZE]]).map(p=>p.map(v=>v.map(rounded)))
}
const cells=fractureCells()
const motionRandom=seededRandom(DEFAULT_FRACTURE_SEED+17)
export const CUBE_FRAGMENTS=Object.freeze(cells.map((polygon,i)=>{
  const [x,y]=polygon.reduce(([sx,sy],p)=>[sx+p[0]/polygon.length,sy+p[1]/polygon.length],[0,0])
  const mass=polygonArea(polygon)
  const weight=Math.min(1,mass/FRACTURE_LIMITS.maxArea)
  const heavy=weight>.57
  const vx=x-627,vy=y-565
  const direction=Math.atan2(vy,vx)+(motionRandom()-.5)*.36
  const distance=155+(1-weight)*100+motionRandom()*35
  return Object.freeze({
    id:'stone-'+i,
    d:'M'+polygon.map(p=>p.join(' ')).join('L')+'Z',
    dx:Math.round(Math.cos(direction)*distance),dy:Math.round(Math.sin(direction)*distance),
    angle:(motionRandom()>.5?1:-1)*(4+Math.round((1-weight)*15+motionRandom()*5)),
    x:rounded(x),y:rounded(y),heavy,
    area:mass,span:polygonSpan(polygon),
    delay:Math.round(20+weight*155),
    returnDelay:Math.round((1-weight)*125),
  })
}))
// Only internal cell boundaries are illuminated; the alpha mask hides
// any portion of the diagram outside the actual stone silhouette.
export const FRACTURE_SEAMS=(()=>{
  const edges=new Map()
  for(const polygon of cells) for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length]
    const key=[a.join(','),b.join(',')].sort().join(':')
    if(!edges.has(key))edges.set(key,[a,b])
  }
  return [...edges.values()].filter(([a,b])=>!([0,SIZE].some(v=>(a[0]===v&&b[0]===v)||(a[1]===v&&b[1]===v))))
    .map(([a,b])=>'M'+a.join(' ')+'L'+b.join(' ')).join(' ')
})()
export const FRACTURE_PARTICLES=Object.freeze(Array.from({length:8},(_,i)=>{
  const angle=i*Math.PI/4+.18
  return {x:Math.round(627+Math.cos(angle)*145),y:Math.round(565+Math.sin(angle)*100),
    dx:Math.round(Math.cos(angle)*140),dy:Math.round(Math.sin(angle)*110),size:4+i%3*2,delay:i%4*18}
}))
export function selectFracture(search='') {
  return new URLSearchParams(search).get('fracture')==='7'?LEGACY_CUBE_FRAGMENTS:CUBE_FRAGMENTS
}
