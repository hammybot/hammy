import { Client, Message, User } from 'discord.js';

import { createNewChallenge, getUserActiveChallenge } from './db/wato-db';
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

export const WATOChallengeResponse = (msg: Message) => {
	// Validation:
	// - There must be an active challenge issued to the author by the mentioned user in the message
	// - The value responded for the BetLimit must be a number >= 1 and <= Number.MAX_SAFE_INTEGER
	// nine quadrillion, seven trillion, one hundred ninety nine billion, two hundred fifty four million,
	// seven hundred forty thousand, nine hundred ninety one

	// If the challenge is accepted
	// - Set the "BetLimit" for the active challenge for that author
	// - Set the status of the challenge to BET
	// - Send DM's to both participants asking for a bet

	// Note to challenged user of how to respond? Mention the help command?
	// challenger.send(`Active challenge from: ${challenged.username}`);
	// challenged.send(`Active challenge from: ${challenger.username}`);


	// If the challenge is declined
	// - Set the status of the challenge to DEC
	// - Respond to text channel announcing the official declining of the challenge
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
