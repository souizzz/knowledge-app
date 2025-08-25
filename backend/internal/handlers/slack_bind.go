package handlers


import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"


"slack-bot/backend/internal/app"
"slack-bot/backend/internal/auth"
dbpkg "slack-bot/backend/internal/db"
)


type slackStartReq struct { SlackID string `json:"slack_id"` }


type slackVerifyReq struct { Code string `json:"code"` }


// 簡易: DB テーブルを使わず、コードをメモリ or TODO: slack_bind_requests に保存する実装に差し替え
var codeMem = map[string]string{} // userID -> code (雛形用)


func PostSlackStart(a *app.App) http.HandlerFunc {
return func(w http.ResponseWriter, r *http.Request) {
uid := auth.CurrentUserID(r)
if uid == "" { http.Error(w, "unauthorized", 401); return }
var req slackStartReq
if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.SlackID == "" {
http.Error(w, "bad request", 400); return
}
// 6 桁コード作成
rand.Seed(time.Now().UnixNano())
code := rand.Intn(900000) + 100000
codeMem[uid] = fmt.Sprintf("%06d", code)


// TODO: Slack DM 送信（現状はログ代替）
// slackbot.SendDM(req.SlackID, fmt.Sprintf("Your verification code: %06d", code))


auth.JSON(w, 200, map[string]any{"requires_verification": true})
}
}


func PostSlackVerify(a *app.App) http.HandlerFunc {
return func(w http.ResponseWriter, r *http.Request) {
uid := auth.CurrentUserID(r)
if uid == "" { http.Error(w, "unauthorized", 401); return }
var req slackVerifyReq
if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Code == "" {
http.Error(w, "bad request", 400); return
}
if codeMem[uid] != req.Code { http.Error(w, "invalid code", 401); return }
// TODO: SlackID は start 時に persist（雛形簡略化のため固定値）
// 実装時は slack_bind_requests に (uid, slack_id, code) を保存 → ここで取り出す
slackID := r.URL.Query().Get("slack_id") // 雛形用
if slackID == "" { slackID = "U123PLACEHOLDER" }
if err := dbpkg.SetUserSlackID(r.Context(), a.DB, uid, slackID); err != nil { http.Error(w, err.Error(), 500); return }
delete(codeMem, uid)
auth.JSON(w, 200, map[string]any{"ok": true, "slack_id": slackID})
}
}
