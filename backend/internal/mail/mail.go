package mail

import "log"

func SendInvite(email, inviteURL string) error {
	log.Printf("[DEV] Invite to %s: %s", email, inviteURL)
	return nil
}
