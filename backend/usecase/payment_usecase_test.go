package usecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"local-event-backend/domain"
)

func futureEvent() *domain.Event {
	return &domain.Event{ID: "event-1", EventDate: time.Now().Add(48 * time.Hour), Status: domain.EventPublished}
}

func newPaymentUC(tickets *fakeTicketRepo, orders *fakeOrderRepo, users *fakeUserRepo, events *fakeEventRepo, gw *fakePaymentGateway) *PaymentUsecase {
	return NewPaymentUsecase(tickets, orders, users, events, gw, &fakeMailer{}, "http://cb", "http://ret")
}

func TestPaymentUsecase_Initiate_FreeEvent(t *testing.T) {
	tickets := &fakeTicketRepo{ticket: &domain.Ticket{ID: "t1", Price: 0, QuantityTotal: 100}}
	orders := &fakeOrderRepo{}
	events := &fakeEventRepo{event: futureEvent()}
	uc := newPaymentUC(tickets, orders, &fakeUserRepo{}, events, &fakePaymentGateway{})

	res, err := uc.Initiate(context.Background(), "user-1", "event-1", 2)
	if err != nil {
		t.Fatalf("Initiate error = %v", err)
	}
	if res.Status != domain.OrderCompleted {
		t.Errorf("status = %q; want completed", res.Status)
	}
	if res.CheckoutURL != "" {
		t.Errorf("checkout url = %q; want empty for free event", res.CheckoutURL)
	}
	if orders.created == nil || orders.created.Status != domain.OrderCompleted {
		t.Error("free order not created as completed")
	}
}

func TestPaymentUsecase_Initiate_PaidEvent(t *testing.T) {
	tickets := &fakeTicketRepo{ticket: &domain.Ticket{ID: "t1", Price: 500, QuantityTotal: 100}}
	orders := &fakeOrderRepo{}
	users := &fakeUserRepo{byID: map[string]*domain.User{"user-1": {ID: "user-1", Email: "u@e.com", FullName: "Full Name"}}}
	events := &fakeEventRepo{event: futureEvent()}
	gw := &fakePaymentGateway{checkoutURL: "https://chapa/checkout"}
	uc := newPaymentUC(tickets, orders, users, events, gw)

	res, err := uc.Initiate(context.Background(), "user-1", "event-1", 2)
	if err != nil {
		t.Fatalf("Initiate error = %v", err)
	}
	if res.Status != domain.OrderPending {
		t.Errorf("status = %q; want pending", res.Status)
	}
	if res.CheckoutURL != "https://chapa/checkout" {
		t.Errorf("checkout url = %q", res.CheckoutURL)
	}
	if res.TotalPrice != 1000 {
		t.Errorf("total = %v; want 1000", res.TotalPrice)
	}
	if !gw.initialized {
		t.Error("gateway not initialized for paid event")
	}
}

func TestPaymentUsecase_Initiate_Errors(t *testing.T) {
	t.Run("quantity below 1", func(t *testing.T) {
		uc := newPaymentUC(&fakeTicketRepo{}, &fakeOrderRepo{}, &fakeUserRepo{}, &fakeEventRepo{event: futureEvent()}, &fakePaymentGateway{})
		if _, err := uc.Initiate(context.Background(), "u", "e", 0); !errors.Is(err, domain.ErrInvalidInput) {
			t.Errorf("error = %v; want ErrInvalidInput", err)
		}
	})

	t.Run("past event", func(t *testing.T) {
		past := &domain.Event{ID: "event-1", EventDate: time.Now().Add(-time.Hour)}
		uc := newPaymentUC(&fakeTicketRepo{}, &fakeOrderRepo{}, &fakeUserRepo{}, &fakeEventRepo{event: past}, &fakePaymentGateway{})
		if _, err := uc.Initiate(context.Background(), "u", "e", 1); !errors.Is(err, domain.ErrEventPast) {
			t.Errorf("error = %v; want ErrEventPast", err)
		}
	})

	t.Run("sold out", func(t *testing.T) {
		tickets := &fakeTicketRepo{ticket: &domain.Ticket{ID: "t1", Price: 0, QuantityTotal: 1, QuantitySold: 1}}
		uc := newPaymentUC(tickets, &fakeOrderRepo{}, &fakeUserRepo{}, &fakeEventRepo{event: futureEvent()}, &fakePaymentGateway{})
		if _, err := uc.Initiate(context.Background(), "u", "e", 1); !errors.Is(err, domain.ErrSoldOut) {
			t.Errorf("error = %v; want ErrSoldOut", err)
		}
	})
}

func TestPaymentUsecase_Initiate_Idempotent(t *testing.T) {
	tickets := &fakeTicketRepo{ticket: &domain.Ticket{ID: "t1", Price: 500, QuantityTotal: 100}}
	orders := &fakeOrderRepo{active: &domain.Order{ID: "existing", Quantity: 1, ChapaTxRef: "ref-1", Status: domain.OrderPending}}
	users := &fakeUserRepo{byID: map[string]*domain.User{"user-1": {ID: "user-1", Email: "u@e.com", FullName: "Test User"}}}
	gw := &fakePaymentGateway{checkoutURL: "https://chapa/checkout"}
	uc := newPaymentUC(tickets, orders, users, &fakeEventRepo{event: futureEvent()}, gw)

	res, err := uc.Initiate(context.Background(), "user-1", "event-1", 1)
	if err != nil {
		t.Fatalf("Initiate error = %v", err)
	}
	if res.OrderID != "existing" {
		t.Errorf("order id = %q; want existing (pending reuse)", res.OrderID)
	}
	if res.CheckoutURL != "https://chapa/checkout" {
		t.Errorf("checkout url = %q; want the Chapa URL", res.CheckoutURL)
	}
}

func TestPaymentUsecase_Verify(t *testing.T) {
	orders := &fakeOrderRepo{byTxRef: &domain.Order{ID: "o1", Status: domain.OrderCompleted}}
	gw := &fakePaymentGateway{success: true}
	uc := newPaymentUC(&fakeTicketRepo{}, orders, &fakeUserRepo{}, &fakeEventRepo{}, gw)

	order, err := uc.Verify(context.Background(), "ref-1")
	if err != nil {
		t.Fatalf("Verify error = %v", err)
	}
	if orders.lastStatus != domain.OrderCompleted {
		t.Errorf("updated status = %q; want completed", orders.lastStatus)
	}
	if order.Status != domain.OrderCompleted {
		t.Errorf("order status = %q; want completed", order.Status)
	}
}
