package controller

import (
	"encoding/json"
	"errors"
	"net/http"

	"local-event-backend/domain"
)

// writeJSON writes v as a JSON response with the given status code.
func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if v != nil {
		_ = json.NewEncoder(w).Encode(v)
	}
}

// writeError writes a JSON error body.
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// writeDomainError maps a domain/usecase error to an appropriate status code.
func writeDomainError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		writeError(w, http.StatusNotFound, "resource not found")
	case errors.Is(err, domain.ErrConflict):
		writeError(w, http.StatusConflict, "resource already exists")
	case errors.Is(err, domain.ErrInvalidInput):
		writeError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, domain.ErrInvalidLogin):
		writeError(w, http.StatusUnauthorized, "invalid email or password")
	case errors.Is(err, domain.ErrUnauthorized):
		writeError(w, http.StatusUnauthorized, "authentication required")
	case errors.Is(err, domain.ErrForbidden):
		writeError(w, http.StatusForbidden, "you don't have permission to perform this action")
	case errors.Is(err, domain.ErrCategoryInUse):
		writeError(w, http.StatusConflict, "category is in use; deactivate it instead of deleting")
	case errors.Is(err, domain.ErrSoldOut):
		writeError(w, http.StatusConflict, "not enough tickets available")
	case errors.Is(err, domain.ErrEventPast):
		writeError(w, http.StatusConflict, "this event has already passed")
	case errors.Is(err, domain.ErrEventHasSales):
		writeError(w, http.StatusConflict, "this event has sold tickets and can't be deleted")
	case errors.Is(err, domain.ErrAlreadyScanned):
		writeError(w, http.StatusConflict, "this ticket has already been scanned")
	case errors.Is(err, domain.ErrInvalidTicket):
		writeError(w, http.StatusBadRequest, "ticket is not valid for check-in")
	default:
		writeError(w, http.StatusInternalServerError, "something went wrong")
	}
}

// decodeJSON decodes a request body, returning false and writing a 400 on error.
func decodeJSON(w http.ResponseWriter, r *http.Request, dst interface{}) bool {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return false
	}
	return true
}
