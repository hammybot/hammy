.PHONY: start
start:
	docker-compose up -d

.PHONY: down
down:
	docker-compose down

.PHONY: setup
setup:
	docker exec ollama /hammy/configure.sh

.PHONY: rebuild
rebuild:
	docker exec ollama ollama rm hammy
	docker compose up -d --force-recreate ollama
	make setup