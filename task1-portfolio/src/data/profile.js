// ─────────────────────────────────────────────────────────────
//  Edit this file to personalize the portfolio.
//  Everything shown on the site comes from here.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: 'Alex Doe',
  initials: 'AD',
  role: 'Full Stack Developer',
  tagline:
    'I build fast, accessible web applications with React, Node.js and modern databases.',
  location: 'Amman, Jordan',
  email: 'alex.doe@example.com',
  phone: '+962 7X XXX XXXX',
  resumeUrl: '#',
  available: true,
  bio: [
    "I'm a computer science student and aspiring full stack developer who enjoys turning ideas into clean, working products.",
    'I care about readable code, thoughtful UI, and shipping things people actually use. Right now I am sharpening my skills through the Auspify Full Stack Development Internship.',
  ],
  socials: [
    { label: 'GitHub', url: 'https://github.com/' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
    { label: 'Email', url: 'mailto:alex.doe@example.com' },
  ],
  stats: [
    { value: '10+', label: 'Projects built' },
    { value: '2+', label: 'Years coding' },
    { value: '8', label: 'Technologies' },
  ],
};

export const skills = [
  {
    group: 'Frontend',
    items: ['HTML5', 'CSS3', 'JavaScript (ES6+)', 'React', 'Responsive Design'],
  },
  {
    group: 'Backend',
    items: ['Node.js', 'Express.js', 'REST APIs', 'Authentication (JWT)'],
  },
  {
    group: 'Database',
    items: ['MongoDB', 'MySQL', 'Mongoose'],
  },
  {
    group: 'Tools',
    items: ['Git & GitHub', 'VS Code', 'Postman', 'Vite', 'Vercel / Netlify'],
  },
];

export const timeline = [
  {
    period: '2026',
    title: 'Full Stack Development Intern',
    place: 'Auspify Technologies',
    description:
      'Building real-world full stack projects: portfolio, student management system, and more.',
  },
  {
    period: '2023 – Present',
    title: 'B.Sc. Computer Science',
    place: 'University (placeholder)',
    description: 'Coursework in data structures, databases, web development and software engineering.',
  },
  {
    period: '2022',
    title: 'Started learning web development',
    place: 'Self-taught',
    description: 'HTML, CSS and JavaScript fundamentals, then React and Node.js.',
  },
];

export const projects = [
  {
    title: 'Student Management System',
    description:
      'Full stack CRUD app to add, update, delete and view student records with search, filters and pagination.',
    tags: ['React', 'Node.js', 'Express', 'MongoDB'],
    category: 'Full Stack',
    github: 'https://github.com/',
    live: '',
    featured: true,
  },
  {
    title: 'Personal Portfolio',
    description:
      'This responsive portfolio site with light/dark themes, project filtering and a validated contact form.',
    tags: ['React', 'CSS', 'Vite'],
    category: 'Frontend',
    github: 'https://github.com/',
    live: '',
    featured: true,
  },
  {
    title: 'Expense Tracker',
    description:
      'Track income and expenses with charts, monthly summaries and secure user authentication.',
    tags: ['React', 'Express', 'MongoDB', 'Chart.js'],
    category: 'Full Stack',
    github: 'https://github.com/',
    live: '',
    featured: true,
  },
  {
    title: 'Weather Dashboard',
    description:
      'Search any city to see current conditions and a 5-day forecast from a public weather API.',
    tags: ['JavaScript', 'REST API', 'CSS'],
    category: 'Frontend',
    github: 'https://github.com/',
    live: '',
  },
  {
    title: 'Task Manager API',
    description:
      'RESTful API with JWT authentication, input validation and role-based access to tasks.',
    tags: ['Node.js', 'Express', 'JWT', 'MySQL'],
    category: 'Backend',
    github: 'https://github.com/',
    live: '',
  },
  {
    title: 'Landing Page Clone',
    description:
      'Pixel-accurate, fully responsive recreation of a modern SaaS landing page using only HTML and CSS.',
    tags: ['HTML', 'CSS'],
    category: 'Frontend',
    github: 'https://github.com/',
    live: '',
  },
];
