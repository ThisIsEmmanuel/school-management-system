const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  register: (token, payload) => request('/auth/register', { method: 'POST', body: payload, token }),

  getStudents: (token) => request('/students', { token }),
  getMyProfile: (token) => request('/students/me', { token }),
  getStudent: (token, id) => request(`/students/${id}`, { token }),
  createStudent: (token, payload) => request('/students', { method: 'POST', body: payload, token }),
  updateStudent: (token, id, payload) => request(`/students/${id}`, { method: 'PUT', body: payload, token }),
  deleteStudent: (token, id) => request(`/students/${id}`, { method: 'DELETE', token }),

  getClasses: (token) => request('/classes', { token }),
  createClass: (token, payload) => request('/classes', { method: 'POST', body: payload, token }),
  getSubjects: (token, classId) => request(`/classes/${classId}/subjects`, { token }),
  createSubject: (token, classId, name) => request(`/classes/${classId}/subjects`, { method: 'POST', body: { name }, token }),
  deleteClass: (token, id) => request(`/classes/${id}`, { method: 'DELETE', token }),

  markAttendance: (token, payload) => request('/attendance', { method: 'POST', body: payload, token }),
  getClassAttendance: (token, classId, date) => request(`/attendance/class/${classId}?date=${date}`, { token }),
  getStudentAttendance: (token, studentId) => request(`/attendance/student/${studentId}`, { token }),

  addGrade: (token, payload) => request('/grades', { method: 'POST', body: payload, token }),
  getStudentGrades: (token, studentId, term) =>
    request(`/grades/student/${studentId}${term ? `?term=${encodeURIComponent(term)}` : ''}`, { token }),

  getAnnouncements: (token) => request('/announcements', { token }),
  postAnnouncement: (token, payload) => request('/announcements', { method: 'POST', body: payload, token })
};
