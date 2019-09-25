import { expect } from 'chai';
import { Message, TextChannel } from 'discord.js';
import 'mocha';
import 'reflect-metadata';
import * as TypeMoq from 'typemoq';
import { IMock } from 'typemoq';

import {
	createChannelTypePredicate,
	createContainsPredicate,
	createRegexPredicate
} from './message-predicates';

describe('Message Predicates', () => {
	let mockMessage: IMock<Message>;
	let mockChannel: IMock<TextChannel>;

	beforeEach(() => {
		mockMessage = TypeMoq.Mock.ofType(Message);
		mockChannel = TypeMoq.Mock.ofInstance({ send: () => { }, type: '' as any } as TextChannel);
		mockMessage.setup((mock) => mock.channel).returns(() => mockChannel.object as TextChannel);
	});

	afterEach(() => {
		mockMessage.reset();
		mockChannel.reset();
	});

	describe('Contains', () => {
		it('successful match when message does contain the correct text (case-sensitive)', async () => {
			const predicate = createContainsPredicate('this text', true);
			const isMatch = predicate(createMockMessage('text', 'it will contain this text'));

			expect(isMatch).to.be.true;
		});

		it('successful match when message does contain the correct text (case-insensitive)', async () => {
			const predicate = createContainsPredicate('this text', false);
			const isMatch = predicate(createMockMessage('text', 'it will contain this TEXT'));

			expect(isMatch).to.be.true;
		});

		it('failed match when message doesn\'t contain the correct text (case-sensitive)', async () => {
			const predicate = createContainsPredicate('this text', true);
			const isMatch = predicate(createMockMessage('text', 'it will contain this TEXT'));

			expect(isMatch).to.be.false;
		});

		it('failed match when message doesn\'t contain the correct text (case-insensitive)', async () => {
			const predicate = createContainsPredicate('this text', false);
			const isMatch = predicate(createMockMessage('text', 'nope'));

			expect(isMatch).to.be.false;
		});
	});

	describe('Regex', () => {
		it('successful match when message matches regex', async () => {
			const predicate = createRegexPredicate(/^!ping$/);
			const isMatch = predicate(createMockMessage('text', '!ping'));

			expect(isMatch).to.be.true;
		});

		it('failed match when message doesn\'t match regex', async () => {
			const predicate = createRegexPredicate(/^!ping$/);
			const isMatch = predicate(createMockMessage('text', 'text with !ping please'));

			expect(isMatch).to.be.false;
		});
	});

	describe('Channel Type', () => {
		it('successful match when channel type matches the msg channel type', async () => {
			const predicate = createChannelTypePredicate('dm');
			const isMatch = predicate(createMockMessage('dm', 'fake msg'));

			expect(isMatch).to.be.true;
		});

		it('failed match when channel type doesn\'t match the msg channel type', async () => {
			const predicate = createChannelTypePredicate('text');
			const isMatch = predicate(createMockMessage('dm', 'fake msg'));

			expect(isMatch).to.be.false;
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
