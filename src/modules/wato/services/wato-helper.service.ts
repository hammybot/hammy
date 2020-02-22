import { Client, GuildMember, RichEmbed, User } from 'discord.js';
import { injectable } from 'inversify';

import { Challenge } from '../models/challenge';
import { ChallengeStatus } from '../models/challenge-status';

const QUESTION_MARK_ICON = 'https://i.imgur.com/DbxSPZy.png';

@injectable()
export class WatoHelperService {
	async createWatoStatusEmbed(
		challengerUser: GuildMember, challengedUser: GuildMember, status: ChallengeStatus, description: string
	): Promise<RichEmbed> {
		return new RichEmbed()
			.setColor(this.getChallengeStatusColor(status))
			.setTitle(`__${challengerUser.displayName}__ has challenged __${challengedUser.displayName}__ to a game of odds!`)
			.setDescription(`\`\`\`${description}\`\`\``)
			.addField('**Status**', this.getChallengeStatusText(status, challengedUser))
			.setFooter(this.getHelpFooterText(), QUESTION_MARK_ICON);
	}

	async createWatoResultsEmbed(winningUser: GuildMember, losingUser: GuildMember, challenge: Challenge): Promise<RichEmbed> {
		const winnerWasChallenger = winningUser.id === challenge.ChallengerId;

		const winningBet = Number(winnerWasChallenger ? challenge.ChallengerBet : challenge.ChallengedBet);
		const losingBet = Number(winnerWasChallenger ? challenge.ChallengedBet : challenge.ChallengerBet);

		return new RichEmbed()
			.setColor('#0099ff')
			.setTitle(`__${winningUser.displayName}__ has defeated __${losingUser.displayName}__ in a game of odds!`)
			.setDescription(`\`\`\`${challenge.Description}\`\`\``)
			.setThumbnail(`${winningUser.user.displayAvatarURL}`)
			.addField(`${winningUser.displayName}'s bet`, `${winningBet.toLocaleString()}`, true)
			.addField(`${losingUser.displayName}'s bet`, `${losingBet.toLocaleString()}`, true);
	}

	createWatoDmEmbed(username: string, betLimit: number, challenge: Challenge): RichEmbed {
		return new RichEmbed()
			.setColor('#ffffff')
			.setTitle(`__${username}__ challenged you!`)
			.setDescription(`\`\`\`${challenge.Description}\`\`\``)
			.addField(`**Status**`, `Respond here with a whole number between 1 and ${betLimit.toLocaleString()}`, true)
			.setFooter(this.getHelpFooterText(), QUESTION_MARK_ICON);
	}

	createWatoValidationEmbed(errMessage: string): RichEmbed {
		return new RichEmbed()
			.setColor('#ff2821')
			.setTitle(`WATO Error`)
			.setDescription(`${errMessage}`)
			.setFooter(this.getHelpFooterText(), QUESTION_MARK_ICON);
	}

	createGenericWatoHelpMessage(authorUsername: string, botUsername: string): RichEmbed {
		return new RichEmbed()
			.setColor('#1ed8f7')
			.setTitle('How to Play WATO (What are the Odds?)')
			.addField(
				'**1. Challenge someone by mentioning them like below:**',
				`\`@${botUsername} what are the odds that you challenge me?\``
			)
			.addField(
				'**2a. The challenged player will respond mentioning you and with an odd:**',
				`\`@${authorUsername} 10,000\``
			)
			.addField(
				'**2b. The challenged player can also decline the challenge like below:**',
				`\`@${authorUsername} decline\``
			)
			.addField(
				'**3. If an odd was given, I\'ll DM both of you asking for a bet! Just respond with a number.**',
				`\`100\``
			)
			.addField(
				'**4. Once both players have bet, I\'ll respond in the original channel with the winner!**',
				'If the challenged player guesses the same number as you, you win!'
			);
	}

	createWaitingOnOpponentAcceptHelpMessage(author: User, opponent: User): RichEmbed {
		return new RichEmbed()
			.setColor('#1ed8f7')
			.setTitle('WATO Help - You\'re in an active challenge!')
			.addField(
				`**You\'re waiting for ${opponent.username} to accept or decline!**`,
				`\`@${author.username} 1326\``
			);
	}

	createWaitingOnAuthorAcceptHelpMessage(opponent: User): RichEmbed {
		return new RichEmbed()
			.setColor('#1ed8f7')
			.setTitle('WATO Help - You\'re in an active challenge!')
			.addField(
				`**You need to respond to the challenge from ${opponent.username}**`,
				`\`@${opponent.username} 1326\``
			);
	}

	createWaitingOnOpponentBetHelpMessage(opponent: User): RichEmbed {
		return new RichEmbed()
			.setColor('#1ed8f7')
			.setTitle('WATO Help - You\'re in an active challenge!')
			.addField(
				`**You\'re waiting for ${opponent.username}'s bet**`,
				`They need to answer my DM`
			);
	}

	createWaitingOnAuthorBetHelpMessage(): RichEmbed {
		return new RichEmbed()
			.setColor('#1ed8f7')
			.setTitle('WATO Help - You\'re in an active challenge!')
			.addField(
				`**You need to respond with a bet to my DM! Just respond with a number.`,
				`\`100\``
			);
	}

	private getChallengeStatusText(challengeStatus: ChallengeStatus, challengedUser: GuildMember): string {
		switch (challengeStatus) {
			case ChallengeStatus.Declined:
				return `<@${challengedUser.id}> declined :frowning:`;
			case ChallengeStatus.PendingAccept:
				return `Waiting on response from <@${challengedUser.id}>`;
			case ChallengeStatus.PendingBets:
				return 'Game on!';
			default:
				return 'Game is complete!';
		}
	}

	private getChallengeStatusColor(challengeStatus: ChallengeStatus): string {
		switch (challengeStatus) {
			case ChallengeStatus.Declined:
				return '#ff2821';
			case ChallengeStatus.PendingAccept:
				return '#fff821';
			default:
				return '#4dff21';
		}
	}

	private getHelpFooterText(): string {
		return 'Need help? Just type !wato';
	}
}
