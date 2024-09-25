# Variables
DockerFile := docker-compose-dev.yml
DockerGpu := docker-compose-dev-gpu.yml
ContainerName := ollama
ModelName := hammy

.PHONY: start start-gpu up down delete setup_models

# Start services and setup models for CPU
start: up setup_models
	@echo "Services started and models set up."

# Start services and setup models for GPU
start-gpu: up-gpu setup_models
	@echo "Services started with GPU and models set up."

# Bring up the CPU services
up:
	@echo "Starting services using ${DockerFile}..."
	docker compose -f ${DockerFile} up -d

# Bring up the GPU services
up-gpu:
	@echo "Starting services using ${DockerGpu}..."
	docker compose -f ${DockerGpu} up -d

# Bring down the CPU services
down:
	@echo "Stopping services using ${DockerFile}..."
	docker compose -f ${DockerFile} down

# Bring down the GPU services
down-gpu:
	@echo "Stopping services using ${DockerGpu}..."
	docker compose -f ${DockerGpu} down

# Delete a specific model
delete:
	@echo "Deleting model ${ModelName}..."
	docker exec ${ContainerName} ollama rm ${ModelName}

# Set up models in the container
setup_models:
	@echo "Setting up model ${ModelName}..."
	docker exec ${ContainerName} ollama create ${ModelName} -f /models/${ModelName}.modelfile
