Hammy
=========
Modular bot built for discord w/ Node and [discord.js](https://github.com/discordjs/discord.js) .

## Setting up hammy w/ Docker (local dev)

* Clone the hammy git repo
* Create a `.env` file using the `.env.example` template and modify the following:
  * **DISCORD_BOT_TOKEN**: Create a discord application and bot token for development testing [here](https://discordapp.com/developers/applications/)
  * **PGUSER**: If local, usually will be [default](https://chartio.com/resources/tutorials/how-to-set-the-default-user-password-in-postgresql/)
  * **PGPASSWORD**: If local, usually will be [default](https://chartio.com/resources/tutorials/how-to-set-the-default-user-password-in-postgresql/)
* Download [Docker](https://docs.docker.com/install/)
* Open a terminal and navigate to the root of the `hammy` directory
* Run `docker-compose up -d`
  * This will run both the hammy discord bot, as well as the database
* Initalize the database by running `yarn run db:create-all`
* To stop the bot, run `docker-compose down`
> **Note:** Running `docker-compose down` will not delete the local database, it will just bring down the PostgreSQL database engine. If you want to clear out the database you can use `npm run db:drop-all` or `npm run db:drop-schema` depending on what you want to drop.

> **Note** If you're not using docker to run the bot, you will need to install [ffmpeg](https://www.ffmpeg.org/) for some features
