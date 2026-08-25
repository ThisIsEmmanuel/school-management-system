# School Management System — Go Backend

This replaces the Node/Express backend with a Go equivalent. Same routes, same database schema, same JWT auth — just written in Go using `net/http`, `gorilla/mux`, `lib/pq`, and `golang-jwt`.

## Folder structure
```
backend-go/
├── main.go              entry point, all routes wired here
├── go.mod
├── .env.example
├── db/db.go              PostgreSQL connection
├── middleware/auth.go    JWT auth + role-based access control
├── handlers/             one file per resource (auth, students, attendance, grades, classes, timetable, announcements)
└── seed/seedAdmin.go     run once to create the first admin login
```

It uses the **same `schema.sql`** as before — if you already ran that against `school_db`, you don't need to redo it.

## Setup

### 1. Install Go
Download from https://go.dev/dl/ (Windows installer), run it, then confirm in a new Command Prompt:
```
go version
```

### 2. Configure environment
```
cd backend-go
copy .env.example .env
```
Edit `.env` in Notepad — same as before, set your real Postgres password:
```
PORT=5000
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/school_db?sslmode=disable
JWT_SECRET=some_long_random_string
```

### 3. Download dependencies
```
go mod tidy
```
This reads `go.mod`, fetches all the packages, and generates a `go.sum` lockfile. Needs internet access.

### 4. Seed the first admin
```
go run ./seed
```
Creates `admin@school.com` / `ChangeMe123!` — change the password after first login.

### 5. Run the server
```
go run main.go
```
You should see:
```
Connected to PostgreSQL
Server running on port 5000
```

Test it at `http://localhost:5000/api/health` — same response as before.

## API routes (identical to the Node version)
All routes are the same paths, methods, request/response shapes as documented in the original backend — so the frontend doesn't need any changes to talk to this version. Auth uses `Authorization: Bearer <token>` headers exactly as before.

## Building a standalone .exe (optional, for deployment)
```
go build -o school-api.exe main.go
```
This produces a single executable you can run directly (`.\school-api.exe`) without needing Go installed on the deployment machine — handy for deploying to a cloud VM.
