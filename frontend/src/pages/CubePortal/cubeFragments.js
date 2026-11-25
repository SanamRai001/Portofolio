// The seven polygons tile the source image; its alpha preserves the stone silhouette.
// Shared boundaries keep the original artwork intact when the fragments converge.
export const CUBE_FRAGMENTS = Object.freeze([
  {id:'crown-left',d:'M0 0H390L510 240 335 465 153 356 0 268Z',dx:-145,dy:-135,angle:-12},
  {id:'crown-center',d:'M390 0H875L760 260 880 490 627 637 335 465 510 240Z',dx:5,dy:-220,angle:5},
  {id:'crown-right',d:'M875 0H1254V253L1090 354 880 490 760 260Z',dx:160,dy:-110,angle:13},
  {id:'west-upper',d:'M0 268L153 356 335 465 627 637 660 815 420 850 260 720 0 765Z',dx:-205,dy:5,angle:-9},
  {id:'east-upper',d:'M627 637L880 490 1090 354 1254 253V730L1015 760 840 820 660 815Z',dx:210,dy:5,angle:10},
  {id:'west-lower',d:'M0 765L260 720 420 850 660 815 627 960 640 1254H0Z',dx:-135,dy:155,angle:9},
  {id:'east-lower',d:'M660 815L840 820 1015 760 1254 730V1254H640L627 960Z',dx:130,dy:180,angle:-8},
])
