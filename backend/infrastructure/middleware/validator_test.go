package middleware

import "testing"

func TestValidEmail(t *testing.T) {
	cases := map[string]bool{
		"user@example.com": true,
		"a.b@c.co":         true,
		"not-an-email":     false,
		"":                 false,
	}
	for in, want := range cases {
		if got := ValidEmail(in); got != want {
			t.Errorf("ValidEmail(%q) = %v; want %v", in, got, want)
		}
	}
}

func TestStrongPassword(t *testing.T) {
	cases := map[string]bool{
		"Passw0rd1": true,
		"password":  false, // no digit
		"12345678":  false, // no letter
		"Pas1":      false, // too short
	}
	for in, want := range cases {
		if got := StrongPassword(in); got != want {
			t.Errorf("StrongPassword(%q) = %v; want %v", in, got, want)
		}
	}
}

func TestSlugify(t *testing.T) {
	if got := Slugify("Addis Jazz Night!"); got != "addis-jazz-night" {
		t.Errorf("Slugify = %q; want %q", got, "addis-jazz-night")
	}
}
