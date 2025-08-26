# 🚀 Vercelデプロイ手順

## 📋 前提条件

- GitHubアカウント
- Vercelアカウント
- Supabaseアカウント

## 🔧 デプロイ手順

### **Step 1: Vercelダッシュボードでプロジェクト作成**

1. **Vercelダッシュボードにアクセス**
   ```
   https://vercel.com/dashboard
   ```

2. **「New Project」をクリック**

3. **GitHubリポジトリを選択**
   - `souizzz/knowledge-app` を選択
   - または、リポジトリをインポート

4. **プロジェクト設定**
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (自動検出)
   - **Install Command**: `npm install`

   **重要な注意事項**:
   - **vercel.json**: npm使用を明示的に設定済み
   - **standalone出力**: 無効化済み
   - **環境変数**: 必ずVercelダッシュボードで設定
   - **パッケージマネージャー**: npmを使用（yarn.lock削除済み）
   - **.npmrc**: package-manager=npmで明示的に設定
   - **package.json**: enginesフィールドでnpm使用を明示

### **Step 2: 環境変数の設定**

Vercelダッシュボード > Settings > Environment Variables で以下を設定：

#### **Supabase設定**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### **フロントエンド設定**
```
NEXT_PUBLIC_FRONTEND_URL=https://your-domain.vercel.app
```

#### **OpenAI設定**
```
OPENAI_API_KEY=your_openai_api_key
```

#### **Slack設定**
```
SLACK_SIGNING_SECRET=your_slack_signing_secret
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_APP_TOKEN=your_slack_app_token
```

#### **JWT設定**
```
JWT_SECRET=LADF/MmchpqdOW5+6KsxUM3+YPRwt/1Idrzbq6sDBu4=
```

### **Step 3: デプロイ実行**

1. **「Deploy」をクリック**
2. **ビルドが完了するまで待機**
3. **デプロイURLを確認**

### **Step 4: カスタムドメイン設定（オプション）**

1. **Settings > Domains**
2. **カスタムドメインを追加**
3. **DNS設定を更新**

## 🔄 自動デプロイ

GitHubにプッシュすると自動的にデプロイされます：

```bash
git add .
git commit -m "Update code"
git push origin main
```

## 🛠️ トラブルシューティング

### **ビルドエラー**
- Vercelダッシュボード > Deployments > 最新デプロイ > Functions
- ログを確認してエラーを修正

### **環境変数エラー**
- Settings > Environment Variables
- 全ての環境変数が設定されているか確認

### **Supabase接続エラー**
- Supabaseダッシュボードでプロジェクトが作成されているか確認
- 環境変数のURLとキーが正しいか確認

## 📊 デプロイ後の確認

### **動作確認**
1. **フロントエンド**: https://your-domain.vercel.app
2. **API**: https://your-domain.vercel.app/api/health
3. **Supabase連携**: データベース接続テスト

### **ログ確認**
- Vercelダッシュボード > Deployments > 最新デプロイ
- Functions タブでログを確認

## 🎉 完了

これでVercelでのデプロイが完了します！

### **次のステップ**
1. Supabase本番環境の設定
2. Slackアプリの設定更新
3. カスタムドメインの設定
