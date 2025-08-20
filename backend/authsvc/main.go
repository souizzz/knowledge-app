package main

import (
	"bufio"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

type config struct {
	DatabaseURL       string
	JWTSecret         string
	AccessTokenTTLMin int
	AppOrigin         string
	CookieDomain      string
	SMTPHost          string
	SMTPPort          int
	MailFrom          string
	PublicAppURL      string
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func loadConfig() config {
	ttl, _ := strconv.Atoi(getenv("ACCESS_TOKEN_TTL_MIN", "15"))
	smtpPort, _ := strconv.Atoi(getenv("SMTP_PORT", "1025"))
	return config{
		DatabaseURL:       getenv("DATABASE_URL", getenv("POSTGRES_DSN", "")),
		JWTSecret:         getenv("JWT_SECRET", "change_me"),
		AccessTokenTTLMin: ttl,
		AppOrigin:         getenv("APP_ORIGIN", "http://localhost:3000"),
		CookieDomain:      getenv("COOKIE_DOMAIN", "localhost"),
		SMTPHost:          getenv("SMTP_HOST", "localhost"),
		SMTPPort:          smtpPort,
		MailFrom:          getenv("MAIL_FROM", "Knowledge App <no-reply@local.test>"),
		PublicAppURL:      getenv("PUBLIC_APP_URL", "http://localhost:3000"),
	}
}

type server struct {
	cfg config
	db  *sql.DB
}

func main() {
	cfg := loadConfig()
	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL(or POSTGRES_DSN) is required")
	}
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}

	s := &server{cfg: cfg, db: db}

	mux := http.NewServeMux()

	// ミドルウェア：すべてのリクエストをログに記録
	logHandler := func(pattern string, handler http.HandlerFunc) {
		mux.HandleFunc(pattern, func(w http.ResponseWriter, r *http.Request) {
			log.Printf("[%s] %s %s from %s", pattern, r.Method, r.URL.Path, r.RemoteAddr)
			handler(w, r)
		})
	}

	logHandler("/auth/register", s.handleRegister)
	logHandler("/auth/verify-email", s.handleVerifyEmail)
	logHandler("/auth/login", s.handleLogin)
	logHandler("/auth/logout", s.handleLogout)
	logHandler("/auth/me", s.handleMe)
	logHandler("/healthz", func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(200); w.Write([]byte("ok")) })

	handler := withCORS(cfg.AppOrigin, mux)

	addr := ":8081"
	log.Printf("auth service listening %s", addr)
	log.Fatal(http.ListenAndServe(addr, handler))
}

// ---------- CORS ----------
func withCORS(origin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ---------- Helpers ----------
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
func badReq(w http.ResponseWriter, msg string) { writeJSON(w, 400, map[string]string{"error": msg}) }
func unauthorized(w http.ResponseWriter, msg string) {
	writeJSON(w, 401, map[string]string{"error": msg})
}

func hashPassword(pw string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(pw), 12)
	return string(b), err
}
func checkPassword(hash, pw string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(pw))
}

func sendMail(cfg config, to, subject, body string) error {
	addr := fmt.Sprintf("%s:%d", cfg.SMTPHost, cfg.SMTPPort)

	// 最もシンプルなメッセージフォーマット
	msg := []byte(fmt.Sprintf("To: %s\r\nSubject: %s\r\n\r\n%s", to, subject, body))

	log.Printf("🔧 SMTP Debug: connecting to %s", addr)
	log.Printf("🔧 From: '%s', To: '%s'", cfg.MailFrom, to)

	// NetCat風のシンプルなSMTP接続テスト
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		log.Printf("❌ Failed to connect to SMTP server: %v", err)
		return err
	}
	defer conn.Close()

	// SMTP基本コマンドを手動で送信
	commands := []string{
		"HELO localhost\r\n",
		fmt.Sprintf("MAIL FROM:<%s>\r\n", cfg.MailFrom),
		fmt.Sprintf("RCPT TO:<%s>\r\n", to),
		"DATA\r\n",
	}

	// 読み込み用バッファ
	reader := bufio.NewReader(conn)

	// 初期応答を読む
	response, _ := reader.ReadString('\n')
	log.Printf("🔧 Initial response: %s", strings.TrimSpace(response))

	for i, cmd := range commands {
		log.Printf("🔧 Sending: %s", strings.TrimSpace(cmd))
		conn.Write([]byte(cmd))

		response, _ := reader.ReadString('\n')
		log.Printf("🔧 Response %d: %s", i+1, strings.TrimSpace(response))
	}

	// メッセージ本文を送信
	conn.Write(msg)
	conn.Write([]byte("\r\n.\r\n"))

	// 最終応答
	response, _ = reader.ReadString('\n')
	log.Printf("🔧 Final response: %s", strings.TrimSpace(response))

	// QUIT
	conn.Write([]byte("QUIT\r\n"))
	response, _ = reader.ReadString('\n')
	log.Printf("🔧 Quit response: %s", strings.TrimSpace(response))

	log.Printf("✅ Manual SMTP send completed")
	return nil
}

