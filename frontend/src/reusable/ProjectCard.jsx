import { ArrowUpRight, Github } from 'lucide-react'

const ProjectCard = ({ project }) => {
  const {
    name,
    description,
    techStacks = [],
    github,
    liveDemo,
    imageUrl,
  } = project;

  const openDemo = () => {
    if (liveDemo) {
      window.open(liveDemo, "_blank", "noopener,noreferrer");
    }
  };

  const handleKeyDown = (event) => {
    if (!liveDemo) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDemo();
    }
  };

  return (
    <article
      className={"ProjectCard" + (liveDemo ? " clickable" : "")}
      onClick={liveDemo ? openDemo : undefined}
      onKeyDown={handleKeyDown}
      tabIndex={liveDemo ? 0 : undefined}
      role={liveDemo ? "link" : undefined}
      aria-label={liveDemo ? name + " — open live demo" : undefined}
    >
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
            <a
              href={liveDemo}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
            >
              Live demo <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          )}

          {github && (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
            >
              <Github size={15} aria-hidden="true" /> Source
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;
