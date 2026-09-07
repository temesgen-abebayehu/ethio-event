package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"local-event-backend/config"
	"local-event-backend/delivery/controller"
	"local-event-backend/delivery/route"
	"local-event-backend/domain"
	"local-event-backend/infrastructure/chapa"
	"local-event-backend/infrastructure/cloudinary"
	"local-event-backend/infrastructure/database"
	"local-event-backend/infrastructure/mailer"
	"local-event-backend/infrastructure/middleware"
	"local-event-backend/repository"
	"local-event-backend/usecase"
)

func main() {
	cfg := config.Load()

	db, err := database.New(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer db.Close()

	// Infrastructure adapters.
	fileStore, err := cloudinary.NewClient(cfg.CloudinaryName, cfg.CloudinaryAPIKey, cfg.CloudinarySecret)
	if err != nil {
		log.Fatalf("cloudinary: %v", err)
	}
	gateway := chapa.NewGateway(cfg.ChapaSecretKey)
	smtpCfg := mailer.SMTPConfig{Host: cfg.SMTPHost, Port: cfg.SMTPPort, Username: cfg.SMTPUser, Password: cfg.SMTPPass, From: cfg.SMTPFrom}
	var mail domain.Mailer = mailer.NewLogMailer("templates")
	if smtpCfg.Configured() {
		mail = mailer.NewSMTPMailer(smtpCfg, "templates")
	}

	// Repositories.
	users := repository.NewUserRepository(db)
	resets := repository.NewPasswordResetRepository(db)
	categories := repository.NewCategoryRepository(db)
	tags := repository.NewTagRepository(db)
	events := repository.NewEventRepository(db)
	tickets := repository.NewTicketRepository(db)
	orders := repository.NewOrderRepository(db)
	interactions := repository.NewInteractionRepository(db)
	analytics := repository.NewAnalyticsRepository(db)

	// Usecases.
	authUC := usecase.NewAuthUsecase(users, resets, mail, cfg.JWTSecret, cfg.FrontEnd)
	eventUC := usecase.NewEventUsecase(events, categories)
	categoryUC := usecase.NewCategoryUsecase(categories)
	tagUC := usecase.NewTagUsecase(tags)
	interactionUC := usecase.NewInteractionUsecase(interactions)
	uploadUC := usecase.NewUploadUsecase(fileStore)
	paymentUC := usecase.NewPaymentUsecase(tickets, orders, users, events, gateway, mail, cfg.ChapaCallbackURL, cfg.ChapaReturnURL)
	analyticsUC := usecase.NewAnalyticsUsecase(analytics)

	// Controllers + router.
	controllers := route.Controllers{
		Auth:        controller.NewAuthController(authUC),
		Event:       controller.NewEventController(eventUC),
		Category:    controller.NewCategoryController(categoryUC),
		Tag:         controller.NewTagController(tagUC),
		Interaction: controller.NewInteractionController(interactionUC),
		Upload:      controller.NewUploadController(uploadUC),
		Payment:     controller.NewPaymentController(paymentUC),
		Analytics:   controller.NewAnalyticsController(analyticsUC),
	}
	router := route.New(controllers, middleware.New(cfg.JWTSecret))

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
	}
	log.Printf("server listening on :%s", cfg.Port)
	log.Fatal(srv.ListenAndServe())
}
