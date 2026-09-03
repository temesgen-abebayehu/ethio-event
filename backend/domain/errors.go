package domain

import "errors"

// Sentinel errors returned by the domain and usecase layers.
// Controllers map these to HTTP status codes.
var (
	ErrNotFound       = errors.New("resource not found")
	ErrConflict       = errors.New("resource already exists")
	ErrInvalidInput   = errors.New("invalid input")
	ErrUnauthorized   = errors.New("unauthorized")
	ErrForbidden      = errors.New("forbidden")
	ErrInvalidLogin   = errors.New("invalid email or password")
	ErrCategoryInUse  = errors.New("category is in use and cannot be deleted")
	ErrSoldOut        = errors.New("not enough tickets available")
	ErrEventPast      = errors.New("event date has already passed")
	ErrEventHasSales  = errors.New("event has sold tickets and cannot be deleted")
	ErrAlreadyScanned = errors.New("ticket has already been scanned")
	ErrInvalidTicket  = errors.New("ticket is not valid for check-in")
)
