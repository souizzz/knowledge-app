# ✅ Cursor用プロンプト（そのままコピペ）

**目的**
`slack-bot` リポジトリに以下の認証機能を"破壊的変更なし"で追加する。

1. 新規登録（法人名・代表者名・ユーザー名・メール・パスワード）
2. メールアドレス認証（ワンタイムリンク）
3. ログイン（JWTをHttpOnly Cookieで返却）
   将来Slack OAuthを後付けできるよう疎結合設計。

**前提/制約**

* バックエンド: Go 1.22 で新規ミニサービスを追加（既存コードを壊さない）。サービス名は `backend/authsvc`、ポートは `:8081`。
* フロント: Next.js(App Router, TypeScript)。`/app/register`, `/app/login`, `/app/verify-email` を追加。
* DB: PostgreSQL（既存の `slackbot` データベースを再利用、ポート5432）。
* メール: 開発は MailDev（SMTP: 1025, UI: 1080）。
* 認証: アクセストークンのみ（デモ）。Cookieは `HttpOnly/ SameSite=Lax`（本番は `Secure` 必須）。
* メール認証トークン: **平文はメール送付のみ**、DBは `SHA-256` ハッシュで保存。24時間有効・1回使い切り。
* CORS: `http://localhost:3000` のみ許可、`Allow-Credentials: true`。
* **既存の構成を最初にスキャンして**、パスが異なる場合は適切に置換。既存の docker-compose と衝突しないようにマージ。

---

## 0) リポジトリ解析 & 作業ブランチ

* リポジトリのルート構成と package.json / docker-compose / DB接続定義を走査し、差分計画を**要約**してコメント出力。
* `feature/auth` ブランチを作成。

---

## 1) DBマイグレーションを追加（安全）

新規ファイル: `db/migrations/20250820_auth.sql`
内容:

* `organizations(id, name, representative_name, created_at, updated_at)`
* `users(id, org_id fk, username unique, email unique, password_hash, email_verified bool default false, role default 'member', created_at, updated_at)`
* `email_verification_tokens(id, user_id fk, token_hash text, expires_at timestamptz, consumed_at timestamptz null, created_at)`
* すべて `IF NOT EXISTS` 付き。
* `email_verification_tokens(user_id)` と `email_verification_tokens(token_hash)` に INDEX。

> マイグレーション適用方法は README に記載。既存のマイグレーション実行方法（docker-entrypoint-initdb.d）を確認して統一。

---

## 2) Go ミニ認証サービス `backend/authsvc`

生成物:

* `backend/authsvc/go.mod`（依存: `github.com/golang-jwt/jwt/v5`, `github.com/lib/pq`, `golang.org/x/crypto`）
* `backend/authsvc/main.go`（標準 `net/http` + `database/sql`）
* `backend/authsvc/Dockerfile`（multi-stage、最終は distroless）

サーバ仕様:

* ルーティング

  * `POST /auth/register`
    入力: `{ organization_name, representative_name, username, email, password }`
    動作:

    1. パスワードは bcrypt(cost=12)
    2. `organizations` / `users` へ挿入（メールは小文字化）
    3. ワンタイムトークン `raw` 生成 → `SHA-256` ハッシュをDB保存（24h有効）
    4. 検証URL: `${PUBLIC_APP_URL}/verify-email?token=${raw}` を **MailDev** へSMTP送信
    5. `{ status: "ok" }` を返却
  * `GET /auth/verify-email?token=RAW`
    動作: token を `SHA-256`→DB照合、期限切れ/使用済みチェック→ `users.email_verified=true` & token を `consumed_at=now()` → `${PUBLIC_APP_URL}/verify-success` に 302 リダイレクト
  * `POST /auth/login`
    入力: `{ username, password }`
    動作: ユーザー取得→ `email_verified` 確認→bcrypt検証→JWT発行（`sub=id, org_id, role, username, iat, exp`）→ `access_token` を HttpOnly Cookie でセット→ `{ status:"ok" }`
  * `GET /auth/me`
    動作: Cookie `access_token` を検証し、クレーム(JSON)を返す
  * `GET /healthz` → `200 ok`

* CORS: `APP_ORIGIN` からのみに許可、`Allow-Credentials: true`。

