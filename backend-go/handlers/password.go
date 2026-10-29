package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"golang.org/x/crypto/bcrypt"
	"schoolms/db"
)

type changePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

// ChangePassword lets any logged-in user change their own password.
func ChangePassword(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(ClaimsKey).(*Claims)

	var req changePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.CurrentPassword == "" || req.NewPassword == "" {
		writeError(w, http.StatusBadRequest, "current_password and new_password are required")
		return
	}
	if len(req.NewPassword) < 8 {
		writeError(w, http.StatusBadRequest, "New password must be at least 8 characters")
		return
	}

	var currentHash string
	err := db.DB.QueryRow("SELECT password_hash FROM users WHERE id = $1", claims.UserID).Scan(&currentHash)
	if err != nil {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(req.CurrentPassword)); err != nil {
		writeError(w, http.StatusBadRequest, "Current password is incorrect")
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error changing password")
		return
	}

	if _, err := db.DB.Exec("UPDATE users SET password_hash = $1 WHERE id = $2", string(newHash), claims.UserID); err != nil {
		log.Println("ChangePassword error:", err)
		writeError(w, http.StatusInternalServerError, "Server error changing password")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Password changed"})
}