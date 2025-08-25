package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"slack-bot/backend/internal/app"
	cryptopkg "slack-bot/backend/internal/crypto"
	dbpkg "slack-bot/backend/internal/db"
)

type ctxKey string

const userIDKey ctxKey = "uid"

func WithAuth(a *app.App, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie("session")
		if err != nil || c.Value == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		h := cryptopkg.Hash(c.Value)
		s, err := dbpkg.GetSession(r.Context(), a.DB, h)
		if err != nil || s.ExpiresAt.Before(time.Now()) {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), userIDKey, s.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RequireOwner(a *app.App, next http.Handler) http.Handler {
	return WithAuth(a, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// uid := r.Context().Value(userIDKey).(string)
		// TODO: Implement GetUserByID
		// u, err := dbpkg.GetUserByID(r.Context(), a.DB, uid)
		// if err != nil || u.Role != "OWNER" {
		// 	http.Error(w, "forbidden", http.StatusForbidden)
		// 	return
		// }
		next.ServeHTTP(w, r)
	}))
}

func CurrentUserID(r *http.Request) string {
	v := r.Context().Value(userIDKey)
	if v == nil {
		return ""
	}
	return v.(string)
}

func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
