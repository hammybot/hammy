import { User } from 'discord.js';
import 'mocha';
import 'reflect-metadata';
import * as TypeMoq from 'typemoq';
import { IMock, Times } from 'typemoq';

import { DiscordMessage, PredicateHelper, REGEX } from '../../../utils';
import { WATODatabase } from '../db/wato-database';
import { Challenge } from '../models/challenge';
import { ChallengeStatus } from '../models/challenge-status';
import { WatoHelperService } from '../services/wato-helper.service';

import { WATOHelpMessageHandler } from './wato-help.handler';

describe('WATOHelpMessageHandler', () => {
	let mockPredicateHelper: IMock<PredicateHelper>;
	let mockWatoDatabase: IMock<WATODatabase>;
	let mockWatoHelperService: IMock<WatoHelperService>;

	let mockMessage: IMock<DiscordMessage>;

	let sut: WATOHelpMessageHandler;
	beforeEach(() => {
		mockPredicateHelper = TypeMoq.Mock.ofType(PredicateHelper);
		mockWatoDatabase = TypeMoq.Mock.ofType(WATODatabase);
		mockWatoHelperService = TypeMoq.Mock.ofType(WatoHelperService);
		mockMessage = TypeMoq.Mock.ofType(DiscordMessage);

		sut = new WATOHelpMessageHandler(mockPredicateHelper.object, mockWatoDatabase.object, mockWatoHelperService.object);
	});

	afterEach(() => {
		mockPredicateHelper.reset();
		mockWatoDatabase.reset();
		mockMessage.reset();
	});

	describe('Setting up Predicate', () => {
		it('sets up regex predicate for command wato help', async () => {
			sut.createHandlerPredicate();

			mockPredicateHelper.verify(
				mp => mp.createRegexPredicate(TypeMoq.It.isValue(REGEX.WATO_HELP)),
				Times.once()
			);
		});
	});

	describe('Handle Message', () => {
		it('no active challenge, gets generic help message', async () => {
			mockWatoDatabase.setup(mock => mock.getUserActiveChallenge(TypeMoq.It.isAny())).returns(
				() => new Promise<Challenge | null>((resolve) => {
					resolve(null);
				}));
			await sut.handleMessage(createMockMessage(''));

			mockWatoHelperService.verify(mock => mock.createGenericWatoHelpMessage(TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
		});

		it('active challenge, waiting on opponent accepting, gets special context', async () => {
			const fakeChallenge = {
				ChallengerId: '1',
				ChallengedId: '2',
				Status: ChallengeStatus.PendingAccept
			} as Challenge;
			mockWatoDatabase.setup(mock => mock.getUserActiveChallenge(TypeMoq.It.isAny())).returns(
				() => new Promise<Challenge | null>((resolve) => {
					resolve(fakeChallenge);
				}));
			await sut.handleMessage(createMockMessage(fakeChallenge.ChallengerId));

			mockWatoHelperService.verify(
				mock => mock.createWaitingOnOpponentAcceptHelpMessage(TypeMoq.It.isAny(), TypeMoq.It.isAny()),
				TypeMoq.Times.once()
			);
		});

		it('active challenge, waiting on your input, gets special context', async () => {
			const fakeChallenge = {
				ChallengerId: '2',
				ChallengedId: '1',
				Status: ChallengeStatus.PendingAccept
			} as Challenge;
			mockWatoDatabase.setup(mock => mock.getUserActiveChallenge(TypeMoq.It.isAny())).returns(
				() => new Promise<Challenge | null>((resolve) => {
					resolve(fakeChallenge);
				}));
			await sut.handleMessage(createMockMessage(fakeChallenge.ChallengedId));

			mockWatoHelperService.verify(mock => mock.createWaitingOnAuthorAcceptHelpMessage(TypeMoq.It.isAny()), TypeMoq.Times.once());
		});

		it('active challenge, waiting on opponent bet, gets special context', async () => {
			const fakeChallenge = {
				ChallengerId: '1',
				ChallengerBet: 1,
				ChallengedId: '2',
				ChallengedBet: undefined,
				Status: ChallengeStatus.PendingBets
			} as Challenge;
			mockWatoDatabase.setup(mock => mock.getUserActiveChallenge(TypeMoq.It.isAny())).returns(
				() => new Promise<Challenge | null>((resolve) => {
					resolve(fakeChallenge);
				}));
			await sut.handleMessage(createMockMessage(fakeChallenge.ChallengerId));

			mockWatoHelperService.verify(mock => mock.createWaitingOnOpponentBetHelpMessage(TypeMoq.It.isAny()), TypeMoq.Times.once());
		});

		it('active challenge, waiting on your bet, gets special context', async () => {
			const fakeChallenge = {
				ChallengerId: '1',
				ChallengerBet: undefined,
				ChallengedId: '2',
				ChallengedBet: 2,
				Status: ChallengeStatus.PendingBets
			} as Challenge;
			mockWatoDatabase.setup(mock => mock.getUserActiveChallenge(TypeMoq.It.isAny())).returns(
				() => new Promise<Challenge | null>((resolve) => {
					resolve(fakeChallenge);
				}));
			await sut.handleMessage(createMockMessage(fakeChallenge.ChallengerId));

			mockWatoHelperService.verify(mock => mock.createWaitingOnAuthorBetHelpMessage(), TypeMoq.Times.once());
		});

		it('active challenge, waiting on both bets, gets special context', async () => {
			const fakeChallenge = {
				ChallengerId: '1',
				ChallengerBet: undefined,
				ChallengedId: '2',
				ChallengedBet: undefined,
				Status: ChallengeStatus.PendingBets
			} as Challenge;
			mockWatoDatabase.setup(mock => mock.getUserActiveChallenge(TypeMoq.It.isAny())).returns(
				() => new Promise<Challenge | null>((resolve) => {
					resolve(fakeChallenge);
				}));
			await sut.handleMessage(createMockMessage(fakeChallenge.ChallengerId));

			mockWatoHelperService.verify(mock => mock.createWaitingOnAuthorBetHelpMessage(), TypeMoq.Times.once());
		});

		function createMockMessage(authorId: string): DiscordMessage {
			mockMessage.setup(msg => msg.getClient()).returns(() => {
				return {
					fetchUser: () => new Promise<User>((resolve) => resolve({} as any)),
					user: {
						username: ''
					}
				} as any;
			});

			mockMessage.setup(msg => msg.getAuthorUser()).returns(() => {
				return {
					id: authorId,
					username: '',
					send: () => { }
				} as any;
			});

			return mockMessage.object;
		}
	});
});
