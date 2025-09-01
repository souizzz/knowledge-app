# 🚀 Resend連携設定ガイド

## 📋 現在の設定状況

### ✅ 完了済み
- 環境変数ファイルにResend設定が追加済み
- フロントエンドの認証機能が実装済み
- Supabase認証の基本設定が完了

### 🔄 進行中
- Resendアカウントの設定
- SupabaseでのSMTP設定

## 🎯 ステップ1: Resendアカウントの設定

### 1.1 Resendアカウント作成
1. [Resend.com](https://resend.com) にアクセス
2. **Sign up** をクリック
3. GitHubアカウントでサインアップ（推奨）
4. メールアドレスを確認

### 1.2 APIキーの取得
1. Resendダッシュボードにログイン
2. **API Keys** セクションに移動
3. **Create API Key** をクリック
4. キー名を入力（例：`supabase-auth`）
5. 生成されたAPIキーをコピー（`re_xxxxxxxxx` 形式）

### 1.3 ドメイン設定（推奨）
1. **Domains** セクションに移動
2. **Add Domain** をクリック
3. カスタムドメインを追加（例：`mail.sales-develop.com`）
4. DNS設定を完了

## 🔧 ステップ2: 環境変数の更新

### 2.1 本番環境（Vercel）での設定
```bash
# Vercelダッシュボードで以下の環境変数を設定
RESEND_API_KEY=re_your_actual_api_key_here
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_your_actual_api_key_here
MAIL_FROM=Knowledge App <noreply@sales-develop.com>
```

### 2.2 開発環境での設定
```bash
# .env.local ファイルに追加
RESEND_API_KEY=re_your_actual_api_key_here
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_your_actual_api_key_here
MAIL_FROM=Knowledge App <noreply@local.test>
```

## 🌐 ステップ3: SupabaseでのSMTP設定

### 3.1 Supabaseダッシュボードでの設定
1. Supabaseプロジェクトにログイン
2. **Authentication** → **Settings** に移動
3. **SMTP Settings** セクションを展開

### 3.2 SMTP設定の入力
```
Enable custom SMTP: ✅ 有効化

SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Pass: re_your_actual_api_key_here
SMTP Admin Email: your-email@example.com
SMTP Sender Name: Knowledge App
```

### 3.3 設定の保存
1. **Save** をクリック
2. 設定が保存されるまで待機
3. **Test SMTP** でテスト送信（オプション）

## 📧 ステップ4: メールテンプレートの設定

### 4.1 Magic Link テンプレート
1. **Authentication** → **Email Templates** に移動
2. **Magic Link** テンプレートを選択
3. 日本語テンプレートを適用

### 4.2 テンプレート例
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

## 🧪 ステップ5: テストと動作確認

### 5.1 開発環境でのテスト
```bash
# フロントエンドを起動
cd frontend
npm run dev

# ブラウザでアクセス
# http://localhost:3000/login
```

### 5.2 テスト手順
1. **ログインページにアクセス**
2. **メールアドレスを入力**
3. **「メールリンク / 6桁コードを送る」をクリック**
4. **メールボックスを確認**
5. **メールのリンクをクリック**
6. **認証が完了することを確認**

### 5.3 本番環境でのテスト
1. **Vercelにデプロイ**
2. **本番URLでテスト実行**
3. **メール送信の確認**

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### メールが届かない
1. **スパムフォルダを確認**
2. **Resendのログを確認**
3. **APIキーが正しいか確認**
4. **ドメイン設定を確認**

#### SMTP認証エラー
1. **APIキーを再生成**
2. **SMTP設定を再確認**
3. **Resendの制限に達していないか確認**

#### メールテンプレートエラー
1. **テンプレートの構文を確認**
2. **変数の記法を確認**
3. **HTMLの構文を確認**

## 📊 監視とメトリクス

### Resendダッシュボードで確認できる情報
- 送信数
- 配信率
- 開封率
- クリック率
- エラー率

### Supabaseダッシュボードで確認できる情報
- 認証ログ
- エラーログ
- ユーザー登録数

## ✅ チェックリスト

- [ ] Resendアカウント作成完了
- [ ] APIキー取得完了
- [ ] 環境変数設定完了
- [ ] SupabaseのSMTP設定完了
- [ ] メールテンプレート設定完了
- [ ] 開発環境でのテスト成功
- [ ] 本番環境でのテスト成功

これでResendを使用したメール認証が完全に動作します！
