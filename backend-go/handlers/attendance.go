package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"schoolms/db"
)

type markAttendanceRequest struct {
	StudentID int    `json:"student_id"`
	ClassID   int    `json:"class_id"`
	Date      string `json:"date"`
	Status    string `json:"status"`
}

// MarkAttendance records or updates a student's attendance for a given day. Admin/teacher only.
func MarkAttendance(w http.ResponseWriter, r *http.Request) {
	var req markAttendanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.StudentID == 0 || req.ClassID == 0 || req.Date == "" || req.Status == "" {
		writeError(w, http.StatusBadRequest, "student_id, class_id, date, and status are required")
		return
	}

	_, err := db.DB.Exec(`
		INSERT INTO attendance (student_id, class_id, date, status)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (student_id, date) DO UPDATE SET status = EXCLUDED.status
	`, req.StudentID, req.ClassID, req.Date, req.Status)

	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error marking attendance")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"message": "Attendance saved"})
}

// GetClassAttendance returns attendance for a whole class on a given date (?date=YYYY-MM-DD).
func GetClassAttendance(w http.ResponseWriter, r *http.Request) {
	classID := mux.Vars(r)["classId"]
	date := r.URL.Query().Get("date")
	if date == "" {
		writeError(w, http.StatusBadRequest, "date query param is required")
		return
	}

	rows, err := db.DB.Query(`
		SELECT a.id, a.status, s.id, u.full_name
		FROM attendance a
		JOIN students s ON a.student_id = s.id
		JOIN users u ON s.user_id = u.id
		WHERE a.class_id = $1 AND a.date = $2
		ORDER BY u.full_name
	`, classID, date)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error fetching attendance")
		return
	}
	defer rows.Close()

	type record struct {
		ID        int    `json:"id"`
		Status    string `json:"status"`
		StudentID int    `json:"student_id"`
		FullName  string `json:"full_name"`
	}
	results := []record{}
	for rows.Next() {
		var rec record
		rows.Scan(&rec.ID, &rec.Status, &rec.StudentID, &rec.FullName)
		results = append(results, rec)
	}
	writeJSON(w, http.StatusOK, results)
}

// GetStudentAttendance returns a student's full attendance history.
func GetStudentAttendance(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(ClaimsKey).(*Claims)
	studentID := mux.Vars(r)["studentId"]

	if claims.Role == "student" {
		var ownerUserID int
		err := db.DB.QueryRow("SELECT user_id FROM students WHERE id = $1", studentID).Scan(&ownerUserID)
		if err != nil || ownerUserID != claims.UserID {
			writeError(w, http.StatusForbidden, "You can only view your own attendance")
			return
		}
	}

	rows, err := db.DB.Query("SELECT date, status FROM attendance WHERE student_id = $1 ORDER BY date DESC", studentID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error fetching attendance")
		return
	}
	defer rows.Close()

	type record struct {
		Date   string `json:"date"`
		Status string `json:"status"`
	}
	results := []record{}
	for rows.Next() {
		var rec record
		rows.Scan(&rec.Date, &rec.Status)
		results = append(results, rec)
	}
	writeJSON(w, http.StatusOK, results)
}
