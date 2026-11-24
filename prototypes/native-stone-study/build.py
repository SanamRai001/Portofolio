"""Build native Blender stone geometry and GLB; no projected concept art.
Run with Blender 4.x: blender -b -t 4 --python-exit-code 1 --python build.py -- OUTPUT
"""
import bpy, bmesh, math, json, sys, hashlib, urllib.request
from pathlib import Path
from urllib.parse import urlparse
import numpy as np
from mathutils import Vector

out=Path(sys.argv[sys.argv.index("--")+1]).resolve()
out.mkdir(parents=True,exist_ok=True)
maps=out/"maps";maps.mkdir(exist_ok=True)
def download(url,path):
    p=urlparse(url)
    if p.scheme!="https" or p.hostname not in {"api.polyhaven.com", "dl.polyhaven.org", "dl.polyhaven.com"}:
        raise ValueError("Unexpected material host: "+url)
    req=urllib.request.Request(url,headers={"User-Agent":"PortfolioStoneStudy/1.0"})
    with urllib.request.urlopen(req,timeout=45) as response: data=response.read(30_000_001)
    if len(data)>30_000_000: raise ValueError("Map exceeds size limit")
    path.write_bytes(data)
download("https://api.polyhaven.com/files/dark_rock",maps/"metadata.json")
metadata=json.loads((maps/"metadata.json").read_text())
sources={}
for key in ("diff","nor_gl","rough","disp"):
    aliases={"diff":("diffuse","diff","albedo"),"nor_gl":("nor_gl","normal"),"rough":("rough","roughness"),"disp":("disp","displacement")}
    available=next((name for name in aliases[key] if name in metadata),None)
    if available is None: raise RuntimeError(f"Missing {key}: available metadata keys {list(metadata)}")
    options=metadata[available]["1k"]
    fmt=next(f for f in ("jpg","png","exr") if f in options)
    url=options[fmt]["url"]
    dest=maps/(key+"."+fmt);download(url,dest)
    sources[key]={"url":url,"sha256":hashlib.sha256(dest.read_bytes()).hexdigest()}
    print("MAP",key,dest.stat().st_size,flush=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
def tex(key,space):
    image=bpy.data.images.load(str(next(maps.glob(key+".*"))))
    image.colorspace_settings.name=space
    return image
albedo=tex("diff","sRGB");normal=tex("nor_gl","Non-Color");rough=tex("rough","Non-Color")
height=tex("disp","Non-Color")
w,h=height.size
pixels=np.array(height.pixels[:],dtype=np.float32).reshape(h,w,4)[:,:,0]
lo,hi=np.percentile(pixels,[5,95])
def sample(u,v):
    x=(u%1)*(w-1);y=(v%1)*(h-1);i,j=int(x),int(y)
    a,b=x-i,y-j
    v0=(1-a)*pixels[j,i]+a*pixels[j,min(i+1,w-1)]
    v1=(1-a)*pixels[min(j+1,h-1),i]+a*pixels[min(j+1,h-1),min(i+1,w-1)]
    return float(np.clip(((1-b)*v0+b*v1-lo)/max(float(hi-lo),.001),0,1))-.5
stone=bpy.data.materials.new("Dark Rock CC0 PBR");stone.use_nodes=True
n=stone.node_tree.nodes;l=stone.node_tree.links;bs=n.get("Principled BSDF")
bs.inputs["Metallic"].default_value=0
for label,img in (("Color",albedo),("Roughness",rough),("Normal",normal)):
    t=n.new("ShaderNodeTexImage");t.image=img;t.label=label
    if label=="Color":l.new(t.outputs["Color"],bs.inputs["Base Color"])
    elif label=="Roughness":l.new(t.outputs["Color"],bs.inputs["Roughness"])
    else:
        nm=n.new("ShaderNodeNormalMap");nm.inputs["Strength"].default_value=.8
        l.new(t.outputs["Color"],nm.inputs["Color"]);l.new(nm.outputs["Normal"],bs.inputs["Normal"])
def material(name,color,roughness,emission=0):
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    node=mat.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value=(*color,1)
    node.inputs["Roughness"].default_value=roughness
    if emission:
        node.inputs["Emission Color"].default_value=(1,.49,.12,1)
        node.inputs["Emission Strength"].default_value=emission
    return mat
inside=material("Shadowed stone interior",(.025,.024,.023),.92)
gold=material("Warm emissive fracture",(.72,.30,.045),.45,4.0)

# Each stone piece is a welded, watertight mesh. Relief is actual displacement
# with a narrow protected edge zone; no backing meshes or coplanar shell layers.
class Surface:
    def __init__(self,z0,z1,radius):
        self.v=[];self.f=[];self.uv=[];self.mi=[]
        self.center=Vector((0,0,(z0+z1)/2))
        self.half=Vector((1,1,(z1-z0)/2));self.r=radius
    def round_edge(self,p):
        q=p-self.center
        core=Vector(tuple(max(-self.half[k]+self.r,min(self.half[k]-self.r,q[k])) for k in range(3)))
        delta=q-core
        return self.center+core+delta.normalized()*self.r if delta.length>self.r else p
    def grid(self,nu,nv,position,offset=(0,0),relief=0,mat=0,normal=(0,0,0),scale=(1,1),rounding=True):
        base=len(self.v);normal=Vector(normal)
        for j in range(nv+1):
            t=j/nv
            for i in range(nu+1):
                s=i/nu;uv=(offset[0]+s*scale[0],offset[1]+t*scale[1])
                p=Vector(position(s,t))
                if rounding:p=self.round_edge(p)
                taper=min(1,i/2,j/2,(nu-i)/2,(nv-j)/2)
                if relief:p+=normal*(relief*taper*sample(*uv))
                self.v.append(tuple(p));self.uv.append(uv)
        for j in range(nv):
            for i in range(nu):
                k=base+j*(nu+1)+i
                self.f.append((k,k+1,k+nu+2,k+nu+1));self.mi.append(mat)
    def patch(self,o,u,v,nu,nv,offset=(0,0),relief=0,mat=0,rounding=True):
        o,u,v=map(Vector,(o,u,v))
        self.grid(nu,nv,lambda s,t:o+s*u+t*v,offset,relief,mat,u.cross(v).normalized(),(u.length/2.35,v.length/2.35),rounding)
    def object(self,name):
        mesh=bpy.data.meshes.new(name);mesh.from_pydata(self.v,[],self.f);mesh.update()
        mesh.materials.append(stone);mesh.materials.append(inside)
        uv=mesh.uv_layers.new(name="Stone UV")
        for poly,idx in zip(mesh.polygons,self.mi):
            poly.material_index=idx;poly.use_smooth=True
            for li in poly.loop_indices:uv.data[li].uv=self.uv[mesh.loops[li].vertex_index]
        bm=bmesh.new();bm.from_mesh(mesh)
        bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-5)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
        nonmanifold=sum(not e.is_manifold for e in bm.edges)
        assert nonmanifold==0,(name,"nonmanifold edges",nonmanifold)
        for e in bm.edges:
            if e.is_manifold and e.calc_face_angle(0)>math.radians(50):e.smooth=False
        bm.to_mesh(mesh);bm.free();mesh.update()
        obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj)
        return obj
