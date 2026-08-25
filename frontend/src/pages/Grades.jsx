import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Grades() {
  const { auth } = useAuth();
  const isStaff = auth.user.role === 'admin' || auth.user.role === 'teacher';
  return isStaff ? <StaffGradeEntry /> : <StudentReportCard />;
}

function StaffGradeEntry() {
  const { auth } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ student_id: '', class_id: '', subject_id: '', term: '', score: '', remark: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getStudents(auth.token).then(setStudents).catch(() => {});
    api.getClasses(auth.token).then(setClasses).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.class_id) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/classes/${form.class_id}/subjects`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
        .then((r) => r.json())
        .then(setSubjects)
        .catch(() => setSubjects([]));
    } else {
      setSubjects([]);
    }
  }, [form.class_id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.addGrade(auth.token, {
        student_id: Number(form.student_id),
        subject_id: Number(form.subject_id),
        term: form.term,
        score: Number(form.score),
        remark: form.remark
      });
      setMessage('Grade saved.');
      setForm({ ...form, score: '', remark: '' });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Assessment</span>
          <h1>Enter grades</h1>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <label>Class</label>
          <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value, subject_id: '' })}>
            <option value="">Select a class</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <label>Student</label>
          <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} required>
            <option value="">Select a student</option>
            {students
              .filter((s) => !form.class_id || s.class_name === classes.find((c) => String(c.id) === form.class_id)?.name)
              .map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>

          <label>Subject</label>
          <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} required>
            <option value="">Select a subject</option>
            {subjects.map((sub) => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
          </select>

          <label>Term</label>
          <input placeholder="e.g. 1st Term 2025/2026" value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} required />

          <label>Score (0–100)</label>
          <input type="number" min="0" max="100" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} required />

          <label>Remark</label>
          <input value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} placeholder="Optional" />

          {error && <p className="error-text">{error}</p>}
          {message && <p style={{ color: 'var(--success)', fontSize: 13, marginTop: 10 }}>{message}</p>}
          <button type="submit">Save grade</button>
        </form>
      </div>
    </>
  );
}

function StudentReportCard() {
  const { auth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [grades, setGrades] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMyProfile(auth.token)
      .then((p) => {
        setProfile(p);
        return api.getStudentGrades(auth.token, p.id);
      })
      .then(setGrades)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Report card</span>
          <h1>My grades</h1>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="card">
        {grades.length === 0 ? (
          <p className="empty-state">No grades recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Subject</th><th>Term</th><th>Score</th><th>Remark</th></tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g.id}>
                  <td>{g.subject_name}</td>
                  <td>{g.term}</td>
                  <td>{g.score}</td>
                  <td>{g.remark || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
