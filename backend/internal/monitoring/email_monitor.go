package monitoring

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"slack-bot/backend/internal/security"
)

// EmailEvent はメール送信イベントを表す
type EmailEvent struct {
	ID        string                 `json:"id"`
	Timestamp time.Time              `json:"timestamp"`
	EventType string                 `json:"event_type"`
	Email     string                 `json:"email"`
	Subject   string                 `json:"subject"`
	Status    string                 `json:"status"`
	Error     string                 `json:"error,omitempty"`
	Metadata  map[string]interface{} `json:"metadata"`
	IPAddress string                 `json:"ip_address,omitempty"`
	UserAgent string                 `json:"user_agent,omitempty"`
}

// EmailMetrics はメール送信のメトリクスを表す
type EmailMetrics struct {
	TotalSent      int64            `json:"total_sent"`
	TotalFailed    int64            `json:"total_failed"`
	SuccessRate    float64          `json:"success_rate"`
	AverageLatency time.Duration    `json:"average_latency"`
	Last24Hours    int64            `json:"last_24_hours"`
	LastHour       int64            `json:"last_hour"`
	ErrorsByType   map[string]int64 `json:"errors_by_type"`
	EmailsByDomain map[string]int64 `json:"emails_by_domain"`
	mu             sync.RWMutex
}

// EmailMonitor はメール送信を監視する
type EmailMonitor struct {
	events  []EmailEvent
	metrics EmailMetrics
	mu      sync.RWMutex
}

// NewEmailMonitor は新しいメール監視器を作成
func NewEmailMonitor() *EmailMonitor {
	monitor := &EmailMonitor{
		events: make([]EmailEvent, 0),
		metrics: EmailMetrics{
			ErrorsByType:   make(map[string]int64),
			EmailsByDomain: make(map[string]int64),
		},
	}

	// 定期的にメトリクスを更新
	go monitor.updateMetrics()

	return monitor
}

// LogEmailEvent はメール送信イベントをログに記録
func (em *EmailMonitor) LogEmailEvent(ctx context.Context, event EmailEvent) {
	em.mu.Lock()
	defer em.mu.Unlock()

	// イベントIDを生成
	if event.ID == "" {
		event.ID = generateEventID()
	}

	// タイムスタンプを設定
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	// イベントを記録
	em.events = append(em.events, event)

	// メトリクスを更新
	em.updateMetricsFromEvent(event)

	// セキュリティログに記録
	em.logSecurityEvent(event)

	// 構造化ログに記録
	em.logStructuredEvent(event)

	// 古いイベントをクリーンアップ（メモリ管理）
	em.cleanupOldEvents()
}

// GetMetrics は現在のメトリクスを取得
func (em *EmailMonitor) GetMetrics() EmailMetrics {
	em.metrics.mu.RLock()
	defer em.metrics.mu.RUnlock()

	return em.metrics
}

// GetRecentEvents は最近のイベントを取得
func (em *EmailMonitor) GetRecentEvents(limit int) []EmailEvent {
	em.mu.RLock()
	defer em.mu.RUnlock()

	if limit <= 0 || limit > len(em.events) {
		limit = len(em.events)
	}

	// 最新のイベントから取得
	start := len(em.events) - limit
	if start < 0 {
		start = 0
	}

	events := make([]EmailEvent, limit)
	copy(events, em.events[start:])

	return events
}

// GetEventsByStatus はステータス別のイベントを取得
func (em *EmailMonitor) GetEventsByStatus(status string) []EmailEvent {
	em.mu.RLock()
	defer em.mu.RUnlock()

	var filtered []EmailEvent
	for _, event := range em.events {
		if event.Status == status {
			filtered = append(filtered, event)
		}
	}

	return filtered
}

// GetEventsByEmail は特定のメールアドレスのイベントを取得
func (em *EmailMonitor) GetEventsByEmail(email string) []EmailEvent {
	em.mu.RLock()
	defer em.mu.RUnlock()

	var filtered []EmailEvent
	for _, event := range em.events {
		if event.Email == email {
			filtered = append(filtered, event)
		}
	}

	return filtered
}

// updateMetricsFromEvent はイベントからメトリクスを更新
func (em *EmailMonitor) updateMetricsFromEvent(event EmailEvent) {
	em.metrics.mu.Lock()
	defer em.metrics.mu.Unlock()

	// 送信数の更新
	if event.Status == "sent" || event.Status == "delivered" {
		em.metrics.TotalSent++
	} else if event.Status == "failed" || event.Status == "bounced" {
		em.metrics.TotalFailed++
	}

	// エラー種別の集計
	if event.Error != "" {
		em.metrics.ErrorsByType[event.Error]++
	}

	// ドメイン別の集計
	domain := extractDomain(event.Email)
	if domain != "" {
		em.metrics.EmailsByDomain[domain]++
	}

	// 成功率の計算
	total := em.metrics.TotalSent + em.metrics.TotalFailed
	if total > 0 {
		em.metrics.SuccessRate = float64(em.metrics.TotalSent) / float64(total) * 100
	}
}

