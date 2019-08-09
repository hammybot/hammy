import { Client, Message } from 'discord.js';

export const WATOChallenge = (msg: Message) => {
	const challenger = msg.author;
	const challenged = msg.mentions.users.values().next().value;
	console.log(`${challenged.username} has been challenged by ${challenger.username}!!!`);

	// Validation:
	// - Both users cannot be in an active challenge (waiting for challenge response or bet response)
	// - You can't challenge a bot ( not yet :) )
	// - You must provide challenge text, i.e. "What are the odds 'that you {Challenge}?'"

	// Create a new challenge entry in database
	// - Challenges table
	//   - Id							-> Primary Key (auto indexed)
	//   - ChallengerId					-> Challenger user's discord id
	//   - ChallengedId					-> Challenged user's discord id
	//   - ChannelId					-> Originating text channel where the challenge started in
	//   - OriginalDescription			-> Original challenge text from discord message
	//   - TranslatedDescription		-> Displayed message text after translating key words (like you -> username)
	//   - Status						-> PND (Pending challenged user's response), BET (Pending user bets),
	//                                  -> DEC (Declined challenge), CMP (Challenge completed)
	//   - BetLimit						-> Max number that can be selected for a bet
	//   - ChallengerBet				-> Number chosen by the challenger user
	//   - ChallengedBet				-> Number chosen by the challenged user

	// Note to challenged user of how to respond? Mention the help command?
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
