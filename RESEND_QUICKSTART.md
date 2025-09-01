# 🚀 Resend連携 クイックスタートガイド

## 📋 前提条件

- Resendアカウント（[resend.com](https://resend.com)で作成）
- Supabaseプロジェクト
- 環境変数の設定

## ⚡ 5分で完了！設定手順

### ステップ1: Resend APIキーの取得

1. [Resend.com](https://resend.com) にログイン
2. **API Keys** → **Create API Key**
3. キー名: `supabase-auth`
4. 生成されたAPIキーをコピー（`re_xxxxxxxxx`形式）

### ステップ2: 環境変数の設定

#### 本番環境（Vercel）
```bash
# Vercelダッシュボードで設定
RESEND_API_KEY=re_your_actual_api_key_here
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_your_actual_api_key_here
MAIL_FROM=Knowledge App <noreply@sales-develop.com>
```

#### 開発環境
```bash
# .env.local ファイルに追加
RESEND_API_KEY=re_your_actual_api_key_here
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_your_actual_api_key_here
MAIL_FROM=Knowledge App <noreply@local.test>
```

### ステップ3: Supabase SMTP設定

1. Supabaseダッシュボード → **Authentication** → **Settings**
2. **SMTP Settings** を展開
3. 以下の設定を入力：

```
Enable custom SMTP: ✅ 有効化
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Pass: re_your_actual_api_key_here
SMTP Admin Email: admin@sales-develop.com
SMTP Sender Name: Knowledge App
```

4. **Save** をクリック

### ステップ4: メールテンプレートの設定

1. **Authentication** → **Email Templates**
2. **Magic Link** テンプレートを選択
3. 以下のHTMLを貼り付け：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ログインリンク</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 ログインリンク</h1>
        </div>
        <div class="content">
            <h2>こんにちは！</h2>
            <p>以下のボタンをクリックしてログインしてください：</p>
            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">ログインする</a>
            </p>
            <p><strong>重要：</strong></p>
            <ul>
                <li>このリンクは24時間有効です</li>
                <li>このリンクは一度だけ使用できます</li>
                <li>心当たりのない場合は、このメールを無視してください</li>
            </ul>
        </div>
        <div class="footer">
            <p>このメールは自動送信されています。返信はできません。</p>
            <p>© 2024 Knowledge App. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```

4. **Save** をクリック

### ステップ5: テスト実行

#### 開発環境でのテスト
```bash
# フロントエンドを起動
npm run dev

# ブラウザでアクセス
# http://localhost:3000/login
```

#### テスト手順
1. ログインページでメールアドレスを入力
2. 「メールリンク / 6桁コードを送る」をクリック
3. メールボックスを確認
4. メールのリンクをクリック
5. 認証が完了することを確認

## 🔧 自動化スクリプト（オプション）

### 依存関係のインストール
```bash
npm install
```

### メールテンプレートの自動設定
```bash
npm run setup:email-templates
```

### 全体的な設定
```bash
npm run setup:email
```

## 🚨 トラブルシューティング

### メールが届かない
1. **スパムフォルダを確認**
2. **Resendのログを確認**
3. **APIキーが正しいか確認**

### SMTP認証エラー
1. **APIキーを再生成**
2. **SMTP設定を再確認**

### テンプレートエラー
1. **HTMLの構文を確認**
2. **変数の記法を確認**

## ✅ 完了チェックリスト

- [ ] Resendアカウント作成
- [ ] APIキー取得
- [ ] 環境変数設定
- [ ] Supabase SMTP設定
- [ ] メールテンプレート設定
- [ ] テスト実行成功

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. **Resendダッシュボード** - 送信ログとエラー
2. **Supabaseダッシュボード** - 認証ログとエラー
3. **ブラウザの開発者ツール** - コンソールエラー

これでResendを使用したメール認証が完全に動作します！🎉
