import { injectable } from 'inversify';

@injectable()
export class ErrorLogger {
	async log(message: string) { console.error(message); }
}
