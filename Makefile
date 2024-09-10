DockerFile:= "docker-compose-dev.yml"

.PHONY: up
up:
	docker-compose -f ./${DockerFile} up -d

.PHONY: down
down:
	docker-compose -f ./${DockerFile} down

.PHONY: delete
delete:
	docker exec ollama ollama rm hammy