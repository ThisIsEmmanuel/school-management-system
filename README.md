# Brightfield Academy — School Management System

A full-stack school management system built for a SIWES project: React frontend, Node/Express backend, PostgreSQL database, designed to deploy on a cloud provider (AWS/Azure/GCP).

## What's included
- **Auth**: JWT login, 3 roles (admin, teacher, student)
- **Students**: enroll, view, edit records
- **Attendance**: mark daily attendance per class
- **Grades**: teachers enter scores, students view their report card
- **Timetable**: class schedules
- **Announcements**: admin posts, everyone sees

## Project structure
```
school-management-system/
├── backend/          Express API
│   ├── config/        DB connection, schema.sql, seedAdmin.js
│   ├── middleware/     JWT auth
│   ├── routes/         auth, students, attendance, grades, classes, timetable, announcements
│   └── server.js
└── frontend/         React (Vite)
    └── src/
        ├── pages/       Login, Dashboard, Students, Attendance, Grades, Announcements, RegisterUser
        ├── api.js       API client
        └── AuthContext.jsx
```

## Part 1 — Run it locally first

### 1. Set up PostgreSQL
Install Postgres locally, or use Docker:
```bash
docker run --name school-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```
Create the database and load the schema:
```bash
createdb school_db
psql -d school_db -f backend/config/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# edit .env: set DATABASE_URL and a random JWT_SECRET
npm install
node config/seedAdmin.js      # creates the first admin login
npm run dev                    # starts on http://localhost:5000
```
Default admin login (change immediately): `admin@school.com` / `ChangeMe123!`

### 3. Frontend
```bash
cd frontend
cp .env.example .env           # points to http://localhost:5000/api
npm install
npm run dev                    # starts on http://localhost:5173
```

### 4. Try it out
1. Log in as admin.
2. Go to **Add user** → create a teacher and a student account.
3. Go to **Students** → **Add student** → link the student's user ID to a class.
4. Go to **Attendance** / **Grades** to try marking records.
5. Log out and log in as the student to see their own report card.

## Part 2 — Deploy to the cloud

This is the part your school wants to see. Recommended path on **AWS** (Azure/GCP equivalents noted):

| Piece | AWS service | Azure equivalent | GCP equivalent |
|---|---|---|---|
| Database | RDS (PostgreSQL) | Azure Database for PostgreSQL | Cloud SQL |
| Backend | Elastic Beanstalk or EC2 | App Service | App Engine / Cloud Run |
| Frontend | S3 + CloudFront | Static Web Apps | Cloud Storage + CDN |
| File storage (photos, etc.) | S3 bucket | Blob Storage | Cloud Storage |

### Suggested order of operations
1. **Database**: create a managed PostgreSQL instance (free tier available on AWS RDS for 12 months). Run `schema.sql` against it. Update `DATABASE_URL` in your backend `.env`.
2. **Backend**: deploy the `backend/` folder to Elastic Beanstalk (easiest) or an EC2 instance. Set environment variables (`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`) in the platform's config, not in a committed `.env` file.
3. **Frontend**: run `npm run build` in `frontend/` to produce a `dist/` folder, then upload it to an S3 bucket configured for static website hosting, with CloudFront in front for HTTPS and caching. Set `VITE_API_URL` to your deployed backend URL before building.
4. **Connect them**: update CORS in `backend/server.js` if you want to restrict it to your frontend's domain instead of allowing all origins.

### For your report/documentation
Include:
- An architecture diagram (frontend → load balancer → backend → database)
- Why you picked managed services (RDS vs self-hosting Postgres) — reliability, backups, less ops work
- A cost estimate for a small deployment (mention free-tier limits)
- What you'd add for production: HTTPS certs, environment secrets manager, automated backups, monitoring/alerts, rate limiting

## Security notes for your write-up
- Passwords are hashed with bcrypt, never stored in plain text
- JWT tokens expire after 8 hours
- Role-based access control on every sensitive route
- `.env` files are excluded from version control (see `.gitignore`) — never commit real credentials
