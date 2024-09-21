DockerFile:= "docker-compose-dev.yml"

.PHONY: start up stop delete setup_models

start: up setup_models

up:
	docker compose -f ./${DockerFile} up -d

down:
	docker compose -f ./${DockerFile} down

delete:
	docker exec ollama ollama rm hammy

setup_models:
	docker exec ollama ollama create hammy -f /models/hammy.modelfile