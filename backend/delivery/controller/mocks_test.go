package controller

import (
	"context"
	"mime/multipart"

	"local-event-backend/domain"
)

// ---- fake AuthUsecase ----

type fakeAuthUsecase struct {
	result   *domain.AuthResult
	user     *domain.User
	err      error
	forgotFn func(email string) error
}

func (f *fakeAuthUsecase) Signup(_ context.Context, _, _, _, _ string) (*domain.AuthResult, error) {
	return f.result, f.err
}
func (f *fakeAuthUsecase) Login(_ context.Context, _, _ string) (*domain.AuthResult, error) {
	return f.result, f.err
}
func (f *fakeAuthUsecase) Me(_ context.Context, _ string) (*domain.User, error) {
	return f.user, f.err
}
func (f *fakeAuthUsecase) UpdateProfile(_ context.Context, _, _, _, _, _ string) (*domain.User, error) {
	return f.user, f.err
}
func (f *fakeAuthUsecase) ChangePassword(_ context.Context, _, _, _ string) error { return f.err }
func (f *fakeAuthUsecase) ForgotPassword(_ context.Context, email string) error {
	if f.forgotFn != nil {
		return f.forgotFn(email)
	}
	return f.err
}
func (f *fakeAuthUsecase) ResetPassword(_ context.Context, _, _ string) error { return f.err }

// ---- fake EventUsecase ----

type fakeEventUsecase struct {
	events  []domain.Event
	total   int
	event   *domain.Event
	nearby  []domain.NearbyEvent
	err     error
	deleted bool
}

func (f *fakeEventUsecase) List(_ context.Context, _ domain.EventFilter) ([]domain.Event, int, error) {
	return f.events, f.total, f.err
}
func (f *fakeEventUsecase) ListByOrganizer(_ context.Context, _ string) ([]domain.Event, int, error) {
	return f.events, f.total, f.err
}
func (f *fakeEventUsecase) Get(_ context.Context, _ string, _ bool) (*domain.Event, error) {
	return f.event, f.err
}
func (f *fakeEventUsecase) Nearby(_ context.Context, _, _, _ float64) ([]domain.NearbyEvent, error) {
	return f.nearby, f.err
}
func (f *fakeEventUsecase) Create(_ context.Context, _ string, _ domain.EventInput) (*domain.Event, error) {
	return f.event, f.err
}
func (f *fakeEventUsecase) Update(_ context.Context, _, _, _ string, _ domain.EventInput) (*domain.Event, error) {
	return f.event, f.err
}
func (f *fakeEventUsecase) Delete(_ context.Context, _, _, _ string) error {
	f.deleted = true
	return f.err
}

// ---- fake CategoryUsecase ----

type fakeCategoryUsecase struct {
	categories []domain.Category
	category   *domain.Category
	err        error
}

func (f *fakeCategoryUsecase) List(_ context.Context, _ bool) ([]domain.Category, error) {
	return f.categories, f.err
}
func (f *fakeCategoryUsecase) Create(_ context.Context, _ *domain.Category) (*domain.Category, error) {
	return f.category, f.err
}
func (f *fakeCategoryUsecase) Update(_ context.Context, _ *domain.Category) (*domain.Category, error) {
	return f.category, f.err
}
func (f *fakeCategoryUsecase) Delete(_ context.Context, _ string) error            { return f.err }
func (f *fakeCategoryUsecase) SetActive(_ context.Context, _ string, _ bool) error { return f.err }

// ---- fake TagUsecase ----

type fakeTagUsecase struct {
	tags []domain.Tag
	err  error
}

func (f *fakeTagUsecase) List(_ context.Context) ([]domain.Tag, error) { return f.tags, f.err }

// ---- fake InteractionUsecase ----

type fakeInteractionUsecase struct {
	bookmarked bool
	following  bool
	events     []domain.Event
	err        error
}

func (f *fakeInteractionUsecase) Bookmark(_ context.Context, _, _ string) error       { return f.err }
func (f *fakeInteractionUsecase) RemoveBookmark(_ context.Context, _, _ string) error { return f.err }
func (f *fakeInteractionUsecase) Follow(_ context.Context, _, _ string) error         { return f.err }
func (f *fakeInteractionUsecase) Unfollow(_ context.Context, _, _ string) error       { return f.err }
func (f *fakeInteractionUsecase) Status(_ context.Context, _, _ string) (bool, bool, error) {
	return f.bookmarked, f.following, f.err
}
func (f *fakeInteractionUsecase) Bookmarks(_ context.Context, _ string) ([]domain.Event, error) {
	return f.events, f.err
}
func (f *fakeInteractionUsecase) Follows(_ context.Context, _ string) ([]domain.Event, error) {
	return f.events, f.err
}

// ---- fake PaymentUsecase ----

type fakePaymentUsecase struct {
	result *domain.InitiateResult
	order  *domain.Order
	orders []domain.Order
	err    error
}

func (f *fakePaymentUsecase) Initiate(_ context.Context, _, _ string, _ int) (*domain.InitiateResult, error) {
	return f.result, f.err
}
func (f *fakePaymentUsecase) Verify(_ context.Context, _ string) (*domain.Order, error) {
	return f.order, f.err
}
func (f *fakePaymentUsecase) HandleCallback(_ context.Context, _, _ string) error { return f.err }
func (f *fakePaymentUsecase) MyTickets(_ context.Context, _ string) ([]domain.Order, error) {
	return f.orders, f.err
}
func (f *fakePaymentUsecase) EventBuyers(_ context.Context, _, _, _ string) ([]domain.EventBuyer, error) {
	return nil, f.err
}
func (f *fakePaymentUsecase) ScanTicket(_ context.Context, _, _, _ string) (*domain.ScanResult, error) {
	if f.err != nil {
		return nil, f.err
	}
	return &domain.ScanResult{OrderID: "order-1"}, nil
}
func (f *fakePaymentUsecase) NotifyBuyers(_ context.Context, _, _, _ string, _ []string, _, _ string) (int, error) {
	return 1, f.err
}

// ---- fake UploadUsecase ----

type fakeUploadUsecase struct {
	files []domain.UploadedFile
	err   error
}

func (f *fakeUploadUsecase) UploadFiles(_ []*multipart.FileHeader, _, _ string) ([]domain.UploadedFile, error) {
	return f.files, f.err
}
func (f *fakeUploadUsecase) DeleteFiles(_ []string) error { return f.err }

// ---- fake AnalyticsUsecase ----

type fakeAnalyticsUsecase struct {
	analytics *domain.Analytics
	err       error
}

func (f *fakeAnalyticsUsecase) Get(_ context.Context) (*domain.Analytics, error) {
	return f.analytics, f.err
}
