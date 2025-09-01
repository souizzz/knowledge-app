# 📧 Resend + Supabase メール認証設定ガイド

## 🚀 ステップ1: Resendアカウント設定

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

### 1.3 ドメイン設定（オプション）
1. **Domains** セクションに移動
2. **Add Domain** をクリック
3. カスタムドメインを追加（例：`mail.yourdomain.com`）
4. DNS設定を完了

## 🔧 ステップ2: SupabaseでResendのSMTP設定

### 2.1 Supabaseダッシュボードでの設定
1. Supabaseプロジェクトにログイン
2. **Authentication** → **Settings** に移動
3. **SMTP Settings** セクションを展開

### 2.2 SMTP設定の入力
```
Enable custom SMTP: ✅ 有効化

SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Pass: re_xxxxxxxxx (ResendのAPIキー)
SMTP Admin Email: your-email@example.com
SMTP Sender Name: Your App Name
```

### 2.3 設定の保存
1. **Save** をクリック
2. 設定が保存されるまで待機
3. **Test SMTP** でテスト送信（オプション）

## 🌐 ステップ3: URL設定

### 3.1 Auth URL Configuration
```
Site URL: https://your-domain.vercel.app
Redirect URLs: 
  - https://your-domain.vercel.app/auth/callback
  - http://localhost:3000/auth/callback (開発用)
```

## 📝 ステップ4: メールテンプレートのカスタマイズ

### 4.1 Magic Link テンプレート
1. **Authentication** → **Email Templates** に移動
2. **Magic Link** テンプレートを選択
3. 必要に応じてカスタマイズ

### 4.2 テンプレート例
```html
<h2>ログインリンク</h2>
<p>以下のリンクをクリックしてログインしてください：</p>
<p><a href="{{ .ConfirmationURL }}">ログインする</a></p>
<p>このリンクは24時間有効です。</p>
```

## 🔍 ステップ5: テストと動作確認

### 5.1 開発環境でのテスト
```bash
# ローカルでテスト
npm run dev
# http://localhost:3000/login でメール送信テスト
```

### 5.2 本番環境でのテスト
```bash
# Vercelにデプロイ後
# https://your-domain.vercel.app/login でメール送信テスト
```

### 5.3 ログの確認
1. **Supabase** → **Logs** でメール送信ログを確認
2. **Resend** → **Logs** で配信状況を確認

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

## 🎯 ベストプラクティス

### セキュリティ
1. **APIキーは環境変数で管理**
2. **定期的にAPIキーをローテーション**
3. **送信制限を設定**

### パフォーマンス
1. **メールテンプレートを最適化**
2. **送信頻度を調整**
3. **エラーハンドリングを実装**

### ユーザーエクスペリエンス
1. **分かりやすいメールテンプレート**
2. **適切な送信頻度**
3. **エラーメッセージの改善**

## ✅ チェックリスト

- [ ] Resendアカウント作成完了
- [ ] APIキー取得完了
- [ ] SupabaseのSMTP設定完了
- [ ] URL設定完了
- [ ] メールテンプレート設定完了
- [ ] テスト送信成功
- [ ] 本番環境での動作確認完了

これでResendを使用したメール認証が完全に動作します！
