import { useState } from "react"
import initialProjects from "./data/initialproject"
import ProjectCard from "./reusable/ProjectCard"

const InfoSection = () => {
  const [projects] = useState(initialProjects);
  return (
    <div className='InfoSection'>
      <h1>Static Project Showcase</h1>
      <div className='ProjectCards'>
        {projects.map((p) => (
          <ProjectCard key={p._id} project={p} />
        ))}
      </div>
    </div>
  )
}

export default InfoSection