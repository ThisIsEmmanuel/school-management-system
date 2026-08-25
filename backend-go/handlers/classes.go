package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"schoolms/db"
)

// GetClasses lists all classes. Any authenticated user.
func GetClasses(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(`
		SELECT c.id, c.name, u.full_name
		FROM classes c
		LEFT JOIN users u ON c.teacher_id = u.id
		ORDER BY c.name
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error fetching classes")
		return
	}
	defer rows.Close()

	type class struct {
		ID          int     `json:"id"`
		Name        string  `json:"name"`
		TeacherName *string `json:"teacher_name"`
	}
	results := []class{}
	for rows.Next() {
		var c class
		rows.Scan(&c.ID, &c.Name, &c.TeacherName)
		results = append(results, c)
	}
	writeJSON(w, http.StatusOK, results)
}

type createClassRequest struct {
	Name      string `json:"name"`
	TeacherID *int   `json:"teacher_id"`
}

// CreateClass adds a new class. Admin only.
func CreateClass(w http.ResponseWriter, r *http.Request) {
	var req createClassRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	var id int
	err := db.DB.QueryRow("INSERT INTO classes (name, teacher_id) VALUES ($1, $2) RETURNING id", req.Name, req.TeacherID).Scan(&id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error creating class")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]int{"id": id})
}

// GetSubjects lists subjects for a class. Any authenticated user.
func GetSubjects(w http.ResponseWriter, r *http.Request) {
	classID := mux.Vars(r)["id"]
	rows, err := db.DB.Query("SELECT id, name FROM subjects WHERE class_id = $1 ORDER BY name", classID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error fetching subjects")
		return
	}
	defer rows.Close()

	type subject struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
	}
	results := []subject{}
	for rows.Next() {
		var s subject
		rows.Scan(&s.ID, &s.Name)
		results = append(results, s)
	}
	writeJSON(w, http.StatusOK, results)
}

type createSubjectRequest struct {
	Name string `json:"name"`
}

// CreateSubject adds a subject to a class. Admin/teacher only.
func CreateSubject(w http.ResponseWriter, r *http.Request) {
	classID := mux.Vars(r)["id"]
	var req createSubjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	var id int
	err := db.DB.QueryRow("INSERT INTO subjects (name, class_id) VALUES ($1, $2) RETURNING id", req.Name, classID).Scan(&id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error adding subject")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]int{"id": id})
}
