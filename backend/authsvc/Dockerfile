# Build stage
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod ./
COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o authsvc .

# Final stage
FROM gcr.io/distroless/static-debian11
WORKDIR /
COPY --from=builder /app/authsvc .
EXPOSE 8081
CMD ["./authsvc"]
