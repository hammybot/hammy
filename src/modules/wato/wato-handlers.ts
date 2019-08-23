import { Client, Message, User } from 'discord.js';

import { REGEX } from '../../utils';

import { createNewChallenge, declineChallenge, getUserActiveChallenge, setBetLimit } from './db/wato-db';
import { Challenge } from './models/challenge';
import { ChallengeStatus } from './models/challenge-status';

export const WATOChallenge = async (msg: Message) => {
	const challenger = msg.author;
	const challenged = msg.mentions.users.values().next().value as User;

	if (challenger.bot || challenged.bot) {
		await msg.channel.send(`Hey <@${challenger.id}>! Bot's can't play the odds game...`);
		return;
	}

	const challengedActiveChallenge = await getUserActiveChallenge(challenged);
	if (challengedActiveChallenge) {
		await msg.channel.send(`<@${challenged.id}> is currently in a challenge! They need to finish that one first.`);
		return;
	}

	const challengerActiveChallenge = await getUserActiveChallenge(challenger);
	if (challengerActiveChallenge) {
		await msg.channel.send(`You're currently in a challenge! Finish that one first.`);
		return;
	}

	const challenge: Challenge = {
		ChallengerId: challenger.id,
		ChallengedId: challenged.id,
		ChannelId: msg.channel.id,
		Description: msg.cleanContent,
		Status: ChallengeStatus.PendingAccept
	};

	await createNewChallenge(challenge);
};

export const WATOChallengeResponse = async (msg: Message) => {
	const challengeResponse = msg.cleanContent.match(REGEX.VALID_NUMBER);
	if (!challengeResponse || !challengeResponse[0]) { return; }

	const betLimit = Number(challengeResponse[0]);

	const activeChallenge = await getUserActiveChallenge(msg.author);
	if (!activeChallenge ||
		activeChallenge.Status !== ChallengeStatus.PendingAccept ||
		activeChallenge.ChallengedId !== msg.author.id) { return; }

	if (!Number.isSafeInteger(betLimit) || betLimit <= 1 || betLimit > Number.MAX_SAFE_INTEGER) {
		await msg.channel.send(`
			<@${msg.author.id}> Your bet needs to be between 1 and 9,007,199,254,740,991
		`);
		return;
	}

	await setBetLimit(activeChallenge, betLimit);

	const challenger = msg.guild.members.get(activeChallenge.ChallengerId);
	const challenged = msg.guild.members.get(activeChallenge.ChallengedId);

	if (!challenger || !challenged) { return; }

	challenger.send(`Place your bet for your odds challenge with ${challenged.user.username}`);
	challenged.send(`Place your bet for your odds challenge with ${challenger.user.username}`);
};

export const WATOChallengeDecline = async (msg: Message) => {
	const activeChallenge = await getUserActiveChallenge(msg.author);
	if (!activeChallenge ||
		activeChallenge.Status !== ChallengeStatus.PendingAccept ||
		activeChallenge.ChallengedId !== msg.author.id) { return; }

	console.log(`${msg.author.username} has declined a challenge`);

	await declineChallenge(activeChallenge);

	await msg.channel.send(`
		<@${msg.author.id}> has declined the challenge from <@${activeChallenge.ChallengerId}>
	`);
};

export const WATOBetResponse = (msg: Message) => {
	// Validation:
	// - Must be a direct message to hammy
	// - There must be an active challenge issued to the author by the mentioned user in the message
	// - The value responded for the bet must be a number >= 1 and <= activeChallenge.BetLimit

	// Set the correct bet column on the database
	// If both bets are now set
	// - set the challenge in database to CMP
	// - Archive the data in a separate table and remove from active table??
	// - then send the results to the original text channel
};

export const WATOLeaderboard = (msg: Message) => {
	// Display leaderboard of all challenges for all users in that text channel
};

export const WATOUserStats = (msg: Message) => {
	// Display detailed stats of specified user's challenges
};

export const WATOHistory = (msg: Message) => {
	// Show recent WATO history of challenges
};

export const WATOHelp = (msg: Message) => {
	// Respond to user's asking for help, with specific instructions depending on the status of their challenge
};

const _WATOResults = (client: Client) => {
	// Send the results to the correct channel with all info about completed challenge and winner
	// If the two bets match, then the winner is the challenger, otherwise the winner is the challenged
};
