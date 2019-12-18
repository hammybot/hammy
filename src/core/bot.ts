import { Client } from 'discord.js';
import { inject, injectable } from 'inversify';

import { SYMBOLS } from '../types';
import { ErrorLogger } from '../utils';

import { MessageRunner } from './message-runner';

@injectable()
export class Bot {
	constructor(
		@inject(SYMBOLS.Client) private _client: Client,
		@inject(SYMBOLS.Token) private _token: string | undefined,
		@inject(SYMBOLS.MessageRunner) private _messageRunner: MessageRunner,
		@inject(SYMBOLS.ErrorLogger) private _errorLogger: ErrorLogger
	) { }

	public async startBot(): Promise<void> {
		if (!this._token) {
			throw new Error('Generate a discord token and store in "DISCORD_BOT_TOKEN" environment file.');
		}
		this.setupEventHandlers();

		await this._client.login(this._token);
	}

	private setupEventHandlers(): void {
		this._client.on('message', (msg) => { this._messageRunner.run(msg); });
		this._client.on('error', (err) => { this._errorLogger.log(err.message); });
	}
}