// updateMetrics は定期的にメトリクスを更新
func (em *EmailMonitor) updateMetrics() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		em.mu.RLock()
		now := time.Now()

		// 過去24時間の送信数
		em.metrics.mu.Lock()
		em.metrics.Last24Hours = em.countEventsSince(now.Add(-24 * time.Hour))
		em.metrics.LastHour = em.countEventsSince(now.Add(-1 * time.Hour))
		em.metrics.mu.Unlock()

		em.mu.RUnlock()
	}
}

// countEventsSince は指定時刻以降のイベント数をカウント
func (em *EmailMonitor) countEventsSince(since time.Time) int64 {
	var count int64
	for _, event := range em.events {
		if event.Timestamp.After(since) && (event.Status == "sent" || event.Status == "delivered") {
			count++
		}
	}
	return count
}

// logSecurityEvent はセキュリティログに記録
func (em *EmailMonitor) logSecurityEvent(event EmailEvent) {
	details := map[string]interface{}{
		"event_id":   event.ID,
		"event_type": event.EventType,
		"email":      maskEmail(event.Email),
		"status":     event.Status,
		"ip_address": event.IPAddress,
	}

	if event.Error != "" {
		details["error"] = event.Error
	}

	security.LogSecurityEvent("email_event", details)
}

// logStructuredEvent は構造化ログに記録
func (em *EmailMonitor) logStructuredEvent(event EmailEvent) {
	logData := map[string]interface{}{
		"timestamp":  event.Timestamp.Format(time.RFC3339),
		"event_id":   event.ID,
		"event_type": event.EventType,
		"email":      maskEmail(event.Email),
		"subject":    event.Subject,
		"status":     event.Status,
		"ip_address": event.IPAddress,
		"user_agent": event.UserAgent,
	}

	if event.Error != "" {
		logData["error"] = event.Error
	}

	if len(event.Metadata) > 0 {
		logData["metadata"] = event.Metadata
	}

	jsonData, _ := json.Marshal(logData)
	log.Printf("[EMAIL] %s", string(jsonData))
}

// cleanupOldEvents は古いイベントをクリーンアップ
func (em *EmailMonitor) cleanupOldEvents() {
	// 7日以上古いイベントを削除
	cutoff := time.Now().Add(-7 * 24 * time.Hour)

	var filtered []EmailEvent
	for _, event := range em.events {
		if event.Timestamp.After(cutoff) {
			filtered = append(filtered, event)
		}
	}

	em.events = filtered
}

// generateEventID はイベントIDを生成
func generateEventID() string {
	return fmt.Sprintf("email_%d_%d", time.Now().Unix(), time.Now().UnixNano()%1000000)
}

// extractDomain はメールアドレスからドメインを抽出
func extractDomain(email string) string {
	for i := len(email) - 1; i >= 0; i-- {
		if email[i] == '@' {
			return email[i+1:]
		}
	}
	return ""
}

// maskEmail はメールアドレスをマスク
func maskEmail(email string) string {
	if email == "" {
		return ""
	}

	atIndex := -1
	for i, c := range email {
		if c == '@' {
			atIndex = i
			break
		}
	}

	if atIndex == -1 {
		return "***"
	}

	if atIndex <= 2 {
		return email[:atIndex] + "***@" + email[atIndex+1:]
	}

	return email[:2] + "***@" + email[atIndex+1:]
}

// グローバルなメール監視器
var GlobalEmailMonitor = NewEmailMonitor()

// LogEmailSent はメール送信成功をログ
func LogEmailSent(ctx context.Context, email, subject string, metadata map[string]interface{}) {
	event := EmailEvent{
		EventType: "email_sent",
		Email:     email,
		Subject:   subject,
		Status:    "sent",
		Metadata:  metadata,
	}

	GlobalEmailMonitor.LogEmailEvent(ctx, event)
}

// LogEmailFailed はメール送信失敗をログ
func LogEmailFailed(ctx context.Context, email, subject, error string, metadata map[string]interface{}) {
	event := EmailEvent{
		EventType: "email_failed",
		Email:     email,
		Subject:   subject,
		Status:    "failed",
		Error:     error,
		Metadata:  metadata,
	}

	GlobalEmailMonitor.LogEmailEvent(ctx, event)
}

// LogEmailDelivered はメール配信成功をログ
func LogEmailDelivered(ctx context.Context, email, subject string, metadata map[string]interface{}) {
	event := EmailEvent{
		EventType: "email_delivered",
		Email:     email,
		Subject:   subject,
		Status:    "delivered",
		Metadata:  metadata,
	}

	GlobalEmailMonitor.LogEmailEvent(ctx, event)
}

// LogEmailBounced はメールバウンスをログ
func LogEmailBounced(ctx context.Context, email, subject, reason string, metadata map[string]interface{}) {
	event := EmailEvent{
		EventType: "email_bounced",
		Email:     email,
		Subject:   subject,
		Status:    "bounced",
		Error:     reason,
		Metadata:  metadata,
	}

	GlobalEmailMonitor.LogEmailEvent(ctx, event)
}
