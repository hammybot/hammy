MODEL:=llama3.1

.PHONY: start
start:
	docker-compose up -d

.PHONY: down
down:
	docker-compose down