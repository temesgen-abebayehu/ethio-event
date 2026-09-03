# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Cache dependencies first
COPY go.mod go.sum ./
RUN go mod download

# Build the binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/main.go

# Runtime stage — golang-alpine already includes ca-certificates
FROM golang:1.25-alpine

WORKDIR /app
COPY --from=builder /app/server .
COPY --from=builder /app/templates ./templates

EXPOSE 3001
CMD ["./server"]
