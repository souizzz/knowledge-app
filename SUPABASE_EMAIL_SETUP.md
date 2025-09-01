# 📧 Supabase メール設定ガイド

## 🚨 重要: 本番環境でのメール送信

Supabaseのデフォルトメール送信には制限があります：
- **開発環境**: 1日100通まで
- **本番環境**: カスタムSMTP設定が必要

## 🔧 本番環境での設定手順

### 1. Supabaseダッシュボードでの設定

#### **Auth → Email Templates**
1. **Confirm signup** テンプレートを確認
2. **Magic Link** テンプレートを確認
3. 必要に応じてカスタマイズ

#### **Auth → URL Configuration**
```
Site URL: https://your-domain.vercel.app
Redirect URLs: https://your-domain.vercel.app/auth/callback
```

### 2. カスタムSMTP設定（推奨）

#### **Auth → SMTP Settings**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: your-app-password
SMTP Admin Email: your-email@gmail.com
SMTP Sender Name: Your App Name
```

#### **Gmail App Password設定**
1. Googleアカウントの2段階認証を有効化
2. アプリパスワードを生成
3. 生成されたパスワードをSMTP Passに設定

### 3. 代替案: Resend/SendGrid

#### **Resend使用例**
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Pass: re_xxxxxxxxx
```

#### **SendGrid使用例**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: SG.xxxxxxxxx
```

## 🧪 テスト方法

### 1. 開発環境でのテスト
```bash
# ローカルでテスト
npm run dev
# http://localhost:3000/login でメール送信テスト
```

### 2. 本番環境でのテスト
```bash
# Vercelにデプロイ後
# https://your-domain.vercel.app/login でメール送信テスト
```

## 🔍 トラブルシューティング

### メールが届かない場合
1. **スパムフォルダを確認**
2. **Supabaseダッシュボードのログを確認**
3. **SMTP設定を再確認**
4. **送信制限に達していないか確認**

### よくあるエラー
- **"Email rate limit exceeded"**: 送信制限に達した
- **"SMTP authentication failed"**: SMTP認証エラー
- **"Invalid email template"**: メールテンプレートエラー

## 📋 チェックリスト

- [ ] SupabaseのSMTP設定完了
- [ ] メールテンプレートの確認
- [ ] URL設定の確認
- [ ] テストメール送信成功
- [ ] 本番環境での動作確認

## 🎯 推奨設定

### 本番環境での推奨構成
1. **Resend** または **SendGrid** を使用
2. **カスタムドメイン** でメール送信
3. **メールテンプレート** のカスタマイズ
4. **送信ログ** の監視

これで確実に認証メールが届くようになります！
