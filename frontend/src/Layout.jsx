import { useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function Layout() {
  const { auth, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sms_sidebar') === 'collapsed';
    } catch {
      return false;
    }
  });

  if (!auth) return <Navigate to="/login" replace />;

  const { user } = auth;

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sms_sidebar', next ? 'collapsed' : 'open');
      } catch { }
      return next;
    });
  }

  const links = [
    { to: '/', label: 'Dashboard', roles: ['admin', 'teacher', 'student'] },
    { to: '/students', label: 'Students', roles: ['admin', 'teacher'] },
    { to: '/classes', label: 'Classes', roles: ['admin', 'teacher'] },
    { to: '/attendance', label: 'Attendance', roles: ['admin', 'teacher'] },
    { to: '/grades', label: 'Grades', roles: ['admin', 'teacher', 'student'] },
    { to: '/announcements', label: 'Announcements', roles: ['admin', 'teacher', 'student'] },
    { to: '/register', label: 'Add user', roles: ['admin'] }
  ];

  return (
    <div className="app-shell">
      <aside className={'sidebar' + (collapsed ? ' collapsed' : '')}>
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-mark">BA</div>
            <div className="brand-name">Brightfield Academy</div>
            <div className="brand-sub">Student portal</div>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggleSidebar}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>

        <ul className="nav-list">
          {links
            .filter((l) => l.roles.includes(user.role))
            .map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === '/'}
                  title={l.label}
                  className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                >
                  <span className="nav-icon">{l.label[0]}</span>
                  <span className="nav-label">{l.label}</span>
                </NavLink>
              </li>
            ))}
        </ul>

        <div className="sidebar-footer">
          <div className="user-info">
            {user.full_name} ({user.role})
          </div>
          <button type="button" className="logout-btn" onClick={logout} title="Logout">
            {collapsed ? '↩' : 'Logout'}
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}