N=28
def walls(s,z0,z1,a=1,relief=.10,reverse=False,mat=0,rounding=True):
    d=z1-z0;nz=max(2,round(N*d/2))
    edges=[((-a,-a,z0),(2*a,0,0)),((a,-a,z0),(0,2*a,0)),((a,a,z0),(-2*a,0,0)),((-a,a,z0),(0,-2*a,0))]
    for k,(o,u) in enumerate(edges):
        if reverse:o=tuple(Vector(o)+Vector(u));u=tuple(-Vector(u))
        s.patch(o,u,(0,0,d),N,nz,(k*.29,.17+k*.19),relief,mat,rounding)
zb,zt,inn,zfloor=-1,.76,.75,-.75
body_s=Surface(zb,zt,.021)
walls(body_s,zb,zt,relief=.115)
body_s.patch((-1,1,zb),(2,0,0),(0,-2,0),N,N,(.43,.31),.04)
walls(body_s,zfloor,zt,a=inn,relief=0,reverse=True,mat=1,rounding=False)
body_s.patch((-inn,-inn,zfloor),(2*inn,0,0),(0,2*inn,0),N,N,mat=1,rounding=False)
for k in range(4):
    angle=math.pi*k/2
    def rim(s,t):
        r=1-(1-inn)*t;x=-r+2*r*s;y=-r
        return (x*math.cos(angle)-y*math.sin(angle),x*math.sin(angle)+y*math.cos(angle),zt)
    body_s.grid(N,3,rim,mat=1)
body=body_s.object("stone_body")

z0,z1=.781,1.0
lid_s=Surface(z0,z1,.021)
walls(lid_s,z0,z1,relief=.028)
lid_s.patch((-1,-1,z1),(2,0,0),(0,2,0),N,N,(.13,.37),.17)
lid_s.patch((-1,1,z0),(2,0,0),(0,-2,0),N,N,mat=1)
lid=lid_s.object("stone_lid")
pivot=bpy.data.objects.new("lid_pivot",None);scene.collection.objects.link(pivot)
pivot.location=(0,1,z0);bpy.context.view_layer.update()
lid.parent=pivot;lid.matrix_parent_inverse=pivot.matrix_world.inverted()

