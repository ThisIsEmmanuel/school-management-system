package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"schoolms/db"
)

// GetClassTimetable returns the weekly schedule for a class.
func GetClassTimetable(w http.ResponseWriter, r *http.Request) {
	classID := mux.Vars(r)["classId"]
	rows, err := db.DB.Query(`
		SELECT t.id, t.day_of_week, t.start_time, t.end_time, sub.name
		FROM timetable t
		JOIN subjects sub ON t.subject_id = sub.id
		WHERE t.class_id = $1
		ORDER BY
			array_position(ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday'], t.day_of_week),
			t.start_time
	`, classID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error fetching timetable")
		return
	}
	defer rows.Close()

	type entry struct {
		ID          int    `json:"id"`
		DayOfWeek   string `json:"day_of_week"`
		StartTime   string `json:"start_time"`
		EndTime     string `json:"end_time"`
		SubjectName string `json:"subject_name"`
	}
	results := []entry{}
	for rows.Next() {
		var e entry
		rows.Scan(&e.ID, &e.DayOfWeek, &e.StartTime, &e.EndTime, &e.SubjectName)
		results = append(results, e)
	}
	writeJSON(w, http.StatusOK, results)
}

type createTimetableRequest struct {
	ClassID   int    `json:"class_id"`
	SubjectID int    `json:"subject_id"`
	DayOfWeek string `json:"day_of_week"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}

// CreateTimetableEntry adds a period to a class's schedule. Admin/teacher only.
func CreateTimetableEntry(w http.ResponseWriter, r *http.Request) {
	var req createTimetableRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.ClassID == 0 || req.SubjectID == 0 || req.DayOfWeek == "" || req.StartTime == "" || req.EndTime == "" {
		writeError(w, http.StatusBadRequest, "class_id, subject_id, day_of_week, start_time, and end_time are required")
		return
	}

	var id int
	err := db.DB.QueryRow(`
		INSERT INTO timetable (class_id, subject_id, day_of_week, start_time, end_time)
		VALUES ($1, $2, $3, $4, $5) RETURNING id
	`, req.ClassID, req.SubjectID, req.DayOfWeek, req.StartTime, req.EndTime).Scan(&id)

	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error adding timetable entry")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]int{"id": id})
}
