import SkillBadge from './SkillBadge.jsx';
import '../styles/projects.css';

const hues = { 'Full Stack': 245, Frontend: 190, Backend: 330 };

export default function ProjectCard({ project }) {
  const hue = hues[project.category] ?? 260;

  return (
    <article className="project-card">
      <div
        className="project-card__thumb"
        style={{ '--hue': hue }}
        aria-hidden="true"
      >
        <span>{project.title.split(' ').map((w) => w[0]).join('').slice(0, 3)}</span>
      </div>
      <div className="project-card__body">
        <p className="project-card__category">{project.category}</p>
        <h3 className="project-card__title">{project.title}</h3>
        <p className="project-card__desc">{project.description}</p>
        <div className="project-card__tags">
          {project.tags.map((t) => (
            <SkillBadge key={t}>{t}</SkillBadge>
          ))}
        </div>
        <div className="project-card__links">
          {project.github && (
            <a href={project.github} target="_blank" rel="noreferrer" className="link-arrow">
              Source code
            </a>
          )}
          {project.live && (
            <a href={project.live} target="_blank" rel="noreferrer" className="link-arrow">
              Live demo
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
