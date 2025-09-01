package monitoring

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

// EmailMonitoringHandler はメール監視のAPIハンドラ
type EmailMonitoringHandler struct {
	monitor *EmailMonitor
}

// NewEmailMonitoringHandler は新しいハンドラを作成
func NewEmailMonitoringHandler() *EmailMonitoringHandler {
	return &EmailMonitoringHandler{
		monitor: GlobalEmailMonitor,
	}
}

// HandleGetMetrics はメトリクス取得のハンドラ
func (h *EmailMonitoringHandler) HandleGetMetrics(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	metrics := h.monitor.GetMetrics()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   true,
		"data":      metrics,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// HandleGetEvents はイベント取得のハンドラ
func (h *EmailMonitoringHandler) HandleGetEvents(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// クエリパラメータの取得
	limitStr := r.URL.Query().Get("limit")
	status := r.URL.Query().Get("status")
	email := r.URL.Query().Get("email")

	var events []EmailEvent

	if email != "" {
		events = h.monitor.GetEventsByEmail(email)
	} else if status != "" {
		events = h.monitor.GetEventsByStatus(status)
	} else {
		limit := 100 // デフォルト
		if limitStr != "" {
			if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
				limit = parsedLimit
			}
		}
		events = h.monitor.GetRecentEvents(limit)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   true,
		"data":      events,
		"count":     len(events),
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// HandleGetHealth はヘルスチェックのハンドラ
func (h *EmailMonitoringHandler) HandleGetHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	metrics := h.monitor.GetMetrics()

	// ヘルスチェックの判定
	health := "healthy"
	if metrics.SuccessRate < 90.0 && metrics.TotalSent > 10 {
		health = "degraded"
	}
	if metrics.SuccessRate < 70.0 && metrics.TotalSent > 10 {
		health = "unhealthy"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":       health,
		"success_rate": metrics.SuccessRate,
		"total_sent":   metrics.TotalSent,
		"total_failed": metrics.TotalFailed,
		"timestamp":    time.Now().Format(time.RFC3339),
	})
}

// HandleGetDashboard はダッシュボードデータのハンドラ
func (h *EmailMonitoringHandler) HandleGetDashboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	metrics := h.monitor.GetMetrics()
	recentEvents := h.monitor.GetRecentEvents(50)

	// ダッシュボード用のデータを構築
	dashboard := map[string]interface{}{
		"metrics":       metrics,
		"recent_events": recentEvents,
		"summary": map[string]interface{}{
			"total_emails":  metrics.TotalSent + metrics.TotalFailed,
			"success_rate":  metrics.SuccessRate,
			"last_24_hours": metrics.Last24Hours,
			"last_hour":     metrics.LastHour,
			"top_domains":   getTopDomains(metrics.EmailsByDomain, 5),
			"common_errors": getTopErrors(metrics.ErrorsByType, 5),
		},
		"timestamp": time.Now().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    dashboard,
	})
}

// getTopDomains は上位ドメインを取得
func getTopDomains(domains map[string]int64, limit int) []map[string]interface{} {
	type domainCount struct {
		domain string
		count  int64
	}

	var sorted []domainCount
	for domain, count := range domains {
		sorted = append(sorted, domainCount{domain, count})
	}

	// カウント順でソート（簡易実装）
	for i := 0; i < len(sorted)-1; i++ {
		for j := i + 1; j < len(sorted); j++ {
			if sorted[i].count < sorted[j].count {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}

	var result []map[string]interface{}
	for i, dc := range sorted {
		if i >= limit {
			break
		}
		result = append(result, map[string]interface{}{
			"domain": dc.domain,
			"count":  dc.count,
		})
	}

	return result
}

// getTopErrors は上位エラーを取得
func getTopErrors(errors map[string]int64, limit int) []map[string]interface{} {
	type errorCount struct {
		error string
		count int64
	}

	var sorted []errorCount
	for err, count := range errors {
		sorted = append(sorted, errorCount{err, count})
	}

	// カウント順でソート（簡易実装）
	for i := 0; i < len(sorted)-1; i++ {
		for j := i + 1; j < len(sorted); j++ {
			if sorted[i].count < sorted[j].count {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}

	var result []map[string]interface{}
	for i, ec := range sorted {
		if i >= limit {
			break
		}
		result = append(result, map[string]interface{}{
			"error": ec.error,
			"count": ec.count,
		})
	}

	return result
}
