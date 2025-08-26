package main

import (
	"log"
	"net/http"
	"os"

	apppkg "slack-bot/backend/internal/app"
	authpkg "slack-bot/backend/internal/auth"
	dbpkg "slack-bot/backend/internal/db"
	h "slack-bot/backend/internal/handlers"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	db, err := dbpkg.Open(dsn)
	if err != nil {
		log.Fatal(err)
	}
	app := apppkg.New(db)
	appWrapper := &h.App{DB: db}

	mux := http.NewServeMux()

	// Public invite flows
	mux.HandleFunc("/api/auth/invitations", h.GetInvitation(appWrapper))      // GET ?token=...
	mux.HandleFunc("/api/auth/accept-invite", h.PostAcceptInvite(appWrapper)) // POST

	// Me
	mux.Handle("/api/me", authpkg.WithAuth(app, http.HandlerFunc(h.GetMe(appWrapper))))
	mux.Handle("/api/logout", authpkg.WithAuth(app, http.HandlerFunc(h.PostLogout(appWrapper))))

	// Slack bind
	mux.Handle("/api/me/slack/start", authpkg.WithAuth(app, http.HandlerFunc(h.PostSlackStart(app))))
	mux.Handle("/api/me/slack/verify", authpkg.WithAuth(app, http.HandlerFunc(h.PostSlackVerify(app))))

	// Admin (OWNER only)
	mux.HandleFunc("/api/admin/invitations", h.PostAdminInvitations(appWrapper))
	mux.Handle("/api/admin/users", authpkg.RequireOwner(app, http.HandlerFunc(h.GetAdminUsers(appWrapper))))
	mux.Handle("/api/admin/users/patch", authpkg.RequireOwner(app, http.HandlerFunc(h.PatchAdminUser(appWrapper))))

	addr := ":8080"
	log.Printf("API listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
