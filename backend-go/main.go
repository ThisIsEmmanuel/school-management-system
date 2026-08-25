package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"

	"schoolms/db"
	"schoolms/handlers"
	"schoolms/middleware"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on system environment variables")
	}

	db.Connect()
	defer db.DB.Close()

	r := mux.NewRouter()

	// Health check
	r.HandleFunc("/api/health", func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","message":"School Management System API is running"}`))
	}).Methods("GET")

	// Auth
	r.HandleFunc("/api/auth/register", middleware.Authorize(handlers.Register, "admin")).Methods("POST")
	r.HandleFunc("/api/auth/login", handlers.Login).Methods("POST")

	// Students
	r.HandleFunc("/api/students", middleware.Authorize(handlers.GetStudents, "admin", "teacher")).Methods("GET")
	r.HandleFunc("/api/students/me", middleware.Authorize(handlers.GetMyProfile, "student")).Methods("GET")
	r.HandleFunc("/api/students/{id}", middleware.Authenticate(handlers.GetStudent)).Methods("GET")
	r.HandleFunc("/api/students", middleware.Authorize(handlers.CreateStudent, "admin")).Methods("POST")
	r.HandleFunc("/api/students/{id}", middleware.Authorize(handlers.UpdateStudent, "admin")).Methods("PUT")
	r.HandleFunc("/api/students/{id}", middleware.Authorize(handlers.DeleteStudent, "admin")).Methods("DELETE")

	// Attendance
	r.HandleFunc("/api/attendance", middleware.Authorize(handlers.MarkAttendance, "admin", "teacher")).Methods("POST")
	r.HandleFunc("/api/attendance/class/{classId}", middleware.Authorize(handlers.GetClassAttendance, "admin", "teacher")).Methods("GET")
	r.HandleFunc("/api/attendance/student/{studentId}", middleware.Authenticate(handlers.GetStudentAttendance)).Methods("GET")

	// Grades
	r.HandleFunc("/api/grades", middleware.Authorize(handlers.AddGrade, "admin", "teacher")).Methods("POST")
	r.HandleFunc("/api/grades/student/{studentId}", middleware.Authenticate(handlers.GetStudentGrades)).Methods("GET")

	// Classes & subjects
	r.HandleFunc("/api/classes", middleware.Authenticate(handlers.GetClasses)).Methods("GET")
	r.HandleFunc("/api/classes", middleware.Authorize(handlers.CreateClass, "admin")).Methods("POST")
	r.HandleFunc("/api/classes/{id}/subjects", middleware.Authenticate(handlers.GetSubjects)).Methods("GET")
	r.HandleFunc("/api/classes/{id}/subjects", middleware.Authorize(handlers.CreateSubject, "admin", "teacher")).Methods("POST")

	// Timetable
	r.HandleFunc("/api/timetable/class/{classId}", middleware.Authenticate(handlers.GetClassTimetable)).Methods("GET")
	r.HandleFunc("/api/timetable", middleware.Authorize(handlers.CreateTimetableEntry, "admin", "teacher")).Methods("POST")

	// Announcements
	r.HandleFunc("/api/announcements", middleware.Authenticate(handlers.GetAnnouncements)).Methods("GET")
	r.HandleFunc("/api/announcements", middleware.Authorize(handlers.CreateAnnouncement, "admin")).Methods("POST")

	corsHandler := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	log.Printf("Server running on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, corsHandler.Handler(r)))
}
