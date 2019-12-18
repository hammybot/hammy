import { Client } from 'discord.js';
import { Container } from 'inversify';
import { Pool } from 'pg';
import 'reflect-metadata';
import { Stopwatch } from 'ts-stopwatch';
import * as ytdl from 'ytdl-core';

import { MessageHandler } from '../models/message-handler';
import {
	PauseMediaMessageHandler,
	PingMessageHandler,
	PlayYoutubeUrlMessageHandler,
	ResumeMediaMessageHandler,
	StopMediaMessageHandler,
	WATOBetMessageHandler,
	WATOChallengeMessageHandler,
	WATODeclineMessageHandler,
	WATOHelpMessageHandler,
	WATOResponseMessageHandler,
} from '../modules';
import { WATODatabase } from '../modules/wato/db/wato-database';
import { WatoHelperService } from '../modules/wato/wato-helper.service';
import { StopwatchCreator, SYMBOLS, YtdlCreator } from '../types';
import { ErrorLogger, PredicateHelper } from '../utils';

import { Bot } from './bot';
import { MessageRunner } from './message-runner';

const container = new Container();

container.bind<Bot>(SYMBOLS.Bot).to(Bot).inSingletonScope();
container.bind<Client>(SYMBOLS.Client).toConstantValue(
	new Client({ disabledEvents: ['TYPING_START'] })
);
container.bind<string | undefined>(SYMBOLS.Token).toConstantValue(process.env.DISCORD_BOT_TOKEN);

container.bind<PredicateHelper>(SYMBOLS.PredicateHelper).to(PredicateHelper);
container.bind<Pool>(SYMBOLS.DbPool).toConstantValue(new Pool());
container.bind<WATODatabase>(SYMBOLS.WATODatabase).to(WATODatabase);
container.bind<StopwatchCreator>(SYMBOLS.StopwatchCreator).toDynamicValue(() => () => new Stopwatch());
container.bind<YtdlCreator>(SYMBOLS.YtdlCreator).toDynamicValue(
	() => (url: string, opts?: ytdl.downloadOptions | undefined) => ytdl(url, opts)
);

container.bind<WatoHelperService>(SYMBOLS.WatoHelperService).to(WatoHelperService);

container.bind<PingMessageHandler>(SYMBOLS.PingMessageHandler).to(PingMessageHandler);
container.bind<PlayYoutubeUrlMessageHandler>(SYMBOLS.PlayYoutubeUrlMessageHandler).to(PlayYoutubeUrlMessageHandler);
container.bind<PauseMediaMessageHandler>(SYMBOLS.PauseMediaMessageHandler).to(PauseMediaMessageHandler);
container.bind<ResumeMediaMessageHandler>(SYMBOLS.ResumeMediaMessageHandler).to(ResumeMediaMessageHandler);
container.bind<StopMediaMessageHandler>(SYMBOLS.StopMediaMessageHandler).to(StopMediaMessageHandler);
container.bind<WATOChallengeMessageHandler>(SYMBOLS.WATOChallengeMessageHandler).to(WATOChallengeMessageHandler);
container.bind<WATOResponseMessageHandler>(SYMBOLS.WATOResponseMessageHandler).to(WATOResponseMessageHandler);
container.bind<WATODeclineMessageHandler>(SYMBOLS.WATODeclineMessageHandler).to(WATODeclineMessageHandler);
container.bind<WATOBetMessageHandler>(SYMBOLS.WATOBetMessageHandler).to(WATOBetMessageHandler);
container.bind<WATOHelpMessageHandler>(SYMBOLS.WATOHelpMessageHandler).to(WATOHelpMessageHandler);

container.bind<MessageHandler[]>(SYMBOLS.MessageHandlers).toConstantValue(_createHandlers());

container.bind<MessageRunner>(SYMBOLS.MessageRunner).to(MessageRunner);
container.bind<ErrorLogger>(SYMBOLS.ErrorLogger).to(ErrorLogger);

export default container;

function _createHandlers(): MessageHandler[] {
	return [
		container.get<PingMessageHandler>(SYMBOLS.PingMessageHandler),
		container.get<PlayYoutubeUrlMessageHandler>(SYMBOLS.PlayYoutubeUrlMessageHandler),
		container.get<PauseMediaMessageHandler>(SYMBOLS.PauseMediaMessageHandler),
		container.get<ResumeMediaMessageHandler>(SYMBOLS.ResumeMediaMessageHandler),
		container.get<StopMediaMessageHandler>(SYMBOLS.StopMediaMessageHandler),
		container.get<WATOChallengeMessageHandler>(SYMBOLS.WATOChallengeMessageHandler),
		container.get<WATOResponseMessageHandler>(SYMBOLS.WATOResponseMessageHandler),
		container.get<WATODeclineMessageHandler>(SYMBOLS.WATODeclineMessageHandler),
		container.get<WATOBetMessageHandler>(SYMBOLS.WATOBetMessageHandler),
		container.get<WATOHelpMessageHandler>(SYMBOLS.WATOHelpMessageHandler)
	];
}
