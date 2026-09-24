import { useLayoutEffect, useRef, useState } from 'react'
import SystemCore from './SystemCore'
import { gsap, ScrollTrigger, MOTION } from './motion'
import useReducedMotion from './motion/useReducedMotion'
import './ArchitectureStory.css'

const CHAPTERS = [
  {
    key: 'api',
    number: '01',
    label: 'API CORE',
    title: 'Every interface eventually reaches a system.',
    body: 'Requests enter through a deliberate contract. The API core validates intent, coordinates domain behavior, and keeps the interface separated from infrastructure details.',
    detail: 'HTTP → validation → domain',
  },
  {
    key: 'auth',
    number: '02',
    label: 'AUTH',
    title: 'Trust is a boundary, not a button.',
    body: 'Authentication decides who a request represents. Authorization decides what that identity is allowed to do before protected application behavior continues.',
    detail: 'identity → policy → access',
  },
  {
    key: 'cache',
    number: '03',
    label: 'CACHE',
    title: 'Fast paths should still be predictable.',
    body: 'Caching reduces repeated work without becoming the source of truth. Misses fall through cleanly, hits stay cheap, and invalidation remains an explicit system decision.',
    detail: 'lookup → hit / miss → fallback',
  },
  {
    key: 'database',
    number: '04',
    label: 'DATABASE',
    title: 'Persistence is where state becomes responsibility.',
    body: 'Data boundaries, indexes, validation, and tenant-safe queries determine whether a backend stays reliable after the happy path ends.',
    detail: 'query → persist → verify',
  },
  {
    key: 'runtime',
    number: '05',
    label: 'RUNTIME',
    title: 'Production behavior is part of the architecture.',
    body: 'Logs, limits, failures, configuration, and observability decide whether a system can be understood and recovered when real traffic arrives.',
    detail: 'observe → constrain → recover',
  },
]

const ArchitectureStory = ({ suspended = false }) => {
  const sectionRef = useRef(null)
  const progressRef = useRef(0)
  const activeChapterRef = useRef(0)
  const activeIndexRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const reducedMotion = useReducedMotion()

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section || reducedMotion || suspended) return undefined

    const context = gsap.context(() => {
      const cards = gsap.utils.toArray('.ArchitectureStoryChapter')

      const progressTrigger = ScrollTrigger.create({
        trigger: section,
        start: 'top 62%',
        end: 'bottom 38%',
        onUpdate: (self) => {
          progressRef.current = self.progress

          const nextIndex = Math.min(
            CHAPTERS.length - 1,
            Math.floor(self.progress * CHAPTERS.length),
          )

          activeChapterRef.current = nextIndex

          if (nextIndex !== activeIndexRef.current) {
            activeIndexRef.current = nextIndex
            setActiveIndex(nextIndex)
          }
        },
      })

      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { autoAlpha: 0.46, y: MOTION.distance.md },
          {
            autoAlpha: 1,
            y: 0,
            duration: MOTION.duration.base,
            ease: MOTION.ease.standard,
            scrollTrigger: {
              trigger: card,
              start: 'top 78%',
              end: 'top 48%',
              toggleActions: 'play none none reverse',
            },
          },
        )
      })

      return () => progressTrigger.kill()
    }, section)

    return () => context.revert()
  }, [reducedMotion, suspended])

  return (
    <section
      className="ArchitectureStory"
      id="architecture-story"
      ref={sectionRef}
      aria-labelledby="architecture-story-title"
    >
      <div className="ArchitectureStoryShell">
        <div className="ArchitectureStoryVisual">
          <div className="ArchitectureStoryIntro">
            <span className="SectionKicker">SYSTEM / 01—05</span>
            <h2 id="architecture-story-title">How a request becomes reliable behavior.</h2>
            <p>
              The same system core opens as you scroll. Each layer has a job; none of them should quietly become everything.
            </p>
          </div>

          <div className="ArchitectureStoryCore">
            <SystemCore
              variant="story"
              storyProgressRef={progressRef}
              activeChapterRef={activeChapterRef}
              suspended={suspended}
            />
          </div>

          <div className="ArchitectureStoryProgress" aria-hidden="true">
            {CHAPTERS.map((chapter, index) => (
              <span
                className={index <= activeIndex ? 'is-active' : ''}
                key={chapter.key}
              />
            ))}
          </div>
        </div>

        <div className="ArchitectureStoryChapters">
          {CHAPTERS.map((chapter, index) => (
            <article
              className={'ArchitectureStoryChapter' + (index === activeIndex ? ' is-active' : '')}
              key={chapter.key}
              aria-current={index === activeIndex ? 'step' : undefined}
            >
              <div className="ArchitectureStoryChapterMeta">
                <span>{chapter.number}</span>
                <span>{chapter.label}</span>
              </div>
              <h3>{chapter.title}</h3>
              <p>{chapter.body}</p>
              <code>{chapter.detail}</code>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ArchitectureStory
