import React from 'react'

const ProjectCard = ({ project }) => {
  const { name, description, techStacks = [], github } = project;
  return (
    <div className='ProjectCard'>
      <h1>{name}</h1>
      <p>{description}</p>
      <ul>
        {techStacks.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
      <a href={github} target="_blank" rel="noopener noreferrer">
        View Code
      </a>
    </div>
  )
}

export default ProjectCard