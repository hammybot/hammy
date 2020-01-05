import { Message, TextChannel } from 'discord.js';
import 'mocha';
import 'reflect-metadata';
import * as TypeMoq from 'typemoq';
import { IMock, Times } from 'typemoq';

import { DiscordMessage, PredicateHelper, REGEX } from '../../../utils';
import { WATODatabase } from '../db/wato-database';
import { ChallengeStatus } from '../models/challenge-status';
import { WatoHelperService } from '../services/wato-helper.service';

import { WATOResponseMessageHandler } from './wato-response.handler';

describe('WATO Response Handler', () => {
	const fakeValidationMessage = { 'validationError': true };
	const fakeStatusUpdate = { status: '1' } as any;
	let mockPredicateHelper: IMock<PredicateHelper>;
	let mockWatoDatabase: IMock<WATODatabase>;
	let mockWatoHelperService: IMock<WatoHelperService>;

	let mockMessage: IMock<DiscordMessage>;
	let mockChannel: IMock<TextChannel>;
	let mockStatusMessage: IMock<Message>;

	let sut: WATOResponseMessageHandler;
	beforeEach(() => {
		mockPredicateHelper = TypeMoq.Mock.ofType(PredicateHelper);
		mockWatoDatabase = TypeMoq.Mock.ofType(WATODatabase);
		mockWatoHelperService = TypeMoq.Mock.ofType(WatoHelperService);
		mockMessage = TypeMoq.Mock.ofType(DiscordMessage);
		mockChannel = TypeMoq.Mock.ofInstance({ send: () => { }, fetchMessage: (id: string) => { } } as TextChannel);
		mockStatusMessage = TypeMoq.Mock.ofType(Message);

		sut = new WATOResponseMessageHandler(mockPredicateHelper.object, mockWatoDatabase.object, mockWatoHelperService.object);
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

		it('sets up regex predicate for a valid number', async () => {
			sut.createHandlerPredicate();

			mockPredicateHelper.verify(
				mp => mp.createRegexPredicate(TypeMoq.It.isValue(REGEX.VALID_NUMBER)),
				Times.once()
			);
		});
	});

	describe('Handle Message', () => {
		const challenger = { id: '1', user: { username: 'user-1' }, send: (x: any) => { } };
		const challenged = { id: '2', user: { username: 'user-2' }, send: (x: any) => { } };

		const mockChallenger = TypeMoq.Mock.ofInstance(challenger);
		const mockChallenged = TypeMoq.Mock.ofInstance(challenged);

		beforeEach(() => {
			mockMessage.setup(md => md.getChannel()).returns(() => mockChannel.object);
			mockWatoHelperService.setup(helper => helper.createWatoValidationEmbed(TypeMoq.It.isAny()))
				.returns(() => fakeValidationMessage as any);
			mockChannel.setup(mock => mock.fetchMessage(TypeMoq.It.isAny())).returns(async () => {
				return mockStatusMessage.object;
			});

			mockWatoDatabase.setup(db => db.getUserActiveChallenge(TypeMoq.It.isAny())).returns(() => {
				return {
					Status: ChallengeStatus.PendingAccept,
					ChallengerId: '1',
					ChallengedId: '2'
				} as any;
			});
		});

		afterEach(() => {
			mockChallenger.reset();
			mockChallenged.reset();
		});

		it('validation fails when bet limit is set to 1', async () => {
			await sut.handleMessage(createMockWatoMessage(1));

			assertThatValidationHasFailed();
		});

		it('validation fails when bet limit is less then 1', async () => {
			await sut.handleMessage(createMockWatoMessage(0));

			assertThatValidationHasFailed();
		});

		it('validation fails when bet limit is more then MAX_SAFE_INTEGER', async () => {
			await sut.handleMessage(createMockWatoMessage(Number.MAX_SAFE_INTEGER + 1));

			assertThatValidationHasFailed();
		});

		it('bet limit is saved to database', async () => {
			await sut.handleMessage(createMockWatoMessage(200));

			mockWatoDatabase.verify(
				db => db.setBetLimit(TypeMoq.It.isAny(), TypeMoq.It.isValue(200)),
				Times.once()
			);
		});

		it('DM is sent to challenger and challenged user', async () => {
			await sut.handleMessage(createMockWatoMessage(200));

			mockWatoHelperService.verify(
				mock => mock.createWatoDmEmbed(TypeMoq.It.isValue(challenged.user.username), TypeMoq.It.isAny(), TypeMoq.It.isAny()),
				Times.once()
			);
			mockWatoHelperService.verify(
				mock => mock.createWatoDmEmbed(TypeMoq.It.isValue(challenger.user.username), TypeMoq.It.isAny(), TypeMoq.It.isAny()),
				Times.once()
			);

			mockChallenged.verify(mock => mock.send(TypeMoq.It.isAny()), Times.once());
			mockChallenger.verify(mock => mock.send(TypeMoq.It.isAny()), Times.once());
		});

		it('updates existing WATO status message to new status', async () => {
			mockMessage.setup(md => md.getClientChannel(TypeMoq.It.isAny())).returns(() => mockChannel.object);
			mockWatoHelperService.setup(
				mock => mock.createWatoStatusEmbed(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny())
			).returns(() => fakeStatusUpdate);

			await sut.handleMessage(createMockWatoMessage(200));

			mockStatusMessage.verify(
				mock => mock.edit(TypeMoq.It.isValue(fakeStatusUpdate)),
				TypeMoq.Times.once()
			);
		});

		function createMockWatoMessage(betLimit: number) {
			mockMessage.setup(msg => msg.getAuthorUser()).returns(() => {
				return challenged as any;
			});
			mockMessage.setup(mock => mock.getCleanContent()).returns(() => `<@81440962496172032> ${betLimit}`);

			mockMessage.setup(mock => mock.getGuildMember(TypeMoq.It.isValue(challenger.id))).returns(() => mockChallenger.object as any);
			mockMessage.setup(mock => mock.getGuildMember(TypeMoq.It.isValue(challenged.id))).returns(() => mockChallenged.object as any);

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
	});
});
