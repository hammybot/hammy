import { Message, TextChannel } from 'discord.js';
import 'mocha';
import 'reflect-metadata';
import * as TypeMoq from 'typemoq';
import { IMock, Times } from 'typemoq';

import { DiscordMessage, MESSAGE_TARGETS, PredicateHelper } from '../../../utils';
import { WATODatabase } from '../db/wato-database';
import { ChallengeStatus } from '../models/challenge-status';
import { WatoHelperService } from '../services/wato-helper.service';

import { WATODeclineMessageHandler } from './wato-decline.handler';


describe('WATO Decline Handler', () => {
	const fakeAuthor = { id: '1' } as any;
	const fakeStatusUpdate = { status: '1' } as any;
	let mockPredicateHelper: IMock<PredicateHelper>;
	let mockWatoDatabase: IMock<WATODatabase>;
	let mockWatoHelperService: IMock<WatoHelperService>;

	let mockMessage: IMock<DiscordMessage>;
	let mockChannel: IMock<TextChannel>;
	let mockStatusMessage: IMock<Message>;

	let sut: WATODeclineMessageHandler;
	beforeEach(() => {
		mockPredicateHelper = TypeMoq.Mock.ofType(PredicateHelper);
		mockWatoDatabase = TypeMoq.Mock.ofType(WATODatabase);
		mockWatoHelperService = TypeMoq.Mock.ofType(WatoHelperService);
		mockMessage = TypeMoq.Mock.ofType(DiscordMessage);
		mockChannel = TypeMoq.Mock.ofInstance({ send: () => { }, fetchMessage: (id: string) => { } } as TextChannel);
		mockStatusMessage = TypeMoq.Mock.ofType(Message);

		sut = new WATODeclineMessageHandler(mockPredicateHelper.object, mockWatoDatabase.object, mockWatoHelperService.object);
	});

	afterEach(() => {
		mockPredicateHelper.reset();
		mockWatoDatabase.reset();
		mockWatoHelperService.reset();
		mockMessage.reset();
		mockChannel.reset();
		mockStatusMessage.reset();
	});

	describe('Setting up Predicate', () => {
		it('sets up channel type predicate of text', async () => {
			sut.createHandlerPredicate();

			mockPredicateHelper.verify(
				mp => mp.createChannelTypePredicate(TypeMoq.It.isValue('text')),
				Times.once()
			);
		});

		it('sets up unique mention predicate for 1 mention, excluding bot mentions', async () => {
			sut.createHandlerPredicate();

			mockPredicateHelper.verify(
				mp => mp.createUniqueMentionsPredicate(TypeMoq.It.isValue(1), TypeMoq.It.isValue(true)),
				Times.once()
			);
		});

		it('sets up contains predicate for wato challenge (case-insensitive)', async () => {
			sut.createHandlerPredicate();

			mockPredicateHelper.verify(
				mp => mp.createContainsPredicate(TypeMoq.It.isValue(MESSAGE_TARGETS.WATO_DECLINE), TypeMoq.It.isValue(false)),
				Times.once()
			);
		});
	});

	describe('Handle Message', () => {
		beforeEach(() => {
			mockMessage.setup(msg => msg.getAuthorUser()).returns(() => fakeAuthor);
			mockChannel.setup(mock => mock.fetchMessage(TypeMoq.It.isAny())).returns(async () => {
				return mockStatusMessage.object;
			});
		});

		it('author is not in an active challenge and no challenge is declined', async () => {
			mockWatoDatabase.setup(db => db.getUserActiveChallenge(TypeMoq.It.isValue(fakeAuthor)));

			await sut.handleMessage(mockMessage.object);

			mockWatoDatabase.verify(
				mock => mock.declineChallenge(TypeMoq.It.isAny()),
				TypeMoq.Times.never()
			);
		});

		it('active challenge is not in pending status and challenge is not declined', async () => {
			mockWatoDatabase.setup(db => db.getUserActiveChallenge(TypeMoq.It.isValue(fakeAuthor)))
				.returns(() => {
					return { Status: ChallengeStatus.PendingBets } as any;
				});

			await sut.handleMessage(mockMessage.object);

			mockWatoDatabase.verify(
				mock => mock.declineChallenge(TypeMoq.It.isAny()),
				TypeMoq.Times.never()
			);
		});

		it('author was not challenged user and challenge is not declined', async () => {
			mockWatoDatabase.setup(db => db.getUserActiveChallenge(TypeMoq.It.isValue(fakeAuthor)))
				.returns(() => {
					return {
						Status: ChallengeStatus.PendingAccept,
						ChallengedId: '2'
					} as any;
				});

			await sut.handleMessage(mockMessage.object);

			mockWatoDatabase.verify(
				mock => mock.declineChallenge(TypeMoq.It.isAny()),
				TypeMoq.Times.never()
			);
		});

		it('challenge is declined when pending and author is the challenged user', async () => {
			mockWatoDatabase.setup(db => db.getUserActiveChallenge(TypeMoq.It.isValue(fakeAuthor)))
				.returns(() => {
					return {
						Status: ChallengeStatus.PendingAccept,
						ChallengedId: '1'
					} as any;
				});

			await sut.handleMessage(mockMessage.object);

			mockWatoDatabase.verify(
				mock => mock.declineChallenge(TypeMoq.It.isAny()),
				TypeMoq.Times.once()
			);
		});

		it('original status message is updated to show declined status', async () => {
			const fakeChallenged = { id: '1' } as any;
			const fakeChallenger = { id: '2' } as any;
			mockWatoDatabase.setup(db => db.getUserActiveChallenge(TypeMoq.It.isValue(fakeAuthor)))
				.returns(() => {
					return {
						Status: ChallengeStatus.PendingAccept,
						ChallengedId: '1',
						ChallengerId: '2'
					} as any;
				});
			mockMessage.setup(md => md.getClientChannel(TypeMoq.It.isAny())).returns(() => mockChannel.object);
			mockMessage.setup(m => m.getGuildMember(TypeMoq.It.isValue('2'))).returns(() => fakeChallenger);
			mockMessage.setup(m => m.getGuildMember(TypeMoq.It.isValue('1'))).returns(() => fakeChallenged);

			mockWatoHelperService.setup(
				mock => mock.createWatoStatusEmbed(
					TypeMoq.It.isValue(fakeChallenger), TypeMoq.It.isValue(fakeChallenged), TypeMoq.It.isAny(), TypeMoq.It.isAny()
				)
			).returns(() => fakeStatusUpdate);

			await sut.handleMessage(mockMessage.object);

			mockStatusMessage.verify(
				mock => mock.edit(TypeMoq.It.isValue(fakeStatusUpdate)),
				TypeMoq.Times.once()
			);
		});
	});
});
