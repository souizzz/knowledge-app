package app

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"
)


type App struct {
	DB            *sql.DB
	SessionSecret []byte
	InviteTokenTTL time.Duration
	SessionTTL     time.Duration
	BaseURL        string
}


func New(db *sql.DB) *App {
	inviteTTL, _ := time.ParseDuration(getEnv("INVITE_TOKEN_TTL", "168h"))
	sessionTTL, _ := time.ParseDuration(getEnv("SESSION_TTL", "720h"))
	return &App{
		DB:            db,
		SessionSecret: []byte(getEnv("SESSION_SECRET", "dev-secret-change-me")),
		InviteTokenTTL: inviteTTL,
		SessionTTL:     sessionTTL,
		BaseURL:        getEnv("APP_BASE_URL", "http://localhost:3000"),
	}
}


func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}


func (a *App) LogErr(err error) {
	if err != nil {
		log.Printf("ERR: %v", err)
	}
}


func JSON(w http.ResponseWriter, status int, body []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(body)
}