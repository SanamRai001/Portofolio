"""Generate Cube Portal's original matte charcoal stone GLB.

Canonical stone model uses the approved original artwork, correctly aligned UVs,
and subtle real normal relief. The golden seam follows the lid edges.
The six detached panels retain their original node names for the portal animation.
"""
from __future__ import annotations

import math
from pathlib import Path

import cv2
import numpy as np
import trimesh
from PIL import Image
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

OUT = Path(__file__).resolve().parents[1] / 'assets' / 'stone-cube-canonical.glb'
RES = 512
GRID = 42


def stone_maps(side: str):
    # Exact corners measured on the 1254x1254 approved original render.
    image = np.array(Image.open(Path(__file__).with_name('reference-cube.png')).convert('RGB'))
    quads = {
        'top': [(635,83),(1090,354),(627,637),(153,356)],
        'front': [(153,356),(627,637),(627,1139),(193,838)],
        'right': [(627,637),(1090,354),(1043,840),(627,1139)],
    }
    quad=np.array(quads[side],np.float32)
    quad=quad*.982+quad.mean(axis=0)*.018
    dest=np.float32([(0,0),(RES-1,0),(RES-1,RES-1),(0,RES-1)])
    rgb=cv2.warpPerspective(image,cv2.getPerspectiveTransform(quad,dest),(RES,RES),flags=cv2.INTER_CUBIC).astype(np.float32)
    gray=cv2.cvtColor(rgb,cv2.COLOR_RGB2GRAY)
    # Retain real fracture detail; suppress strongly warm baked lighting only.
    warm=np.clip((rgb[:,:,0]-rgb[:,:,2]-12)/70,0,1)
    base=gray*(1-.32*warm)
    base=np.clip((base-22)*1.10+39,22,145)
    colors=np.stack([base*.97,base,base*1.025],axis=-1)
    # Relief from local contrast, not the large-scale baked lighting gradient.
    height=(gray-cv2.GaussianBlur(gray,(0,0),10))/32
    height=cv2.GaussianBlur(height,(0,0),1.2)
    gy,gx=np.gradient(height)
    nx=-gx*1.2; ny=gy*1.2; nz=np.ones_like(nx)
    norm=np.sqrt(nx*nx+ny*ny+nz*nz)
    normal=np.stack([(nx/norm*.5+.5)*255,(ny/norm*.5+.5)*255,(nz/norm*.5+.5)*255],axis=-1)
    return Image.fromarray(colors.astype('uint8')),Image.fromarray(normal.astype('uint8')),height


def add_stone(scene, side: str, rotation: np.ndarray, position: tuple, textures, elevation):
    # Faces in local XY; point local +Z outward, then rotate to world side.
    vertices,uv,triangles=[],[],[]
    sampled=cv2.resize(elevation,(GRID+1,GRID+1),interpolation=cv2.INTER_AREA)
    for j in range(GRID+1):
        for i in range(GRID+1):
            x=-.983+1.966*i/GRID
            y=.983-1.966*j/GRID
            border=min(i,j,GRID-i,GRID-j)
            taper=min(border/3.5,1)
            z=.055 + taper * .009*float(np.clip(sampled[j,i],-1.5,1.5))
            vertices.append((x,y,z))
            uv.append((i/GRID,1-j/GRID)) # trimesh exports v = 1 - input v
    for j in range(GRID):
        for i in range(GRID):
            a=j*(GRID+1)+i;b=a+1;c=a+GRID+1;d=c+1
            triangles.extend([(a,c,b),(b,c,d)])
    mesh=trimesh.Trimesh(vertices=np.asarray(vertices),faces=triangles,process=False)
    base,normal=textures
    material=PBRMaterial(
        name='charcoal_slate_'+side,baseColorTexture=base,normalTexture=normal,
        baseColorFactor=[255,255,255,255],metallicFactor=.02,roughnessFactor=.79,doubleSided=True,
    )
    mesh.visual=TextureVisuals(uv=np.asarray(uv),material=material)
    matrix=rotation.copy();matrix[:3,3]=position
    scene.add_geometry(mesh,node_name='stone_'+side,geom_name='stone_'+side,transform=matrix)
    # The deliberately recessed backing remains invisible while the cube is shut.
    plate=trimesh.creation.box(extents=[1.964,1.964,.068])
    plate.apply_translation([0,0,-.035])
    plate.visual=TextureVisuals(material=PBRMaterial(
        name='charcoal_edge',baseColorFactor=[28,32,34,255],metallicFactor=.01,roughnessFactor=.86))
    scene.add_geometry(plate,node_name='shell_'+side,geom_name='shell_'+side,transform=matrix)
    clearance=min(v[2] for v in vertices)-max(plate.vertices[:,2])
    assert clearance>=.02,(side,clearance)
    return clearance


