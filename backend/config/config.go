package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all runtime configuration loaded from the environment.
type Config struct {
	Port     string
	AppURL   string // public backend URL, used in password reset links
	FrontEnd string // frontend origin, used for CORS and redirects

	DatabaseURL string
	JWTSecret   string

	CloudinaryName   string
	CloudinaryAPIKey string
	CloudinarySecret string

	ChapaSecretKey   string
	ChapaPublicKey   string
	ChapaCallbackURL string
	ChapaReturnURL   string

	SMTPHost string
	SMTPPort string
	SMTPUser string
	SMTPPass string
	SMTPFrom string
}

// Load reads configuration from a .env file (if present) and the environment.
func Load() *Config {
	_ = godotenv.Load()

	return &Config{
		Port:     getEnv("PORT", "3001"),
		AppURL:   getEnv("APP_URL", "http://localhost:3001"),
		FrontEnd: getEnv("FRONTEND_URL", "http://localhost:3000"),

		DatabaseURL: mustGetEnv("DATABASE_URL"),
		JWTSecret:   mustGetEnv("JWT_SECRET"),

		CloudinaryName:   getEnv("CLOUDINARY_CLOUD_NAME", ""),
		CloudinaryAPIKey: getEnv("CLOUDINARY_API_KEY", ""),
		CloudinarySecret: getEnv("CLOUDINARY_API_SECRET", ""),

		ChapaSecretKey:   getEnv("CHAPA_SECRET_KEY", ""),
		ChapaPublicKey:   getEnv("CHAPA_PUBLIC_KEY", ""),
		ChapaCallbackURL: getEnv("CHAPA_CALLBACK_URL", ""),
		ChapaReturnURL:   getEnv("CHAPA_RETURN_URL", ""),

		SMTPHost: getEnv("SMTP_HOST", ""),
		SMTPPort: getEnv("SMTP_PORT", "587"),
		SMTPUser: getEnv("SMTP_USER", ""),
		SMTPPass: getEnv("SMTP_PASS", ""),
		SMTPFrom: getEnv("SMTP_FROM", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func mustGetEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("%s environment variable is required", key)
	}
	return value
}