// ---------- Models ----------
type user struct {
	ID            int64
	OrgID         int64
	Username      string
	Email         string
	PasswordHash  string
	EmailVerified bool
	Role          string
}

// ---------- Handlers ----------

// POST /auth/register
func (s *server) handleRegister(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received registration request from %s", r.RemoteAddr)
	if r.Method != http.MethodPost {
		log.Printf("Invalid method: %s", r.Method)
		badReq(w, "method_not_allowed")
		return
	}
	var req struct {
		OrganizationName   string `json:"organization_name"`
		RepresentativeName string `json:"representative_name"`
		Username           string `json:"username"`
		Email              string `json:"email"`
		Password           string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		badReq(w, "invalid_payload")
		return
	}
	log.Printf("Registration data: org=%s, user=%s, email=%s", req.OrganizationName, req.Username, req.Email)
	if req.OrganizationName == "" || req.RepresentativeName == "" || req.Username == "" || req.Email == "" || len(req.Password) < 8 {
		log.Printf("Validation failed: missing or weak fields")
		badReq(w, "missing_or_weak_fields")
		return
	}
	pwHash, _ := hashPassword(req.Password)

	ctx := r.Context()
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "tx_begin_failed"})
		return
	}
	defer tx.Rollback()

	var orgID int64
	if err := tx.QueryRowContext(ctx,
		`INSERT INTO organizations(name, representative_name) VALUES ($1,$2) RETURNING id`,
		req.OrganizationName, req.RepresentativeName,
	).Scan(&orgID); err != nil {
		writeJSON(w, 500, map[string]string{"error": "org_create_failed"})
		return
	}

	var userID int64
	if err := tx.QueryRowContext(ctx,
		`INSERT INTO users(org_id, username, email, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`,
		orgID, req.Username, strings.ToLower(req.Email), pwHash,
	).Scan(&userID); err != nil {
		writeJSON(w, 500, map[string]string{"error": "user_create_failed"})
		return
	}

	// email verification token
	raw := fmt.Sprintf("%d-%d-%d", time.Now().UnixNano(), userID, orgID)
	sum := sha256.Sum256([]byte(raw))
	tokenHash := hex.EncodeToString(sum[:])
	expires := time.Now().Add(24 * time.Hour)

	if _, err := tx.ExecContext(ctx,
		`INSERT INTO email_verification_tokens(user_id, token_hash, expires_at) VALUES ($1,$2,$3)`,
		userID, tokenHash, expires,
	); err != nil {
		writeJSON(w, 500, map[string]string{"error": "token_save_failed"})
		return
	}
	if err := tx.Commit(); err != nil {
		writeJSON(w, 500, map[string]string{"error": "tx_commit_failed"})
		return
	}

	verifyURL := s.cfg.PublicAppURL + "/verify-email?token=" + raw
	mailBody := "以下のURLをクリックしてメール認証を完了してください:\n\n" + verifyURL + "\n\n有効期限: 24時間"

	// シンプルなSMTP送信をテスト
	if err := sendMail(s.cfg, req.Email, "Verify your email", mailBody); err != nil {
		log.Printf("Failed to send verification email to %s: %v", req.Email, err)
		// メール送信失敗でも登録は成功として扱う
		log.Printf("=== Fallback: Email Verification Info ===")
		log.Printf("To: %s", req.Email)
		log.Printf("Subject: Verify your email")
		log.Printf("Verification URL: %s", verifyURL)
		log.Printf("==========================================")
	} else {
		log.Printf("✅ Verification email successfully sent to %s", req.Email)
	}

	writeJSON(w, 200, map[string]string{"status": "ok"})
}

