FROM golang:1.23 AS builder

WORKDIR /app

COPY . .

RUN go mod download

#RUN GOOS=linux GOARCH=amd64 go build -buildvcs=false -o /app/hammy ./cmd/hammy
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -tags netgo -o /app/hammy ./cmd/hammy

FROM alpine:latest

RUN apk add --no-cache \
    wget \
    chromium \
    && ln -s /usr/bin/chromium-browser /usr/bin/google-chrome

WORKDIR /app

COPY --from=builder /app/hammy .

RUN ls -la .
RUN chmod +x /app/hammy

CMD ["/app/hammy"]