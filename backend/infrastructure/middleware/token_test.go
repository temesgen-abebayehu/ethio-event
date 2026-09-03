package middleware

import "testing"

func TestRandomToken_UniqueAndSized(t *testing.T) {
	a, err := RandomToken(32)
	if err != nil {
		t.Fatalf("RandomToken error: %v", err)
	}
	b, _ := RandomToken(32)
	if a == b {
		t.Error("RandomToken produced identical tokens")
	}
	if len(a) != 64 { // 32 bytes -> 64 hex chars
		t.Errorf("len = %d; want 64", len(a))
	}
}

func TestHashToken_Deterministic(t *testing.T) {
	if HashToken("abc") != HashToken("abc") {
		t.Error("HashToken not deterministic")
	}
	if HashToken("abc") == HashToken("abd") {
		t.Error("HashToken collision for different inputs")
	}
}
