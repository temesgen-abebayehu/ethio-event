package usecase

import (
	"context"

	"local-event-backend/domain"
)

// ---- fake UserRepository ----

type fakeUserRepo struct {
	byEmail   map[string]*domain.User
	byID      map[string]*domain.User
	createErr error
	created   *domain.User
}

func (f *fakeUserRepo) Create(_ context.Context, u *domain.User) (*domain.User, error) {
	if f.createErr != nil {
		return nil, f.createErr
	}
	u.ID = "user-1"
	f.created = u
	return u, nil
}

func (f *fakeUserRepo) FindByEmail(_ context.Context, email string) (*domain.User, error) {
	if u, ok := f.byEmail[email]; ok {
		return u, nil
	}
	return nil, domain.ErrNotFound
}

func (f *fakeUserRepo) FindByID(_ context.Context, id string) (*domain.User, error) {
	if u, ok := f.byID[id]; ok {
		return u, nil
	}
	return nil, domain.ErrNotFound
}

func (f *fakeUserRepo) UpdatePassword(_ context.Context, _, _ string) error { return nil }

func (f *fakeUserRepo) UpdateProfile(_ context.Context, userID, fullName string, phone, city, avatarURL *string) (*domain.User, error) {
	return &domain.User{ID: userID, FullName: fullName, Phone: phone, City: city, AvatarURL: avatarURL}, nil
}

// ---- fake PasswordResetRepository ----

type fakeResetRepo struct{ created *domain.PasswordReset }

func (f *fakeResetRepo) Create(_ context.Context, pr *domain.PasswordReset) error {
	f.created = pr
	return nil
}
func (f *fakeResetRepo) FindValidByHash(_ context.Context, _ string) (*domain.PasswordReset, error) {
	return nil, domain.ErrNotFound
}
func (f *fakeResetRepo) MarkUsed(_ context.Context, _ string) error { return nil }

// ---- fake Mailer ----

type fakeMailer struct {
	sentTo, sentLink string
	bulkTo           []string
}

func (f *fakeMailer) SendPasswordReset(to, link string) error {
	f.sentTo, f.sentLink = to, link
	return nil
}

func (f *fakeMailer) Send(to []string, _, _ string) error {
	f.bulkTo = to
	return nil
}

// ---- fake CategoryRepository ----

type fakeCategoryRepo struct {
	category   *domain.Category
	eventCount int
	deleted    bool
}

func (f *fakeCategoryRepo) List(_ context.Context, _ bool) ([]domain.Category, error) {
	return nil, nil
}
func (f *fakeCategoryRepo) FindByID(_ context.Context, _ string) (*domain.Category, error) {
	if f.category == nil {
		return nil, domain.ErrNotFound
	}
	return f.category, nil
}
func (f *fakeCategoryRepo) Create(_ context.Context, c *domain.Category) (*domain.Category, error) {
	c.ID = "cat-1"
	return c, nil
}
func (f *fakeCategoryRepo) Update(_ context.Context, c *domain.Category) (*domain.Category, error) {
	return c, nil
}
func (f *fakeCategoryRepo) Delete(_ context.Context, _ string) error            { f.deleted = true; return nil }
func (f *fakeCategoryRepo) SetActive(_ context.Context, _ string, _ bool) error { return nil }
func (f *fakeCategoryRepo) CountEvents(_ context.Context, _ string) (int, error) {
	return f.eventCount, nil
}

// ---- fake EventRepository ----

type fakeEventRepo struct {
	event     *domain.Event
	createdIn domain.EventInput
	deleted   bool
	findErr   error
}

func (f *fakeEventRepo) List(_ context.Context, _ domain.EventFilter) ([]domain.Event, int, error) {
	return nil, 0, nil
}
func (f *fakeEventRepo) FindByIDOrSlug(_ context.Context, _ string, _ bool) (*domain.Event, error) {
	if f.findErr != nil {
		return nil, f.findErr
	}
	if f.event == nil {
		return nil, domain.ErrNotFound
	}
	return f.event, nil
}
func (f *fakeEventRepo) Create(_ context.Context, _ string, in domain.EventInput) (*domain.Event, error) {
	f.createdIn = in
	return &domain.Event{ID: "event-1", Title: in.Title}, nil
}
func (f *fakeEventRepo) Update(_ context.Context, id string, in domain.EventInput) (*domain.Event, error) {
	return &domain.Event{ID: id, Title: in.Title}, nil
}
func (f *fakeEventRepo) Delete(_ context.Context, _ string) error { f.deleted = true; return nil }
func (f *fakeEventRepo) Nearby(_ context.Context, _, _, _ float64) ([]domain.NearbyEvent, error) {
	return nil, nil
}
