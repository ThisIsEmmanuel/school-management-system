-- School Management System Database Schema (PostgreSQL)

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,        -- e.g. "SS2 Gold"
    teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    admission_no VARCHAR(30) UNIQUE NOT NULL,
    date_of_birth DATE,
    photo_url VARCHAR(255),           -- points to a file in cloud storage (S3/Blob)
    guardian_name VARCHAR(150),
    guardian_phone VARCHAR(30)
);

CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    UNIQUE (student_id, date)
);

CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    term VARCHAR(20) NOT NULL,        -- e.g. "1st Term 2025/2026"
    score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    remark VARCHAR(100)
);

CREATE TABLE timetable (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL, -- Monday..Friday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    body TEXT NOT NULL,
    posted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX idx_attendance_class_date ON attendance(class_id, date);
CREATE INDEX idx_grades_student ON grades(student_id);
