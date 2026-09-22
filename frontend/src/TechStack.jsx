import { ArrowRight } from 'lucide-react'

const TechStack = () => {
  return (
    <section className="TechStack" aria-labelledby="architecture-title">
      <div className="SectionShell">
        <div className="SectionHeading SectionHeadingSplit">
          <div>
            <p className="SectionKicker">Technology + architecture</p>
            <h2 id="architecture-title">Tools are useful. System boundaries matter more.</h2>
          </div>
          <p>
            I use JavaScript and TypeScript across the stack, with Node.js APIs, React interfaces, relational and document databases, and the tooling needed to ship and observe the result.
          </p>
        </div>

        <div className="ArchitectureCards">
          <article>
            <span>01</span>
            <h3>Interface</h3>
            <p>React · Vite · Tailwind · accessible component patterns</p>
          </article>
          <ArrowRight className="ArchitectureArrow" aria-hidden="true" />
          <article>
            <span>02</span>
            <h3>API + domain</h3>
            <p>Node.js · Express · NestJS · REST · auth · validation</p>
          </article>
          <ArrowRight className="ArchitectureArrow" aria-hidden="true" />
          <article>
            <span>03</span>
            <h3>Data + runtime</h3>
            <p>MongoDB · MySQL · PostgreSQL · caching · logs · deployment</p>
          </article>
        </div>
      </div>
    </section>
  )
}

export default TechStack
