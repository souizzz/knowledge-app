# 最小限の設定（Resend APIキー設定済み）

## 設定済みの項目

✅ **Resend APIキー**: `re_hKLwpgJn_8DrJ8Hf4oyMKZaoX8hjA8bw5`
✅ **ドメイン**: `https://sales-develop.com`
✅ **SSL証明書**: `cert_GNM51rP3tjeArOYVwqVhc8vY`

## 現在設定されている環境変数

```bash
# Frontend Configuration
FRONTEND_URL=https://sales-develop.com
BACKEND_URL=https://api.sales-develop.com
NEXT_PUBLIC_FRONTEND_URL=https://sales-develop.com
NEXT_PUBLIC_BASE_URL=https://sales-develop.com

# Email Configuration (Resend) - 設定済み
RESEND_API_KEY=re_hKLwpgJn_8DrJ8Hf4oyMKZaoX8hjA8bw5
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_hKLwpgJn_8DrJ8Hf4oyMKZaoX8hjA8bw5
MAIL_FROM=Knowledge App <noreply@sales-develop.com>

# SSL Configuration - 設定済み
SSL_CERT_ID=cert_GNM51rP3tjeArOYVwqVhc8vY

# JWT Configuration
JWT_SECRET=LADF/MmchpqdOW5+6KsxUM3+YPRwt/1Idrzbq6sDBu4=
```

## 次に設定が必要な項目

- OpenAI APIキー（AI機能を使用する場合）
- Slack設定（Slackボット機能を使用する場合）
- データベース設定（データベースを使用する場合）

## デプロイ準備完了

Resend APIキーが設定されたので、メール送信機能は使用可能です。
他のAPIキーは必要に応じて後で追加できます。