def add_gold_seam(scene, side: str, rotation: np.ndarray, position: tuple):
    # Hairline golden fracture belongs to its stone face, so portal opening
    # carries the light with the detached geometry rather than leaving it behind.
    paths = {
        'top': [(-.975,-.972),(.975,-.972),(.975,.975)],
    }
    if side not in paths: return
    path = np.asarray(paths[side],dtype=float)
    strips=[]
    for idx,pt in enumerate(path):
        before=path[max(0,idx-1)]
        after=path[min(len(path)-1,idx+1)]
        tangent=after-before
        tangent=tangent/np.linalg.norm(tangent)
        tangent=np.array([-tangent[1],tangent[0]])
        # Relatively flush to stone, with breathing room for displacement.
        width=.009 if side=='top' else .010
        strips.append([*(pt-tangent*width/2),.064])
        strips.append([*(pt+tangent*width/2),.064])
    tri=[]
    for i in range(len(path)-1):
        a=i*2;tri.extend([[a,a+2,a+1],[a+1,a+2,a+3]])
    mesh=trimesh.Trimesh(vertices=np.array(strips),faces=np.array(tri),process=False)
    mesh.visual=TextureVisuals(material=PBRMaterial(
        name='gold_seam_'+side,baseColorFactor=[255,197,131,255],
        emissiveFactor=[1,.56,.22],metallicFactor=.06,roughnessFactor=.32,doubleSided=True))
    matrix=rotation.copy();matrix[:3,3]=position
    scene.add_geometry(mesh,node_name='seam_'+side,geom_name='seam_'+side,transform=matrix)


def main():
    scene=trimesh.Scene()
    rotations={
        'front':trimesh.transformations.rotation_matrix(0,[0,1,0]),
        'right':trimesh.transformations.rotation_matrix(math.pi/2,[0,1,0]),
        'top':trimesh.transformations.rotation_matrix(-math.pi/2,[1,0,0]),
        'back':trimesh.transformations.rotation_matrix(math.pi,[0,1,0]),
        'left':trimesh.transformations.rotation_matrix(-math.pi/2,[0,1,0]),
        'bottom':trimesh.transformations.rotation_matrix(math.pi/2,[1,0,0]),
    }
    positions={'front':(0,0,.96),'right':(.96,0,0),'top':(0,.96,0),'back':(0,0,-.96),'left':(-.96,0,0),'bottom':(0,-.96,0)}
    # Reuse three source materials across opposite faces: smaller, cache-friendly GLB.
    source={side:stone_maps(side) for side in ('front','right','top')}
    maps={side:source[{'back':'front','left':'right','bottom':'top'}.get(side,side)] for side in rotations}
    clearances={}
    for side in rotations:
        base,normal,height=maps[side]
        clearances[side]=add_stone(scene,side,rotations[side],positions[side],(base,normal),height)
        add_gold_seam(scene,side,rotations[side],positions[side])

    core=trimesh.creation.box(extents=[1.81,1.81,1.81])
    core.visual=TextureVisuals(material=PBRMaterial(name='inner_rock',baseColorFactor=[31,31,33,255],metallicFactor=.02,roughnessFactor=.82))
    scene.add_geometry(core,node_name='inner_core',geom_name='inner_core')
    heart=trimesh.creation.icosphere(subdivisions=2,radius=.16)
    heart.visual=TextureVisuals(material=PBRMaterial(name='gold_heart',baseColorFactor=[255,185,94,255],emissiveFactor=[.9,.6,.24],metallicFactor=.12,roughnessFactor=.27))
    scene.add_geometry(heart,node_name='gold_heart',geom_name='gold_heart')
    OUT.write_bytes(scene.export(file_type='glb'))
    print({'path':str(OUT),'bytes':OUT.stat().st_size,'meshes':len(scene.geometry),'minimum_clearance':min(clearances.values())})

if __name__=='__main__':main()
