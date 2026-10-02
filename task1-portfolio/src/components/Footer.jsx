import { profile } from '../data/profile.js';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p>
          © {new Date().getFullYear()} {profile.name}. Built with React.
        </p>
        <ul className="footer__socials">
          {profile.socials.map((s) => (
            <li key={s.label}>
              <a href={s.url} target={s.url.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
