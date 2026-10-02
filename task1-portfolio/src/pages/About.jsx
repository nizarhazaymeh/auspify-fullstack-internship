import { Link } from 'react-router-dom';
import SkillBadge from '../components/SkillBadge.jsx';
import { profile, skills, timeline } from '../data/profile.js';
import '../styles/about.css';

export default function About() {
  return (
    <section className="section">
      <div className="container">
        <header className="page-head">
          <p className="eyebrow">About me</p>
          <h1 className="page-title">A little about who I am</h1>
        </header>

        <div className="about">
          <div className="about__avatar" aria-hidden="true">
            <span>{profile.initials}</span>
          </div>
          <div className="about__bio">
            {profile.bio.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <dl className="about__facts">
              <div>
                <dt>Location</dt>
                <dd>{profile.location}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${profile.email}`}>{profile.email}</a>
                </dd>
              </div>
              <div>
                <dt>Focus</dt>
                <dd>{profile.role}</dd>
              </div>
            </dl>
            <div className="hero__cta">
              <a href={profile.resumeUrl} className="btn btn--primary">
                Download résumé
              </a>
              <Link to="/contact" className="btn btn--ghost">
                Contact me
              </Link>
            </div>
          </div>
        </div>

        <h2 className="section__title section__title--spaced">Skills</h2>
        <div className="grid grid--4">
          {skills.map((g) => (
            <div key={g.group} className="skill-group">
              <h3>{g.group}</h3>
              <div className="skill-group__items">
                {g.items.map((s) => (
                  <SkillBadge key={s}>{s}</SkillBadge>
                ))}
              </div>
            </div>
          ))}
        </div>

        <h2 className="section__title section__title--spaced">Experience &amp; education</h2>
        <ol className="timeline">
          {timeline.map((t) => (
            <li key={t.title} className="timeline__item">
              <span className="timeline__period">{t.period}</span>
              <h3>{t.title}</h3>
              <p className="timeline__place">{t.place}</p>
              <p>{t.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
