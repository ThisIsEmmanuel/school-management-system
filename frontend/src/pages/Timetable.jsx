import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const hhmm = (v) => ((v || '').includes('T') ? v.slice(11, 16) : (v || '').slice(0, 5));

export default function Timetable() {
    const { auth } = useAuth();
    const isStaff = auth.user.role === 'admin' || auth.user.role === 'teacher';
    const [classes, setClasses] = useState([]);
    const [classId, setClassId] = useState('');
    const [entries, setEntries] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [form, setForm] = useState({ subject_id: '', day_of_week: 'Monday', start_time: '', end_time: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        if (isStaff) {
            api.getClasses(auth.token).then(setClasses).catch((e) => setError(e.message));
        } else {
            api.getMyProfile(auth.token)
                .then((p) => {
                    if (p.class_id) setClassId(String(p.class_id));
                    else setError('You have not been assigned to a class yet.');
                })
                .catch((e) => setError(e.message));
        }
    }, []);

    function loadEntries() {
        if (!classId) { setEntries([]); return; }
        api.getClassTimetable(auth.token, classId).then(setEntries).catch((e) => setError(e.message));
    }

    useEffect(() => {
        loadEntries();
        if (isStaff && classId) {
            api.getSubjects(auth.token, classId).then(setSubjects).catch(() => setSubjects([]));
        }
    }, [classId]);

    async function handleAdd(e) {
        e.preventDefault();
        setError('');
        try {
            await api.addTimetableEntry(auth.token, {
                class_id: Number(classId),
                subject_id: Number(form.subject_id),
                day_of_week: form.day_of_week,
                start_time: form.start_time,
                end_time: form.end_time
            });
            setForm({ ...form, start_time: '', end_time: '' });
            loadEntries();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <span className="eyebrow">Schedule</span>
                    <h1>Timetable</h1>
                </div>
            </div>

            {isStaff && (
                <div className="card">
                    <label style={{ marginTop: 0 }}>Class</label>
                    <select value={classId} onChange={(e) => setClassId(e.target.value)}>
                        <option value="">Select a class</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            )}

            {isStaff && classId && (
                <div className="card">
                    <h3 style={{ marginBottom: 6 }}>Add a period</h3>
                    {subjects.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                            This class has no subjects yet. Add some on the Classes page first.
                        </p>
                    ) : (
                        <form onSubmit={handleAdd}>
                            <label>Subject</label>
                            <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} required>
                                <option value="">Select a subject</option>
                                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>

                            <label>Day</label>
                            <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}>
                                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>

                            <label>Start time</label>
                            <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />

                            <label>End time</label>
                            <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />

                            <button type="submit">Add period</button>
                        </form>
                    )}
                </div>
            )}

            {error && <p className="error-text">{error}</p>}

            {classId && (
                <div className="card">
                    {entries.length === 0 ? (
                        <p className="empty-state">No periods scheduled yet.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr><th>Day</th><th>Time</th><th>Subject</th></tr>
                            </thead>
                            <tbody>
                                {entries.map((en) => (
                                    <tr key={en.id}>
                                        <td>{en.day_of_week}</td>
                                        <td className="admission-no">{hhmm(en.start_time)} – {hhmm(en.end_time)}</td>
                                        <td>{en.subject_name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </>
    );
}