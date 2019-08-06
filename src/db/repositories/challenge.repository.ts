import { TextChannel, User } from 'discord.js';
import { AbstractRepository } from 'typeorm';

import { ChallengeEntity, ChallengeStatusEntity } from '../entities';


export class ChallengeRepository extends AbstractRepository<ChallengeEntity> {
	async createNewChallenge(challenger: User,
		challenged: User,
		textChannel: TextChannel,
		originalDescription: string,
		translatedDescription: string): Promise<void> {

		const newChallenge = new ChallengeEntity();

		newChallenge.challengerUserId = challenger.id;
		newChallenge.challengedUserId = challenged.id;
		newChallenge.textChannelId = textChannel.id;
		newChallenge.originalDescription = originalDescription;
		newChallenge.translatedDescription = translatedDescription;
		newChallenge.status = ChallengeStatusEntity.PendingAccept;

		await this.manager.save(newChallenge);
		return;
	}

	async getActiveChallenge(author: User) {
		return await this.repository.findOne({ challengedUserId: author.id });
	}

	async setBetLimit(author: User, betLimit: number): Promise<void> {
		const activeChallenge = await this.getActiveChallenge(author);
		if (!activeChallenge) { return; }

		activeChallenge.betLimit = betLimit;
		activeChallenge.status = ChallengeStatusEntity.PendingBets;
		await this.repository.save(activeChallenge);
		return;
	}

	async declineChallenge(author: User): Promise<void> {
		const activeChallenge = await this.getActiveChallenge(author);
		if (!activeChallenge) { return; }

		activeChallenge.status = ChallengeStatusEntity.Declined;
		await this.repository.save(activeChallenge);
		return;
	}

}
