# Task 1 — Personal Portfolio Website

**Auspify Full Stack Development Internship · Task 1 (Easy)**

A responsive portfolio website that showcases personal information, skills, projects and contact details.

## Features
- **4 pages** — Home, About, Projects, Contact (client-side routing with React Router, plus a 404 page)
- **Responsive design** — mobile-first layout, hamburger navigation on small screens, fluid grids
- **Project showcase** — project cards with tech tags, source/demo links and category filters
- **Contact form** — inline validation (name, email format, message length), character counter, success/error states
- **Light / dark theme** — follows the system setting by default and remembers the visitor's choice
- **Accessible** — semantic HTML, keyboard-friendly navigation, visible focus states, reduced-motion support

## Tech stack
React 19 · React Router 7 · Vite · plain CSS (custom properties)

## Getting started
```bash
cd task1-portfolio
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## Personalizing
All content lives in **`src/data/profile.js`**: name, bio, skills, timeline, projects and social links. Edit that one file and the whole site updates.

## Contact form delivery
- By default, submitting the form opens the visitor's email client with the message pre-filled.
- To receive messages directly, create a free form at [formspree.io](https://formspree.io), copy `.env.example` to `.env` and set `VITE_FORMSPREE_ID`.

## Deployment
SPA routing configs are included for both hosts (`vercel.json` and `public/_redirects`).

**Vercel**
```bash
npm i -g vercel
vercel          # follow the prompts; framework preset: Vite
vercel --prod
```

**Netlify**
```bash
npm i -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

## Project structure
```
src/
├── data/profile.js      # all site content
├── components/          # Navbar, Footer, ProjectCard, SkillBadge, ThemeToggle
├── pages/               # Home, About, Projects, Contact, NotFound
└── styles/              # global tokens + per-section styles
```

## Screenshots
_Add screenshots of each page here for the submission._
