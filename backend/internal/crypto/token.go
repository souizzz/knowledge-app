package crypto

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
)


func NewToken(n int) (plain string, hash []byte, err error) {
	b := make([]byte, n)
	if _, err = rand.Read(b); err != nil {
		return "", nil, err
	}
	plain = base64.RawURLEncoding.EncodeToString(b)
	h := sha256.Sum256([]byte(plain))
	return plain, h[:], nil
}


func Hash(s string) []byte {
	h := sha256.Sum256([]byte(s))
	return h[:]
}
