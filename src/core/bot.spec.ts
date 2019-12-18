import { expect } from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Client } from 'discord.js';
import 'reflect-metadata';
import * as TypeMoq from 'typemoq';
import { IMock, Times } from 'typemoq';

import { ErrorLogger } from '../utils';

import { Bot } from './bot';
import { MessageRunner } from './message-runner';

describe('Bot', () => {
	let mockClient: IMock<Client>;
	let mockMessageRunner: IMock<MessageRunner>;
	let mockErrorLogger: IMock<ErrorLogger>;

	beforeEach(() => {
		chai.use(chaiAsPromised);

		mockClient = TypeMoq.Mock.ofType(Client);
		mockMessageRunner = TypeMoq.Mock.ofType(MessageRunner);
		mockErrorLogger = TypeMoq.Mock.ofType(ErrorLogger);
	});

	afterEach(() => {
		mockClient.reset();
		mockMessageRunner.reset();
	});

	describe('startBot', () => {
		it('when token is null, throw error', async () => {
			const sut = new Bot(mockClient.object, undefined, mockMessageRunner.object, mockErrorLogger.object);

			await expect(sut.startBot()).to.be.rejectedWith(Error);
		});

		it('when token exists, login to discord client', async () => {
			const sut = new Bot(mockClient.object, 'faketoken', mockMessageRunner.object, mockErrorLogger.object);

			await sut.startBot();

			mockClient.verify(mc => mc.login(TypeMoq.It.isAny()), Times.once());
		});
	});
});
