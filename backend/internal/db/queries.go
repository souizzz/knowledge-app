package db

import (
	"context"
	"database/sql"
	"time"
)

// User represents a user in the system
type User struct {
	ID        string         `json:"id"`
	Name      string         `json:"name"`
	Email     string         `json:"email"`
	SlackID   sql.NullString `json:"slack_id"`
	Role      string         `json:"role"`
	IsActive  bool           `json:"is_active"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

// Session represents a user session
type Session struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	TokenHash []byte    `json:"token_hash"`
	ExpiresAt time.Time `json:"expires_at"`
}

// Invitation represents an invitation
type Invitation struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	Token     string    `json:"token"`
	CreatedAt time.Time `json:"created_at"`
}

// UserRow for admin list
type UserRow struct {
	ID        string
	Name      string
	Email     string
	Role      string
	SlackID   sql.NullString
	IsActive  bool
	CreatedAt time.Time
}

func GetUserByEmail(ctx context.Context, db *sql.DB, email string) (*User, error) {
	u := &User{}
	var slack sql.NullString
	err := db.QueryRowContext(ctx, `SELECT id,name,email,slack_id,role,is_active,created_at,updated_at FROM users WHERE email=$1`, email).
		Scan(&u.ID, &u.Name, &u.Email, &slack, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	u.SlackID = slack
	return u, nil
}

func UpdateUserRoleActive(ctx context.Context, db *sql.DB, id, role string, active bool) error {
	_, err := db.ExecContext(ctx, `UPDATE users SET role=$1, is_active=$2, updated_at=NOW() WHERE id=$3`, role, active, id)
	return err
}

func SetUserSlackID(ctx context.Context, db *sql.DB, id, slackID string) error {
	_, err := db.ExecContext(ctx, `UPDATE users SET slack_id=$1, updated_at=NOW() WHERE id=$2`, slackID, id)
	return err
}

// Sessions
func CreateSession(ctx context.Context, db *sql.DB, userID string, tokenHash []byte, expiresAt time.Time) (string, error) {
	var id string
	err := db.QueryRowContext(ctx, `INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1,$2,$3) RETURNING id`, userID, tokenHash, expiresAt).Scan(&id)
	return id, err
}

func GetSession(ctx context.Context, db *sql.DB, tokenHash []byte) (*Session, error) {
	s := &Session{}
	err := db.QueryRowContext(ctx, `SELECT id,user_id,token_hash,expires_at FROM sessions WHERE token_hash=$1 AND expires_at > NOW()`, tokenHash).
		Scan(&s.ID, &s.UserID, &s.TokenHash, &s.ExpiresAt)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func DeleteSessionByHash(ctx context.Context, db *sql.DB, tokenHash []byte) error {
	_, err := db.ExecContext(ctx, `DELETE FROM sessions WHERE token_hash=$1`, tokenHash)
	return err
}

// Admin: list users
func ListUsers(ctx context.Context, db *sql.DB) ([]UserRow, error) {
	rows, err := db.QueryContext(ctx, `SELECT id,name,email,slack_id,role,is_active,created_at FROM users ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []UserRow
	for rows.Next() {
		var r UserRow
		if err := rows.Scan(&r.ID, &r.Name, &r.Email, &r.SlackID, &r.Role, &r.IsActive, &r.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

// Invitations
func CreateInvitation(ctx context.Context, db *sql.DB, email, role, token string) error {
	_, err := db.ExecContext(ctx,
		`INSERT INTO invitations (email, role, token) VALUES ($1, $2, $3)`,
		email, role, token)
	return err
}

func GetInvitationByToken(ctx context.Context, db *sql.DB, token string) (*Invitation, error) {
	inv := &Invitation{}
	err := db.QueryRowContext(ctx,
		`SELECT id, email, role, token, created_at FROM invitations WHERE token = $1`,
		token).Scan(&inv.ID, &inv.Email, &inv.Role, &inv.Token, &inv.CreatedAt)
	if err != nil {
		return nil, err
	}
	return inv, nil
}

func DeleteInvitation(ctx context.Context, db *sql.DB, token string) error {
	_, err := db.ExecContext(ctx, `DELETE FROM invitations WHERE token = $1`, token)
	return err
}

func CreateUser(ctx context.Context, db *sql.DB, name, email, role string) (string, error) {
	var id string
	err := db.QueryRowContext(ctx,
		`INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING id`,
		name, email, role).Scan(&id)
	return id, err
}