// GET /auth/verify-email?token=RAW
func (s *server) handleVerifyEmail(w http.ResponseWriter, r *http.Request) {
	raw := r.URL.Query().Get("token")
	if raw == "" {
		badReq(w, "missing_token")
		return
	}
	sum := sha256.Sum256([]byte(raw))
	hash := hex.EncodeToString(sum[:])

	var tokID, userID int64
	var expires time.Time
	var consumed sql.NullTime
	row := s.db.QueryRowContext(r.Context(), `
		SELECT t.id, t.user_id, t.expires_at, t.consumed_at
		FROM email_verification_tokens t
		WHERE t.token_hash=$1`, hash)
	if err := row.Scan(&tokID, &userID, &expires, &consumed); err != nil {
		unauthorized(w, "invalid_token")
		return
	}
	if time.Now().After(expires) || (consumed.Valid) {
		unauthorized(w, "expired_or_used")
		return
	}
	tx, _ := s.db.BeginTx(r.Context(), nil)
	defer tx.Rollback()
	if _, err := tx.ExecContext(r.Context(), `UPDATE users SET email_verified=true WHERE id=$1`, userID); err != nil {
		writeJSON(w, 500, map[string]string{"error": "verify_failed"})
		return
	}
	if _, err := tx.ExecContext(r.Context(), `UPDATE email_verification_tokens SET consumed_at=now() WHERE id=$1`, tokID); err != nil {
		writeJSON(w, 500, map[string]string{"error": "consume_failed"})
		return
	}
	_ = tx.Commit()
	http.Redirect(w, r, s.cfg.PublicAppURL+"/verify-success", http.StatusFound)
}

// POST /auth/login
func (s *server) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		badReq(w, "method_not_allowed")
		return
	}
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		badReq(w, "invalid_payload")
		return
	}

	var u user
	row := s.db.QueryRowContext(r.Context(), `
		SELECT id, org_id, username, email, password_hash, email_verified, role
		FROM users WHERE username=$1`, req.Username)
	if err := row.Scan(&u.ID, &u.OrgID, &u.Username, &u.Email, &u.PasswordHash, &u.EmailVerified, &u.Role); err != nil {
		unauthorized(w, "invalid_credentials")
		return
	}
	if !u.EmailVerified {
		writeJSON(w, 403, map[string]string{"error": "email_not_verified"})
		return
	}
	if err := checkPassword(u.PasswordHash, req.Password); err != nil {
		unauthorized(w, "invalid_credentials")
		return
	}

	// issue JWT (cookie)
	now := time.Now()
	exp := now.Add(time.Duration(s.cfg.AccessTokenTTLMin) * time.Minute)
	claims := jwt.MapClaims{
		"sub":      strconv.FormatInt(u.ID, 10),
		"org_id":   u.OrgID,
		"role":     u.Role,
		"username": u.Username,
		"email":    u.Email, // ← 追加
		"iat":      now.Unix(),
		"exp":      exp.Unix(),
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": "token_issue_failed"})
		return
	}

	cookie := &http.Cookie{
		Name:     "access_token",
		Value:    signed,
		Path:     "/",
		Domain:   s.cfg.CookieDomain,
		HttpOnly: true,
		Secure:   false, // 本番は必ず true（HTTPS必須）
		SameSite: http.SameSiteLaxMode,
		Expires:  exp,
	}
	http.SetCookie(w, cookie)
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

// POST /auth/logout
func (s *server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		badReq(w, "method_not_allowed")
		return
	}

	cookie := &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		Domain:   s.cfg.CookieDomain,
		HttpOnly: true,
		Secure:   false, // 本番は true（HTTPS必須）
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
	}
	http.SetCookie(w, cookie)
	writeJSON(w, 200, map[string]string{"status": "logged_out"})
}

// GET /auth/me
func (s *server) handleMe(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie("access_token")
	if err != nil {
		unauthorized(w, "no_token")
		return
	}
	tok, err := jwt.Parse(c.Value, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("bad_alg")
		}
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil || !tok.Valid {
		unauthorized(w, "invalid_token")
		return
	}
	claims, _ := tok.Claims.(jwt.MapClaims)
	writeJSON(w, 200, claims)
}
