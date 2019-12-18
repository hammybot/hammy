import { expect } from 'chai';
import 'reflect-metadata';
import * as TypeMoq from 'typemoq';
import { IMock } from 'typemoq';

import { DiscordMessage } from './discord-message';
import { PredicateHelper } from './predicate-helper';


describe('Predicate Helper', () => {
	let mockMessage: IMock<DiscordMessage>;
	let sut: PredicateHelper;

	beforeEach(() => {
		mockMessage = TypeMoq.Mock.ofType(DiscordMessage);
		sut = new PredicateHelper();
	});

	afterEach(() => {
		mockMessage.reset();
	});

	describe('Contains', () => {
		it('successful match when message does contain the correct text (case-sensitive)', async () => {
			mockCleanContent('it will contain this text');

			const predicate = sut.createContainsPredicate('this text', true);
			const isMatch = predicate(mockMessage.object);

			expect(isMatch).to.be.true;
		});

		it('successful match when message does contain the correct text (case-insensitive)', async () => {
			mockCleanContent('it will contain this TEXT');

			const predicate = sut.createContainsPredicate('this text', false);
			const isMatch = predicate(mockMessage.object);

			expect(isMatch).to.be.true;
		});

		it('failed match when message doesn\'t contain the correct text (case-sensitive)', async () => {
			mockCleanContent('it will contain this TEXT');

			const predicate = sut.createContainsPredicate('this text', true);
			const isMatch = predicate(mockMessage.object);

			expect(isMatch).to.be.false;
		});

		it('failed match when message doesn\'t contain the correct text (case-insensitive)', async () => {
			mockCleanContent('nope');

			const predicate = sut.createContainsPredicate('this text', false);
			const isMatch = predicate(mockMessage.object);

			expect(isMatch).to.be.false;
		});
	});

	describe('Regex', () => {
		it('successful match when message matches regex', async () => {
			mockCleanContent('!ping');

			const predicate = sut.createRegexPredicate(/^!ping$/);
			const isMatch = predicate(mockMessage.object);

			expect(isMatch).to.be.true;
		});

		it('failed match when message doesn\'t match regex', async () => {
			mockCleanContent('text with !ping please');

			const predicate = sut.createRegexPredicate(/^!ping$/);
			const isMatch = predicate(mockMessage.object);

			expect(isMatch).to.be.false;
		});
	});

	describe('Channel Type', () => {
		it('successful match when channel type matches the msg channel type', async () => {
			mockMessage
				.setup(md => md.getChannel())
				.returns(() => {
					return { type: 'dm' } as any;
				});

			const predicate = sut.createChannelTypePredicate('dm');
			const isMatch = predicate(mockMessage.object);

			expect(isMatch).to.be.true;
		});

		it('failed match when channel type doesn\'t match the msg channel type', async () => {
			mockChannelType('dm');

			const predicate = sut.createChannelTypePredicate('text');
			const isMatch = predicate(mockMessage.object);

			expect(isMatch).to.be.false;
		});
	});

	describe('Unique Mentions', () => {
		it('successful match when unique mentions matches the parameter. excludes bot and author', async () => {
			mockMentionedUsers(['1', '2', '3']);
			mockAuthorId('1');
			mockBotId('2');

			const predicate = sut.createUniqueMentionsPredicate(1, true, true);
			const isMatch = predicate(mockMessage.object);

			expect(isMatch).to.be.true;
		});

		it('successful match when unique mentions matches the parameter. excludes only bot', async () => {
			mockMentionedUsers(['1', '2', '3']);
			mockAuthorId('1');
			mockBotId('2');

			const predicate = sut.createUniqueMentionsPredicate(2, true, false);
			const isMatch = predicate(mockMessage.object);

			expect(isMatch).to.be.true;
		});

		it('successful match when unique mentions matches the parameter. excludes only author', async () => {
			mockMentionedUsers(['1', '2', '3']);
			mockAuthorId('1');
			mockBotId('2');

			const predicate = sut.createUniqueMentionsPredicate(2, false, true);
			const isMatch = predicate(mockMessage.object);

			expect(isMatch).to.be.true;
		});

		it('successful match when unique mentions matches the parameter. no exclusions', async () => {
			mockMentionedUsers(['1', '2', '3']);
			mockAuthorId('1');
			mockBotId('2');

			const predicate = sut.createUniqueMentionsPredicate(3, false, false);
			const isMatch = predicate(mockMessage.object);

			expect(isMatch).to.be.true;
		});

		it('fails to match when unique mentions doesn\'t match the parameter', async () => {
			mockMentionedUsers(['1', '2', '3']);
			mockAuthorId('1');
			mockBotId('2');

			const predicate = sut.createUniqueMentionsPredicate(10, false, false);
			const isMatch = predicate(mockMessage.object);

			expect(isMatch).to.be.false;
		});
	});

	function mockChannelType(type: string) {
		mockMessage
			.setup(md => md.getChannel())
			.returns(() => {
				return { type: type } as any;
			});
	}

	function mockCleanContent(content: string) {
		mockMessage
			.setup(md => md.getCleanContent())
			.returns(() => content);
	}

	function mockMentionedUsers(ids: string[]) {
		const mappedIds = new Map(ids.map(id => [id, { id: id }]));
		mockMessage
			.setup(md => md.getMentionedUsers())
			.returns(() => mappedIds as any);
	}

	function mockAuthorId(id: string) {
		mockMessage
			.setup(md => md.getAuthorUser())
			.returns(() => {
				return { id: id } as any;
			});
	}

	function mockBotId(id: string) {
		mockMessage
			.setup(md => md.getBotUser())
			.returns(() => {
				return { id: id } as any;
			});
	}
});
