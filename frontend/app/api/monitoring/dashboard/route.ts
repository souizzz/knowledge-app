import { NextRequest, NextResponse } from "next/server";

// モックデータ（実際の実装では、バックエンドのAPIを呼び出す）
const mockDashboardData = {
  metrics: {
    total_sent: 1250,
    total_failed: 45,
    success_rate: 96.5,
    last_24_hours: 89,
    last_hour: 12,
    errors_by_type: {
      "Invalid email address": 15,
      "Rate limit exceeded": 8,
      "SMTP connection failed": 12,
      "Authentication failed": 10
    },
    emails_by_domain: {
      "gmail.com": 450,
      "yahoo.co.jp": 320,
      "outlook.com": 280,
      "example.com": 150,
      "company.co.jp": 50
    }
  },
  recent_events: [
    {
      id: "email_1703123456_001",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      event_type: "email_sent",
      email: "user@example.com",
      subject: "ログインリンク",
      status: "sent",
      metadata: { template: "magic_link" }
    },
    {
      id: "email_1703123400_002",
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      event_type: "email_sent",
      email: "admin@company.co.jp",
      subject: "招待メール",
      status: "delivered",
      metadata: { template: "invite" }
    },
    {
      id: "email_1703123300_003",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      event_type: "email_failed",
      email: "invalid-email",
      subject: "ログインリンク",
      status: "failed",
      error: "Invalid email address",
      metadata: { template: "magic_link" }
    },
    {
      id: "email_1703123200_004",
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      event_type: "email_sent",
      email: "test@gmail.com",
      subject: "ログインリンク",
      status: "sent",
      metadata: { template: "magic_link" }
    },
    {
      id: "email_1703123100_005",
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      event_type: "email_bounced",
      email: "bounced@example.com",
      subject: "招待メール",
      status: "bounced",
      error: "Mailbox does not exist",
      metadata: { template: "invite" }
    }
  ],
  summary: {
    total_emails: 1295,
    success_rate: 96.5,
    last_24_hours: 89,
    last_hour: 12,
    top_domains: [
      { domain: "gmail.com", count: 450 },
      { domain: "yahoo.co.jp", count: 320 },
      { domain: "outlook.com", count: 280 },
      { domain: "example.com", count: 150 },
      { domain: "company.co.jp", count: 50 }
    ],
    common_errors: [
      { error: "Invalid email address", count: 15 },
      { error: "SMTP connection failed", count: 12 },
      { error: "Authentication failed", count: 10 },
      { error: "Rate limit exceeded", count: 8 }
    ]
  }
};

export async function GET(request: NextRequest) {
  try {
    // 実際の実装では、バックエンドのAPIを呼び出す
    // const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    // const response = await fetch(`${backendUrl}/api/monitoring/dashboard`);
    // const data = await response.json();
    
    // 現在はモックデータを返す
    const data = mockDashboardData;
    
    return NextResponse.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard data',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
