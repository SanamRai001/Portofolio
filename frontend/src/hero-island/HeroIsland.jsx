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

const makeGrassTuft = (material, bladeGeometry, position, scale, phase) => {
  const tuft = new THREE.Group()
  const bladeOffsets = [
    [-0.045, 0, -0.015],
    [0.035, 0.015, 0.025],
    [0, 0.025, 0.055],
  ]

  bladeOffsets.forEach(([x, y, z], index) => {
    const blade = new THREE.Mesh(bladeGeometry, material)
    blade.position.set(x, y + 0.14, z)
    blade.rotation.z = (index - 1) * 0.16
    blade.rotation.y = index * 0.65
    tuft.add(blade)
  })

  tuft.position.set(...position)
  tuft.scale.setScalar(scale)
  tuft.userData.phase = phase
  return tuft
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

    const grassBladeMaterial = new THREE.MeshStandardMaterial({
      color: 0x739174,
      roughness: 0.94,
      flatShading: true,
    })

    const waterfallMaterial = new THREE.MeshStandardMaterial({
      color: 0x69c5d2,
      emissive: 0x174854,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.62,
      roughness: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    })

    const streamMaterial = waterfallMaterial.clone()
    streamMaterial.opacity = 0.5

    const smokeMaterial = new THREE.MeshBasicMaterial({
      color: 0xb9c4c8,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    })

    const fireflyMaterial = new THREE.PointsMaterial({
      color: 0xffd479,
      size: compact ? 0.035 : 0.045,
      transparent: true,
      opacity: compact ? 0.48 : 0.7,
      depthWrite: false,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
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

    const smokeGroup = new THREE.Group()
    smokeGroup.position.set(-0.24, 1.02, -0.1)
    house.add(smokeGroup)

    const smokeGeometry = new THREE.SphereGeometry(0.11, 8, 7)
    const smokePuffs = []

    for (let index = 0; index < (compact ? 3 : 4); index += 1) {
      const material = smokeMaterial.clone()
      const puff = new THREE.Mesh(smokeGeometry, material)
      puff.userData.phase = index / (compact ? 3 : 4)
      smokeGroup.add(puff)
      smokePuffs.push(puff)
    }

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
    const crownMeshes = []
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
      crown.userData.windPhase = crownMeshes.length * 0.8
      crownMeshes.push(crown)
      tree.add(crown)
    })

    addRock(root, stoneMaterial, [-1.52, 0.55, 0.62], [1.25, 0.72, 0.9], [0.2, 0.4, -0.08])
    addRock(root, stoneMaterial, [1.36, 0.51, -0.72], [0.92, 0.62, 1.1], [-0.08, 0.2, 0.14])
    addRock(root, stoneMaterial, [1.66, 0.48, 0.42], [0.58, 0.42, 0.72], [0.16, -0.24, 0.05])
    addRock(root, stoneMaterial, [-0.35, -2.08, 0.36], [0.58, 1.8, 0.64], [0.25, 0.1, 0.28])
    addRock(root, stoneMaterial, [0.62, -2.38, -0.15], [0.46, 1.35, 0.5], [-0.18, -0.2, -0.14])

    const grassBladeGeometry = new THREE.ConeGeometry(0.045, 0.32, 3)
    const grassTufts = []
    const grassTuftData = [
      [-1.56, 0.42, -0.38, 0.86],
      [-1.3, 0.42, 0.14, 1],
      [-1.04, 0.42, 0.72, 0.76],
      [-0.7, 0.42, -0.78, 0.92],
      [-0.4, 0.42, -1.02, 0.74],
      [0.04, 0.42, -0.92, 0.9],
      [0.34, 0.42, 1.12, 0.76],
      [0.78, 0.42, -1.12, 0.88],
      [1.1, 0.42, 0.9, 0.72],
      [1.45, 0.42, 0.2, 0.9],
      [1.55, 0.42, -0.35, 0.72],
      [-1.62, 0.42, 0.92, 0.68],
      [-0.12, 0.42, 1.42, 0.7],
      [0.88, 0.42, 1.25, 0.62],
    ]

    grassTuftData
      .slice(0, compact ? 8 : grassTuftData.length)
      .forEach(([x, y, z, scale], index) => {
        const tuft = makeGrassTuft(
          grassBladeMaterial,
          grassBladeGeometry,
          [x, y, z],
          scale,
          index * 0.73,
        )
        grassTufts.push(tuft)
        root.add(tuft)
      })

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

    const rippleMaterials = [0, 1].map(() => new THREE.MeshBasicMaterial({
      color: 0xa7e5eb,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    }))

    const ripples = rippleMaterials.map((material, index) => {
      const ripple = new THREE.Mesh(
        new THREE.RingGeometry(0.34, 0.365, compact ? 20 : 32),
        material,
      )
      ripple.position.copy(pond.position)
      ripple.position.y += 0.012 + index * 0.003
      ripple.rotation.x = -Math.PI / 2
      ripple.userData.phase = index * 0.52
      root.add(ripple)
      return ripple
    })

    const stream = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 1.22, 1, 3),
      streamMaterial,
    )
    stream.position.set(-0.38, 0.38, 1.42)
    stream.rotation.x = -Math.PI / 2
    root.add(stream)

    const waterfall = new THREE.Mesh(
      new THREE.PlaneGeometry(0.31, 1.48, 1, 5),
      waterfallMaterial,
    )
    waterfall.position.set(-0.38, -0.31, 1.96)
    waterfall.rotation.z = -0.025
    root.add(waterfall)

    const moteCount = compact ? 8 : 18
    const motePositions = new Float32Array(moteCount * 3)
    const moteBase = new Float32Array(moteCount * 3)
    const motePhases = new Float32Array(moteCount)

    for (let index = 0; index < moteCount; index += 1) {
      const angle = index * 2.399963229728653
      const radius = 1.25 + (index % 5) * 0.27
      const x = Math.cos(angle) * radius
      const y = 0.62 + (index % 6) * 0.27
      const z = Math.sin(angle) * radius * 0.78

      motePositions[index * 3] = x
      motePositions[index * 3 + 1] = y
      motePositions[index * 3 + 2] = z
      moteBase[index * 3] = x
      moteBase[index * 3 + 1] = y
      moteBase[index * 3 + 2] = z
      motePhases[index] = index * 0.83
    }

    const moteGeometry = new THREE.BufferGeometry()
    moteGeometry.setAttribute('position', new THREE.BufferAttribute(motePositions, 3))
    const moteMaterial = new THREE.PointsMaterial({
      color: 0xb5eef0,
      size: compact ? 0.022 : 0.03,
      transparent: true,
      opacity: compact ? 0.28 : 0.38,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const motes = new THREE.Points(moteGeometry, moteMaterial)
    root.add(motes)

    const fireflyCount = compact ? 4 : 9
    const fireflyPositions = new Float32Array(fireflyCount * 3)
    const fireflyBase = new Float32Array(fireflyCount * 3)
    const fireflyPhases = new Float32Array(fireflyCount)

    for (let index = 0; index < fireflyCount; index += 1) {
      const angle = index * 2.17
      const radius = 0.48 + (index % 4) * 0.18
      const x = -0.36 + Math.cos(angle) * radius
      const y = 0.72 + (index % 3) * 0.24
      const z = 0.12 + Math.sin(angle) * radius * 0.72

      fireflyPositions[index * 3] = x
      fireflyPositions[index * 3 + 1] = y
      fireflyPositions[index * 3 + 2] = z
      fireflyBase[index * 3] = x
      fireflyBase[index * 3 + 1] = y
      fireflyBase[index * 3 + 2] = z
      fireflyPhases[index] = index * 1.19
    }

    const fireflyGeometry = new THREE.BufferGeometry()
    fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3))
    const fireflies = new THREE.Points(fireflyGeometry, fireflyMaterial)
    root.add(fireflies)

    let forgeTexture = null
    let forgeMaterial = null
    let forgeSprite = null
    let forgeFrame = -1
    let disposed = false

    const interactiveTargets = [
      { object: houseBody, type: 'house' },
      { object: pond, type: 'pond' },
    ]

    const textureLoader = new THREE.TextureLoader()
    textureLoader.load(
      '/forge/forge-sprite.svg',
      (texture) => {
        if (disposed) {
          texture.dispose()
          return
        }

        forgeTexture = texture
        forgeTexture.colorSpace = THREE.SRGBColorSpace
        forgeTexture.repeat.set(1 / 8, 1 / 11)
        forgeTexture.offset.set(0, 8 / 11)

        forgeMaterial = new THREE.SpriteMaterial({
          map: forgeTexture,
          transparent: true,
          alphaTest: 0.02,
          depthWrite: false,
        })

        forgeSprite = new THREE.Sprite(forgeMaterial)
        forgeSprite.position.set(-0.42, 0.94, 0.82)
        forgeSprite.scale.set(0.62, 0.68, 1)
        forgeSprite.renderOrder = 4
        root.add(forgeSprite)
        interactiveTargets.push({ object: forgeSprite, type: 'forge' })
      },
      undefined,
      (error) => {
        console.warn('Forge island cameo texture unavailable', error)
      },
    )

    const cloudA = makeCloud(cloudMaterial, 0.86)
    cloudA.position.set(-3.6, 2.65, -1.45)
    cloudA.userData = { startX: -4.2, span: 8.4, offset: 0.6, speed: 0.12, baseY: 2.65, phase: 0 }
    scene.add(cloudA)

    const cloudB = makeCloud(cloudMaterial, 0.68)
    cloudB.position.set(3.1, 2.15, -2.1)
    cloudB.userData = { startX: -4.2, span: 8.4, offset: 7.3, speed: 0.095, baseY: 2.15, phase: 1.4 }
    scene.add(cloudB)

    const cloudC = makeCloud(cloudMaterial, 0.48)
    cloudC.position.set(1.7, 3.55, -3.4)
    cloudC.userData = { startX: -4.2, span: 8.4, offset: 5.9, speed: 0.075, baseY: 3.55, phase: 2.2 }
    scene.add(cloudC)

    const clouds = [cloudA, cloudB, cloudC]

    const pointer = { x: 0, y: 0 }
    const raycaster = new THREE.Raycaster()
    let hoverTarget = null

    const updateHoverTarget = () => {
      scene.updateMatrixWorld(true)
      raycaster.setFromCamera(pointer, camera)

      const hits = raycaster.intersectObjects(
        interactiveTargets.map((item) => item.object),
        false,
      )

      hoverTarget = null

      if (hits.length) {
        const match = interactiveTargets.find((item) => item.object === hits[0].object)
        hoverTarget = match?.type || null
      }

      mount.style.cursor = hoverTarget ? 'pointer' : 'default'
    }

    const onPointerMove = (event) => {
      const bounds = mount.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return

      pointer.x = THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 2, -1, 1)
      pointer.y = THREE.MathUtils.clamp(((event.clientY - bounds.top) / bounds.height - 0.5) * 2, -1, 1)
      updateHoverTarget()
    }

    const onPointerLeave = () => {
      pointer.x = 0
      pointer.y = 0
      hoverTarget = null
      mount.style.cursor = 'default'
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

      const wind = Math.sin(seconds * 0.86) * 0.035 + Math.sin(seconds * 1.63 + 0.8) * 0.012
      tree.rotation.z = wind
      tree.rotation.x = Math.sin(seconds * 0.62) * 0.008

      crownMeshes.forEach((crown, index) => {
        crown.rotation.z = wind * (0.72 + index * 0.13) + Math.sin(seconds * 1.1 + crown.userData.windPhase) * 0.012
        crown.rotation.x = Math.sin(seconds * 0.74 + crown.userData.windPhase) * 0.009
      })

      grassTufts.forEach((tuft) => {
        const gust = Math.sin(seconds * 1.45 + tuft.userData.phase) * 0.07
        tuft.rotation.z = wind * 1.7 + gust
        tuft.rotation.x = Math.sin(seconds * 1.08 + tuft.userData.phase) * 0.025
      })

      clouds.forEach((cloud) => {
        const { startX, span, offset, speed, baseY, phase } = cloud.userData
        cloud.position.x = startX + ((offset + seconds * speed) % span)
        cloud.position.y = baseY + Math.sin(seconds * 0.28 + phase) * 0.045
      })

      const pondHoverBoost = hoverTarget === 'pond' ? 1 : 0

      ripples.forEach((ripple, index) => {
        const speed = 0.2 + pondHoverBoost * 0.18
        const progress = (seconds * speed + ripple.userData.phase) % 1
        const spread = 0.88 + progress * (0.82 + pondHoverBoost * 0.22)
        ripple.scale.set(1.35 * spread, 0.78 * spread, 1)
        rippleMaterials[index].opacity = (1 - progress) * (0.2 + pondHoverBoost * 0.15)
      })

      pond.scale.x = 1.35 + Math.sin(seconds * 0.9) * 0.015
      pond.scale.y = 0.78 + Math.sin(seconds * 1.16 + 0.6) * 0.012
      pondMaterial.opacity = 0.76 + Math.sin(seconds * 1.3) * 0.035

      streamMaterial.opacity = 0.47 + Math.sin(seconds * 1.7) * 0.04
      waterfallMaterial.opacity = 0.58 + Math.sin(seconds * 1.42 + 0.4) * 0.06
      waterfall.scale.y = 1 + Math.sin(seconds * 1.15) * 0.018

      const moteAttribute = moteGeometry.getAttribute('position')
      for (let index = 0; index < moteCount; index += 1) {
        const phase = motePhases[index]
        motePositions[index * 3] = moteBase[index * 3] + Math.sin(seconds * 0.43 + phase) * 0.055
        motePositions[index * 3 + 1] = moteBase[index * 3 + 1] + Math.sin(seconds * 0.72 + phase) * 0.09
        motePositions[index * 3 + 2] = moteBase[index * 3 + 2] + Math.cos(seconds * 0.37 + phase) * 0.045
      }
      moteAttribute.needsUpdate = true
      motes.rotation.y = seconds * 0.018

      const fireflyAttribute = fireflyGeometry.getAttribute('position')
      for (let index = 0; index < fireflyCount; index += 1) {
        const phase = fireflyPhases[index]
        fireflyPositions[index * 3] = fireflyBase[index * 3] + Math.sin(seconds * 0.64 + phase) * 0.11
        fireflyPositions[index * 3 + 1] = fireflyBase[index * 3 + 1] + Math.sin(seconds * 1.08 + phase) * 0.13
        fireflyPositions[index * 3 + 2] = fireflyBase[index * 3 + 2] + Math.cos(seconds * 0.53 + phase) * 0.09
      }
      fireflyAttribute.needsUpdate = true
      fireflyMaterial.opacity = (compact ? 0.48 : 0.7) + Math.sin(seconds * 1.35) * 0.1

      smokePuffs.forEach((puff) => {
        const progress = (seconds * 0.11 + puff.userData.phase) % 1
        puff.position.set(
          Math.sin(seconds * 0.5 + puff.userData.phase * 6) * 0.08 + progress * 0.1,
          progress * 1.1,
          Math.cos(seconds * 0.35 + puff.userData.phase * 5) * 0.045,
        )
        const scale = 0.62 + progress * 1.45
        puff.scale.setScalar(scale)
        puff.material.opacity = (1 - progress) * 0.15
      })

      if (forgeTexture && forgeSprite) {
        const forgeRow = hoverTarget === 'forge' ? 4 : 2
        const frame = Math.floor(seconds * (hoverTarget === 'forge' ? 8 : 5)) % 8
        const frameKey = forgeRow * 8 + frame

        if (frameKey !== forgeFrame) {
          forgeTexture.offset.x = frame / 8
          forgeTexture.offset.y = (10 - forgeRow) / 11
          forgeFrame = frameKey
        }

        forgeSprite.position.y = 0.94 + Math.sin(seconds * 1.1) * 0.018
      }

      const houseHoverBoost = hoverTarget === 'house' ? 1 : 0
      const houseBase = compact ? 2.2 : 3.2
      houseGlow.intensity += ((houseBase + houseHoverBoost * 2.4 + Math.sin(seconds * 0.9) * 0.12) - houseGlow.intensity) * 0.12
      windowMaterial.emissiveIntensity += ((1.7 + houseHoverBoost * 1.8) - windowMaterial.emissiveIntensity) * 0.14

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
      disposed = true
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

      if (forgeTexture) forgeTexture.dispose()
      forgeTexture = null
      forgeMaterial = null
      forgeSprite = null

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
      aria-label="A small surreal floating island with a warm interactive house, wind-swept tree and grass, pond and waterfall, drifting clouds, fireflies, chimney smoke, and a tiny Forge companion."
    >
      <div className="HeroIslandMeta" aria-hidden="true">
        <span>WORLD / 03</span>
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
            <i className="FallbackPond" />
            <i className="FallbackWaterfall" />
            <i className="FallbackForge" />
          </span>
        </div>

        <div className="HeroIslandCaption" aria-hidden="true">
          <span>Someone lives here now.</span>
          <strong>handmade in Three.js</strong>
        </div>
      </div>
    </div>
  )
}

export default HeroIsland
