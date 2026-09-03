package middleware

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
)

// RandomToken returns a cryptographically-random hex string (n bytes of entropy).
func RandomToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// HashToken returns the SHA-256 hex digest of a token, for safe storage.
func HashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
