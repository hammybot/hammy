import { TextChannel } from 'discord.js';
import 'mocha';
import 'reflect-metadata';
import * as TypeMoq from 'typemoq';
import { IMock, Times } from 'typemoq';

import { DiscordMessage, PredicateHelper, REGEX } from '../../../utils';
import { WATODatabase } from '../db/wato-database';
import { ChallengeStatus } from '../models/challenge-status';
import { WatoHelperService } from '../services/wato-helper.service';

import { WATOBetMessageHandler } from './wato-bet.handler';

describe('WATO Bet Handler', () => {
	const fakeValidationMessage = { 'validationError': true };
	const fakeResultMessage = { 'message': 'test' };
	let mockPredicateHelper: IMock<PredicateHelper>;
	let mockWatoDatabase: IMock<WATODatabase>;
	let mockWatoHelperService: IMock<WatoHelperService>;

	let mockMessage: IMock<DiscordMessage>;
	let mockChannel: IMock<TextChannel>;

	let sut: WATOBetMessageHandler;
	beforeEach(() => {
		mockPredicateHelper = TypeMoq.Mock.ofType(PredicateHelper);
		mockWatoDatabase = TypeMoq.Mock.ofType(WATODatabase);
		mockWatoHelperService = TypeMoq.Mock.ofType(WatoHelperService);
		mockMessage = TypeMoq.Mock.ofType(DiscordMessage);
		mockChannel = TypeMoq.Mock.ofInstance({ id: '123', send: () => { }, type: '' as any } as TextChannel);

		sut = new WATOBetMessageHandler(mockPredicateHelper.object, mockWatoDatabase.object, mockWatoHelperService.object);
	});

	afterEach(() => {
		mockPredicateHelper.reset();
		mockWatoDatabase.reset();
		mockWatoHelperService.reset();
		mockMessage.reset();
		mockChannel.reset();
	});

	describe('Setting up Predicate', () => {
		it('sets up channel type predicate of dm', async () => {
			sut.createHandlerPredicate();

			mockPredicateHelper.verify(
				mp => mp.createChannelTypePredicate(TypeMoq.It.isValue('dm')),
				Times.once()
			);
		});

		it('sets up regex predicate for a valid number', async () => {
			sut.createHandlerPredicate();

			mockPredicateHelper.verify(
				mp => mp.createRegexPredicate(TypeMoq.It.isValue(REGEX.VALID_NUMBER)),
				Times.once()
			);
		});
	});

	describe('Handle Message', () => {
		const challenger = { id: '1' };
		const challenged = { id: '2' };

		beforeEach(() => {
			mockMessage.setup(md => md.getChannel()).returns(() => mockChannel.object);
			mockWatoHelperService.setup(helper => helper.createWatoValidationEmbed(TypeMoq.It.isAny()))
				.returns(() => fakeValidationMessage as any);
		});

		it('if not in an active challenge, no bet is set', async () => {
			mockWatoDatabase.setup(db => db.getUserActiveChallenge(TypeMoq.It.isAny())).returns(() => undefined as any);
			await sut.handleMessage(createMockWatoMessage(true, 100));

			mockWatoDatabase.verify(
				mock => mock.setChallengerBet(TypeMoq.It.isAny(), TypeMoq.It.isAny()),
				Times.never()
			);

			mockWatoDatabase.verify(
				mock => mock.setChallengedBet(TypeMoq.It.isAny(), TypeMoq.It.isAny()),
				Times.never()
			);
		});

		it('if no bet limit is set, no bet is set', async () => {
			mockWatoDatabase.setup(db => db.getUserActiveChallenge(TypeMoq.It.isAny())).returns(() => {
				return { BetLimit: undefined } as any;
			});
			await sut.handleMessage(createMockWatoMessage(false, 100));

			mockWatoDatabase.verify(
				mock => mock.setChallengerBet(TypeMoq.It.isAny(), TypeMoq.It.isAny()),
				Times.never()
			);

			mockWatoDatabase.verify(
				mock => mock.setChallengedBet(TypeMoq.It.isAny(), TypeMoq.It.isAny()),
				Times.never()
			);
		});

		it('if challenge status is not pending bets, no bet is set', async () => {
			mockWatoDatabase.setup(db => db.getUserActiveChallenge(TypeMoq.It.isAny())).returns(() => {
				return { BetLimit: 10, Status: ChallengeStatus.Declined } as any;
			});
			await sut.handleMessage(createMockWatoMessage(false, 100));

			mockWatoDatabase.verify(
				mock => mock.setChallengerBet(TypeMoq.It.isAny(), TypeMoq.It.isAny()),
				Times.never()
			);

			mockWatoDatabase.verify(
				mock => mock.setChallengedBet(TypeMoq.It.isAny(), TypeMoq.It.isAny()),
				Times.never()
			);
		});

		it('validation fails when bet is set to 1', async () => {
			mockActiveChallenge();
			await sut.handleMessage(createMockWatoMessage(false, 1));

			assertThatValidationHasFailed();
		});

		it('validation fails when bet is less than 1', async () => {
			mockActiveChallenge();
			await sut.handleMessage(createMockWatoMessage(true, 0));

			assertThatValidationHasFailed();
		});

		it('validation fails when bet is greater than bet limit', async () => {
			mockActiveChallenge();
			await sut.handleMessage(createMockWatoMessage(false, 101));

			assertThatValidationHasFailed();
		});

		it('if author is challenger, set\'s the challenger bet and responds with confirmation', async () => {
			mockActiveChallenge();
			await sut.handleMessage(createMockWatoMessage(true, 99));

			mockWatoDatabase.verify(
				mock => mock.setChallengerBet(TypeMoq.It.isAny(), TypeMoq.It.isValue(99)),
				Times.once()
			);
			mockChannel.verify(
				mock => mock.send(TypeMoq.It.isAny()),
				Times.once()
			);
		});

		it('if author is challenged user, set\'s the challenged bet and responds with confirmation', async () => {
			mockActiveChallenge();
			await sut.handleMessage(createMockWatoMessage(false, 99));

			mockWatoDatabase.verify(
				mock => mock.setChallengedBet(TypeMoq.It.isAny(), TypeMoq.It.isValue(99)),
				Times.once()
			);
			mockChannel.verify(
				mock => mock.send(TypeMoq.It.isAny()),
				Times.once()
			);
		});

		it('if challenger\'s bet matches the challenged user\'s bet, complete the game with challenger as the winner', async () => {
			mockActiveChallenge(80, 80);
			await sut.handleMessage(createMockWatoMessage(false, 80));

			mockWatoDatabase.verify(
				mock => mock.completeChallenge(TypeMoq.It.isAny(), TypeMoq.It.isValue('1')),
				Times.once()
			);
		});

		it('if challenger\'s bet doesn\'t match the challenged user\'s bet, complete the game with challenged as the winner', async () => {
			mockActiveChallenge(22, 80);
			await sut.handleMessage(createMockWatoMessage(true, 22));

			mockWatoDatabase.verify(
				mock => mock.completeChallenge(TypeMoq.It.isAny(), TypeMoq.It.isValue('2')),
				Times.once()
			);
		});

		it('sends out a result message when game is complete to original channel', async () => {
			mockMessage.setup(md => md.getClientChannel(TypeMoq.It.isAny())).returns(() => mockChannel.object);
			mockWatoHelperService.setup(
				mock => mock.createWatoResultsEmbed(TypeMoq.It.isValue('1'), TypeMoq.It.isAny(), TypeMoq.It.isAny())
			).returns(() => fakeResultMessage as any);

			mockActiveChallenge(80, 80);
			await sut.handleMessage(createMockWatoMessage(false, 80));

			mockChannel.verify(
				mock => mock.send(TypeMoq.It.isValue(fakeResultMessage)),
				Times.once()
			);
		});

		function createMockWatoMessage(isChallenger: boolean, bet: number) {
			mockMessage.setup(msg => msg.getAuthorUser()).returns(() => {
				return isChallenger ? challenger : challenged as any;
			});
			mockMessage.setup(mock => mock.getCleanContent()).returns(() => `${bet}`);

			return mockMessage.object;
		}

		function assertThatValidationHasFailed() {
			mockWatoHelperService.verify(
				mock => mock.createWatoValidationEmbed(TypeMoq.It.isAny()),
				TypeMoq.Times.once()
			);
			mockChannel.verify(
				mock => mock.send(TypeMoq.It.isValue(fakeValidationMessage)),
				TypeMoq.Times.once()
			);
		}

		function mockActiveChallenge(challengerBet?: number, challengedUserBet?: number) {
			mockWatoDatabase.setup(db => db.getUserActiveChallenge(TypeMoq.It.isAny())).returns(() => {
				return {
					BetLimit: 100,
					Status: ChallengeStatus.PendingBets,
					ChallengerId: challenger.id,
					ChallengedId: challenged.id,
					ChallengerBet: challengerBet,
					ChallengedBet: challengedUserBet
				} as any;
			});
		}
	});
});
