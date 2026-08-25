package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"schoolms/db"
)

type registerRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// tokenClaims mirrors middleware's jwtClaims shape so tokens created here parse correctly there.
type tokenClaims struct {
	UserID int    `json:"id"`
	Role   string `json:"role"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func generateToken(userID int, role, email string) (string, error) {
	claims := tokenClaims{
		UserID: userID,
		Role:   role,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(8 * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

// Register creates a new user account. Restricted to admins via middleware in main.go.
func Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.FullName == "" || req.Email == "" || req.Password == "" || req.Role == "" {
		writeError(w, http.StatusBadRequest, "full_name, email, password, and role are required")
		return
	}
	if req.Role != "admin" && req.Role != "teacher" && req.Role != "student" {
		writeError(w, http.StatusBadRequest, "role must be admin, teacher, or student")
		return
	}

	var existingID int
	err := db.DB.QueryRow("SELECT id FROM users WHERE email = $1", req.Email).Scan(&existingID)
	if err == nil {
		writeError(w, http.StatusConflict, "Email already registered")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error creating user")
		return
	}

	var id int
	err = db.DB.QueryRow(
		`INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id`,
		req.FullName, req.Email, string(hash), req.Role,
	).Scan(&id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error creating user")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"id": id, "full_name": req.FullName, "email": req.Email, "role": req.Role,
	})
}

// Login verifies credentials and returns a JWT.
func Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	var id int
	var fullName, passwordHash, role string
	err := db.DB.QueryRow(
		"SELECT id, full_name, password_hash, role FROM users WHERE email = $1", req.Email,
	).Scan(&id, &fullName, &passwordHash, &role)

	if err != nil {
		writeError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		writeError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	token, err := generateToken(id, role, req.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Server error logging in")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"token": token,
		"user": map[string]interface{}{
			"id": id, "full_name": fullName, "email": req.Email, "role": role,
		},
	})
}
