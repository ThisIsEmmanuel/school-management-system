package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"schoolms/db"
)

type addGradeRequest struct {
	StudentID int     `json:"student_id"`
	SubjectID int     `json:"subject_id"`
	Term      string  `json:"term"`
	Score     float64 `json:"score"`
	Remark    *string `json:"remark"`
}

// AddGrade records a score for a student in a subject/term. Admin/teacher only.
func AddGrade(w http.ResponseWriter, r *http.Request) {
	var req addGradeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.StudentID == 0 || req.SubjectID == 0 || req.Term == "" {
		writeError(w, http.StatusBadRequest, "student_id, subject_id, term, and score are required")
		return
	}
	if req.Score < 0 || req.Score > 100 {
		writeError(w, http.StatusBadRequest, "score must be between 0 and 100")
		return
	}

	_, err := db.DB.Exec(`
		INSERT INTO grades (student_id, subject_id, term, score, remark)
		VALUES ($1, $2, $3, $4, $5)
	`, req.StudentID, req.SubjectID, req.Term, req.Score, req.Remark)

	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error saving grade")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"message": "Grade saved"})
}

// GetStudentGrades returns a student's report card, optionally filtered by ?term=
func GetStudentGrades(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(ClaimsKey).(*Claims)
	studentID := mux.Vars(r)["studentId"]
	term := r.URL.Query().Get("term")

	if claims.Role == "student" {
		var ownerUserID int
		err := db.DB.QueryRow("SELECT user_id FROM students WHERE id = $1", studentID).Scan(&ownerUserID)
		if err != nil || ownerUserID != claims.UserID {
			writeError(w, http.StatusForbidden, "You can only view your own grades")
			return
		}
	}

	query := `
		SELECT g.id, g.score, g.remark, g.term, sub.name
		FROM grades g
		JOIN subjects sub ON g.subject_id = sub.id
		WHERE g.student_id = $1
	`
	args := []interface{}{studentID}
	if term != "" {
		query += " AND g.term = $2"
		args = append(args, term)
	}
	query += " ORDER BY sub.name"

	rows, err := db.DB.Query(query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error fetching grades")
		return
	}
	defer rows.Close()

	type record struct {
		ID          int     `json:"id"`
		Score       float64 `json:"score"`
		Remark      *string `json:"remark"`
		Term        string  `json:"term"`
		SubjectName string  `json:"subject_name"`
	}
	results := []record{}
	for rows.Next() {
		var rec record
		rows.Scan(&rec.ID, &rec.Score, &rec.Remark, &rec.Term, &rec.SubjectName)
		results = append(results, rec)
	}
	writeJSON(w, http.StatusOK, results)
}
