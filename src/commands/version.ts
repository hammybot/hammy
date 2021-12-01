import { CommandInteraction } from "discord.js";
import { Discord, Slash } from "discordx";
import packageJson from "../../package.json";

@Discord()
export abstract class VersionCommand {
	@Slash("version", { description: "Returns the runtime version of Hammy" })
	async getVersions(interaction: CommandInteraction): Promise<void> {
		await interaction.reply(`**NodeJS:** ${process.version}\n**Hammy:** ${packageJson.version}`)
	}
}
