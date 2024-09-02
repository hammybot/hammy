Hammy
=========
Bot built for Discord w/ Golang and [discordgo](https://github.com/bwmarrin/discordgo).

## Running hammy (local)

* Clone the repo
* Install [Golang](https://go.dev/dl/)
* Set environment variables:
  * **DISCORD_BOT_TOKEN**: Create a discord application and bot token for development testing [here](https://discordapp.com/developers/applications/)
* Start docker dev (make option available)
* Run bot with `go run` command

```bash
make up
go run ./cmd/hammy/
```

