import { Message, TextChannel } from 'discord.js';
import 'reflect-metadata';
import { Stopwatch } from 'ts-stopwatch';
import * as TypeMoq from 'typemoq';
import { IMock, Times } from 'typemoq';

import { BOT_MESSAGES, DiscordMessage, PredicateHelper, REGEX } from '../../utils';

import { PingMessageHandler } from './ping.handler';

describe('PingMessageHandler', () => {
	let mockStopWatch: IMock<Stopwatch>;
	let mockMessage: IMock<DiscordMessage>;
	let mockPredicateHelper: IMock<PredicateHelper>;
	let mockChannel: IMock<TextChannel>;
	let mockEditMessage: IMock<Message>;

	let sut: PingMessageHandler;
	beforeEach(() => {
		mockMessage = TypeMoq.Mock.ofType(DiscordMessage);
		mockPredicateHelper = TypeMoq.Mock.ofType(PredicateHelper);
		mockStopWatch = TypeMoq.Mock.ofType(Stopwatch);
		mockChannel = TypeMoq.Mock.ofInstance({ send: () => { }, type: '' as any } as TextChannel);
		mockEditMessage = TypeMoq.Mock.ofType(Message);

		sut = new PingMessageHandler(
			mockPredicateHelper.object,
			() => mockStopWatch.object
		);
	});

	afterEach(() => {
		mockMessage.reset();
		mockPredicateHelper.reset();
		mockStopWatch.reset();
		mockChannel.reset();
		mockEditMessage.reset();
	});

	describe('Setting up Predicate', () => {
		it('sets up channel type predicate of text', async () => {
			sut.createHandlerPredicate();

			mockPredicateHelper.verify(
				mp => mp.createChannelTypePredicate(TypeMoq.It.isValue('text')),
				Times.once()
			);
		});

		it('sets up regex predicate for command ping', async () => {
			sut.createHandlerPredicate();

			mockPredicateHelper.verify(
				mp => mp.createRegexPredicate(TypeMoq.It.isValue(REGEX.COMMAND_PING)),
				Times.once()
			);
		});
	});

	describe('Handle Message', () => {
		beforeEach(() => {
			mockMessage.setup(md => md.getChannel()).returns(() => mockChannel.object);
			mockStopWatch.setup(mock => mock.getTime()).returns(() => 100);

			mockChannel.setup((mock) => mock.send(TypeMoq.It.isAnyString())).returns(() => new Promise<Message>(resolve => {
				resolve(mockEditMessage.object);
			}));

			mockEditMessage.setup(mock => mock.edit(TypeMoq.It.isAnyString())).returns(() => new Promise<Message>(resolve => {
				resolve();
			}));
			mockEditMessage.object.content = BOT_MESSAGES.PONG;
		});

		it('successful initial response with pong msg', async () => {
			await sut.handleMessage(mockMessage.object);

			mockChannel.verify(mock => mock.send(BOT_MESSAGES.PONG), Times.once());
		});

		it('timer should be started/stopped and returned in edit of message', async () => {
			await sut.handleMessage(mockMessage.object);

			mockStopWatch.verify(mock => mock.start(), Times.once());
			mockStopWatch.verify(mock => mock.stop(), Times.once());
			mockStopWatch.verify(mock => mock.getTime(), Times.once());
			mockEditMessage.verify(mock => mock.edit(`${BOT_MESSAGES.PONG} \`100ms\``), Times.once());
		});
	});
});
