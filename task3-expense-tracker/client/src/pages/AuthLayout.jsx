export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <div className="auth__panel">
        <div className="auth__brand">
          <img src="/favicon.svg" alt="" width="40" height="40" />
          <span>Expense Tracker</span>
        </div>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
        <p className="auth__footer">{footer}</p>
      </div>
      <div className="auth__art" aria-hidden="true">
        <div className="auth__art-card">
          <span>This month</span>
          <strong>+ $1,240.50</strong>
          <div className="auth__bars">
            {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
              <i key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <p>Track every dollar. See where your money goes. Build better habits.</p>
      </div>
    </div>
  );
}
