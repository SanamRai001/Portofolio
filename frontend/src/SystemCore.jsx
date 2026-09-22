import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import useReducedMotion from './motion/useReducedMotion'
import './SystemCore.css'

const NODE_CONFIG = [
  { id: 'auth', stateKey: 'auth', label: 'AUTH', position: [0, 1.48, 0.12], color: 0x35c8b4 },
  { id: 'cache', stateKey: 'cache', label: 'CACHE', position: [-1.68, 0.08, -0.08], color: 0x57ddf2 },
  { id: 'database', stateKey: 'db', label: 'DATABASE', position: [1.68, 0.08, -0.08], color: 0xffb85c },
  { id: 'runtime', stateKey: 'logging', label: 'RUNTIME', position: [0, -1.38, 0.18], color: 0xf2738a },
]

const SystemCore = ({
  storyProgressRef = null,
  activeChapterRef = null,
  variant = 'panel',
  systemState = null,
}) => {
  const mountRef = useRef(null)
  const systemStateRef = useRef(systemState)
  const [webglFailed, setWebglFailed] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    systemStateRef.current = systemState
  }, [systemState])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || reducedMotion) return undefined

    const compact = window.matchMedia('(max-width: 720px), (pointer: coarse)').matches
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50)
    camera.position.set(0, 0.05, 5.6)

    let renderer

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !compact,
        powerPreference: 'high-performance',
      })
    } catch (error) {
      console.warn('System Core WebGL unavailable', error)
      setWebglFailed(true)
      return undefined
    }

    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.2 : 1.6))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.replaceChildren(renderer.domElement)

    const root = new THREE.Group()
    root.rotation.x = -0.08
    scene.add(root)

    scene.add(new THREE.AmbientLight(0x83a8b8, 0.52))

    const cyanLight = new THREE.PointLight(0x57ddf2, 7.5, 8)
    cyanLight.position.set(-2.4, 1.5, 2.8)
    scene.add(cyanLight)

    const amberLight = new THREE.PointLight(0xffb85c, 8, 8)
    amberLight.position.set(2.1, -1.4, 2.5)
    scene.add(amberLight)

    const coreGeometry = new THREE.IcosahedronGeometry(0.55, compact ? 1 : 2)
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d2432,
      emissive: 0x57ddf2,
      emissiveIntensity: 1.25,
      metalness: 0.72,
      roughness: 0.24,
    })
    const core = new THREE.Mesh(coreGeometry, coreMaterial)
    root.add(core)

    const shellGeometry = new THREE.IcosahedronGeometry(0.69, 1)
    const shellMaterial = new THREE.MeshBasicMaterial({
      color: 0x57ddf2,
      transparent: true,
      opacity: 0.13,
      wireframe: true,
    })
    const shell = new THREE.Mesh(shellGeometry, shellMaterial)
    root.add(shell)

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x57ddf2,
      transparent: true,
      opacity: 0.5,
    })
    const ringSecondaryMaterial = new THREE.MeshBasicMaterial({
      color: 0x35c8b4,
      transparent: true,
      opacity: 0.32,
    })
    const ringTertiaryMaterial = new THREE.MeshBasicMaterial({
      color: 0xffb85c,
      transparent: true,
      opacity: 0.2,
    })

    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(1.02, 0.014, 8, compact ? 56 : 96),
      ringMaterial,
    )
    ringA.rotation.x = 1.08
    ringA.rotation.y = 0.28
    root.add(ringA)

    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(1.27, 0.011, 8, compact ? 56 : 96),
      ringSecondaryMaterial,
    )
    ringB.rotation.x = 0.36
    ringB.rotation.y = 1.14
    root.add(ringB)

    const ringC = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.008, 8, compact ? 48 : 84),
      ringTertiaryMaterial,
    )
    ringC.rotation.x = 1.46
    ringC.rotation.z = 0.42
    root.add(ringC)

    const origin = new THREE.Vector3(0, 0, 0)
    const pulses = []
    const serviceVisuals = []

    NODE_CONFIG.forEach((nodeConfig, index) => {
      const nodePosition = new THREE.Vector3(...nodeConfig.position)
      const nodeMaterial = new THREE.MeshStandardMaterial({
        color: 0x0b1822,
        emissive: nodeConfig.color,
        emissiveIntensity: 1.1,
        metalness: 0.58,
        roughness: 0.34,
      })

      const node = new THREE.Mesh(
        new THREE.SphereGeometry(compact ? 0.115 : 0.14, 16, 16),
        nodeMaterial,
      )
      node.position.copy(nodePosition)
      root.add(node)

      const haloMaterial = new THREE.MeshBasicMaterial({
        color: nodeConfig.color,
        transparent: true,
        opacity: 0.42,
      })
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(compact ? 0.19 : 0.22, 0.008, 8, 36),
        haloMaterial,
      )
      halo.position.copy(nodePosition)
      root.add(halo)

      const connectionMaterial = new THREE.LineBasicMaterial({
        color: nodeConfig.color,
        transparent: true,
        opacity: 0.22,
      })
      const connectionGeometry = new THREE.BufferGeometry().setFromPoints([origin, nodePosition])
      const connection = new THREE.Line(connectionGeometry, connectionMaterial)
      root.add(connection)

      const pulseMaterial = new THREE.MeshBasicMaterial({
        color: nodeConfig.color,
        transparent: true,
        opacity: 1,
      })
      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(compact ? 0.026 : 0.034, 10, 10),
        pulseMaterial,
      )
      pulse.userData = {
        destination: nodePosition,
        offset: index * 0.37,
        speed: 0.34 + index * 0.025,
      }
      root.add(pulse)
      pulses.push(pulse)
      serviceVisuals.push({
        stateKey: nodeConfig.stateKey,
        node,
        nodeMaterial,
        haloMaterial,
        connectionMaterial,
        pulseMaterial,
      })
    })

    const particleCount = compact ? 18 : 44
    const positions = new Float32Array(particleCount * 3)

    for (let index = 0; index < particleCount; index += 1) {
      const radius = 1.9 + (index % 7) * 0.11
      const angle = index * 2.399963229728653
      positions[index * 3] = Math.cos(angle) * radius
      positions[index * 3 + 1] = Math.sin(angle) * radius * 0.72
      positions[index * 3 + 2] = ((index % 5) - 2) * 0.22
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x57ddf2,
      size: compact ? 0.018 : 0.024,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true,
    })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    root.add(particles)

    const pointer = { x: 0, y: 0 }

    const onPointerMove = (event) => {
      const bounds = mount.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return

      pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
      pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
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
    let visible = true

    const renderFrame = (time) => {
      animationFrame = 0
      if (!visible) return

      const seconds = time * 0.001
      const storyProgress = THREE.MathUtils.clamp(storyProgressRef?.current ?? 0, 0, 1)
      const activeChapter = activeChapterRef?.current ?? -1
      const liveConfig = variant === 'lab' ? systemStateRef.current : null
      const targetRotationX = -0.08 + pointer.y * 0.11 + storyProgress * 0.08
      const targetRotationY = pointer.x * 0.18 + Math.sin(seconds * 0.18) * 0.08 + storyProgress * 0.12

      root.rotation.x += (targetRotationX - root.rotation.x) * 0.045
      root.rotation.y += (targetRotationY - root.rotation.y) * 0.045

      core.rotation.x = seconds * 0.14
      core.rotation.y = seconds * 0.2
      shell.rotation.x = -seconds * 0.09
      shell.rotation.y = seconds * 0.12

      const enabledMappedCount = liveConfig
        ? ['auth', 'cache', 'db', 'logging'].filter((key) => Boolean(liveConfig[key])).length
        : 0
      const pulseScale = 1 + Math.sin(seconds * 2.2) * 0.035 + storyProgress * 0.055
      core.scale.setScalar(pulseScale + (liveConfig ? enabledMappedCount * 0.012 : 0))

      const coreTarget = liveConfig
        ? 0.78 + enabledMappedCount * 0.24
        : (activeChapter === 0 ? 2.1 : 1.25) + storyProgress * 0.18
      coreMaterial.emissiveIntensity += (coreTarget - coreMaterial.emissiveIntensity) * 0.08

      const ringSpread = 1 + storyProgress * 0.16
      ringA.scale.setScalar(ringSpread)
      ringB.scale.setScalar(1 + storyProgress * 0.22)
      ringC.scale.setScalar(1 + storyProgress * 0.28)
      ringA.rotation.z = seconds * 0.15 + storyProgress * 0.22
      ringB.rotation.z = -seconds * 0.11 - storyProgress * 0.18
      ringC.rotation.y = seconds * 0.07 + storyProgress * 0.16
      particles.rotation.z = seconds * 0.018

      if (liveConfig) {
        const cacheOn = Boolean(liveConfig.cache)
        const authOn = Boolean(liveConfig.auth)
        const dbOn = Boolean(liveConfig.db)
        const loggingOn = Boolean(liveConfig.logging)

        ringMaterial.opacity += ((cacheOn ? 0.52 : 0.09) - ringMaterial.opacity) * 0.08
        ringSecondaryMaterial.opacity += ((authOn ? 0.5 : 0.08) - ringSecondaryMaterial.opacity) * 0.08
        ringTertiaryMaterial.opacity += ((dbOn ? 0.42 : 0.07) - ringTertiaryMaterial.opacity) * 0.08
        particleMaterial.opacity += ((loggingOn ? 0.46 : 0.08) - particleMaterial.opacity) * 0.08
      }

      serviceVisuals.forEach((service, index) => {
        const storyActive = activeChapter === index + 1
        const enabled = liveConfig ? Boolean(liveConfig[service.stateKey]) : null
        const targetIntensity = liveConfig ? (enabled ? 2.25 : 0.16) : (storyActive ? 2.4 : 1.02)
        const targetOpacity = liveConfig ? (enabled ? 0.74 : 0.08) : (storyActive ? 0.78 : 0.34)
        const connectionOpacity = liveConfig ? (enabled ? 0.5 : 0.06) : 0.22
        const pulseOpacity = liveConfig ? (enabled ? 1 : 0.08) : 1
        const nodeScale = liveConfig ? (enabled ? 1.08 : 0.76) : 1

        service.nodeMaterial.emissiveIntensity += (targetIntensity - service.nodeMaterial.emissiveIntensity) * 0.09
        service.haloMaterial.opacity += (targetOpacity - service.haloMaterial.opacity) * 0.09
        service.connectionMaterial.opacity += (connectionOpacity - service.connectionMaterial.opacity) * 0.09
        service.pulseMaterial.opacity += (pulseOpacity - service.pulseMaterial.opacity) * 0.09
        service.node.scale.x += (nodeScale - service.node.scale.x) * 0.09
        service.node.scale.y += (nodeScale - service.node.scale.y) * 0.09
        service.node.scale.z += (nodeScale - service.node.scale.z) * 0.09
      })

      pulses.forEach((pulse) => {
        const phase = (seconds * pulse.userData.speed + pulse.userData.offset) % 1
        pulse.position.lerpVectors(origin, pulse.userData.destination, phase)
        pulse.scale.setScalar(0.75 + Math.sin(phase * Math.PI) * 0.65)
      })

      renderer.render(scene, camera)
      animationFrame = window.requestAnimationFrame(renderFrame)
    }

    const startRendering = () => {
      if (!visible || animationFrame) return
      animationFrame = window.requestAnimationFrame(renderFrame)
    }

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting

        if (visible) {
          startRendering()
        } else if (animationFrame) {
          window.cancelAnimationFrame(animationFrame)
          animationFrame = 0
        }
      },
      { threshold: 0.05 },
    )

    visibilityObserver.observe(mount)
    startRendering()

    return () => {
      visible = false
      if (animationFrame) window.cancelAnimationFrame(animationFrame)

      visibilityObserver.disconnect()
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
  }, [activeChapterRef, reducedMotion, storyProgressRef, variant])

  const staticMode = reducedMotion || webglFailed
  const mappedEnabledCount = systemState
    ? ['auth', 'cache', 'db', 'logging'].filter((key) => Boolean(systemState[key])).length
    : 0

  return (
    <div
      className={'SystemCore SystemCore--' + variant + (staticMode ? ' is-static' : '')}
      role="img"
      aria-label={
        variant === 'lab'
          ? 'Live system topology reflecting authentication, cache, database, and logging configuration.'
          : 'System topology showing an API core connected to authentication, cache, database, and runtime services.'
      }
    >
      <div className="SystemCoreMeta" aria-hidden="true">
        <span>{variant === 'lab' ? 'LIVE CONFIG MAP' : 'LIVE TOPOLOGY'}</span>
        <span>
          {staticMode
            ? 'STATIC MODE'
            : variant === 'lab'
              ? mappedEnabledCount + '/4 MAPPED ACTIVE'
              : 'WEBGL / ACTIVE'}
        </span>
      </div>

      <div className="SystemCoreStage">
        <div className="SystemCoreCanvas" ref={mountRef} aria-hidden="true" />

        <div className="SystemCoreFallback" aria-hidden="true">
          <span className="SystemCoreFallbackRing ring-one" />
          <span className="SystemCoreFallbackRing ring-two" />
          <span className="SystemCoreFallbackCenter" />
        </div>

        <span className="SystemCoreCenterLabel" aria-hidden="true">API CORE</span>

        {NODE_CONFIG.map((node) => {
          const liveClass = variant === 'lab' && systemState
            ? (systemState[node.stateKey] ? ' is-enabled' : ' is-disabled')
            : ''

          return (
            <span
              className={'SystemCoreLabel label-' + node.id + liveClass}
              key={node.id}
              aria-hidden="true"
            >
              <i />
              {node.label}
            </span>
          )
        })}
      </div>

      <div className="SystemCoreLegend" aria-hidden="true">
        {variant === 'lab' ? (
          <>
            <span><i className="legend-cyan" /> enabled path</span>
            <span><i className="legend-amber" /> persistence</span>
            <span><i className="legend-teal" /> trust boundary</span>
          </>
        ) : (
          <>
            <span><i className="legend-cyan" /> requests</span>
            <span><i className="legend-amber" /> persistence</span>
            <span><i className="legend-teal" /> trust boundary</span>
          </>
        )}
      </div>
    </div>
  )
}

export default SystemCore
