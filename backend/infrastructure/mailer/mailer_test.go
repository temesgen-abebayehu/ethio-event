package mailer

import (
	"strings"
	"testing"
)

func TestLogMailer_RendersResetLink(t *testing.T) {
	m := NewLogMailer("../../templates")

	body, err := m.render("password_reset.html", map[string]string{"Link": "http://front/reset?token=abc"})
	if err != nil {
		t.Fatalf("render error: %v", err)
	}
	if !strings.Contains(body, "http://front/reset?token=abc") {
		t.Error("rendered email does not contain the reset link")
	}
	if !strings.Contains(strings.ToLower(body), "<html") {
		t.Error("rendered email is not HTML")
	}
}

func TestLogMailer_SendPasswordReset(t *testing.T) {
	m := NewLogMailer("../../templates")
	if err := m.SendPasswordReset("u@example.com", "http://front/reset?token=abc"); err != nil {
		t.Errorf("SendPasswordReset error = %v", err)
	}
}
