package middleware

import (
	"context"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"schoolms/handlers"
)

// Authenticate verifies the JWT in the Authorization header and attaches claims to the request context.
func Authenticate(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			http.Error(w, `{"error":"No token provided"}`, http.StatusUnauthorized)
			return
		}

		tokenStr := strings.TrimPrefix(header, "Bearer ")
		claims := &handlers.Claims{}

		token, err := jwt.ParseWithClaims(tokenStr, &jwtClaims{}, func(t *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, `{"error":"Invalid or expired token"}`, http.StatusUnauthorized)
			return
		}

		c := token.Claims.(*jwtClaims)
		claims.UserID = c.UserID
		claims.Role = c.Role
		claims.Email = c.Email

		ctx := context.WithValue(r.Context(), handlers.ClaimsKey, claims)
		next(w, r.WithContext(ctx))
	}
}

// jwtClaims mirrors handlers.Claims but implements jwt.Claims for parsing.
type jwtClaims struct {
	UserID int    `json:"id"`
	Role   string `json:"role"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// Authorize restricts a route to specific roles, e.g. Authorize(handler, "admin", "teacher")
func Authorize(next http.HandlerFunc, allowedRoles ...string) http.HandlerFunc {
	return Authenticate(func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(handlers.ClaimsKey).(*handlers.Claims)
		allowed := false
		for _, role := range allowedRoles {
			if claims.Role == role {
				allowed = true
				break
			}
		}
		if !allowed {
			http.Error(w, `{"error":"You do not have permission to do this"}`, http.StatusForbidden)
			return
		}
		next(w, r)
	})
}
