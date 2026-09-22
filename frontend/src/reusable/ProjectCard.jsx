import { ArrowUpRight } from 'lucide-react'
import { FaGithub } from 'react-icons/fa'

const ProjectCard = ({ project }) => {
  const {
    name,
    description,
    techStacks = [],
    github,
    liveDemo,
    imageUrl,
  } = project;

  return (
    <article className="ProjectCard">
      <div className="ProjectVisual">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="ProjectImage"
            loading="lazy"
            onError={(event) => { event.currentTarget.style.display = "none"; }}
          />
        ) : null}
        <span className="ProjectVisualLabel">case / build</span>
      </div>

      <div className="ProjectBody">
        <div>
          <h3>{name}</h3>
          <p>{description}</p>
        </div>

        <ul className="ProjectTags" aria-label={name + " technologies"}>
          {techStacks.map((technology) => (
            <li key={technology}>{technology}</li>
          ))}
        </ul>

        <div className="ProjectActions">
          {liveDemo && (
            <a href={liveDemo} target="_blank" rel="noopener noreferrer">
              Live demo <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          )}

          {github && (
            <a href={github} target="_blank" rel="noopener noreferrer">
              <FaGithub size={15} aria-hidden="true" /> Source
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;
