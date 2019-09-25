import { expect } from 'chai';
import { Message, TextChannel } from 'discord.js';
import 'mocha';
import 'reflect-metadata';
import * as TypeMoq from 'typemoq';
import { IMock } from 'typemoq';

import { YtdlCreator } from '../../types';

import { PlayYoutubeUrlMessageHandler } from './youtube.handlers';

describe('Youtube Handlers', () => {
	let mockMessage: IMock<Message>;
	let mockChannel: IMock<TextChannel>;
	let mockYtdl: IMock<YtdlCreator>;

	beforeEach(() => {
		mockYtdl = TypeMoq.Mock.ofType<YtdlCreator>();
		mockMessage = TypeMoq.Mock.ofType(Message);
		mockChannel = TypeMoq.Mock.ofInstance({ send: () => { }, type: '' as any } as TextChannel);
		mockMessage.setup((mock) => mock.channel).returns(() => mockChannel.object as TextChannel);
	});

	afterEach(() => {
		mockYtdl.reset();
		mockMessage.reset();
		mockChannel.reset();
	});

	describe('PlayYoutubeUrlMessageHandler', () => {
		let sut: PlayYoutubeUrlMessageHandler;

		beforeEach(() => {
			sut = new PlayYoutubeUrlMessageHandler(mockYtdl.object);
		});

		describe('Message Matching', () => {
			it('successful match when !play message w/ URL in text channel and user in voice', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!play https://www.youtube.com/watch?v=PHgc8Q6qTjc', true, false));

				expect(isMatch).to.be.true;
			});

			it('no match when !play message does not contain a youtube url', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!play https://streamable.com/8ybc9', true, false));

				expect(isMatch).to.be.false;
			});

			it('no match when !play message not in text channel', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('dm', '!play https://www.youtube.com/watch?v=PHgc8Q6qTjc', true, false));

				expect(isMatch).to.be.false;
			});

			it('no match when no !play message', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!notplay https://www.youtube.com/watch?v=PHgc8Q6qTjc', true, false));

				expect(isMatch).to.be.false;
			});

			it('no match when user not in voice channel', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!play https://www.youtube.com/watch?v=PHgc8Q6qTjc', false, false));

				expect(isMatch).to.be.false;
			});

			it('no match when bot not in voice channel', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!play https://www.youtube.com/watch?v=PHgc8Q6qTjc', true, true));

				expect(isMatch).to.be.false;
			});
		});
	});

	function createMockMessage(
		type: string, content: string = '', userInVoice: boolean = true, botPlaying: boolean = true
	): Message {
		mockMessage.setup(mock => mock.cleanContent).returns(() => content);
		mockChannel.setup(mock => mock.type).returns(() => type as any);

		mockMessage.object.member = userInVoice ? {
			voiceChannel: {
				connection: botPlaying ? { dispatcher: {} } : null
			}
		} as any : {};

		return mockMessage.object;
	}
});
