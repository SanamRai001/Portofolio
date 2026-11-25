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

// Uneven seed spacing creates a mix of heavy plates and smaller chips.
// Each cell is clipped by perpendicular bisectors in source-image coordinates.
const SIZE = 1254
const SEEDS = [
  [348,290],[480,215],[620,175],[778,245],[922,306],
  [261,435],[404,414],[540,383],[654,346],[790,427],[993,445],
  [313,600],[459,570],[615,580],[751,568],[924,612],
  [344,825],[536,771],[713,829],[899,811],
]
function clipHalfPlane(polygon, nx, ny, limit) {
  const result = []
  for(let i=0;i<polygon.length;i++) {
    const a=polygon[i], b=polygon[(i+1)%polygon.length]
    const da=a[0]*nx+a[1]*ny-limit, db=b[0]*nx+b[1]*ny-limit
    if(da<=0) result.push(a)
    if((da<=0)!==(db<=0)) {
      const t=da/(da-db)
      result.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])
    }
  }
  return result
}
const rounded = n => Math.round(n*1000)/1000
export function fractureCells() {
  return SEEDS.map(([x,y],i) => {
    let polygon=[[0,0],[SIZE,0],[SIZE,SIZE],[0,SIZE]]
    SEEDS.forEach(([sx,sy],j)=>{
      if(i!==j) polygon=clipHalfPlane(polygon,sx-x,sy-y,(sx*sx+sy*sy-x*x-y*y)/2)
    })
    return polygon.map(p=>p.map(rounded))
  })
}
const cells=fractureCells()
const area = polygon => Math.abs(polygon.reduce((sum,p,i)=>{
  const q=polygon[(i+1)%polygon.length]
  return sum+p[0]*q[1]-q[0]*p[1]
},0))/2
export const CUBE_FRAGMENTS=Object.freeze(cells.map((polygon,i)=>{
  const [x,y]=SEEDS[i]
  const mass=area(polygon)
  const heavy=mass>80000
  const vx=x-627,vy=y-565
  const norm=Math.max(60,Math.hypot(vx,vy))
  const distance=heavy?155+(i%3)*20:215+(i%4)*17
  return Object.freeze({
    id:'stone-'+i,
    d:'M'+polygon.map(p=>p.join(' ')).join('L')+'Z',
    dx:Math.round(vx/norm*distance),dy:Math.round(vy/norm*distance),
    angle:(i%2?1:-1)*(heavy?5+i%5:10+i%8),
    x,y,heavy,
    delay:heavy?120+(i%3)*24:35+(i%4)*18,
    returnDelay:heavy?0:85+(i%3)*25,
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
