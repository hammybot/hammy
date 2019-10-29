import { Client, GuildMember, RichEmbed, User } from 'discord.js';

import { Challenge } from './models/challenge';
import { ChallengeStatus } from './models/challenge-status';

const getChallengeStatusText = (challengeStatus: ChallengeStatus, challengedUser: User): string => {
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
};

const getChallengeStatusColor = (challengeStatus: ChallengeStatus): string => {
	switch (challengeStatus) {
		case ChallengeStatus.Declined:
			return '#ff2821';
		case ChallengeStatus.PendingAccept:
			return '#fff821';
		default:
			return '#4dff21';
	}
};

export const createWatoStatusEmbed = async (challenge: Challenge, client: Client): Promise<RichEmbed> => {
	const challengerUser = await client.fetchUser(challenge.ChallengerId);
	const challengedUser = await client.fetchUser(challenge.ChallengedId);

	return new RichEmbed()
		.setColor(getChallengeStatusColor(challenge.Status))
		.setTitle(`\`${challengerUser.username}\` has challenged \`${challengedUser.username}\` to a game of odds!`)
		.setDescription(`\`\`\`${challenge.Description}\`\`\``)
		.addField('**Status**', getChallengeStatusText(challenge.Status, challengedUser));
};

export const createWatoResultsEmbed = async (winnerId: string, challenge: Challenge, client: Client): Promise<RichEmbed> => {
	const winnerWasChallenger = winnerId === challenge.ChallengerId;

	const winningUser = await client.fetchUser(winnerId);
	const losingUser = await client.fetchUser(
		winnerWasChallenger ? challenge.ChallengedId : challenge.ChallengerId
	);

	const winningBet = winnerWasChallenger ? challenge.ChallengerBet : challenge.ChallengedBet;
	const losingBet = winnerWasChallenger ? challenge.ChallengedBet : challenge.ChallengerBet;

	return new RichEmbed()
		.setColor('#0099ff')
		.setTitle(`\`${winningUser.username}\` has defeated \`${losingUser.username}\` in a game of odds!`)
		.setDescription(`\`\`\`${challenge.Description}\`\`\``)
		.setThumbnail(`${winningUser.displayAvatarURL}`)
		.addField(`${winningUser.username}'s bet`, `${winningBet}`, true)
		.addField(`${losingUser.username}'s bet`, `${losingBet}`, true);
};

export const createWatoDmEmbed = (username: string, betLimit: number): RichEmbed => {
	return new RichEmbed()
		.setColor('#ffffff')
		.setTitle(`WATO Challenge - Bet Limit: ${betLimit}`)
		.setDescription(`Place your bet for your odds challenge with ${username}`);
};

export const createWatoValidationEmbed = (errMessage: string): RichEmbed => {
	return new RichEmbed()
		.setColor('#ff2821')
		.setTitle(`WATO Error`)
		.setDescription(`${errMessage}`);
};