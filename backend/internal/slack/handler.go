package slack

import "net/http"

func RegisterSlackHandlers(corsMiddleware func(http.HandlerFunc) http.HandlerFunc) {
	http.HandleFunc("/slack/commands", corsMiddleware(HandleAskCommand))
}
