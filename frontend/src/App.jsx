import { Routes, Route } from 'react-router-dom';
import Layout from './Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import Classes from './pages/Classes.jsx';
import Timetable from './pages/Timetable.jsx';
import Attendance from './pages/Attendance.jsx';
import MyAttendance from './pages/MyAttendance.jsx';
import Grades from './pages/Grades.jsx';
import Announcements from './pages/Announcements.jsx';
import RegisterUser from './pages/RegisterUser.jsx';
import ChangePassword from './pages/ChangePassword.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/my-attendance" element={<MyAttendance />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/register" element={<RegisterUser />} />
        <Route path="/change-password" element={<ChangePassword />} />
      </Route>
    </Routes>
  );
}