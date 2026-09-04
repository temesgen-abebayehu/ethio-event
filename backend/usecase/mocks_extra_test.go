package usecase

import (
	"context"
	"mime/multipart"
	"time"

	"local-event-backend/domain"
)

// ---- fake TagRepository ----

type fakeTagRepo struct {
	tags []domain.Tag
	err  error
}

func (f *fakeTagRepo) List(_ context.Context) ([]domain.Tag, error) { return f.tags, f.err }

// ---- fake InteractionRepository ----

type fakeInteractionRepo struct {
	bookmarked bool
	following  bool
	events     []domain.Event
	calls      map[string]int
}

func (f *fakeInteractionRepo) record(name string) {
	if f.calls == nil {
		f.calls = map[string]int{}
	}
	f.calls[name]++
}

func (f *fakeInteractionRepo) AddBookmark(_ context.Context, _, _ string) error {
	f.record("AddBookmark")
	return nil
}
func (f *fakeInteractionRepo) RemoveBookmark(_ context.Context, _, _ string) error {
	f.record("RemoveBookmark")
	return nil
}
func (f *fakeInteractionRepo) AddFollow(_ context.Context, _, _ string) error {
	f.record("AddFollow")
	return nil
}
func (f *fakeInteractionRepo) RemoveFollow(_ context.Context, _, _ string) error {
	f.record("RemoveFollow")
	return nil
}
func (f *fakeInteractionRepo) Status(_ context.Context, _, _ string) (bool, bool, error) {
	return f.bookmarked, f.following, nil
}
func (f *fakeInteractionRepo) ListBookmarkedEvents(_ context.Context, _ string) ([]domain.Event, error) {
	return f.events, nil
}
func (f *fakeInteractionRepo) ListFollowedEvents(_ context.Context, _ string) ([]domain.Event, error) {
	return f.events, nil
}

// ---- fake AnalyticsRepository ----

type fakeAnalyticsRepo struct {
	analytics *domain.Analytics
	err       error
}

func (f *fakeAnalyticsRepo) Get(_ context.Context) (*domain.Analytics, error) {
	return f.analytics, f.err
}

// ---- fake TicketRepository ----

type fakeTicketRepo struct {
	ticket *domain.Ticket
	err    error
}

func (f *fakeTicketRepo) FindByEventID(_ context.Context, _ string) (*domain.Ticket, error) {
	if f.err != nil {
		return nil, f.err
	}
	return f.ticket, nil
}

// ---- fake OrderRepository ----

type fakeOrderRepo struct {
	active     *domain.Order
	created    *domain.Order
	byTxRef    *domain.Order
	lastStatus string
	userOrders []domain.Order
	scanInfo   *domain.TicketScanInfo
}

func (f *fakeOrderRepo) Create(_ context.Context, o *domain.Order) (*domain.Order, error) {
	o.ID = "order-1"
	f.created = o
	return o, nil
}
func (f *fakeOrderRepo) UpdateStatus(_ context.Context, _, status string) error {
	f.lastStatus = status
	return nil
}
func (f *fakeOrderRepo) FindByTxRef(_ context.Context, _ string) (*domain.Order, error) {
	if f.byTxRef == nil {
		return nil, domain.ErrNotFound
	}
	return f.byTxRef, nil
}
func (f *fakeOrderRepo) ListByUser(_ context.Context, _ string) ([]domain.Order, error) {
	return f.userOrders, nil
}
func (f *fakeOrderRepo) ListEventBuyers(_ context.Context, _ string) ([]domain.EventBuyer, error) {
	return nil, nil
}
func (f *fakeOrderRepo) FindActiveByUserAndTicket(_ context.Context, _, _ string) (*domain.Order, error) {
	if f.active == nil {
		return nil, domain.ErrNotFound
	}
	return f.active, nil
}
func (f *fakeOrderRepo) FindTicketScanInfo(_ context.Context, _ string) (*domain.TicketScanInfo, error) {
	if f.scanInfo == nil {
		return nil, domain.ErrNotFound
	}
	return f.scanInfo, nil
}
func (f *fakeOrderRepo) MarkScanned(_ context.Context, _, _ string) (time.Time, error) {
	return time.Now(), nil
}

// ---- fake FileStore ----

type fakeFileStore struct {
	uploads int
	deleted []string
	err     error
}

func (f *fakeFileStore) Upload(_ multipart.File, _, _ string) (string, string, error) {
	if f.err != nil {
		return "", "", f.err
	}
	f.uploads++
	return "https://cdn/img.jpg", "public-id", nil
}
func (f *fakeFileStore) Delete(publicIDs []string) error {
	f.deleted = append(f.deleted, publicIDs...)
	return nil
}

// ---- fake PaymentGateway ----

type fakePaymentGateway struct {
	checkoutURL string
	success     bool
	initErr     error
	verifyErr   error
	initialized bool
}

func (f *fakePaymentGateway) Initialize(_ domain.PaymentInitInput) (string, error) {
	if f.initErr != nil {
		return "", f.initErr
	}
	f.initialized = true
	return f.checkoutURL, nil
}
func (f *fakePaymentGateway) Verify(_ string) (bool, error) {
	return f.success, f.verifyErr
}
