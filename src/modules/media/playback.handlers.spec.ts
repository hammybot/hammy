import { expect } from 'chai';
import { Message, TextChannel } from 'discord.js';
import 'mocha';
import 'reflect-metadata';
import * as TypeMoq from 'typemoq';
import { IMock } from 'typemoq';

import { PauseMediaMessageHandler, ResumeMediaMessageHandler, StopMediaMessageHandler } from './playback.handlers';

describe('Playback Handlers', () => {
	let mockMessage: IMock<Message>;
	let mockChannel: IMock<TextChannel>;

	beforeEach(() => {
		mockMessage = TypeMoq.Mock.ofType(Message);
		mockChannel = TypeMoq.Mock.ofInstance({ send: () => { }, type: '' as any } as TextChannel);
		mockMessage.setup((mock) => mock.channel).returns(() => mockChannel.object as TextChannel);
	});

	afterEach(() => {
		mockMessage.reset();
	});

	describe('PauseMediaMessageHandler', () => {
		let sut: PauseMediaMessageHandler;

		beforeEach(() => {
			sut = new PauseMediaMessageHandler();
		});

		describe('Message Matching', () => {
			it('successful match when !pause message in text channel and user in voice', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!pause', true, true));

				expect(isMatch).to.be.true;
			});

			it('no match when !pause message not in text channel', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('dm', '!pause', true, true));

				expect(isMatch).to.be.false;
			});

			it('no match when no !pause message', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!notpause', true, true));

				expect(isMatch).to.be.false;
			});

			it('no match when user not in voice channel', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!pause', false, true));

				expect(isMatch).to.be.false;
			});

			it('no match when bot not in voice channel', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!pause', true, false));

				expect(isMatch).to.be.false;
			});
		});
	});

	describe('ResumeMediaMessageHandler', () => {
		let sut: ResumeMediaMessageHandler;

		beforeEach(() => {
			sut = new ResumeMediaMessageHandler();
		});

		describe('Message Matching', () => {
			it('successful match when !resume message in text channel and user in voice', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!resume', true, true));

				expect(isMatch).to.be.true;
			});

			it('no match when !resume message not in text channel', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('dm', '!resume', true, true));

				expect(isMatch).to.be.false;
			});

			it('no match when no !pause message', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!notresume', true, true));

				expect(isMatch).to.be.false;
			});

			it('no match when user not in voice channel', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!resume', false, true));

				expect(isMatch).to.be.false;
			});

			it('no match when bot not in voice channel', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!resume', true, false));

				expect(isMatch).to.be.false;
			});
		});
	});

	describe('StopMediaMessageHandler', () => {
		let sut: StopMediaMessageHandler;

		beforeEach(() => {
			sut = new StopMediaMessageHandler();
		});

		describe('Message Matching', () => {
			it('successful match when !stop message in text channel and user in voice', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!stop', true, true));

				expect(isMatch).to.be.true;
			});

			it('no match when !stop message not in text channel', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('dm', '!stop', true, true));

				expect(isMatch).to.be.false;
			});

			it('no match when no !stop message', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!notstop', true, true));

				expect(isMatch).to.be.false;
			});

			it('no match when user not in voice channel', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!stop', false, true));

				expect(isMatch).to.be.false;
			});

			it('no match when bot not in voice channel', async () => {
				const predicate = sut.messageHandlerPredicate();
				const isMatch = predicate(createMockMessage('text', '!stop', true, false));

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
