package main

// Run this ONCE after setting up your database to create the first admin account.
// Usage: go run ./seed

import (
	"log"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"

	"schoolms/db"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on system environment variables")
	}

	db.Connect()
	defer db.DB.Close()

	fullName := "System Admin"
	email := "admin@school.com"
	password := "ChangeMe123!" // change this immediately after first login
	role := "admin"

	var existingID int
	err := db.DB.QueryRow("SELECT id FROM users WHERE email = $1", email).Scan(&existingID)
	if err == nil {
		log.Println("Admin already exists. Skipping.")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password: ", err)
	}

	_, err = db.DB.Exec(
		"INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
		fullName, email, string(hash), role,
	)
	if err != nil {
		log.Fatal("Failed to seed admin: ", err)
	}

	log.Println("Admin created:")
	log.Println("  email:", email)
	log.Println("  password:", password)
	log.Println("IMPORTANT: log in and change this password immediately.")
}
