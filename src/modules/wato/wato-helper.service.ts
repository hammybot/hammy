import { Client, RichEmbed, User } from 'discord.js';
import { injectable } from 'inversify';

import { Challenge } from './models/challenge';
import { ChallengeStatus } from './models/challenge-status';

const QUESTION_MARK_ICON = 'https://i.imgur.com/DbxSPZy.png';

@injectable()
export class WatoHelperService {
	async createWatoStatusEmbed(challenge: Challenge, client: Client): Promise<RichEmbed> {
		const challengerUser = await client.fetchUser(challenge.ChallengerId);
		const challengedUser = await client.fetchUser(challenge.ChallengedId);

		return new RichEmbed()
			.setColor(this.getChallengeStatusColor(challenge.Status))
			.setTitle(`__${challengerUser.username}__ has challenged __${challengedUser.username}__ to a game of odds!`)
			.setDescription(`\`\`\`${challenge.Description}\`\`\``)
			.addField('**Status**', this.getChallengeStatusText(challenge.Status, challengedUser))
			.setFooter(this.getHelpFooterText(), QUESTION_MARK_ICON);
	}

	async createWatoResultsEmbed(winnerId: string, challenge: Challenge, client: Client): Promise<RichEmbed> {
		const winnerWasChallenger = winnerId === challenge.ChallengerId;

		const winningUser = await client.fetchUser(winnerId);
		const losingUser = await client.fetchUser(
			winnerWasChallenger ? challenge.ChallengedId : challenge.ChallengerId
		);

		const winningBet = winnerWasChallenger ? challenge.ChallengerBet : challenge.ChallengedBet;
		const losingBet = winnerWasChallenger ? challenge.ChallengedBet : challenge.ChallengerBet;

		return new RichEmbed()
			.setColor('#0099ff')
			.setTitle(`__${winningUser.username}__ has defeated __${losingUser.username}__ in a game of odds!`)
			.setDescription(`\`\`\`${challenge.Description}\`\`\``)
			.setThumbnail(`${winningUser.displayAvatarURL}`)
			.addField(`${winningUser.username}'s bet`, `${winningBet}`, true)
			.addField(`${losingUser.username}'s bet`, `${losingBet}`, true);
	}

	createWatoDmEmbed(username: string, betLimit: number, challenge: Challenge): RichEmbed {
		return new RichEmbed()
			.setColor('#ffffff')
			.setTitle(`__${username}__ challenged you!`)
			.setDescription(`\`\`\`${challenge.Description}\`\`\``)
			.addField(`**Status**`, `Respond here with a number between 1 and ${betLimit}`, true)
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
				`\`@${authorUsername} what are the odds that you challenge me?\``
			)
			.addField(
				'**2a. The challenged player will respond mentioning you and with an odd:**',
				`\`@${botUsername} 1326\``
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

	private getChallengeStatusText(challengeStatus: ChallengeStatus, challengedUser: User): string {
		switch (challengeStatus) {
			case ChallengeStatus.Declined:
				return `<@${challengedUser.id}> declined :frowning:`;
			case ChallengeStatus.PendingAccept:
				return `Waiting on odds from <@${challengedUser.id}>`;
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
