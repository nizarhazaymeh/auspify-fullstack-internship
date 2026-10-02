import { Link } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard.jsx';
import { profile, projects, skills } from '../data/profile.js';
import '../styles/home.css';

export default function Home() {
  const featured = projects.filter((p) => p.featured).slice(0, 3);
  const topSkills = skills.flatMap((g) => g.items).slice(0, 10);

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__text">
            {profile.available && (
              <p className="hero__status">
                <span className="dot" aria-hidden="true" /> Open to internships &amp; junior roles
              </p>
            )}
            <h1 className="hero__title">
              Hi, I&apos;m <span className="gradient-text">{profile.name}</span>
              <br />
              {profile.role}.
            </h1>
            <p className="hero__tagline">{profile.tagline}</p>
            <div className="hero__cta">
              <Link to="/projects" className="btn btn--primary">
                View my work
              </Link>
              <Link to="/contact" className="btn btn--ghost">
                Get in touch
              </Link>
            </div>
          </div>

          <div className="hero__visual" aria-hidden="true">
            <div className="code-card">
              <div className="code-card__bar">
                <span /> <span /> <span />
              </div>
              <pre>
                <code>
                  <span className="tk-k">const</span> developer = {'{\n'}
                  {'  '}name: <span className="tk-s">&apos;{profile.name}&apos;</span>,{'\n'}
                  {'  '}role: <span className="tk-s">&apos;{profile.role}&apos;</span>,{'\n'}
                  {'  '}stack: [<span className="tk-s">&apos;React&apos;</span>, <span className="tk-s">&apos;Node&apos;</span>, <span className="tk-s">&apos;MongoDB&apos;</span>],{'\n'}
                  {'  '}learning: <span className="tk-b">true</span>,{'\n'}
                  {'}'};
                </code>
              </pre>
            </div>
          </div>
        </div>

        <div className="container">
          <ul className="stats">
            {profile.stats.map((s) => (
              <li key={s.label} className="stats__item">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2 className="section__title">Featured projects</h2>
            <Link to="/projects" className="link-arrow">
              All projects
            </Link>
          </div>
          <div className="grid grid--3">
            {featured.map((p) => (
              <ProjectCard key={p.title} project={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <h2 className="section__title">Tech I work with</h2>
          <ul className="marquee">
            {topSkills.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <div className="cta-band">
            <h3>Have a project in mind?</h3>
            <p>I&apos;m always happy to talk about new ideas and opportunities.</p>
            <Link to="/contact" className="btn btn--primary">
              Let&apos;s talk
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
