// Content is visible by default. Only an entering section gets a short animation;
// no opacity-zero waiting state, per-frame work, or scroll event handler.
export function observeSectionReveals(root, environment = window) {
  if (!root || !environment.IntersectionObserver || !environment.matchMedia) return () => {}
  const document = root.ownerDocument
  const preference = environment.matchMedia('(prefers-reduced-motion: reduce)')
  const pending = new Set([...root.querySelectorAll('[data-reveal]')].filter((element) => !element.dataset.revealed))
  const animating = new Set()

  function stopAnimations() {
    animating.forEach((element) => element.classList.remove('SectionRevealEntering'))
    animating.clear()
  }
  const observer = new environment.IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting, boundingClientRect }) => {
      if (!isIntersecting || document.hidden || preference.matches || !pending.has(target)) return
      pending.delete(target)
      target.dataset.revealed = 'true'
      observer.unobserve(target)
      // Anchor jumps and focused content must settle immediately.
      if (boundingClientRect.top > 0 && !target.contains(document.activeElement)) {
        target.classList.add('SectionRevealEntering')
        animating.add(target)
      }
    })
  }, { threshold: 0.08 })

  function sync() {
    observer.disconnect()
    stopAnimations()
    if (preference.matches || document.hidden) return
    pending.forEach((element) => observer.observe(element))
  }
  function settle(event) {
    const section = event.target.closest?.('[data-reveal]')
    if (!section || !root.contains(section)) return
    section.classList.remove('SectionRevealEntering')
    animating.delete(section)
    pending.delete(section)
    section.dataset.revealed = 'true'
    observer.unobserve(section)
  }
  root.addEventListener('animationend', settle)
  root.addEventListener('focusin', settle)
  document.addEventListener('visibilitychange', sync)
  preference.addEventListener('change', sync)
  sync()

  return () => {
    observer.disconnect()
    stopAnimations()
    root.removeEventListener('animationend', settle)
    root.removeEventListener('focusin', settle)
    document.removeEventListener('visibilitychange', sync)
    preference.removeEventListener('change', sync)
  }
}
