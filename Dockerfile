FROM golang:1.19-bullseye as builder

WORKDIR /app

COPY . ./

RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o ./hammy ./cmd/hammy

FROM gcr.io/distroless/static-debian11

COPY --from=builder /app/hammy .

ENTRYPOINT ["./hammy"]