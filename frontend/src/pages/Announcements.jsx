import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Announcements() {
  const { auth } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: '', body: '' });
  const [error, setError] = useState('');

  function load() {
    api.getAnnouncements(auth.token).then(setAnnouncements).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.postAnnouncement(auth.token, form);
      setForm({ title: '', body: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Notices</span>
          <h1>Announcements</h1>
        </div>
      </div>

      {auth.user.role === 'admin' && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <label>Message</label>
            <textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
            {error && <p className="error-text">{error}</p>}
            <button type="submit">Post announcement</button>
          </form>
        </div>
      )}

      <div className="card">
        {announcements.length === 0 ? (
          <p className="empty-state">No announcements yet.</p>
        ) : (
          announcements.map((a) => (
            <div key={a.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
              <strong>{a.title}</strong>
              <p style={{ margin: '4px 0 0', color: 'var(--ink-soft)' }}>{a.body}</p>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                — {a.posted_by || 'Admin'}, {new Date(a.created_at).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
