import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function RegisterUser() {
  const { auth } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCreated(null);
    try {
      const user = await api.register(auth.token, form);
      setCreated(user);
      setForm({ full_name: '', email: '', password: '', role: 'student' });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Access</span>
          <h1>Add user</h1>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <label>Full name</label>
          <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />

          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />

          <label>Temporary password</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />

          <label>Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>

          {error && <p className="error-text">{error}</p>}
          {created && (
            <p style={{ color: 'var(--success)', fontSize: 13, marginTop: 10 }}>
              Created user id <strong>{created.id}</strong> — {created.full_name}.
              {created.role === 'student' && ' Now go to Students → Add student to link their profile.'}
            </p>
          )}
          <button type="submit">Create account</button>
        </form>
      </div>
    </>
  );
}
