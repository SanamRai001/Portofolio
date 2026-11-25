"""Generate Cube Portal's original matte charcoal stone GLB.

Version 3 removes lighting baked into the previous projection-mapped images.
This deterministic source has no external texture dependency or additional license.
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

OUT = Path(__file__).resolve().parents[1] / 'assets' / 'stone-cube-pbr-v3.glb'
RES = 768
GRID = 42


def smooth_noise(rng: np.random.Generator, size: int) -> np.ndarray:
    raw = rng.normal(0, 1, (size, size)).astype('float32')
    smooth = cv2.resize(raw, (RES, RES), interpolation=cv2.INTER_CUBIC)
    return smooth / max(0.01, float(smooth.std()))


def stone_maps(seed: int):
    rng = np.random.default_rng(seed)
    broad = smooth_noise(rng, 7)
    medium = smooth_noise(rng, 24)
    fine = smooth_noise(rng, 95)
    micro = smooth_noise(rng, 310)
    yy, xx = np.mgrid[0:RES, 0:RES].astype('float32')
    # Organic bedding/stratification: subtle enough to read as stone, not camouflage.
    warp = (yy / RES) + .055 * broad + .023 * medium
    strata = np.sin(2 * math.pi * (2.3 * warp + .11 * medium))
    bed = np.sin(2 * math.pi * (7.5 * warp + .06 * fine))
    height = .51 * broad + .31 * medium + .12 * fine + .045 * micro + .13 * strata
    base = 57 + 7.7 * broad + 4.5 * medium + 2.3 * fine + 1.4 * micro + 2.5 * strata + 1.0 * bed
    # Fine mineral veins: low-contrast, curved, sparse; no pre-rendered specular glare.
    vein_layer = np.zeros((RES, RES), np.uint8)
    for i in range(3):
        x0 = int(rng.uniform(0.08, .92) * RES)
        slope = rng.uniform(-.32, .32)
        phase = rng.uniform(0, 2 * math.pi)
        points=[]
        for t in np.linspace(0, 1, 90):
            y = int(t * (RES-1))
            x = int(x0 + RES*(slope*(t-.5) + .037*math.sin(2.6*math.pi*t + phase) + .011*math.sin(8*math.pi*t+phase)))
            points.append([x,y])
        arr = np.asarray(points, np.int32).reshape(-1,1,2)
        cv2.polylines(vein_layer,[arr],False, 200 if i == 0 else 120, 1, cv2.LINE_AA)
    vein_blur = cv2.GaussianBlur(vein_layer.astype('float32'), (0,0), .8)/255
    base += 12*vein_blur
    height += .09*vein_blur
    # Unlit, neutral charcoal. Lighting comes from Three.js instead of baked highlights.
    rgb = np.stack([base*.91,base*.97,base*1.03],axis=-1)
    rgb = np.clip(rgb,19,103).astype('uint8')
    base_image=Image.fromarray(rgb, 'RGB')
    # Tangent-space normal map with conservative bump scale.
    scaled = cv2.GaussianBlur(height.astype('float32'), (0,0), 1.1)
    gy,gx=np.gradient(scaled)
    nx=-gx*1.1; ny=gy*1.1; nz=np.ones_like(nx)*2.4
    length=np.sqrt(nx**2+ny**2+nz**2)
    normal=np.stack([(nx/length*.5+.5)*255, (ny/length*.5+.5)*255,(nz/length*.5+.5)*255],axis=-1)
    normal_image=Image.fromarray(np.clip(normal,0,255).astype('uint8'),'RGB')
    return base_image,normal_image,height


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
            z=.055 + taper * .012*float(sampled[j,i])
            vertices.append((x,y,z))
            uv.append((i/GRID,j/GRID))
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
        'top': [(-.73,.76),(-.50,.51),(-.18,.19),(.12,-.12),(.55,-.52),(.975,-.975)],
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
        width=.012 if side=='top' else .010
        strips.append([*(pt-tangent*width/2),.09])
        strips.append([*(pt+tangent*width/2),.09])
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
    source={side:stone_maps(5223+i*137) for i,side in enumerate(('front','right','top'))}
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
