import { StreamDispatcher, VoiceChannel, VoiceConnection } from 'discord.js';
import { EventEmitter } from 'events';
import 'mocha';
import 'reflect-metadata';
import { Readable } from 'stream';
import * as TypeMoq from 'typemoq';
import { IMock } from 'typemoq';

import { VoiceChannelService } from './voice-channel.service';

describe('Voice Channel Service', () => {
	let mockVoiceChannel: IMock<VoiceChannel>;
	let mockVoiceConnection: IMock<VoiceConnection>;

	let sut: VoiceChannelService;
	beforeEach(() => {
		mockVoiceChannel = TypeMoq.Mock.ofInstance({ join: () => { } } as VoiceChannel);
		mockVoiceConnection = TypeMoq.Mock.ofInstance({ playStream: () => { } } as any);

		mockVoiceConnection.setup(mock => mock.playStream(TypeMoq.It.isAny())).returns(() => {
			return new EventEmitter() as StreamDispatcher;
		});
		mockVoiceChannel.setup(mock => mock.join()).returns(() => new Promise<VoiceConnection>((resolve, reject) => {
			resolve(mockVoiceConnection.object);
		}));

		sut = new VoiceChannelService();
	});

	afterEach(() => {
		mockVoiceChannel.reset();
		mockVoiceConnection.reset();
	});

	it('joins voice channel and plays the stream', async () => {
		await sut.streamToVoiceChannel(mockVoiceChannel.object, {} as Readable);

		mockVoiceChannel.verify(mock => mock.join(), TypeMoq.Times.once());
		mockVoiceConnection.verify(mock => mock.playStream(TypeMoq.It.isAny()), TypeMoq.Times.once());
	});
});
