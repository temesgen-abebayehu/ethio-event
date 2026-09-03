package middleware

import "testing"

func TestGenerateAndParseJWT(t *testing.T) {
	const secret = "test-secret"
	token, err := GenerateJWT("user-1", "u@example.com", "admin", secret)
	if err != nil {
		t.Fatalf("GenerateJWT error: %v", err)
	}

	claims, err := ParseJWT(token, secret)
	if err != nil {
		t.Fatalf("ParseJWT error: %v", err)
	}
	if claims.UserID != "user-1" {
		t.Errorf("UserID = %q; want %q", claims.UserID, "user-1")
	}
	if claims.Role != "admin" {
		t.Errorf("Role = %q; want %q", claims.Role, "admin")
	}
}

func TestParseJWT_WrongSecret(t *testing.T) {
	token, _ := GenerateJWT("user-1", "u@example.com", "user", "secret-a")
	if _, err := ParseJWT(token, "secret-b"); err == nil {
		t.Error("ParseJWT() error = nil; want error for wrong secret")
	}
}
