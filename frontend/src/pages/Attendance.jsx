import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

const STATUSES = ['present', 'absent', 'late'];

export default function Attendance() {
  const { auth } = useAuth();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getClasses(auth.token).then(setClasses).catch(() => {});
    api.getStudents(auth.token).then(setStudents).catch(() => {});
  }, []);

  const classStudents = students.filter((s) => String(s.class_name) && (!classId || matchesClass(s)));

  // students endpoint returns class_name not class_id, so filter loosely by matching selected class name
  function matchesClass(s) {
    const cls = classes.find((c) => String(c.id) === String(classId));
    return cls && s.class_name === cls.name;
  }

  async function saveAll() {
    setError('');
    setSavedMsg('');
    try {
      const entries = Object.entries(marks);
      for (const [studentId, status] of entries) {
        await api.markAttendance(auth.token, { student_id: Number(studentId), class_id: Number(classId), date, status });
      }
      setSavedMsg(`Saved attendance for ${entries.length} student(s).`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Daily record</span>
          <h1>Attendance</h1>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label>Class</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select a class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {classId && (
        <div className="card">
          {classStudents.length === 0 ? (
            <p className="empty-state">No students found in this class.</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map((s) => (
                    <tr key={s.id}>
                      <td>{s.full_name}</td>
                      <td>
                        <select
                          value={marks[s.id] || ''}
                          onChange={(e) => setMarks({ ...marks, [s.id]: e.target.value })}
                        >
                          <option value="">—</option>
                          {STATUSES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {error && <p className="error-text">{error}</p>}
              {savedMsg && <p style={{ color: 'var(--success)', fontSize: 13, marginTop: 12 }}>{savedMsg}</p>}
              <button onClick={saveAll}>Save attendance</button>
            </>
          )}
        </div>
      )}
    </>
  );
}
