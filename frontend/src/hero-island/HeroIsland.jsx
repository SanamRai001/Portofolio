import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import useReducedMotion from '../motion/useReducedMotion'
import './HeroIsland.css'

const makeCloud = (material, scale = 1) => {
  const cloud = new THREE.Group()
  const pieces = [
    [-0.42, 0, 0, 0.42],
    [0, 0.1, 0.02, 0.56],
    [0.48, -0.02, 0, 0.38],
    [0.16, -0.12, 0.08, 0.42],
  ]

  pieces.forEach(([x, y, z, radius]) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius * scale, 12, 10),
      material,
    )
    mesh.position.set(x * scale, y * scale, z * scale)
    cloud.add(mesh)
  })

  return cloud
}

const addRock = (group, material, position, scale, rotation) => {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.22, 0),
    material,
  )
  rock.position.set(...position)
  rock.scale.set(...scale)
  rock.rotation.set(...rotation)
  rock.castShadow = true
  rock.receiveShadow = true
  group.add(rock)
  return rock
}

const HeroIsland = () => {
  const mountRef = useRef(null)
  const [webglFailed, setWebglFailed] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || reducedMotion) return undefined

    const compact = window.matchMedia('(max-width: 720px), (pointer: coarse)').matches
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40)
    const baseCamera = new THREE.Vector3(4.8, 3.25, 7.2)
    camera.position.copy(baseCamera)
    camera.lookAt(0, -0.1, 0)

    let renderer

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !compact,
        powerPreference: 'high-performance',
      })
    } catch (error) {
      console.warn('Hero island WebGL unavailable', error)
      setWebglFailed(true)
      return undefined
    }

    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.1 : 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = !compact
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.replaceChildren(renderer.domElement)

    const root = new THREE.Group()
    root.position.y = -0.08
    root.rotation.y = -0.24
    scene.add(root)

    const ambient = new THREE.HemisphereLight(0xbcd9e5, 0x17231f, 1.7)
    scene.add(ambient)

    const keyLight = new THREE.DirectionalLight(0xffe5bd, compact ? 2.3 : 2.8)
    keyLight.position.set(4.5, 7, 4)
    keyLight.castShadow = !compact
    if (!compact) {
      keyLight.shadow.mapSize.set(768, 768)
      keyLight.shadow.camera.near = 0.1
      keyLight.shadow.camera.far = 18
      keyLight.shadow.camera.left = -5
      keyLight.shadow.camera.right = 5
      keyLight.shadow.camera.top = 5
      keyLight.shadow.camera.bottom = -5
    }
    scene.add(keyLight)

    const fillLight = new THREE.PointLight(0x79dbea, 7, 12)
    fillLight.position.set(-4, 1.6, 4)
    scene.add(fillLight)

    const grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x587b62,
      roughness: 0.88,
      metalness: 0,
      flatShading: true,
    })

    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0x654b3c,
      roughness: 0.96,
      flatShading: true,
    })

    const deepEarthMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b3030,
      roughness: 1,
      flatShading: true,
    })

    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x687077,
      roughness: 0.92,
      flatShading: true,
    })

    const houseMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8c6a6,
      roughness: 0.82,
      flatShading: true,
    })

    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x713f45,
      roughness: 0.86,
      flatShading: true,
    })

    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x6c4935,
      roughness: 0.94,
      flatShading: true,
    })

    const foliageMaterial = new THREE.MeshStandardMaterial({
      color: 0x466954,
      roughness: 0.9,
      flatShading: true,
    })

    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0xffc979,
      emissive: 0xffa43d,
      emissiveIntensity: 1.7,
      roughness: 0.55,
    })

    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x5ab8c7,
      emissive: 0x123f49,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.8,
      roughness: 0.28,
      metalness: 0.08,
      side: THREE.DoubleSide,
    })

    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8edf0,
      transparent: true,
      opacity: 0.82,
      roughness: 1,
      depthWrite: false,
    })

    const islandBody = new THREE.Mesh(
      new THREE.CylinderGeometry(2.08, 1.62, 0.72, 9, 1, false),
      earthMaterial,
    )
    islandBody.position.y = -0.2
    islandBody.castShadow = true
    islandBody.receiveShadow = true
    root.add(islandBody)

    const grassCap = new THREE.Mesh(
      new THREE.CylinderGeometry(2.12, 2.03, 0.2, 9, 1, false),
      grassMaterial,
    )
    grassCap.position.y = 0.25
    grassCap.castShadow = true
    grassCap.receiveShadow = true
    root.add(grassCap)

    const underside = new THREE.Mesh(
      new THREE.CylinderGeometry(1.62, 0.24, 2.25, 9, 1, false),
      deepEarthMaterial,
    )
    underside.position.y = -1.68
    underside.castShadow = true
    root.add(underside)

    const undersideTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 1.15, 7),
      deepEarthMaterial,
    )
    undersideTip.position.y = -3.18
    undersideTip.rotation.y = 0.28
    root.add(undersideTip)

    const house = new THREE.Group()
    house.position.set(0.62, 0.82, 0.05)
    house.rotation.y = -0.2
    root.add(house)

    const houseBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.02, 0.74, 0.9),
      houseMaterial,
    )
    houseBody.castShadow = true
    houseBody.receiveShadow = true
    house.add(houseBody)

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(0.82, 0.58, 4),
      roofMaterial,
    )
    roof.position.y = 0.62
    roof.rotation.y = Math.PI / 4
    roof.castShadow = true
    house.add(roof)

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.42, 0.035),
      woodMaterial,
    )
    door.position.set(-0.18, -0.15, 0.468)
    house.add(door)

    const windowPane = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.22, 0.028),
      windowMaterial,
    )
    windowPane.position.set(0.24, 0.06, 0.47)
    house.add(windowPane)

    const sideWindow = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.2, 0.24),
      windowMaterial,
    )
    sideWindow.position.set(-0.528, 0.03, -0.08)
    house.add(sideWindow)

    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.42, 0.17),
      roofMaterial,
    )
    chimney.position.set(-0.24, 0.78, -0.1)
    chimney.castShadow = true
    house.add(chimney)

    const houseGlow = new THREE.PointLight(0xffb257, compact ? 2.2 : 3.2, 3.8)
    houseGlow.position.set(0.7, 1.04, 0.85)
    root.add(houseGlow)

    const tree = new THREE.Group()
    tree.position.set(-0.92, 0.78, -0.08)
    root.add(tree)

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 0.95, 7),
      woodMaterial,
    )
    trunk.position.y = 0.03
    trunk.rotation.z = -0.06
    trunk.castShadow = true
    tree.add(trunk)

    const crownGeometry = new THREE.IcosahedronGeometry(0.52, 1)
    const crowns = [
      [-0.24, 0.65, 0.04, 0.92],
      [0.16, 0.72, 0, 1.08],
      [0.02, 1.02, -0.02, 0.82],
    ]

    crowns.forEach(([x, y, z, scale]) => {
      const crown = new THREE.Mesh(crownGeometry, foliageMaterial)
      crown.position.set(x, y, z)
      crown.scale.setScalar(scale)
      crown.castShadow = true
      tree.add(crown)
    })

    addRock(root, stoneMaterial, [-1.52, 0.55, 0.62], [1.25, 0.72, 0.9], [0.2, 0.4, -0.08])
    addRock(root, stoneMaterial, [1.36, 0.51, -0.72], [0.92, 0.62, 1.1], [-0.08, 0.2, 0.14])
    addRock(root, stoneMaterial, [1.66, 0.48, 0.42], [0.58, 0.42, 0.72], [0.16, -0.24, 0.05])
    addRock(root, stoneMaterial, [-0.35, -2.08, 0.36], [0.58, 1.8, 0.64], [0.25, 0.1, 0.28])
    addRock(root, stoneMaterial, [0.62, -2.38, -0.15], [0.46, 1.35, 0.5], [-0.18, -0.2, -0.14])

    const pond = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, compact ? 24 : 36),
      waterMaterial,
    )
    pond.position.set(-0.42, 0.365, 0.74)
    pond.rotation.x = -Math.PI / 2
    pond.scale.set(1.35, 0.78, 1)
    root.add(pond)

    const pondRim = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.63, compact ? 24 : 36),
      new THREE.MeshStandardMaterial({
        color: 0x6b786b,
        roughness: 0.95,
        side: THREE.DoubleSide,
      }),
    )
    pondRim.position.copy(pond.position)
    pondRim.rotation.x = -Math.PI / 2
    pondRim.scale.copy(pond.scale)
    root.add(pondRim)

    const cloudA = makeCloud(cloudMaterial, 0.86)
    cloudA.position.set(-3.6, 2.65, -1.45)
    scene.add(cloudA)

    const cloudB = makeCloud(cloudMaterial, 0.68)
    cloudB.position.set(3.1, 2.15, -2.1)
    scene.add(cloudB)

    const cloudC = makeCloud(cloudMaterial, 0.48)
    cloudC.position.set(1.7, 3.55, -3.4)
    scene.add(cloudC)

    const pointer = { x: 0, y: 0 }

    const onPointerMove = (event) => {
      const bounds = mount.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return

      pointer.x = THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 2, -1, 1)
      pointer.y = THREE.MathUtils.clamp(((event.clientY - bounds.top) / bounds.height - 0.5) * 2, -1, 1)
    }

    const onPointerLeave = () => {
      pointer.x = 0
      pointer.y = 0
    }

    mount.addEventListener('pointermove', onPointerMove, { passive: true })
    mount.addEventListener('pointerleave', onPointerLeave)

    const resize = () => {
      const width = Math.max(mount.clientWidth, 1)
      const height = Math.max(mount.clientHeight, 1)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)
    resize()

    let animationFrame = 0
    let inViewport = true
    let pageVisible = !document.hidden

    const canRender = () => inViewport && pageVisible

    const renderFrame = (time) => {
      animationFrame = 0
      if (!canRender()) return

      const seconds = time * 0.001

      const cameraTargetX = baseCamera.x + pointer.x * 0.48
      const cameraTargetY = baseCamera.y - pointer.y * 0.3
      const cameraTargetZ = baseCamera.z - Math.abs(pointer.x) * 0.08

      camera.position.x += (cameraTargetX - camera.position.x) * 0.035
      camera.position.y += (cameraTargetY - camera.position.y) * 0.035
      camera.position.z += (cameraTargetZ - camera.position.z) * 0.035
      camera.lookAt(0, -0.12, 0)

      root.position.y = -0.08 + Math.sin(seconds * 0.72) * 0.075
      const targetRootRotation = -0.24 + pointer.x * 0.08
      root.rotation.y += (targetRootRotation - root.rotation.y) * 0.035
      root.rotation.z = Math.sin(seconds * 0.46) * 0.008

      cloudA.position.x = -3.6 + Math.sin(seconds * 0.12) * 0.5
      cloudB.position.x = 3.1 + Math.sin(seconds * 0.1 + 1.4) * 0.42
      cloudC.position.x = 1.7 + Math.sin(seconds * 0.085 + 2.2) * 0.36

      pondMaterial.opacity = 0.76 + Math.sin(seconds * 1.3) * 0.035
      houseGlow.intensity = (compact ? 2.2 : 3.2) + Math.sin(seconds * 0.9) * 0.12

      renderer.render(scene, camera)
      animationFrame = window.requestAnimationFrame(renderFrame)
    }

    const stopRendering = () => {
      if (!animationFrame) return
      window.cancelAnimationFrame(animationFrame)
      animationFrame = 0
    }

    const startRendering = () => {
      if (!canRender() || animationFrame) return
      animationFrame = window.requestAnimationFrame(renderFrame)
    }

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        inViewport = entry.isIntersecting
        if (canRender()) startRendering()
        else stopRendering()
      },
      { threshold: 0.05 },
    )

    const onDocumentVisibility = () => {
      pageVisible = !document.hidden
      if (canRender()) startRendering()
      else stopRendering()
    }

    visibilityObserver.observe(mount)
    document.addEventListener('visibilitychange', onDocumentVisibility)
    startRendering()

    return () => {
      inViewport = false
      pageVisible = false
      stopRendering()

      visibilityObserver.disconnect()
      document.removeEventListener('visibilitychange', onDocumentVisibility)
      resizeObserver.disconnect()
      mount.removeEventListener('pointermove', onPointerMove)
      mount.removeEventListener('pointerleave', onPointerLeave)

      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose()

        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => material.dispose())
        }
      })

      renderer.dispose()
      renderer.forceContextLoss()
      mount.replaceChildren()
    }
  }, [reducedMotion])

  const staticMode = reducedMotion || webglFailed

  return (
    <div
      className={'HeroIsland' + (staticMode ? ' is-static' : '')}
      role="img"
      aria-label="A small surreal floating island with a warm house, tree, pond, rocks, and drifting clouds."
    >
      <div className="HeroIslandMeta" aria-hidden="true">
        <span>WORLD / 01</span>
        <span>{staticMode ? 'STILL WORLD' : 'MOVE GENTLY'}</span>
      </div>

      <div className="HeroIslandStage">
        <div className="HeroIslandCanvas" ref={mountRef} aria-hidden="true" />

        <div className="HeroIslandFallback" aria-hidden="true">
          <span className="FallbackCloud cloud-one" />
          <span className="FallbackCloud cloud-two" />
          <span className="FallbackIsland">
            <i className="FallbackGrass" />
            <i className="FallbackEarth" />
            <i className="FallbackTreeTrunk" />
            <i className="FallbackTreeCrown crown-one" />
            <i className="FallbackTreeCrown crown-two" />
            <i className="FallbackHouse" />
            <i className="FallbackRoof" />
            <i className="FallbackWindow" />
          </span>
        </div>

        <div className="HeroIslandCaption" aria-hidden="true">
          <span>A small place between builds.</span>
          <strong>handmade in Three.js</strong>
        </div>
      </div>
    </div>
  )
}

export default HeroIsland
