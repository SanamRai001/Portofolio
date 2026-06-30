import React from 'react'

const ProjectCard = ({ project }) => {
  const { name, description, techStacks = [], github, liveDemo, imageUrl } = project;

  const handleCardClick = () => {
    if (liveDemo) {
      window.open(liveDemo, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      className={`ProjectCard ${liveDemo ? 'clickable' : ''}`}
      onClick={handleCardClick}
      role={liveDemo ? "button" : undefined}
      title={liveDemo ? "Click to view live demo" : undefined}
    >
      {imageUrl && (
        <img src={imageUrl} alt={name} className='ProjectImage' />
      )}
      <h1>{name}</h1>
      <p>{description}</p>
      <ul>
        {techStacks.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
      
        href={github}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        View Code
      </a>
    </div>
  )
}
export default ProjectCard