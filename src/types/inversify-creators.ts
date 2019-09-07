import { Readable } from 'stream';
import { Stopwatch } from 'ts-stopwatch';
import * as ytdl from 'ytdl-core';

export type YtdlCreator = (url: string, opts?: ytdl.downloadOptions | undefined) => Readable;
export type StopwatchCreator = () => Stopwatch;
