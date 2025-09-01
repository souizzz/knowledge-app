"use client";

import { useState, useEffect } from "react";

interface EmailMetrics {
  total_sent: number;
  total_failed: number;
  success_rate: number;
  last_24_hours: number;
  last_hour: number;
  errors_by_type: Record<string, number>;
  emails_by_domain: Record<string, number>;
}

interface EmailEvent {
  id: string;
  timestamp: string;
  event_type: string;
  email: string;
  subject: string;
  status: string;
  error?: string;
  metadata: Record<string, any>;
}

interface DashboardData {
  metrics: EmailMetrics;
  recent_events: EmailEvent[];
  summary: {
    total_emails: number;
    success_rate: number;
    last_24_hours: number;
    last_hour: number;
    top_domains: Array<{ domain: string; count: number }>;
    common_errors: Array<{ error: string; count: number }>;
  };
}

export default function EmailMonitoringPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 実際のAPIエンドポイントに置き換え
      const response = await fetch('/api/monitoring/dashboard');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setDashboardData(data.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // 30秒ごとにデータを更新
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !dashboardData) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "18px", color: "#6b7280" }}>
          メール監視データを読み込み中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <div style={{
          padding: "16px",
          backgroundColor: "#fee2e2",
          border: "1px solid #fca5a5",
          borderRadius: "8px",
          color: "#dc2626"
        }}>
          <h3 style={{ margin: "0 0 8px 0" }}>エラーが発生しました</h3>
          <p style={{ margin: "0 0 16px 0" }}>{error}</p>
          <button
            onClick={fetchDashboardData}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "18px", color: "#6b7280" }}>
          データがありません
        </div>
      </div>
    );
  }

  const { metrics, recent_events, summary } = dashboardData;

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1f2937", margin: "0 0 8px 0" }}>
          📧 メール送信監視ダッシュボード
        </h1>
        <p style={{ color: "#6b7280", margin: "0" }}>
          メール送信の状況とメトリクスを監視
          {lastUpdated && (
            <span style={{ marginLeft: "16px", fontSize: "14px" }}>
              最終更新: {lastUpdated.toLocaleString()}
            </span>
          )}
        </p>
      </div>

      {/* メトリクスカード */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem"
      }}>
        <div style={{
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <h3 style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "14px", fontWeight: "600" }}>
            総送信数
          </h3>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>
            {summary.total_emails.toLocaleString()}
          </div>
        </div>

        <div style={{
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <h3 style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "14px", fontWeight: "600" }}>
            成功率
          </h3>
          <div style={{ 
            fontSize: "24px", 
            fontWeight: "700", 
            color: summary.success_rate >= 95 ? "#059669" : summary.success_rate >= 90 ? "#d97706" : "#dc2626"
          }}>
            {summary.success_rate.toFixed(1)}%
          </div>
        </div>

        <div style={{
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <h3 style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "14px", fontWeight: "600" }}>
            過去24時間
          </h3>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>
            {summary.last_24_hours.toLocaleString()}
          </div>
        </div>

        <div style={{
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <h3 style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "14px", fontWeight: "600" }}>
            過去1時間
          </h3>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>
            {summary.last_hour.toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        {/* 上位ドメイン */}
        <div style={{
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <h3 style={{ margin: "0 0 16px 0", color: "#1f2937", fontSize: "18px", fontWeight: "600" }}>
            上位ドメイン
          </h3>
          {summary.top_domains.length > 0 ? (
            <div>
              {summary.top_domains.map((item, index) => (
                <div key={index} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: index < summary.top_domains.length - 1 ? "1px solid #f3f4f6" : "none"
                }}>
                  <span style={{ color: "#374151" }}>{item.domain}</span>
                  <span style={{ fontWeight: "600", color: "#1f2937" }}>{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#6b7280", textAlign: "center", padding: "20px" }}>
              データがありません
            </div>
          )}
        </div>

        {/* よくあるエラー */}
        <div style={{
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <h3 style={{ margin: "0 0 16px 0", color: "#1f2937", fontSize: "18px", fontWeight: "600" }}>
            よくあるエラー
          </h3>
          {summary.common_errors.length > 0 ? (
            <div>
              {summary.common_errors.map((item, index) => (
                <div key={index} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: index < summary.common_errors.length - 1 ? "1px solid #f3f4f6" : "none"
                }}>
                  <span style={{ color: "#374151", fontSize: "14px" }}>{item.error}</span>
                  <span style={{ fontWeight: "600", color: "#dc2626" }}>{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#6b7280", textAlign: "center", padding: "20px" }}>
              エラーはありません
            </div>
          )}
        </div>
      </div>

      {/* 最近のイベント */}
      <div style={{
        padding: "20px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb"
      }}>
        <h3 style={{ margin: "0 0 16px 0", color: "#1f2937", fontSize: "18px", fontWeight: "600" }}>
          最近のイベント
        </h3>
        {recent_events.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                    時刻
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                    メールアドレス
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                    件名
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                    ステータス
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                    エラー
                  </th>
                </tr>
              </thead>
              <tbody>
                {recent_events.map((event) => (
                  <tr key={event.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#6b7280" }}>
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#374151" }}>
                      {event.email}
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#374151" }}>
                      {event.subject}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor: event.status === "sent" || event.status === "delivered" ? "#d1fae5" : "#fee2e2",
                        color: event.status === "sent" || event.status === "delivered" ? "#065f46" : "#dc2626"
                      }}>
                        {event.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#dc2626" }}>
                      {event.error || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: "#6b7280", textAlign: "center", padding: "20px" }}>
            イベントがありません
          </div>
        )}
      </div>

      {/* 更新ボタン */}
      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          style={{
            padding: "12px 24px",
            backgroundColor: loading ? "#9ca3af" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          }}
        >
          {loading ? "更新中..." : "データを更新"}
        </button>
      </div>
    </div>
  );
}
