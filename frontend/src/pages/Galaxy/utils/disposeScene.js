export function disposeScene(scene, renderer) {
  const geometries = new Set(), materials = new Set(), textures = new Set()
  scene.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry)
    const list = Array.isArray(object.material) ? object.material : [object.material]
    list.filter(Boolean).forEach((material) => materials.add(material))
  })
  materials.forEach((material) => {
    Object.values(material).forEach((value) => { if (value?.isTexture) textures.add(value) })
    Object.values(material.uniforms || {}).forEach(({ value }) => {
      if (value?.isTexture) textures.add(value)
    })
    material.dispose()
  })
  textures.forEach((texture) => texture.dispose())
  geometries.forEach((geometry) => geometry.dispose())
  scene.clear()
  renderer.dispose()
  renderer.forceContextLoss()
  renderer.domElement.remove()
}
