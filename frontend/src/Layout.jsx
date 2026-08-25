import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function Layout() {
  const { auth, logout } = useAuth();

  if (!auth) return <Navigate to="/login" replace />;

  const { user } = auth;

  const links = [
    { to: '/', label: 'Dashboard', roles: ['admin', 'teacher', 'student'] },
    { to: '/students', label: 'Students', roles: ['admin', 'teacher'] },
    { to: '/attendance', label: 'Attendance', roles: ['admin', 'teacher'] },
    { to: '/grades', label: 'Grades', roles: ['admin', 'teacher', 'student'] },
    { to: '/announcements', label: 'Announcements', roles: ['admin', 'teacher', 'student'] },
    { to: '/register', label: 'Add user', roles: ['admin'] }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">BA</div>
          <div className="brand-name">Brightfield Academy</div>
          <div className="brand-sub">Student portal</div>
        </div>

        <ul className="nav-list">
          {links
            .filter((l) => l.roles.includes(user.role))
            .map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
        </ul>

        <div className="sidebar-footer">
          <div>{user.full_name}</div>
          <span className="role-badge">{user.role}</span>
          <div style={{ marginTop: 14 }}>
            <button className="secondary" style={{ marginTop: 0, width: '100%' }} onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
