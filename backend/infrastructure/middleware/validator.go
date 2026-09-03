package middleware

import (
	"net/mail"
	"regexp"
	"strings"
	"unicode"
)

var slugNonWord = regexp.MustCompile(`[^a-z0-9]+`)

// ValidEmail reports whether s is a syntactically valid email address.
func ValidEmail(s string) bool {
	_, err := mail.ParseAddress(s)
	return err == nil
}

// StrongPassword reports whether s is at least 8 chars with a letter and a number.
func StrongPassword(s string) bool {
	if len(s) < 8 {
		return false
	}
	var hasLetter, hasDigit bool
	for _, r := range s {
		switch {
		case unicode.IsLetter(r):
			hasLetter = true
		case unicode.IsDigit(r):
			hasDigit = true
		}
	}
	return hasLetter && hasDigit
}

// Slugify converts text into a URL-safe slug.
func Slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = slugNonWord.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}
