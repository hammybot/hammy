Hammy
=========
Bot built for Discord w/ Golang and [discordgo](https://github.com/bwmarrin/discordgo).

## Running hammy (local)

* Clone the repo
* Install [Golang](https://go.dev/dl/)
* Set environment variables (see [.env](./.env.example) file):
  * **DISCORD_BOT_TOKEN**: Create a discord application and bot token for development testing [here](https://discordapp.com/developers/applications/)
* Start docker dev (make option available)
* Run bot with `go run` command

## GPU acceleration
Hammy runs ML models in Ollama. The `docker-compose-dev.yml` file starts up an ollama container without gpu access. 
If you have an nvidia gpu and would like to use the gpu acceleration run `make up-gpu` instead which will allow 
the container to use the gpu as long as you have the [nvidia container toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) installed

Hammy does not currently support AMD gpu acceleration.

```bash
make up
go run ./cmd/hammy/
```
