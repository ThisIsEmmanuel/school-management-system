import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Classes() {
    const { auth } = useAuth();
    const isAdmin = auth.user.role === 'admin';
    const [classes, setClasses] = useState([]);
    const [subjectsByClass, setSubjectsByClass] = useState({});
    const [newClassName, setNewClassName] = useState('');
    const [newSubject, setNewSubject] = useState({});
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    function loadClasses() {
        api.getClasses(auth.token).then(setClasses).catch((e) => setError(e.message));
    }

    useEffect(loadClasses, []);

    async function loadSubjects(classId) {
        try {
            const subjects = await api.getSubjects(auth.token, classId);
            setSubjectsByClass((prev) => ({ ...prev, [classId]: subjects }));
        } catch (e) {
            setError(e.message);
        }
    }

    useEffect(() => {
        classes.forEach((c) => loadSubjects(c.id));
    }, [classes]);

    async function handleCreateClass(e) {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            await api.createClass(auth.token, { name: newClassName });
            setMessage(`Class "${newClassName}" created.`);
            setNewClassName('');
            loadClasses();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDeleteClass(classId, className) {
        if (!window.confirm(`Delete "${className}"? This cannot be undone.`)) return;
        setError('');
        setMessage('');
        try {
            await api.deleteClass(auth.token, classId);
            loadClasses();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleAddSubject(classId) {
        const name = newSubject[classId];
        if (!name) return;
        setError('');
        try {
            await api.createSubject(auth.token, classId, name);
            setNewSubject({ ...newSubject, [classId]: '' });
            loadSubjects(classId);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <span className="eyebrow">Structure</span>
                    <h1>Classes</h1>
                </div>
            </div>

            {isAdmin && (
                <div className="card">
                    <h3 style={{ marginBottom: 14 }}>Create a class</h3>
                    <form onSubmit={handleCreateClass}>
                        <label>Class name</label>
                        <input
                            placeholder="e.g. SS2 Gold"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            required
                        />
                        {message && <p style={{ color: 'var(--success)', fontSize: 13, marginTop: 10 }}>{message}</p>}
                        <button type="submit">Create class</button>
                    </form>
                </div>
            )}

            {error && <p className="error-text">{error}</p>}

            {classes.length === 0 ? (
                <div className="card">
                    <p className="empty-state">
                        {isAdmin ? 'No classes yet. Create one above to get started.' : 'No classes have been created yet.'}
                    </p>
                </div>
            ) : (
                classes.map((c) => (
                    <div className="card" key={c.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3 style={{ marginBottom: 4 }}>{c.name}</h3>
                            {isAdmin && (
                                <button
                                    type="button"
                                    className="danger"
                                    style={{ marginTop: 0, padding: '6px 12px', fontSize: 13 }}
                                    onClick={() => handleDeleteClass(c.id, c.name)}
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 0, marginBottom: 14 }}>
                            {c.teacher_name ? `Teacher: ${c.teacher_name}` : 'No teacher assigned'}
                        </p>

                        <label style={{ marginTop: 0 }}>Subjects</label>
                        {(subjectsByClass[c.id] || []).length === 0 ? (
                            <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>No subjects added yet.</p>
                        ) : (
                            <ul style={{ margin: '6px 0 14px', paddingLeft: 18 }}>
                                {(subjectsByClass[c.id] || []).map((s) => (
                                    <li key={s.id} style={{ fontSize: 14 }}>{s.name}</li>
                                ))}
                            </ul>
                        )}

                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <input
                                    placeholder="e.g. Mathematics"
                                    value={newSubject[c.id] || ''}
                                    onChange={(e) => setNewSubject({ ...newSubject, [c.id]: e.target.value })}
                                />
                            </div>
                            <button
                                type="button"
                                className="secondary"
                                style={{ marginTop: 0 }}
                                onClick={() => handleAddSubject(c.id)}
                            >
                                Add subject
                            </button>
                        </div>
                    </div>
                ))
            )}
        </>
    );
}