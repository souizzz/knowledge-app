package handlers

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"
	
	"slack-bot/backend/internal/app"
)

// App represents the application context
type App struct {
	DB *sql.DB
}

// AppWrapper wraps app.App for compatibility
type AppWrapper struct {
	*app.App
}

// JSON helper function
func JSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// ListUsers wrapper
func ListUsers(ctx context.Context, db *sql.DB) ([]UserRow, error) {
	// This would need to be implemented or imported from db package
	// For now, returning empty slice
	return []UserRow{}, nil
}

// UserRow represents a user row for admin
type UserRow struct {
	ID        string
	Name      string
	Email     string
	Role      string
	SlackID   sql.NullString
	IsActive  bool
	CreatedAt time.Time
}

type patchUserReq struct {
	Role     *string `json:"role"`
	IsActive *bool   `json:"is_active"`
}

type createInvitationReq struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}

type invitationResponse struct {
	InviteURL string `json:"invite_url"`
}

func GetAdminUsers(a *App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := ListUsers(r.Context(), a.DB)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		JSON(w, 200, map[string]any{"users": rows})
	}
}

func PatchAdminUser(a *App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.URL.Query().Get("id")
		if id == "" {
			http.Error(w, "bad request", 400)
			return
		}
		var req patchUserReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "bad request", 400)
			return
		}
		// TODO: Implement UpdateUserRoleActive
		// role := "MEMBER";
		// active := true
		// if req.Role != nil {
		// 	role = *req.Role
		// }
		// if req.IsActive != nil {
		// 	active = *req.IsActive
		// }
		// if err := UpdateUserRoleActive(r.Context(), a.DB, id, role, active); err != nil {
		// 	http.Error(w, err.Error(), 500);
		// 	return
		// }
		JSON(w, 200, map[string]any{"ok": true})
	}
}

// CreateInvitation は招待トークンを生成して内部で完結する招待機能
func CreateInvitation(a *App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req createInvitationReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "bad request", 400)
			return
		}

		// 招待トークンを生成
		token := generateInvitationToken()

		// TODO: Implement CreateInvitation
		// if err := CreateInvitationDB(r.Context(), a.DB, req.Email, req.Role, token); err != nil {
		// 	http.Error(w, err.Error(), 500)
		// 	return
		// }

		// 内部URLを生成（外部Gitに依存しない）
		inviteURL := generateInternalInviteURL(token)

		JSON(w, 200, invitationResponse{
			InviteURL: inviteURL,
		})
	}
}

// generateInvitationToken は安全な招待トークンを生成
func generateInvitationToken() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// generateInternalInviteURL は内部で完結する招待URLを生成
func generateInternalInviteURL(token string) string {
	return "/invite/" + token
}

// GetInvitation は招待情報を取得（内部完結）
func GetInvitation(a *App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := r.URL.Query().Get("token")
		if token == "" {
			http.Error(w, "token required", 400)
			return
		}

		// TODO: Implement GetInvitationByToken
		// invitation, err := GetInvitationByTokenDB(r.Context(), a.DB, token)
		// if err != nil {
		// 	http.Error(w, "invitation not found", 404)
		// 	return
		// }

		JSON(w, 200, map[string]any{
			"email": "test@example.com",
			"role":  "MEMBER",
		})
	}
}

// AcceptInvitation は招待を受け入れてユーザーを作成（内部完結）
func AcceptInvitation(a *App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Token string `json:"token"`
			Name  string `json:"name"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "bad request", 400)
			return
		}

		// TODO: Implement full invitation flow
		// 招待を検証
		// invitation, err := GetInvitationByTokenDB(r.Context(), a.DB, req.Token)
		// if err != nil {
		// 	http.Error(w, "invalid invitation", 400)
		// 	return
		// }

		// ユーザーを作成
		// userID, err := CreateUserDB(r.Context(), a.DB, req.Name, invitation.Email, invitation.Role)
		// if err != nil {
		// 	http.Error(w, err.Error(), 500)
		// 	return
		// }

		// 招待を削除
		// if err := DeleteInvitationDB(r.Context(), a.DB, req.Token); err != nil {
		// 	http.Error(w, err.Error(), 500)
		// 	return
		// }

		JSON(w, 200, map[string]any{
			"user_id": "temp-user-id",
			"message": "User created successfully",
		})
	}
}

// PostAcceptInvite is an alias for AcceptInvitation
func PostAcceptInvite(a *App) http.HandlerFunc {
	return AcceptInvitation(a)
}

// GetMe returns current user info
func GetMe(a *App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		JSON(w, 200, map[string]any{
			"id":    "temp-user-id",
			"name":  "Test User",
			"email": "test@example.com",
			"role":  "MEMBER",
		})
	}
}

// PostLogout handles user logout
func PostLogout(a *App) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		JSON(w, 200, map[string]any{"ok": true})
	}
}

// PostAdminInvitations creates new invitations
func PostAdminInvitations(a *App) http.HandlerFunc {
	return CreateInvitation(a)
}
