import { expect } from 'chai';
import { Message, TextChannel } from 'discord.js';
import 'mocha';
import 'reflect-metadata';
import { Stopwatch } from 'ts-stopwatch';
import * as TypeMoq from 'typemoq';
import { IMock, Times } from 'typemoq';

import { BOT_MESSAGES } from '../../utils';

import { PingMessageHandler } from './ping.handler';

describe('PingMessageHandler', () => {
	let mockStopWatch: IMock<Stopwatch>;
	let mockMessage: IMock<Message>;
	let mockEditMessage: IMock<Message>;
	let mockChannel: IMock<TextChannel>;

	let sut: PingMessageHandler;
	beforeEach(() => {
		mockStopWatch = TypeMoq.Mock.ofType(Stopwatch);
		mockMessage = TypeMoq.Mock.ofType(Message);
		mockEditMessage = TypeMoq.Mock.ofType(Message);
		mockChannel = TypeMoq.Mock.ofInstance({ send: () => { }, type: '' as any } as TextChannel);

		mockMessage.setup((mock) => mock.channel).returns(() => mockChannel.object as TextChannel);

		sut = new PingMessageHandler(() => mockStopWatch.object);
	});

	afterEach(() => {
		mockStopWatch.reset();
		mockMessage.reset();
		mockChannel.reset();
	});

	describe('Message Matching', () => {
		it('successful match when !ping message in text channel', async () => {
			const predicate = sut.messageHandlerPredicate();
			const isMatch = predicate(createMockMessage('text', '!ping'));

			expect(isMatch).to.be.true;
		});

		it('no match when !ping message not in text channel', async () => {
			const predicate = sut.messageHandlerPredicate();
			const isMatch = predicate(createMockMessage('dm', '!ping'));

			expect(isMatch).to.be.false;
		});

		it('no match when no !ping message', async () => {
			const predicate = sut.messageHandlerPredicate();
			const isMatch = predicate(createMockMessage('text', '!notping'));

			expect(isMatch).to.be.false;
		});

		function createMockMessage(type: string, content: string = ''): Message {
			mockMessage.setup(mock => mock.cleanContent).returns(() => content);
			mockChannel.setup(mock => mock.type).returns(() => type as any);

			return mockMessage.object;
		}
	});

	describe('Handle Message', () => {
		it('successful response with pong and milliseconds', async () => {
			mockStopWatch.setup(mock => mock.getTime()).returns(() => 100);
			await sut.handleMessage(createMockMessage(BOT_MESSAGES.PONG));

			mockChannel.verify(mock => mock.send(BOT_MESSAGES.PONG), Times.once());
			mockStopWatch.verify(mock => mock.start(), Times.once());
			mockStopWatch.verify(mock => mock.stop(), Times.once());
			mockStopWatch.verify(mock => mock.getTime(), Times.once());
			mockEditMessage.verify(mock => mock.edit(`${BOT_MESSAGES.PONG} \`100ms\``), Times.once());
		});

		function createMockMessage(content: string): Message {
			mockEditMessage.setup(mock => mock.edit(TypeMoq.It.isAnyString())).returns(() => new Promise<Message>(resolve => {
				resolve();
			}));
			mockEditMessage.object.content = content;

			mockChannel.setup((mock) => mock.send(TypeMoq.It.isAnyString())).returns(() => new Promise<Message>(resolve => {
				resolve(mockEditMessage.object);
			}));
			return mockMessage.object;
		}
	});
});
