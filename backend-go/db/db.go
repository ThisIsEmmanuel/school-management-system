package db

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

// Connect opens the PostgreSQL connection pool using DATABASE_URL from the environment.
func Connect() {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		log.Fatal("DATABASE_URL is not set in your .env file")
	}

	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Failed to open database connection: ", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}

	log.Println("Connected to PostgreSQL")
}
