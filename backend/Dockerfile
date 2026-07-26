FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o /api-server ./cmd/api

FROM alpine:latest
WORKDIR /app
RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /api-server ./
COPY .env ./

EXPOSE 8080
CMD ["/app/api-server"]
