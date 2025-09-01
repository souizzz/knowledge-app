package security

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"regexp"
	"strings"
	"time"
)

// SecurityConfig はセキュリティ設定を管理
type SecurityConfig struct {
	JWTSecret      string
	SlackSecret    string
	OpenAIAPIKey   string
	DatabaseURL    string
	Environment    string
	AllowedOrigins []string
}

// ValidateSecurityConfig はセキュリティ設定を検証
func ValidateSecurityConfig() (*SecurityConfig, error) {
	config := &SecurityConfig{
		Environment: getEnv("ENVIRONMENT", "development"),
	}

	var errors []string

	// JWT秘密鍵の検証
	jwtSecret := getEnv("JWT_SECRET", "")
	if jwtSecret == "" {
		errors = append(errors, "JWT_SECRET is required")
	} else if jwtSecret == "please_change_me" {
		errors = append(errors, "JWT_SECRET must be changed from default value")
	} else if len(jwtSecret) < 32 {
		errors = append(errors, "JWT_SECRET must be at least 32 characters long")
	}
	config.JWTSecret = jwtSecret

	// Slack署名秘密鍵の検証
	slackSecret := getEnv("SLACK_SIGNING_SECRET", "")
	if slackSecret == "" {
		errors = append(errors, "SLACK_SIGNING_SECRET is required")
	} else if !strings.HasPrefix(slackSecret, "xoxb-") && !strings.HasPrefix(slackSecret, "xoxp-") {
		errors = append(errors, "SLACK_SIGNING_SECRET appears to be invalid format")
	}
	config.SlackSecret = slackSecret

	// OpenAI APIキーの検証
	openAIKey := getEnv("OPENAI_API_KEY", "")
	if openAIKey == "" {
		errors = append(errors, "OPENAI_API_KEY is required")
	} else if !strings.HasPrefix(openAIKey, "sk-") {
		errors = append(errors, "OPENAI_API_KEY appears to be invalid format")
	}
	config.OpenAIAPIKey = openAIKey

	// データベースURLの検証
	dbURL := getEnv("DATABASE_URL", "")
	if dbURL == "" {
		errors = append(errors, "DATABASE_URL is required")
	} else if !strings.Contains(dbURL, "postgres://") && !strings.Contains(dbURL, "postgresql://") {
		errors = append(errors, "DATABASE_URL must be a valid PostgreSQL connection string")
	}
	config.DatabaseURL = dbURL

	// 本番環境での追加検証
	if config.Environment == "production" {
		// HTTPSの強制
		if !strings.Contains(dbURL, "sslmode=require") {
			errors = append(errors, "DATABASE_URL must use SSL in production (sslmode=require)")
		}

		// 強力なJWT秘密鍵の要求
		if len(jwtSecret) < 64 {
			errors = append(errors, "JWT_SECRET must be at least 64 characters long in production")
		}
	}

	// 許可されたオリジンの設定
	config.AllowedOrigins = getAllowedOrigins()

	if len(errors) > 0 {
		return nil, fmt.Errorf("security validation failed: %s", strings.Join(errors, "; "))
	}

	return config, nil
}

// GenerateSecureJWTSecret は安全なJWT秘密鍵を生成
func GenerateSecureJWTSecret() (string, error) {
	bytes := make([]byte, 64) // 512ビット
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}

// ValidatePassword はパスワードの強度を検証
func ValidatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}

	if len(password) > 128 {
		return fmt.Errorf("password must be no more than 128 characters long")
	}

	// 文字種のチェック
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasDigit := regexp.MustCompile(`[0-9]`).MatchString(password)
	hasSpecial := regexp.MustCompile(`[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]`).MatchString(password)

	if !hasUpper {
		return fmt.Errorf("password must contain at least one uppercase letter")
	}
	if !hasLower {
		return fmt.Errorf("password must contain at least one lowercase letter")
	}
	if !hasDigit {
		return fmt.Errorf("password must contain at least one digit")
	}
	if !hasSpecial {
		return fmt.Errorf("password must contain at least one special character")
	}

	return nil
}

// ValidateEmail はメールアドレスの形式を検証
func ValidateEmail(email string) error {
	if email == "" {
		return fmt.Errorf("email is required")
	}

	// RFC 5322準拠の正規表現（簡略版）
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(email) {
		return fmt.Errorf("invalid email format")
	}

	// 長さのチェック
	if len(email) > 254 {
		return fmt.Errorf("email address is too long")
	}

	return nil
}

// SanitizeInput は入力文字列をサニタイズ
func SanitizeInput(input string) string {
	// HTMLタグの除去
	htmlRegex := regexp.MustCompile(`<[^>]*>`)
	sanitized := htmlRegex.ReplaceAllString(input, "")

	// 制御文字の除去
	controlRegex := regexp.MustCompile(`[\x00-\x1F\x7F]`)
	sanitized = controlRegex.ReplaceAllString(sanitized, "")

	// 前後の空白を除去
	sanitized = strings.TrimSpace(sanitized)

	return sanitized
}

// LogSecurityEvent はセキュリティイベントをログに記録
func LogSecurityEvent(event string, details map[string]interface{}) {
	timestamp := time.Now().UTC().Format(time.RFC3339)

	logEntry := fmt.Sprintf("[SECURITY] %s - %s", timestamp, event)

	for key, value := range details {
		// 機密情報はマスク
		if isSensitiveField(key) {
			value = maskSensitiveValue(fmt.Sprintf("%v", value))
		}
		logEntry += fmt.Sprintf(" %s=%v", key, value)
	}

	// セキュリティログファイルに書き込み（実装は環境に応じて調整）
	fmt.Println(logEntry)
}

// isSensitiveField は機密フィールドかどうかを判定
func isSensitiveField(field string) bool {
	sensitiveFields := []string{
		"password", "secret", "key", "token", "auth", "credential",
		"jwt", "api_key", "access_token", "refresh_token",
	}

	fieldLower := strings.ToLower(field)
	for _, sensitive := range sensitiveFields {
		if strings.Contains(fieldLower, sensitive) {
			return true
		}
	}
	return false
}

// maskSensitiveValue は機密値をマスク
func maskSensitiveValue(value string) string {
	if len(value) <= 8 {
		return "***"
	}
	return value[:4] + "***" + value[len(value)-4:]
}

// getAllowedOrigins は許可されたオリジンを取得
func getAllowedOrigins() []string {
	origins := []string{
		"http://localhost:3000",
		"http://localhost:3001",
	}

	// 環境変数から追加のオリジンを取得
	if customOrigins := getEnv("ALLOWED_ORIGINS", ""); customOrigins != "" {
		customList := strings.Split(customOrigins, ",")
		for _, origin := range customList {
			origin = strings.TrimSpace(origin)
			if origin != "" {
				origins = append(origins, origin)
			}
		}
	}

	return origins
}

// getEnv は環境変数を取得（デフォルト値付き）
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
