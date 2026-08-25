package handlers

import (
	"encoding/json"
	"net/http"

	"schoolms/db"
)

// GetAnnouncements lists announcements, newest first. Any authenticated user.
func GetAnnouncements(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(`
		SELECT a.id, a.title, a.body, a.created_at, u.full_name
		FROM announcements a
		LEFT JOIN users u ON a.posted_by = u.id
		ORDER BY a.created_at DESC
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error fetching announcements")
		return
	}
	defer rows.Close()

	type ann struct {
		ID        int     `json:"id"`
		Title     string  `json:"title"`
		Body      string  `json:"body"`
		CreatedAt string  `json:"created_at"`
		PostedBy  *string `json:"posted_by"`
	}
	results := []ann{}
	for rows.Next() {
		var a ann
		rows.Scan(&a.ID, &a.Title, &a.Body, &a.CreatedAt, &a.PostedBy)
		results = append(results, a)
	}
	writeJSON(w, http.StatusOK, results)
}

type createAnnouncementRequest struct {
	Title string `json:"title"`
	Body  string `json:"body"`
}

// CreateAnnouncement posts a new announcement. Admin only.
func CreateAnnouncement(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(ClaimsKey).(*Claims)

	var req createAnnouncementRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Title == "" || req.Body == "" {
		writeError(w, http.StatusBadRequest, "title and body are required")
		return
	}

	var id int
	err := db.DB.QueryRow(
		"INSERT INTO announcements (title, body, posted_by) VALUES ($1, $2, $3) RETURNING id",
		req.Title, req.Body, claims.UserID,
	).Scan(&id)

	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error posting announcement")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]int{"id": id})
}