* Cookie: `Domain=COOKIE_DOMAIN`, `Path=/`, `HttpOnly=true`, `SameSite=Lax`, `Secure=false`（**READMEで本番は true を明記**）。

* 環境変数:

  * `DATABASE_URL=postgres://user:password@db:5432/slackbot?sslmode=disable`（既存DB設定に合わせる）
  * `JWT_SECRET=please_change_me`
  * `ACCESS_TOKEN_TTL_MIN=15`
  * `APP_ORIGIN=http://localhost:3000`
  * `COOKIE_DOMAIN=localhost`
  * `SMTP_HOST=maildev`, `SMTP_PORT=1025`
  * `MAIL_FROM="Knowledge App <no-reply@local.test>"`
  * `PUBLIC_APP_URL=http://localhost:3000`

---

## 3) Next.js 画面 & API 経路

* `frontend/next.config.js` に rewrites を追記（既存rewritesがあればマージ）:
  ```javascript
  { source: "/api/auth/:path*", destination: "http://localhost:8081/auth/:path*" }
  ```
* 画面追加（App Router、既存のTailwindCSSスタイルに合わせる）

  * `frontend/app/register/page.tsx`
    フォーム: 法人名/代表者名/ユーザー名/メール/パスワード(>=8) → `POST /api/auth/register`
    成功時: 「登録完了。メールを確認してください。」アラート、エラーハンドリング付き
  * `frontend/app/login/page.tsx`
    フォーム: ユーザー名/パスワード → `POST /api/auth/login`（`credentials: "include"`）
    成功時: 「ログイン成功」アラート、`/` へリダイレクト
  * `frontend/app/verify-email/page.tsx`
    クエリ `token` を受け取り `GET /api/auth/verify-email?token=...` へリダイレクト
  * `frontend/app/verify-success/page.tsx`
    認証成功メッセージ表示、`/login` へのリンク付き

---

## 4) docker-compose 追記 / 更新

* 既存の `slackbot-db` サービスを再利用。
* 新サービス `maildev`（`image: maildev/maildev`, `ports: ["1080:1080", "1025:1025"]`）を追加。
* 新サービス `auth`（`build: ./backend/authsvc`, `depends_on: [db, maildev]`, `ports: ["8081:8081"]`）を追加。
* 既存サービス（backend, frontend）との競合回避、ヘルスチェック設定も統一。

---

## 5) README 更新

* **認証機能の追加**セクションを既存READMEに統合
* セットアップ手順（初回のみ）

  1. `docker compose up -d --build`
  2. マイグレーション適用（既存の仕組みに合わせて自動適用）
  3. 動作確認:
     - Frontend: `http://localhost:3000/register` で登録
     - MailDev: `http://localhost:1080` からメールを開き、リンククリック
     - `http://localhost:3000/login` でログイン
     - Cookieに `access_token` が設定されることを確認

* 環境変数の説明（既存の env.example に追加）
* セキュリティ注意事項（本番運用時）
* 将来の Slack OAuth 追加方針

---

## 6) テスト & 品質

* Go: 主要ハンドラのユニットテスト（register/login の happy path と主要エラーケース）
* `curl` 例を `docs/auth-api.md` として追加
* 既存のコードスタイル（gofmt, eslint）に統一
* TypeScript型安全性の確保

---

## 7) セキュリティ注意（コメント&README明記）

* 本番環境での `Secure` Cookie有効化
* レート制限の必要性（実装はTODO）
* bcrypt cost=12 の採用理由
* トークンのハッシュ保存（平文NG）
* 適切なエラーメッセージ（情報漏えい防止）

---

## 8) コミット/PR

* Conventional Commits:
  * `feat(auth): add authentication microservice`
  * `feat(auth): add registration and login pages`
  * `feat(auth): add email verification system`
  * `docs(auth): update README with auth setup`
* PR作成時に動作確認スクリーンショット添付

---

### 期待する最終成果物

* 完全に動作する認証システム（登録→メール認証→ログイン→認証状態確認）
* 既存システムとの非破壊的統合
* 将来のSlack OAuth拡張に対応した設計
* 本番運用を考慮したセキュリティ設定

**実装開始時は必ず既存コード構造を分析し、命名規則や設計パターンに合わせてください。**
