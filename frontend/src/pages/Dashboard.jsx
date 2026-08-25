import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Dashboard() {
  const { auth } = useAuth();
  const [students, setStudents] = useState(null);
  const [classes, setClasses] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const isStaff = auth.user.role === 'admin' || auth.user.role === 'teacher';

  useEffect(() => {
    api.getAnnouncements(auth.token).then(setAnnouncements).catch(() => {});
    if (isStaff) {
      api.getStudents(auth.token).then(setStudents).catch(() => {});
      api.getClasses(auth.token).then(setClasses).catch(() => {});
    }
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Overview</span>
          <h1>Welcome back, {auth.user.full_name.split(' ')[0]}</h1>
        </div>
      </div>

      {isStaff && (
        <div className="stat-row">
          <div className="stat">
            <div className="num">{students ? students.length : '—'}</div>
            <div className="label">Enrolled students</div>
          </div>
          <div className="stat">
            <div className="num">{classes ? classes.length : '—'}</div>
            <div className="label">Active classes</div>
          </div>
          <div className="stat">
            <div className="num">{announcements.length}</div>
            <div className="label">Announcements</div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 14 }}>Latest announcements</h3>
        {announcements.length === 0 && <p className="empty-state">No announcements yet.</p>}
        {announcements.slice(0, 5).map((a) => (
          <div key={a.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
            <strong>{a.title}</strong>
            <p style={{ margin: '4px 0 0', color: 'var(--ink-soft)', fontSize: 14 }}>{a.body}</p>
            <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              — {a.posted_by || 'Admin'}, {new Date(a.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
