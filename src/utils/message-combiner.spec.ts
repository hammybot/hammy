import { expect } from 'chai';

import { DiscordMessage } from './discord-message';
import { combinePredicates } from './message-combiner';

describe('Message Combiner', () => {
	it('successfully combines one predicate. result is true', async () => {
		const predicate = combinePredicates(
			createMockPredicate(true)
		);

		expect(predicate({} as any)).to.be.true;
	});

	it('successfully combines one predicate. result is false', async () => {
		const predicate = combinePredicates(
			createMockPredicate(false)
		);

		expect(predicate({} as any)).to.be.false;
	});

	it('successfully combines multiple predicates. last predicate returns false', async () => {
		const predicate = combinePredicates(
			createMockPredicate(true),
			createMockPredicate(true),
			createMockPredicate(false)
		);

		expect(predicate({} as any)).to.be.false;
	});

	it('successfully combines multiple predicates. all are true', async () => {
		const predicate = combinePredicates(
			createMockPredicate(true),
			createMockPredicate(true)
		);

		expect(predicate({} as any)).to.be.true;
	});

	it('successfully combines multiple predicates. first is false', async () => {
		const predicate = combinePredicates(
			createMockPredicate(false),
			createMockPredicate(true)
		);

		expect(predicate({} as any)).to.be.false;
	});

	it('successfully combines multiple predicates. all are false', async () => {
		const predicate = combinePredicates(
			createMockPredicate(false),
			createMockPredicate(false)
		);

		expect(predicate({} as any)).to.be.false;
	});

	function createMockPredicate(result: boolean) {
		return (msg: DiscordMessage) => result;
	}
});
