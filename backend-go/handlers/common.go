package handlers

import "encoding/json"
import "net/http"

// Claims stored inside the JWT and attached to each authenticated request.
type Claims struct {
	UserID int    `json:"id"`
	Role   string `json:"role"`
	Email  string `json:"email"`
}

// contextKey avoids collisions when storing Claims in request context.
type contextKey string

const ClaimsKey contextKey = "claims"

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
