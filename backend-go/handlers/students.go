package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"schoolms/db"
)

type Student struct {
	ID            int     `json:"id"`
	AdmissionNo   string  `json:"admission_no"`
	DateOfBirth   *string `json:"date_of_birth,omitempty"`
	PhotoURL      *string `json:"photo_url,omitempty"`
	GuardianName  *string `json:"guardian_name,omitempty"`
	GuardianPhone *string `json:"guardian_phone,omitempty"`
	FullName      string  `json:"full_name"`
	Email         string  `json:"email"`
	ClassName     *string `json:"class_name,omitempty"`
	UserID        int     `json:"user_id,omitempty"`
}

// GetStudents lists all students. Admin/teacher only.
func GetStudents(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(`
		SELECT s.id, s.admission_no, s.date_of_birth, s.photo_url,
		       s.guardian_name, s.guardian_phone, u.full_name, u.email, c.name
		FROM students s
		JOIN users u ON s.user_id = u.id
		LEFT JOIN classes c ON s.class_id = c.id
		ORDER BY u.full_name
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error fetching students")
		return
	}
	defer rows.Close()

	students := []Student{}
	for rows.Next() {
		var s Student
		rows.Scan(&s.ID, &s.AdmissionNo, &s.DateOfBirth, &s.PhotoURL, &s.GuardianName, &s.GuardianPhone, &s.FullName, &s.Email, &s.ClassName)
		students = append(students, s)
	}
	writeJSON(w, http.StatusOK, students)
}

// GetMyProfile returns the logged-in student's own record.
func GetMyProfile(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(ClaimsKey).(*Claims)

	var s Student
	err := db.DB.QueryRow(`
		SELECT s.id, s.admission_no, s.date_of_birth, s.photo_url, u.full_name, u.email, c.name
		FROM students s
		JOIN users u ON s.user_id = u.id
		LEFT JOIN classes c ON s.class_id = c.id
		WHERE s.user_id = $1
	`, claims.UserID).Scan(&s.ID, &s.AdmissionNo, &s.DateOfBirth, &s.PhotoURL, &s.FullName, &s.Email, &s.ClassName)

	if err != nil {
		writeError(w, http.StatusNotFound, "No student record linked to this account")
		return
	}
	writeJSON(w, http.StatusOK, s)
}

// GetStudent returns a single student's profile. Students may only view their own.
func GetStudent(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(ClaimsKey).(*Claims)
	id := mux.Vars(r)["id"]

	var s Student
	err := db.DB.QueryRow(`
		SELECT s.id, s.admission_no, s.date_of_birth, s.photo_url,
		       s.guardian_name, s.guardian_phone, s.user_id, u.full_name, u.email, c.name
		FROM students s
		JOIN users u ON s.user_id = u.id
		LEFT JOIN classes c ON s.class_id = c.id
		WHERE s.id = $1
	`, id).Scan(&s.ID, &s.AdmissionNo, &s.DateOfBirth, &s.PhotoURL, &s.GuardianName, &s.GuardianPhone, &s.UserID, &s.FullName, &s.Email, &s.ClassName)

	if err != nil {
		writeError(w, http.StatusNotFound, "Student not found")
		return
	}

	if claims.Role == "student" && claims.UserID != s.UserID {
		writeError(w, http.StatusForbidden, "You can only view your own record")
		return
	}

	writeJSON(w, http.StatusOK, s)
}

type createStudentRequest struct {
	UserID        int     `json:"user_id"`
	ClassID       *int    `json:"class_id"`
	AdmissionNo   string  `json:"admission_no"`
	DateOfBirth   *string `json:"date_of_birth"`
	GuardianName  *string `json:"guardian_name"`
	GuardianPhone *string `json:"guardian_phone"`
	PhotoURL      *string `json:"photo_url"`
}

// CreateStudent links a user account to a new student record. Admin only.
func CreateStudent(w http.ResponseWriter, r *http.Request) {
	var req createStudentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.UserID == 0 || req.AdmissionNo == "" {
		writeError(w, http.StatusBadRequest, "user_id and admission_no are required")
		return
	}

	var id int
	err := db.DB.QueryRow(`
		INSERT INTO students (user_id, class_id, admission_no, date_of_birth, guardian_name, guardian_phone, photo_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
	`, req.UserID, req.ClassID, req.AdmissionNo, req.DateOfBirth, req.GuardianName, req.GuardianPhone, req.PhotoURL).Scan(&id)

	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error creating student")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]int{"id": id})
}

// UpdateStudent updates editable fields on a student record. Admin only.
func UpdateStudent(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var req createStudentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	_, err := db.DB.Exec(`
		UPDATE students SET class_id = $1, guardian_name = $2, guardian_phone = $3, photo_url = $4
		WHERE id = $5
	`, req.ClassID, req.GuardianName, req.GuardianPhone, req.PhotoURL, id)

	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error updating student")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Student updated"})
}

// DeleteStudent removes a student record. Admin only.
func DeleteStudent(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	result, err := db.DB.Exec("DELETE FROM students WHERE id = $1", id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error deleting student")
		return
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		writeError(w, http.StatusNotFound, "Student not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Student deleted"})
}
