/* Standalone WebGL2 renderer for a reusable glTF 2.0 stone cube.
   Purposefully dependency-free in this prototype; the included GLB loads in Three.js via GLTFLoader.
   Geometry: six actual independent displaced stone panels, supporting shell and illuminated heart.
   This is a small glTF subset loader for our authored asset, NOT a general GLTFLoader. */
const canvas = document.getElementById('cubeCanvas');
const failure = document.getElementById('cubeFallback');
const root = document.documentElement;
const site = document.getElementById('site');
const gl = canvas?.getContext('webgl2', { alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'low-power',depth:true });
const status = { ready:false, faces:0, triangles:0, webgl:Boolean(gl), error:null, frames:0, unfold:0 };
window.__cube3d = status;
if(!gl) {
  status.error='WebGL2 unavailable — showing accessible static fallback.';
  showFallback();
} else {
  main().catch(error=>{status.error=String(error.message||error);console.error('Stone cube viewer failed',error);showFallback();});
}
function showFallback(){canvas.style.display='none'; if(failure) failure.hidden=false;}
const VS=`#version 300 es
in vec3 aPosition; in vec3 aNormal; in vec2 aUV;
uniform mat4 uMVP; uniform mat4 uModel;
out vec2 vUV; out vec3 vNormal;
void main() { gl_Position=uMVP*vec4(aPosition,1.); vUV=aUV; vNormal=normalize(mat3(uModel)*aNormal); }`;
const FS=`#version 300 es
precision highp float;
in vec2 vUV; in vec3 vNormal; out vec4 outColor;
uniform vec4 uBase; uniform sampler2D uTexture; uniform int uUseTexture;
uniform float uExposure; uniform float uEmissive; uniform vec3 uGold;
void main(){
 vec3 color=uBase.rgb;
 if(uUseTexture==1) color*=texture(uTexture,vUV).rgb;
 vec3 normal=normalize(vNormal);
 float direct=max(dot(normal,normalize(vec3(.32,.75,1.))),0.);
 float fill=max(dot(normal,normalize(vec3(-.7,.24,.5))),0.);
 float light=(.72+.28*direct+.09*fill)*uExposure;
 vec3 lit=color*light + uGold*uEmissive;
 outColor=vec4(lit,uBase.a);
}`;
function shader(type,src){const o=gl.createShader(type);gl.shaderSource(o,src);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(o));return o;}
function program(){const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,VS));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
const I=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function mul(a,b){const r=new Float32Array(16);for(let c=0;c<4;c++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)r[c*4+row]+=a[k*4+row]*b[c*4+k];return r;}
function translate(x,y,z){const a=I();a[12]=x;a[13]=y;a[14]=z;return a;}
function rotation(axis,t){let a=I(),c=Math.cos(t),s=Math.sin(t);if(axis==='x'){a[5]=c;a[6]=s;a[9]=-s;a[10]=c;} else if(axis==='y'){a[0]=c;a[2]=-s;a[8]=s;a[10]=c;} else {a[0]=c;a[1]=s;a[4]=-s;a[5]=c;} return a;}
function scale(s){const a=I();a[0]=a[5]=a[10]=s;return a;}
function dot(a,b){return a.reduce((s,x,i)=>s+x*b[i],0);}
function sub(a,b){return a.map((x,i)=>x-b[i]);}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function norm(a){const m=Math.hypot(...a)||1;return a.map(x=>x/m);}
function lookAt(eye,center){const z=norm(sub(eye,center)),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
function perspective(fovy,aspect,near,far){const f=1/Math.tan(fovy/2),d=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*d,-1,0,0,2*far*near*d,0]);}
function modelNormal(positions,indices){const n=new Float32Array(positions.length);for(let i=0;i<indices.length;i+=3){const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3;const p=[positions[a],positions[a+1],positions[a+2]],q=[positions[b],positions[b+1],positions[b+2]],r=[positions[c],positions[c+1],positions[c+2]];const v=cross(sub(q,p),sub(r,p));for(const j of [a,b,c])for(let k=0;k<3;k++)n[j+k]+=v[k];}for(let i=0;i<n.length;i+=3){const x=norm([n[i],n[i+1],n[i+2]]);n.set(x,i);}return n;}
const u32= (view,offset)=>view.getUint32(offset,true);
function decodeGlb(bytes){const v=new DataView(bytes);if(u32(v,0)!==0x46546c67||u32(v,4)!==2)throw Error('Invalid GLB asset');const length=u32(v,8);if(length!==bytes.byteLength)throw Error('Truncated GLB asset');const jsonSize=u32(v,12),jsonType=u32(v,16);if(jsonType!==0x4e4f534a)throw Error('Missing JSON glTF chunk');const json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,jsonSize)));const offset=20+jsonSize;if(u32(v,offset+4)!==0x004e4942)throw Error('Missing binary chunk');return {json,binStart:offset+8,bytes};}
function accessorBytes(data,id){const a=data.json.accessors[id],b=data.json.bufferViews[a.bufferView];const start=data.binStart+b.byteOffset+(a.byteOffset||0),len=a.count*(a.type==='VEC3'?3:a.type==='VEC2'?2:1);return {data:start,size:len,component:a.componentType,buffer:a,bView:b};}
function accessorTyped(data,id){const a=accessorBytes(data,id);if(a.bView.byteStride)throw Error('Interleaved attributes not supported in this prototype');const s=a.size,bytes=data.bytes;switch(a.component){case 5126:return new Float32Array(bytes.slice(a.data,a.data+s*4));case 5125:return new Uint32Array(bytes.slice(a.data,a.data+s*4));case 5123:return new Uint16Array(bytes.slice(a.data,a.data+s*2));case 5121:return new Uint8Array(bytes.slice(a.data,a.data+s));default:throw Error('Unsupported glTF accessor '+a.component);}}
async function loadTextures(data){const result=[];for(const t of data.json.textures||[]){const im=data.json.images[t.source],bv=data.json.bufferViews[im.bufferView];const blob=new Blob([data.bytes.slice(data.binStart+bv.byteOffset,data.binStart+bv.byteOffset+bv.byteLength)],{type:im.mimeType});const bmp=await createImageBitmap(blob);const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,bmp.width,bmp.height,0,gl.RGBA,gl.UNSIGNED_BYTE,bmp);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);bmp.close();result.push(tex);}return result;}
function createDrawMeshes(data,loc){const meshes=[];for(const n of data.json.nodes){if(n.mesh===undefined)continue;const primitive=data.json.meshes[n.mesh].primitives[0];const at=primitive.attributes,positions=accessorTyped(data,at.POSITION),indices=accessorTyped(data,primitive.indices),uv=at.TEXCOORD_0===undefined?new Float32Array((positions.length/3)*2):accessorTyped(data,at.TEXCOORD_0);const normal=at.NORMAL===undefined?modelNormal(positions,indices):accessorTyped(data,at.NORMAL);const vao=gl.createVertexArray();gl.bindVertexArray(vao);for(const [dataArray,attribute,components] of [[positions,loc.pos,3],[normal,loc.normal,3],[uv,loc.uv,2]]){const buff=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buff);gl.bufferData(gl.ARRAY_BUFFER,dataArray,gl.STATIC_DRAW);gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,components,gl.FLOAT,false,0,0);}const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);const m=data.json.materials[primitive.material],pbr=m?.pbrMetallicRoughness||{};meshes.push({name:n.name,base:new Float32Array(n.matrix||I()),vao,count:indices.length,indexType:indices instanceof Uint32Array?gl.UNSIGNED_INT:indices instanceof Uint16Array?gl.UNSIGNED_SHORT:gl.UNSIGNED_BYTE,color:pbr.baseColorFactor||[1,1,1,1],tex:pbr.baseColorTexture?.index??-1,emissive:m?.emissiveFactor||[0,0,0]});status.triangles+=indices.length/3;}gl.bindVertexArray(null);status.faces=meshes.filter(x=>x.name.startsWith('stone_')).length;return meshes;}
function smooth(t){t=Math.min(1,Math.max(0,t));return t*t*(3-2*t);}
async function main(){
 const response=await fetch('./assets/stone-cube.glb',{cache:'force-cache'});if(!response.ok)throw Error('GLB HTTP '+response.status);
 const data=decodeGlb(await response.arrayBuffer()),p=program();gl.useProgram(p);const loc={pos:gl.getAttribLocation(p,'aPosition'),normal:gl.getAttribLocation(p,'aNormal'),uv:gl.getAttribLocation(p,'aUV'),mvp:gl.getUniformLocation(p,'uMVP'),model:gl.getUniformLocation(p,'uModel'),base:gl.getUniformLocation(p,'uBase'),tex:gl.getUniformLocation(p,'uTexture'),useTex:gl.getUniformLocation(p,'uUseTexture'),exposure:gl.getUniformLocation(p,'uExposure'),emissive:gl.getUniformLocation(p,'uEmissive'),gold:gl.getUniformLocation(p,'uGold')};
 const meshes=createDrawMeshes(data,loc),textures=await loadTextures(data);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);gl.uniform1i(loc.tex,0);
 let progress=0,target=0,start=0,from=0,raf=0;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 function updateTarget(){const x=(site.dataset.phase==='opening'||site.dataset.phase==='work')?1:0;if(x===target)return;from=progress;target=x;start=performance.now();if(reduce.matches){progress=target;requestRender();}else requestRender();}
 function draw(now){raf=0;status.frames++;
  if(progress!==target){const t=smooth((now-start)/850);progress=from+(target-from)*t;if(t>=1)progress=target;}
  status.unfold=Number(progress.toFixed(3));
  const w=Math.max(1,Math.floor(canvas.clientWidth*Math.min(devicePixelRatio||1,1.5))),h=Math.max(1,Math.floor(canvas.clientHeight*Math.min(devicePixelRatio||1,1.5)));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const mobile=window.matchMedia('(max-width:740px)').matches;
  const view=lookAt(mobile?[4.15,3.1,5.5]:[4.25,3.42,5.25],[0,0,0]);
  const proj=perspective((mobile?41:36)*Math.PI/180,w/h,.1,40);
  const baseVP=mul(proj,view);const dark=root.dataset.theme==='dark';gl.uniform1f(loc.exposure,dark?1.2:1.09);
  gl.uniform3f(loc.gold,1.0,dark ? .68 : .57,dark ? .29 : .27);
  const turn=smooth(progress);
  const groupRotation=mul(rotation('y', -.07+turn*.07),rotation('x',.015));
  for(const m of meshes){let model=m.base;
   const role=m.name.replace(/^(stone|shell)_/,'');const panel=m.name.startsWith('stone_')||m.name.startsWith('shell_');
   if(panel){const vec={front:[0,-.03,1],right:[1,0,0],top:[0,1,0],left:[-1,0,0],back:[0,0,-1],bottom:[0,-1,0]}[role];const dist=turn*(role==='front'?.55:role==='right'?.48:role==='top'?.58:.16);const local=mul(translate(vec[0]*dist,vec[1]*dist,vec[2]*dist),rotation(role==='top'||role==='bottom'?'x':'y',turn*(role==='front'?.12:role==='right'?-.24:role==='top'?-.17:.1)));model=mul(local,model);
   } else if(m.name==='inner_core'){model=mul(model,scale(1-.07*turn));}else if(m.name==='gold_heart'){model=mul(model,scale(1+turn*2.7));}
   model=mul(groupRotation,model);
   gl.uniformMatrix4fv(loc.model,false,model);gl.uniformMatrix4fv(loc.mvp,false,mul(baseVP,model));gl.uniform4fv(loc.base,m.color);gl.uniform1f(loc.emissive,m.name==='gold_heart'?(dark?.7:.48)*(turn*.8+.24):0);
   gl.uniform1i(loc.useTex,m.tex>=0?1:0);gl.activeTexture(gl.TEXTURE0);if(m.tex>=0)gl.bindTexture(gl.TEXTURE_2D,textures[m.tex]);gl.bindVertexArray(m.vao);gl.drawElements(gl.TRIANGLES,m.count,m.indexType,0);
  }
  gl.bindVertexArray(null);
  if(Math.abs(progress-target)>.0005)raf=requestAnimationFrame(draw);
 }
 function requestRender(){if(!raf)raf=requestAnimationFrame(draw);}
 new ResizeObserver(requestRender).observe(canvas);
 new MutationObserver(()=>{updateTarget();requestRender();}).observe(site,{attributes:true,attributeFilter:['data-phase']});
 new MutationObserver(requestRender).observe(root,{attributes:true,attributeFilter:['data-theme']});
 reduce.addEventListener('change',()=>{progress=target;requestRender();});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();status.error='WebGL context lost';showFallback();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestRender();});
 status.ready=true;status.geometry='GLB 2.0';status.materials=data.json.materials.length;
 failure?.remove();requestRender();
}
