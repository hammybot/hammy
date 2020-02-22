import { TextChannel } from 'discord.js';
import 'mocha';
import 'reflect-metadata';
import * as TypeMoq from 'typemoq';
import { IMock, Times } from 'typemoq';

import { DiscordMessage, MESSAGE_TARGETS, PredicateHelper } from '../../../utils';
import { WATODatabase } from '../db/wato-database';
import { ChallengeStatus } from '../models/challenge-status';
import { WatoHelperService } from '../services/wato-helper.service';

import { WATOChallengeMessageHandler } from './wato-challenge.handler';

describe('WATO Challenges Handler', () => {
	const fakeValidationMessage = { 'validationError': true };
	const fakeStatusMessage = { 'message': 'test' };
	let mockPredicateHelper: IMock<PredicateHelper>;
	let mockWatoDatabase: IMock<WATODatabase>;
	let mockWatoHelperService: IMock<WatoHelperService>;

	let mockMessage: IMock<DiscordMessage>;
	let mockChannel: IMock<TextChannel>;

	let sut: WATOChallengeMessageHandler;
	beforeEach(() => {
		mockPredicateHelper = TypeMoq.Mock.ofType(PredicateHelper);
		mockWatoDatabase = TypeMoq.Mock.ofType(WATODatabase);
		mockWatoHelperService = TypeMoq.Mock.ofType(WatoHelperService);
		mockMessage = TypeMoq.Mock.ofType(DiscordMessage);
		mockChannel = TypeMoq.Mock.ofInstance({ id: '123', send: () => { }, type: '' as any } as TextChannel);

		sut = new WATOChallengeMessageHandler(mockPredicateHelper.object, mockWatoDatabase.object, mockWatoHelperService.object);
	});

	afterEach(() => {
		mockPredicateHelper.reset();
		mockWatoDatabase.reset();
		mockWatoHelperService.reset();
		mockMessage.reset();
		mockChannel.reset();
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
				mp => mp.createContainsPredicate(TypeMoq.It.isValue(MESSAGE_TARGETS.WATO_CHALLENGE), TypeMoq.It.isValue(false)),
				Times.once()
			);
		});
	});

	describe('Handle Message', () => {
		beforeEach(() => {
			mockMessage.setup(md => md.getChannel()).returns(() => mockChannel.object);
			mockWatoHelperService.setup(helper => helper.createWatoValidationEmbed(TypeMoq.It.isAny()))
				.returns(() => fakeValidationMessage as any);
			mockChannel.setup(mock => mock.send(TypeMoq.It.isAny())).returns(() => {
				return { id: '456' } as any;
			});
		});

		it('validaton fails if challenger is a bot', async () => {
			const challenger = { id: '1', bot: true };
			const challenged = { id: '2', bot: false };
			await sut.handleMessage(createMockWatoMessage(challenger, challenged));

			assertThatValidationHasFailed();
		});

		it('validaton fails if challenged user is a bot', async () => {
			const challenger = { id: '1', bot: false };
			const challenged = { id: '2', bot: true };
			await sut.handleMessage(createMockWatoMessage(challenger, challenged));

			assertThatValidationHasFailed();
		});

		it('validaton fails if challenger is in an active challenge', async () => {
			const challenger = { id: '1', bot: false } as any;
			const challenged = { id: '2', bot: false } as any;
			mockWatoDatabase.setup(db => db.getUserActiveChallenge(TypeMoq.It.isValue(challenger)))
				.returns(() => {
					return {} as any;
				});

			await sut.handleMessage(createMockWatoMessage(challenger, challenged));

			assertThatValidationHasFailed();
		});

		it('validation fails if challenger is the same as the challenged user', async () => {
			const challenger = { id: '1', bot: false } as any;
			const challenged = { id: '1', bot: false } as any;
			await sut.handleMessage(createMockWatoMessage(challenger, challenged));

			assertThatValidationHasFailed();
		});

		it('create a new challenge in database', async () => {
			const challenger = { id: '1', bot: false } as any;
			const challenged = { id: '2', bot: false } as any;
			mockMessage.setup(msg => msg.getContent()).returns(() => {
				return '<@81440962496172032> what are the odds that you do a thing?';
			});

			await sut.handleMessage(createMockWatoMessage(challenger, challenged));

			mockWatoDatabase.verify(
				db => db.createNewChallenge(TypeMoq.It.isValue(
					{
						ChallengerId: '1',
						ChallengedId: '2',
						ChannelId: '123',
						Description: 'what are the odds that you do a thing?',
						Status: ChallengeStatus.PendingAccept
					}
				)),
				TypeMoq.Times.once()
			);
		});

		it('send an initial status message to channel and saves new message id to database', async () => {
			const challenger = { id: '1', bot: false } as any;
			const challenged = { id: '2', bot: false } as any;

			mockMessage.setup(msg => msg.getGuildMember(TypeMoq.It.isValue('1'))).returns(() => challenger);
			mockMessage.setup(msg => msg.getGuildMember(TypeMoq.It.isValue('2'))).returns(() => challenged);
			mockMessage.setup(msg => msg.getContent()).returns(() => {
				return '<@81440962496172032> what are the odds that you do a thing?';
			});
			mockActiveChallenge();
			mockWatoHelperService.setup(
				helper => helper.createWatoStatusEmbed(
					TypeMoq.It.isValue(challenger), TypeMoq.It.isValue(challenged), TypeMoq.It.isAny(),
					TypeMoq.It.isAny()
				)
			).returns(() => fakeStatusMessage as any);

			await sut.handleMessage(createMockWatoMessage(challenger, challenged));

			mockChannel.verify(
				mock => mock.send(TypeMoq.It.isValue(fakeStatusMessage)),
				TypeMoq.Times.once()
			);
			mockWatoDatabase.verify(
				mock => mock.setStatusMessageId(TypeMoq.It.isAny(), TypeMoq.It.isValue('456')),
				TypeMoq.Times.once()
			);
		});

		function createMockWatoMessage(challenger: any, challenged: any) {
			mockMessage.setup(msg => msg.getAuthorUser()).returns(() => {
				return challenger as any;
			});
			mockMessage.setup(msg => msg.getMentionedUsers()).returns(() => {
				return new Map([[challenged.id, challenged]]) as any;
			});

			return mockMessage.object;
		}

		function mockActiveChallenge() {
			// Avoids validation failure
			mockWatoDatabase.setup(db => db.getUserActiveChallenge(TypeMoq.It.isAny())).returns(() => undefined as any);
			mockWatoDatabase.setup(db => db.getUserActiveChallenge(TypeMoq.It.isAny())).returns(() => undefined as any);

			mockWatoDatabase.setup(db => db.getUserActiveChallenge(TypeMoq.It.isAny())).returns(() => {
				return { Id: 1 } as any;
			});
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
	});
});
