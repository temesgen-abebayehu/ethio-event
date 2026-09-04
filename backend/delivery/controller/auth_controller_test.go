package controller

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"local-event-backend/domain"
)

func TestAuthController_Signup_Success(t *testing.T) {
	uc := &fakeAuthUsecase{result: &domain.AuthResult{Token: "tok", User: &domain.User{ID: "u1", Email: "u@e.com"}}}
	c := NewAuthController(uc)

	body := `{"full_name":"Full Name","email":"u@e.com","password":"Passw0rd1"}`
	req := httptest.NewRequest(http.MethodPost, "/api/auth/signup", strings.NewReader(body))
	rec := httptest.NewRecorder()

	c.Signup(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d; want %d", rec.Code, http.StatusCreated)
	}
	var resp struct {
		AccessToken string `json:"access_token"`
	}
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if resp.AccessToken != "tok" {
		t.Errorf("access_token = %q; want tok", resp.AccessToken)
	}
}

func TestAuthController_Signup_InvalidInput(t *testing.T) {
	uc := &fakeAuthUsecase{err: domain.ErrInvalidInput}
	c := NewAuthController(uc)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/signup", strings.NewReader(`{}`))
	rec := httptest.NewRecorder()

	c.Signup(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d; want %d", rec.Code, http.StatusBadRequest)
	}
}

func TestAuthController_Signup_BadJSON(t *testing.T) {
	c := NewAuthController(&fakeAuthUsecase{})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/signup", strings.NewReader(`not-json`))
	rec := httptest.NewRecorder()

	c.Signup(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d; want %d", rec.Code, http.StatusBadRequest)
	}
}

func TestAuthController_Login(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		uc := &fakeAuthUsecase{result: &domain.AuthResult{Token: "tok", User: &domain.User{ID: "u1"}}}
		c := NewAuthController(uc)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(`{"email":"u@e.com","password":"x"}`))
		rec := httptest.NewRecorder()
		c.Login(rec, req)
		if rec.Code != http.StatusOK {
			t.Errorf("status = %d; want 200", rec.Code)
		}
	})

	t.Run("invalid credentials", func(t *testing.T) {
		uc := &fakeAuthUsecase{err: domain.ErrInvalidLogin}
		c := NewAuthController(uc)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(`{"email":"u@e.com","password":"x"}`))
		rec := httptest.NewRecorder()
		c.Login(rec, req)
		if rec.Code != http.StatusUnauthorized {
			t.Errorf("status = %d; want 401", rec.Code)
		}
	})
}

func TestAuthController_Me(t *testing.T) {
	uc := &fakeAuthUsecase{user: &domain.User{ID: "u1", Email: "u@e.com", Role: "user"}}
	c := NewAuthController(uc)
	req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	rec := httptest.NewRecorder()
	c.Me(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d; want 200", rec.Code)
	}
}

func TestAuthController_ForgotAndReset(t *testing.T) {
	c := NewAuthController(&fakeAuthUsecase{})

	fReq := httptest.NewRequest(http.MethodPost, "/api/auth/forgot-password", strings.NewReader(`{"email":"u@e.com"}`))
	fRec := httptest.NewRecorder()
	c.ForgotPassword(fRec, fReq)
	if fRec.Code != http.StatusOK {
		t.Errorf("forgot status = %d; want 200", fRec.Code)
	}

	rReq := httptest.NewRequest(http.MethodPost, "/api/auth/reset-password", strings.NewReader(`{"token":"t","new_password":"Passw0rd1"}`))
	rRec := httptest.NewRecorder()
	c.ResetPassword(rRec, rReq)
	if rRec.Code != http.StatusOK {
		t.Errorf("reset status = %d; want 200", rRec.Code)
	}
}
