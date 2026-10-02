export default function StatCards({ stats }) {
  if (!stats) return null;
  const topCourse = stats.byCourse[0];
  const cards = [
    { label: 'Total students', value: stats.total },
    { label: 'Average GPA', value: stats.averageGpa?.toFixed(2) ?? '—' },
    { label: 'Courses', value: stats.byCourse.length },
    { label: 'Largest course', value: topCourse ? topCourse.course : '—', sub: topCourse ? `${topCourse.count} students` : '' },
  ];
  return (
    <ul className="stats">
      {cards.map((c) => (
        <li key={c.label} className="stat">
          <span className="stat__label">{c.label}</span>
          <strong className="stat__value">{c.value}</strong>
          {c.sub && <span className="stat__sub">{c.sub}</span>}
        </li>
      ))}
    </ul>
  );
}
