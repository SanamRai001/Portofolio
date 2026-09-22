import { Braces, DatabaseZap, Workflow } from 'lucide-react'
import initialProjects from "./data/initialproject"
import ProjectStory from './ProjectStory'

const identity = [
  {
    icon: DatabaseZap,
    title: "Backend first",
    text: "I care about contracts, data integrity, authentication, failure states, and what happens after the happy path."
  },
  {
    icon: Workflow,
    title: "Architecture minded",
    text: "I prefer clear boundaries and understandable flows over clever abstractions that make a project harder to maintain."
  },
  {
    icon: Braces,
    title: "Learn by shipping",
    text: "I turn unfamiliar ideas into working systems, inspect what breaks, and use the result to improve the next design."
  }
];

const InfoSection = () => {
  const selectedProjects = initialProjects.slice(0, 3);

  return (
    <section className="InfoSection" id="about" aria-labelledby="engineering-identity-title">
      <div className="SectionShell">
        <div className="SectionHeading SectionHeadingSplit">
          <div>
            <p className="SectionKicker">Engineering identity</p>
            <h2 id="engineering-identity-title">A builder who wants to understand the whole system.</h2>
          </div>
          <p>
            My strongest interest is backend work, but I treat product quality as an end-to-end responsibility: architecture, APIs, databases, security, interface clarity, and deployment behavior.
          </p>
        </div>

        <div className="IdentityGrid">
          {identity.map((item) => {
            const Icon = item.icon;
            return (
              <article className="IdentityCard" key={item.title}>
                <span className="IdentityIcon"><Icon size={19} aria-hidden="true" /></span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            )
          })}
        </div>

        <div className="SelectedWorkHeader">
          <div>
            <p className="SectionKicker">Selected work</p>
            <h2>Projects I use to learn real engineering trade-offs.</h2>
          </div>
          <p>
            Three builds, viewed as systems rather than thumbnails. The separate Core Projects section still comes from the live backend API.
          </p>
        </div>

        <ProjectStory projects={selectedProjects} />
      </div>
    </section>
  )
}

export default InfoSection
