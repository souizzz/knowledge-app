# 📧 メールテンプレート設定

## 🎨 Supabaseメールテンプレートのカスタマイズ

### 1. Magic Link テンプレート

#### **日本語版テンプレート**
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
            <p>© 2024 Your App Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```

### 2. 招待メールテンプレート

#### **招待用カスタムテンプレート**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>招待メール</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 招待メール</h1>
        </div>
        <div class="content">
            <h2>こんにちは！</h2>
            <p>{{ .InviterName }} さんから招待されました。</p>
            <p>以下のボタンをクリックして参加してください：</p>
            <p style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">参加する</a>
            </p>
            <p><strong>招待の詳細：</strong></p>
            <ul>
                <li>組織名: {{ .OrganizationName }}</li>
                <li>招待者: {{ .InviterName }}</li>
                <li>有効期限: 7日間</li>
            </ul>
        </div>
        <div class="footer">
            <p>このメールは自動送信されています。返信はできません。</p>
            <p>© 2024 Your App Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```

### 3. テンプレート変数

#### **利用可能な変数**
```html
{{ .ConfirmationURL }}     <!-- 確認URL -->
{{ .Email }}              <!-- ユーザーのメールアドレス -->
{{ .SiteURL }}            <!-- サイトURL -->
{{ .Token }}              <!-- トークン -->
{{ .TokenHash }}          <!-- トークンハッシュ -->
{{ .RedirectTo }}         <!-- リダイレクト先 -->
```

### 4. テンプレート設定手順

#### **Supabaseダッシュボードでの設定**
1. **Authentication** → **Email Templates** に移動
2. **Magic Link** テンプレートを選択
3. **Edit** をクリック
4. 上記のHTMLテンプレートを貼り付け
5. **Save** をクリック

#### **テンプレートのテスト**
1. **Preview** でテンプレートをプレビュー
2. **Send test email** でテスト送信
3. 実際のメールで確認

### 5. レスポンシブデザイン

#### **モバイル対応CSS**
```css
@media only screen and (max-width: 600px) {
    .container { width: 100% !important; padding: 10px !important; }
    .header h1 { font-size: 24px !important; }
    .button { display: block !important; width: 100% !important; text-align: center !important; }
}
```

### 6. ブランディング

#### **カスタマイズ可能な要素**
- ロゴ画像
- カラーテーマ
- フォント
- レイアウト
- メッセージ内容

### 7. 多言語対応

#### **英語版テンプレート**
```html
<h2>Hello!</h2>
<p>Click the button below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}" class="button">Sign In</a></p>
<p><strong>Important:</strong></p>
<ul>
    <li>This link is valid for 24 hours</li>
    <li>This link can only be used once</li>
    <li>If you didn't request this, please ignore this email</li>
</ul>
```

## 🎯 ベストプラクティス

### デザイン
1. **シンプルで分かりやすいデザイン**
2. **ブランドカラーを使用**
3. **モバイル対応**
4. **アクセシビリティを考慮**

### コンテンツ
1. **明確なCTA（Call to Action）**
2. **セキュリティ情報を含める**
3. **有効期限を明記**
4. **サポート情報を含める**

### 技術
1. **HTMLの構文チェック**
2. **変数の正しい記法**
3. **テンプレートのテスト**
4. **エラーハンドリング**

これで美しく機能的なメールテンプレートが完成します！
