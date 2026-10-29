import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function ChangePassword() {
    const { auth } = useAuth();
    const [form, setForm] = useState({ current: '', next: '', confirm: '' });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setMessage('');

        if (form.next.length < 8) {
            setError('New password must be at least 8 characters.');
            return;
        }
        if (form.next !== form.confirm) {
            setError('The new passwords do not match.');
            return;
        }

        try {
            await api.changePassword(auth.token, form.current, form.next);
            setMessage('Password changed. Use the new one next time you sign in.');
            setForm({ current: '', next: '', confirm: '' });
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <span className="eyebrow">Account</span>
                    <h1>Change password</h1>
                </div>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <label style={{ marginTop: 0 }}>Current password</label>
                    <input
                        type="password"
                        value={form.current}
                        onChange={(e) => setForm({ ...form, current: e.target.value })}
                        required
                    />

                    <label>New password</label>
                    <input
                        type="password"
                        value={form.next}
                        onChange={(e) => setForm({ ...form, next: e.target.value })}
                        required
                    />

                    <label>Confirm new password</label>
                    <input
                        type="password"
                        value={form.confirm}
                        onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                        required
                    />

                    {error && <p className="error-text">{error}</p>}
                    {message && <p style={{ color: 'var(--success)', fontSize: 13, marginTop: 10 }}>{message}</p>}
                    <button type="submit">Update password</button>
                </form>
            </div>
        </>
    );
}