package slack

import "log"

func SendDM(slackID, text string) error {
	log.Printf("[DEV] DM to %s: %s", slackID, text)
	return nil
}
