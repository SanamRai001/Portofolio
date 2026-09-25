export function getPerformanceProfile({
  width = 1280, coarsePointer = false, deviceMemory, hardwareConcurrency,
  pixelRatio = 1, reducedMotion = false,
} = {}) {
  const lowPower = width <= 768 || coarsePointer
    || (deviceMemory > 0 && deviceMemory <= 4)
    || (hardwareConcurrency > 0 && hardwareConcurrency <= 4)
  return {
    lowPower,
    reducedMotion,
    dpr: Math.min(Math.max(Number.isFinite(pixelRatio) ? pixelRatio : 1, 1), lowPower ? 1 : 1.5),
    starCounts: lowPower ? [120, 260, 520] : [320, 800, 1600],
    fps: lowPower ? 30 : 60,
    parallax: !lowPower && !reducedMotion,
  }
}

export function readPerformanceProfile(reducedMotion) {
  return getPerformanceProfile({
    width: window.innerWidth,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    deviceMemory: navigator.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    pixelRatio: window.devicePixelRatio,
    reducedMotion,
  })
}
