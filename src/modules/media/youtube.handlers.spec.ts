import 'mocha';
import 'reflect-metadata';
import * as TypeMoq from 'typemoq';
import { IMock } from 'typemoq';

import { YtdlCreator } from '../../types';
import { DiscordMessage, PredicateHelper, REGEX } from '../../utils';

import { PlayYoutubeUrlMessageHandler } from './youtube.handlers';

describe('Youtube Handlers', () => {
	let mockPredicateHelper: IMock<PredicateHelper>;
	let mockMessage: IMock<DiscordMessage>;
	let mockYtdl: IMock<YtdlCreator>;

	beforeEach(() => {
		mockPredicateHelper = TypeMoq.Mock.ofType(PredicateHelper);
		mockYtdl = TypeMoq.Mock.ofType<YtdlCreator>();
		mockMessage = TypeMoq.Mock.ofType(DiscordMessage);
	});

	afterEach(() => {
		mockYtdl.reset();
		mockMessage.reset();
	});

	describe('PlayYoutubeUrlMessageHandler', () => {
		let sut: PlayYoutubeUrlMessageHandler;

		beforeEach(() => {
			sut = new PlayYoutubeUrlMessageHandler(mockPredicateHelper.object, mockYtdl.object);
		});

		describe('Setting up Predicate', () => {
			it('sets up channel type predicate of text', async () => {
				sut.createHandlerPredicate();

				mockPredicateHelper.verify(
					mp => mp.createChannelTypePredicate(TypeMoq.It.isValue('text')),
					TypeMoq.Times.once()
				);
			});

			it('sets up regex predicate for command play youtube', async () => {
				sut.createHandlerPredicate();

				mockPredicateHelper.verify(
					mp => mp.createRegexPredicate(TypeMoq.It.isValue(REGEX.COMMAND_PLAY_YOUTUBE)),
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

			it('sets up predicate for bot not playing media in voice channel', async () => {
				sut.createHandlerPredicate();

				mockPredicateHelper.verify(
					mp => mp.createBotNotPlayingMediaPredicate(),
					TypeMoq.Times.once()
				);
			});
		});

		describe('Handle Message', () => {
			it('successful youtube stream created and streams to voice channel', async () => {
				const youtubeCommand = '!play https://www.youtube.com/watch?v=PHgc8Q6qTjc';
				mockMessage.setup(md => md.getCleanContent()).returns(() => youtubeCommand);

				await sut.handleMessage(mockMessage.object);

				mockYtdl.verify(mock => mock(youtubeCommand, TypeMoq.It.isAny()), TypeMoq.Times.once());
				mockMessage.verify(msg => msg.streamToVoiceChannel(TypeMoq.It.isAny()), TypeMoq.Times.once());
			});
		});
	});
});
