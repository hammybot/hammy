import 'reflect-metadata';
import * as TypeMoq from 'typemoq';
import { IMock, Times } from 'typemoq';

import { MessageHandler } from '../models/message-handler';
import { DiscordMessage } from '../utils';
import { ErrorLogger } from '../utils/error-logger';

import { MessageRunner } from './message-runner';

describe('Message Runner', () => {
	let mockFirstHandler: IMock<(msg: DiscordMessage) => Promise<void>>;
	let mockSecondHandler: IMock<(msg: DiscordMessage) => Promise<void>>;
	let mockThirdHandler: IMock<(msg: DiscordMessage) => Promise<void>>;
	let mockErrorHandler: IMock<(msg: DiscordMessage) => Promise<void>>;
	let mockErrorLogger: IMock<ErrorLogger>;

	beforeEach(() => {
		mockFirstHandler = TypeMoq.Mock.ofInstance(async (msg) => { return; });
		mockSecondHandler = TypeMoq.Mock.ofInstance(async (msg) => { return; });
		mockThirdHandler = TypeMoq.Mock.ofInstance(async (msg) => { return; });
		mockErrorHandler = TypeMoq.Mock.ofInstance(async (msg) => { return; });
		mockErrorHandler.setup(eh => eh(TypeMoq.It.isAny())).returns(() => new Promise<void>((res, rej) => {
			rej('Fake Error');
		}));

		mockErrorLogger = TypeMoq.Mock.ofType(ErrorLogger);
	});

	afterEach(() => {
		mockFirstHandler.reset();
		mockSecondHandler.reset();
		mockThirdHandler.reset();
		mockErrorHandler.reset();
		mockErrorLogger.reset();
	});

	describe('run', () => {
		it('ignore message from self', async () => {
			const sut = new MessageRunner(createMockHandlers(), mockErrorLogger.object);

			const mockMessage = {
				author: { id: '1' },
				client: { user: { id: '1' } }
			} as any;
			await sut.run(mockMessage);

			mockFirstHandler.verify(hd => hd(TypeMoq.It.isAny()), Times.never());
			mockSecondHandler.verify(hd => hd(TypeMoq.It.isAny()), Times.never());
			mockThirdHandler.verify(hd => hd(TypeMoq.It.isAny()), Times.never());
		});

		it('ignore message from other bot', async () => {
			const sut = new MessageRunner(createMockHandlers(), mockErrorLogger.object);

			const mockMessage = {
				author: { id: '2', bot: true },
				client: { user: { id: '1' } }
			} as any;
			await sut.run(mockMessage);

			mockFirstHandler.verify(hd => hd(TypeMoq.It.isAny()), Times.never());
			mockSecondHandler.verify(hd => hd(TypeMoq.It.isAny()), Times.never());
			mockThirdHandler.verify(hd => hd(TypeMoq.It.isAny()), Times.never());
		});

		it('when message received, should run first handler only', async () => {
			const sut = new MessageRunner(createMockHandlers(), mockErrorLogger.object);

			const mockMessage = {
				author: { id: '2', bot: false },
				client: { user: { id: '1' } }
			} as any;
			await sut.run(mockMessage);

			mockFirstHandler.verify(hd => hd(TypeMoq.It.isAny()), Times.once());
			mockSecondHandler.verify(hd => hd(TypeMoq.It.isAny()), Times.never());
			mockThirdHandler.verify(hd => hd(TypeMoq.It.isAny()), Times.never());
		});

		it('when message received and handler throws error, it is logged', async () => {
			const sut = new MessageRunner(createMockHandlerWithError(), mockErrorLogger.object);

			const mockMessage = {
				author: { id: '2', bot: false },
				client: { user: { id: '1' } }
			} as any;
			await sut.run(mockMessage);

			mockErrorHandler.verify(hd => hd(TypeMoq.It.isAny()), Times.once());
			mockErrorLogger.verify(logger => logger.log(TypeMoq.It.isValue('Object: Fake Error')), Times.once());
		});

		function createMockHandlers(): MessageHandler[] {
			return [
				{
					createHandlerPredicate: () => () => true,
					handleMessage: mockFirstHandler.object
				},
				{
					createHandlerPredicate: () => () => true,
					handleMessage: mockSecondHandler.object
				},
				{
					createHandlerPredicate: () => () => false,
					handleMessage: mockThirdHandler.object
				}
			];
		}

		function createMockHandlerWithError(): MessageHandler[] {
			return [
				{
					createHandlerPredicate: () => () => true,
					handleMessage: mockErrorHandler.object
				}
			];
		}
	});
});
