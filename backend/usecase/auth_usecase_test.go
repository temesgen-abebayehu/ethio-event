package usecase

import (
	"context"
	"errors"
	"testing"

	"local-event-backend/domain"
)

func TestAuthUsecase_Signup(t *testing.T) {
	tests := []struct {
		name     string
		email    string
		password string
		fullName string
		role     string
		wantErr  bool
	}{
		{"valid user", "u@example.com", "Passw0rd1", "Full Name", "user", false},
		{"valid organizer", "o@example.com", "Passw0rd1", "Full Name", "organizer", false},
		{"default role", "d@example.com", "Passw0rd1", "Full Name", "", false},
		{"admin rejected", "a@example.com", "Passw0rd1", "Full Name", "admin", true},
		{"short name", "u@example.com", "Passw0rd1", "A", "user", true},
		{"bad email", "not-email", "Passw0rd1", "Full Name", "user", true},
		{"weak password", "u@example.com", "password", "Full Name", "user", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			uc := NewAuthUsecase(&fakeUserRepo{}, &fakeResetRepo{}, &fakeMailer{}, "secret", "http://front")
			res, err := uc.Signup(context.Background(), tt.email, tt.password, tt.fullName, tt.role)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("Signup() error = nil; want error")
				}
				return
			}
			if err != nil {
				t.Fatalf("Signup() error = %v; want nil", err)
			}
			if res.Token == "" {
				t.Error("Signup() returned empty token")
			}
		})
	}
}

func TestAuthUsecase_Login_Invalid(t *testing.T) {
	uc := NewAuthUsecase(&fakeUserRepo{byEmail: map[string]*domain.User{}}, &fakeResetRepo{}, &fakeMailer{}, "secret", "http://front")
	_, err := uc.Login(context.Background(), "missing@example.com", "whatever")
	if !errors.Is(err, domain.ErrInvalidLogin) {
		t.Errorf("Login() error = %v; want ErrInvalidLogin", err)
	}
}

func TestAuthUsecase_ForgotPassword_SendsLink(t *testing.T) {
	users := &fakeUserRepo{byEmail: map[string]*domain.User{
		"u@example.com": {ID: "user-1", Email: "u@example.com"},
	}}
	mailer := &fakeMailer{}
	uc := NewAuthUsecase(users, &fakeResetRepo{}, mailer, "secret", "http://front")

	if err := uc.ForgotPassword(context.Background(), "u@example.com"); err != nil {
		t.Fatalf("ForgotPassword() error = %v", err)
	}
	if mailer.sentTo != "u@example.com" {
		t.Errorf("mail sent to %q; want u@example.com", mailer.sentTo)
	}
}