def line(name,coords,radius,radii=None):
    curve=bpy.data.curves.new(name,"CURVE");curve.dimensions="3D"
    curve.bevel_depth=radius;curve.bevel_resolution=2
    spline=curve.splines.new("POLY");spline.points.add(len(coords)-1)
    for i,(p,c) in enumerate(zip(spline.points,coords)):
        p.co=(*c,1)
        if radii:p.radius=radii[i]
    obj=bpy.data.objects.new(name,curve);scene.collection.objects.link(obj);obj.data.materials.append(gold)
    # Convert curves explicitly so the glTF exporter includes their geometry.
    bpy.ops.object.select_all(action="DESELECT");obj.select_set(True);bpy.context.view_layer.objects.active=obj
    bpy.ops.object.convert(target="MESH")
    return bpy.context.object
seam=line("gold_seam",[(-.982,-.982,.770),(.982,-.982,.770),(.982,.982,.770),(-.982,.982,.770),(-.982,-.982,.770)],.011)
vein=line("gold_corner_vein",[(.994,-.994,.77),(.995,-.995,.52),(.995,-.995,.14),(.994,-.994,-.30)],.006,[1,.76,.3,.03])
bpy.ops.object.select_all(action="DESELECT")
for obj in (body,lid,pivot,seam,vein):obj.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.export_scene.gltf(filepath=str(out/"stone-cube-native.glb"),export_format="GLB",use_selection=True,export_apply=True)
glb=out/"stone-cube-native.glb";assert glb.read_bytes()[:4]==b"glTF"
print("EXPORTED",glb.stat().st_size,flush=True)
# Write provenance immediately even if a later render is interrupted.
manifest={"texture":"https://polyhaven.com/a/dark_rock","license":"CC0","maps":sources,
          "blender":bpy.app.version_string,"glb_bytes":glb.stat().st_size,
          "body_polygons":len(body.data.polygons),"lid_polygons":len(lid.data.polygons),
          "pivot":"lid_pivot","rendered":[]}
def save_manifest():(out/"manifest.json").write_text(json.dumps(manifest,indent=2))
save_manifest()
scene.render.engine="CYCLES";scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.render.image_settings.file_format="PNG";scene.render.film_transparent=True
scene.world=bpy.data.worlds.new("Studio world");scene.world.use_nodes=True
scene.world.node_tree.nodes.get("Background").inputs[0].default_value=(.28,.30,.34,1)
scene.world.node_tree.nodes.get("Background").inputs[1].default_value=.40
def aim(obj,point):obj.rotation_euler=(Vector(point)-obj.location).to_track_quat("-Z","Y").to_euler()
def area(name,loc,power,size,color):
    data=bpy.data.lights.new(name,"AREA");data.energy=power;data.shape="DISK";data.size=size;data.color=color
    ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=loc;aim(ob,(0,0,0))
area("Soft key",(2,-4,6),850,4.5,(1,.96,.90))
area("Cool fill",(-4,-1,2),330,3.5,(.78,.86,1))
area("Rim",(3,4,4),600,3,(1,.87,.69))
camera=bpy.data.objects.new("Camera",bpy.data.cameras.new("Camera"));scene.collection.objects.link(camera)
camera.data.type="ORTHO";scene.camera=camera
scene.use_nodes=True
comp=scene.node_tree;comp.nodes.clear()
layers=comp.nodes.new("CompositorNodeRLayers")
glare=comp.nodes.new("CompositorNodeGlare");glare.glare_type="FOG_GLOW";glare.quality="MEDIUM";glare.threshold=1.5;glare.size=7
result=comp.nodes.new("CompositorNodeComposite")
comp.links.new(layers.outputs["Image"],glare.inputs["Image"]);comp.links.new(glare.outputs["Image"],result.inputs["Image"])
camera.location=(4.7,-5.8,4.1);aim(camera,(0,0,0));camera.data.ortho_scale=3.55
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(out/"stone-cube-native.blend"))
for name,position,angle in [("closed-front",(4.7,-5.8,4.1),0),("closed-rear",(-5,5.5,3.1),0),("open-front",(4.7,-5.8,4.8),-62)]:
    pivot.rotation_euler.x=math.radians(angle)
    camera.location=position;aim(camera,(0,0,.15 if angle else 0));camera.data.ortho_scale=4.2 if angle else 3.55
    scene.render.filepath=str(out/(name+".png"));bpy.ops.render.render(write_still=True)
    manifest["rendered"].append(name);save_manifest();print("RENDER",name,flush=True)
