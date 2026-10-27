import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function MyAttendance() {
    const { auth } = useAuth();
    const [records, setRecords] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        api.getMyProfile(auth.token)
            .then((p) => api.getStudentAttendance(auth.token, p.id))
            .then(setRecords)
            .catch((e) => setError(e.message));
    }, []);

    const count = (status) => records.filter((r) => r.status === status).length;

    return (
        <>
            <div className="page-header">
                <div>
                    <span className="eyebrow">Record</span>
                    <h1>My attendance</h1>
                </div>
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="stat-row">
                <div className="stat"><div className="num">{count('present')}</div><div className="label">Present</div></div>
                <div className="stat"><div className="num">{count('late')}</div><div className="label">Late</div></div>
                <div className="stat"><div className="num">{count('absent')}</div><div className="label">Absent</div></div>
            </div>

            <div className="card">
                {records.length === 0 ? (
                    <p className="empty-state">No attendance recorded yet.</p>
                ) : (
                    <table>
                        <thead>
                            <tr><th>Date</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {records.map((r, i) => (
                                <tr key={i}>
                                    <td>{(r.date || '').slice(0, 10)}</td>
                                    <td><span className={'pill ' + r.status}>{r.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}