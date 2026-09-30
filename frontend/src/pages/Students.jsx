import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Students() {
  const { auth } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    user_id: '', class_id: '', admission_no: '', date_of_birth: '', guardian_name: '', guardian_phone: ''
  });

  function loadStudents() {
    api.getStudents(auth.token).then(setStudents).catch((e) => setError(e.message));
  }

  useEffect(() => {
    loadStudents();
    api.getClasses(auth.token).then(setClasses).catch(() => { });
  }, []);
  async function handleDeleteStudent(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setError('');
    try {
      await api.deleteStudent(auth.token, id);
      loadStudents();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createStudent(auth.token, {
        ...form,
        user_id: Number(form.user_id),
        class_id: form.class_id ? Number(form.class_id) : null
      });
      setForm({ user_id: '', class_id: '', admission_no: '', date_of_birth: '', guardian_name: '', guardian_phone: '' });
      setShowForm(false);
      loadStudents();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Records</span>
          <h1>Students</h1>
        </div>
        {auth.user.role === 'admin' && (
          <button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'Add student'}</button>
        )}
      </div>

      {showForm && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 0 }}>
            First create a login for this student under <strong>Add user</strong> (role: student), then link their
            profile here using the user ID shown after creation.
          </p>
          <form onSubmit={handleCreate}>
            <label>User ID</label>
            <input value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required />

            <label>Admission number</label>
            <input value={form.admission_no} onChange={(e) => setForm({ ...form, admission_no: e.target.value })} required />

            <label>Class</label>
            <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
              <option value="">— none —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <label>Date of birth</label>
            <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />

            <label>Guardian name</label>
            <input value={form.guardian_name} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} />

            <label>Guardian phone</label>
            <input value={form.guardian_phone} onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })} />

            {error && <p className="error-text">{error}</p>}
            <button type="submit">Save student</button>
          </form>
        </div>
      )}

      <div className="card">
        {students.length === 0 ? (
          <p className="empty-state">No students enrolled yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Admission no.</th>
                <th>Class</th>
                <th>Guardian</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>{s.full_name}</td>
                  <td className="admission-no">{s.admission_no}</td>
                  <td>{s.class_name || '—'}</td>
                  <td>{s.guardian_name || '—'}</td>
                  <td>
                    {auth.user.role === 'admin' && (
                      <button
                        type="button"
                        className="danger"
                        style={{ marginTop: 0, padding: '5px 10px', fontSize: 12 }}
                        onClick={() => handleDeleteStudent(s.id, s.full_name)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>

              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
