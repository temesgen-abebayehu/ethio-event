package middleware

import "testing"

func TestHashAndCheckPassword(t *testing.T) {
	hash, err := HashPassword("Passw0rd1")
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	if hash == "Passw0rd1" {
		t.Fatal("password was not hashed")
	}
	if !CheckPassword("Passw0rd1", hash) {
		t.Error("CheckPassword() = false; want true for correct password")
	}
	if CheckPassword("wrong", hash) {
		t.Error("CheckPassword() = true; want false for wrong password")
	}
}
