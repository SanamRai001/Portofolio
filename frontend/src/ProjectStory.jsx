import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { FaGithub } from 'react-icons/fa'
import { gsap, ScrollTrigger, MOTION } from './motion'
import useReducedMotion from './motion/useReducedMotion'
import { emitForgeReaction } from './forgeEvents'
import './ProjectStory.css'

const STORY_META = {
  '1': {
    index: '01',
    category: 'MARKETPLACE SYSTEM',
    focus: 'Commerce flows with synchronized state',
    architecture: 'JWT auth · cart state · dual checkout · persistence',
    signal: 'full-stack product flow',
  },
  '2': {
    index: '02',
    category: 'RUNTIME ARCHITECTURE',
    focus: 'Backend behavior you can change and observe',
    architecture: 'auth · cache · logging · pagination · system config',
    signal: 'production-minded API design',
  },
  '3': {
    index: '03',
    category: 'REAL-TIME SYSTEM',
    focus: 'Private messaging with authenticated sockets',
    architecture: 'JWT handshake · presence · Socket.IO · MongoDB',
    signal: 'secure realtime communication',
  },
}

const ProjectStory = ({ projects }) => {
  const rootRef = useRef(null)
  const activeRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const reducedMotion = useReducedMotion()

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion) return undefined

    const context = gsap.context(() => {
      const chapters = gsap.utils.toArray('.ProjectStoryChapter')

      chapters.forEach((chapter, index) => {
        ScrollTrigger.create({
          trigger: chapter,
          start: 'top 58%',
          end: 'bottom 42%',
          onEnter: () => {
            if (activeRef.current !== index) {
              emitForgeReaction('think', { duration: 1000, source: 'projects' })
            }
            activeRef.current = index
            setActiveIndex(index)
          },
          onEnterBack: () => {
            if (activeRef.current !== index) {
              emitForgeReaction('look', { duration: 900, source: 'projects' })
            }
            activeRef.current = index
            setActiveIndex(index)
          },
        })

        gsap.fromTo(
          chapter.querySelector('.ProjectStoryChapterInner'),
          {
            autoAlpha: 0.52,
            y: MOTION.distance.md,
          },
          {
            autoAlpha: 1,
            y: 0,
            ease: MOTION.ease.standard,
            duration: MOTION.duration.base,
            scrollTrigger: {
              trigger: chapter,
              start: 'top 80%',
              end: 'top 52%',
              toggleActions: 'play none none reverse',
            },
          },
        )
      })
    }, root)

    return () => context.revert()
  }, [reducedMotion])

  const activeProject = projects[activeIndex] || projects[0]
  const activeMeta = STORY_META[activeProject?._id] || {
    index: String(activeIndex + 1).padStart(2, '0'),
    category: 'ENGINEERING BUILD',
    focus: 'System-focused project',
    architecture: (activeProject?.techStacks || []).slice(0, 4).join(' · '),
    signal: 'applied engineering',
  }

  return (
    <div className="ProjectStory" ref={rootRef}>
      <div className="ProjectStoryLayout">
        <div className="ProjectStoryVisual">
          <div className="ProjectStoryViewport" aria-live="polite">
            <div className="ProjectStoryFrameMeta" aria-hidden="true">
              <span>{activeMeta.index} / {String(projects.length).padStart(2, '0')}</span>
              <span>{activeMeta.category}</span>
            </div>

            <div className="ProjectStoryImages" aria-hidden="true">
              {projects.map((project, index) => (
                <div
                  className={'ProjectStoryImageLayer' + (index === activeIndex ? ' is-active' : '')}
                  key={project._id}
                >
                  <img
                    src={project.imageUrl}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              ))}
              <div className="ProjectStoryImageGrid" />
            </div>

            <div className="ProjectStoryFrameFooter">
              <div>
                <span>engineering signal</span>
                <strong>{activeMeta.signal}</strong>
              </div>
              <div>
                <span>focus</span>
                <strong>{activeMeta.focus}</strong>
              </div>
            </div>
          </div>

          <div className="ProjectStoryRail" aria-hidden="true">
            {projects.map((project, index) => (
              <span
                className={index === activeIndex ? 'is-active' : ''}
                key={project._id}
              />
            ))}
          </div>
        </div>

        <div className="ProjectStoryChapters">
          {projects.map((project, index) => {
            const meta = STORY_META[project._id] || {
              index: String(index + 1).padStart(2, '0'),
              category: 'ENGINEERING BUILD',
              focus: 'System-focused project',
              architecture: project.techStacks.slice(0, 4).join(' · '),
              signal: 'applied engineering',
            }

            return (
              <article
                className={'ProjectStoryChapter' + (index === activeIndex ? ' is-active' : '')}
                key={project._id}
              >
                <div className="ProjectStoryChapterInner">
                  <div className="ProjectStoryChapterMeta">
                    <span>{meta.index}</span>
                    <span>{meta.category}</span>
                  </div>

                  <h3>{project.name}</h3>
                  <p className="ProjectStoryDescription">{project.description}</p>

                  <div className="ProjectStoryArchitecture">
                    <span>architecture lens</span>
                    <code>{meta.architecture}</code>
                  </div>

                  <ul className="ProjectStoryTags" aria-label={project.name + ' technologies'}>
                    {project.techStacks.map((technology) => (
                      <li key={technology}>{technology}</li>
                    ))}
                  </ul>

                  <div className="ProjectStoryActions">
                    {project.liveDemo && (
                      <a href={project.liveDemo} target="_blank" rel="noopener noreferrer">
                        Open product <ArrowUpRight size={15} aria-hidden="true" />
                      </a>
                    )}

                    {project.github && (
                      <a href={project.github} target="_blank" rel="noopener noreferrer">
                        <FaGithub size={15} aria-hidden="true" /> Source
                      </a>
                    )}
                  </div>

                  <div className="ProjectStoryMobileVisual" aria-hidden="true">
                    <img
                      src={project.imageUrl}
                      alt=""
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ProjectStory
