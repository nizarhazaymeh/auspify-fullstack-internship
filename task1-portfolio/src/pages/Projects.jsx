import { useMemo, useState } from 'react';
import ProjectCard from '../components/ProjectCard.jsx';
import { projects } from '../data/profile.js';

const ALL = 'All';

export default function Projects() {
  const [filter, setFilter] = useState(ALL);
  const categories = useMemo(() => [ALL, ...new Set(projects.map((p) => p.category))], []);
  const visible = filter === ALL ? projects : projects.filter((p) => p.category === filter);

  return (
    <section className="section">
      <div className="container">
        <header className="page-head">
          <p className="eyebrow">Portfolio</p>
          <h1 className="page-title">Things I&apos;ve built</h1>
          <p className="page-lead">A selection of projects covering frontend, backend and full stack work.</p>
        </header>

        <div className="filters" role="group" aria-label="Filter projects by category">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${filter === c ? 'is-active' : ''}`}
              aria-pressed={filter === c}
              onClick={() => setFilter(c)}
            >
              {c}
              <span className="chip__count">
                {c === ALL ? projects.length : projects.filter((p) => p.category === c).length}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid--3">
          {visible.map((p) => (
            <ProjectCard key={p.title} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
