import { expect } from 'chai';
import { Message, TextChannel, User } from 'discord.js';
import 'mocha';
import 'reflect-metadata';
import * as TypeMoq from 'typemoq';
import { IMock } from 'typemoq';

import { WATODatabase } from './db/wato-database';
import { Challenge } from './models/challenge';
import { ChallengeStatus } from './models/challenge-status';
import { WATOHelpMessageHandler } from './wato-help.handler';
import { WatoHelperService } from './wato-helper.service';

describe('WATOHelpMessageHandler', () => {
	let mockWatoDatabase: IMock<WATODatabase>;
	let mockWatoHelperService: IMock<WatoHelperService>;

	let mockMessage: IMock<Message>;
	let mockChannel: IMock<TextChannel>;

	let sut: WATOHelpMessageHandler;
	beforeEach(() => {
		mockWatoDatabase = TypeMoq.Mock.ofType(WATODatabase);
		mockWatoHelperService = TypeMoq.Mock.ofType(WatoHelperService);
		mockMessage = TypeMoq.Mock.ofType(Message);
		mockChannel = TypeMoq.Mock.ofInstance({ send: () => { }, type: '' as any } as TextChannel);

		mockMessage.setup((mock) => mock.channel).returns(() => mockChannel.object as TextChannel);

		sut = new WATOHelpMessageHandler(mockWatoDatabase.object, mockWatoHelperService.object);
	});

	afterEach(() => {
		mockWatoDatabase.reset();
		mockMessage.reset();
		mockChannel.reset();
	});

	describe('Message Matching', () => {
		it('successful match when !wato message in text channel', async () => {
			const predicate = sut.messageHandlerPredicate();
			const isMatch = predicate(createMockMessage('text', '!wato'));

			expect(isMatch).to.be.true;
		});
		it('successful match when !wato message in dm channel', async () => {
			const predicate = sut.messageHandlerPredicate();
			const isMatch = predicate(createMockMessage('dm', '!wato'));

			expect(isMatch).to.be.true;
		});

		it('no match when no !wato message', async () => {
			const predicate = sut.messageHandlerPredicate();
			const isMatch = predicate(createMockMessage('text', '!notwato'));

			expect(isMatch).to.be.false;
		});

		function createMockMessage(type: string, content: string = ''): Message {
			mockMessage.setup(mock => mock.cleanContent).returns(() => content);
			mockChannel.setup(mock => mock.type).returns(() => type as any);

			return mockMessage.object;
		}
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

		function createMockMessage(authorId: string): Message {
			mockMessage.setup(msg => msg.client).returns(() => {
				return {
					fetchUser: () => new Promise<User>((resolve) => resolve({} as any)),
					user: {
						username: ''
					}
				} as any;
			});

			mockMessage.object.author = {
				id: authorId,
				username: '',
				send: () => { }
			} as any;

			return mockMessage.object;
		}
	});
});
