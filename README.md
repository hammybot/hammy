Hammy
=========
Bot built for discord w/ Node and [discord.js](https://github.com/discordjs/discord.js) .

## Setting up hammy w/ Docker (local dev)

* Clone the hammy git repo
* Create a `.env` file using the `.env.example` template and modify the following:
  * **DISCORD_BOT_TOKEN**: Create a discord application and bot token for development testing [here](https://discordapp.com/developers/applications/)
* Install [Yarn](https://yarnpkg.com/getting-started/install)
* Run `yarn run build && yarn start`

> **Note:** If you're not using docker to run the bot, you will need to install [ffmpeg](https://www.ffmpeg.org/) for some features
