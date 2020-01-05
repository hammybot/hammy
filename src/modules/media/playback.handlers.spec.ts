import { expect } from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { StreamDispatcher } from 'discord.js';
import 'mocha';
import 'reflect-metadata';
import * as TypeMoq from 'typemoq';
import { IMock, Times } from 'typemoq';

import { DiscordMessage, PredicateHelper, REGEX } from '../../utils';

import { PauseMediaMessageHandler, ResumeMediaMessageHandler, StopMediaMessageHandler } from './playback.handlers';

describe('Playback Handlers', () => {
	let mockMessage: IMock<DiscordMessage>;
	let mockPredicateHelper: IMock<PredicateHelper>;
	let mockDispatcher: IMock<StreamDispatcher>;

	beforeEach(() => {
		chai.use(chaiAsPromised);

		mockMessage = TypeMoq.Mock.ofType(DiscordMessage);
		mockPredicateHelper = TypeMoq.Mock.ofType(PredicateHelper);
		mockDispatcher = TypeMoq.Mock.ofInstance({ pause: () => { }, resume: () => { }, end: () => { } } as StreamDispatcher);
	});

	afterEach(() => {
		mockMessage.reset();
		mockPredicateHelper.reset();
		mockDispatcher.reset();
	});

	describe('Pause Media Handler', () => {
		let sut: PauseMediaMessageHandler;

		beforeEach(() => {
			sut = new PauseMediaMessageHandler(mockPredicateHelper.object);
		});

		describe('Setting up Predicate', () => {
			it('sets up channel type predicate of text', async () => {
				sut.createHandlerPredicate();

				mockPredicateHelper.verify(
					mp => mp.createChannelTypePredicate(TypeMoq.It.isValue('text')),
					TypeMoq.Times.once()
				);
			});

			it('sets up regex predicate for command pause', async () => {
				sut.createHandlerPredicate();

				mockPredicateHelper.verify(
					mp => mp.createRegexPredicate(TypeMoq.It.isValue(REGEX.COMMAND_PAUSE)),
					TypeMoq.Times.once()
				);
			});

			it('sets up predicate for member required in voice channel', async () => {
				sut.createHandlerPredicate();

				mockPredicateHelper.verify(
					mp => mp.createUserInVoiceChannelPredicate(),
					TypeMoq.Times.once()
				);
			});

			it('sets up predicate for bot playing media in voice channel', async () => {
				sut.createHandlerPredicate();

				mockPredicateHelper.verify(
					mp => mp.createBotPlayingMediaPredicate(),
					TypeMoq.Times.once()
				);
			});
		});

		describe('Handle Message', () => {
			it('no errors returned when dispatcher is null', async () => {
				mockMessage.setup(md => md.getDispatcher()).returns(() => null);
				await expect(sut.handleMessage(mockMessage.object)).to.not.be.rejectedWith(Error);
			});

			it('if dispatching, verify that pause function is called', async () => {
				mockMessage.setup(md => md.getDispatcher()).returns(() => mockDispatcher.object);

				await sut.handleMessage(mockMessage.object);

				mockDispatcher.verify(md => md.pause(), Times.once());
			});
		});
	});

	describe('Resume Media Handler', () => {
		let sut: ResumeMediaMessageHandler;

		beforeEach(() => {
			sut = new ResumeMediaMessageHandler(mockPredicateHelper.object);
		});

		describe('Setting up Predicate', () => {
			it('sets up channel type predicate of text', async () => {
				sut.createHandlerPredicate();

				mockPredicateHelper.verify(
					mp => mp.createChannelTypePredicate(TypeMoq.It.isValue('text')),
					TypeMoq.Times.once()
				);
			});

			it('sets up regex predicate for command resume', async () => {
				sut.createHandlerPredicate();

				mockPredicateHelper.verify(
					mp => mp.createRegexPredicate(TypeMoq.It.isValue(REGEX.COMMAND_RESUME)),
					TypeMoq.Times.once()
				);
			});

			it('sets up predicate for member required in voice channel', async () => {
				sut.createHandlerPredicate();

				mockPredicateHelper.verify(
					mp => mp.createUserInVoiceChannelPredicate(),
					TypeMoq.Times.once()
				);
			});

			it('sets up predicate for bot playing media in voice channel', async () => {
				sut.createHandlerPredicate();

				mockPredicateHelper.verify(
					mp => mp.createBotPlayingMediaPredicate(),
					TypeMoq.Times.once()
				);
			});
		});

		describe('Handle Message', () => {
			it('no errors returned when dispatcher is null', async () => {
				mockMessage.setup(md => md.getDispatcher()).returns(() => null);
				await expect(sut.handleMessage(mockMessage.object)).to.not.be.rejectedWith(Error);
			});

			it('if dispatching, verify that resume function is called', async () => {
				mockMessage.setup(md => md.getDispatcher()).returns(() => mockDispatcher.object);

				await sut.handleMessage(mockMessage.object);

				mockDispatcher.verify(md => md.resume(), Times.once());
			});
		});
	});

	describe('Stop Media Handler', () => {
		let sut: StopMediaMessageHandler;

		beforeEach(() => {
			sut = new StopMediaMessageHandler(mockPredicateHelper.object);
		});

		describe('Setting up Predicate', () => {
			it('sets up channel type predicate of text', async () => {
				sut.createHandlerPredicate();

				mockPredicateHelper.verify(
					mp => mp.createChannelTypePredicate(TypeMoq.It.isValue('text')),
					TypeMoq.Times.once()
				);
			});

			it('sets up regex predicate for command stop', async () => {
				sut.createHandlerPredicate();

				mockPredicateHelper.verify(
					mp => mp.createRegexPredicate(TypeMoq.It.isValue(REGEX.COMMAND_STOP)),
					TypeMoq.Times.once()
				);
			});

			it('sets up predicate for member required in voice channel', async () => {
				sut.createHandlerPredicate();

				mockPredicateHelper.verify(
					mp => mp.createUserInVoiceChannelPredicate(),
					TypeMoq.Times.once()
				);
			});

			it('sets up predicate for bot playing media in voice channel', async () => {
				sut.createHandlerPredicate();

				mockPredicateHelper.verify(
					mp => mp.createBotPlayingMediaPredicate(),
					TypeMoq.Times.once()
				);
			});
		});

		describe('Handle Message', () => {
			it('no errors returned when dispatcher is null', async () => {
				mockMessage.setup(md => md.getDispatcher()).returns(() => null);
				await expect(sut.handleMessage(mockMessage.object)).to.not.be.rejectedWith(Error);
			});

			it('if dispatching, verify that end function is called', async () => {
				mockMessage.setup(md => md.getDispatcher()).returns(() => mockDispatcher.object);

				await sut.handleMessage(mockMessage.object);

				mockDispatcher.verify(md => md.end(), Times.once());
			});
		});
	});
});
