workflow "Build and Deploy" {
  on = "push"
  resolves = [
    "Push image to Docker Hub",
  ]
}

action "Build Docker image" {
  uses = "actions/docker/cli@master"
  env = {
    DOCKER_USERNAME = "moosebot"
    APPLICATION_NAME = "hammy"
  }
  args = ["build", "-t", "$DOCKER_USERNAME/$APPLICATION_NAME:$(echo $GITHUB_SHA | head -c7)", "."]
}

action "Docker Login" {
  uses = "actions/docker/login@master"
  secrets = ["DOCKER_USERNAME", "DOCKER_PASSWORD"]
}

action "Push image to Docker Hub" {
  needs = ["Docker Login", "Build Docker image"]
  uses = "actions/docker/cli@master"
  env = {
    DOCKER_USERNAME = "moosebot"
    APPLICATION_NAME = "hammy"
  }
  args = ["push", "$DOCKER_USERNAME/$APPLICATION_NAME"]
}
