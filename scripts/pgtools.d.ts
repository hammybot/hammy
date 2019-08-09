declare module 'pgtools' {
	export function createdb(config: any, databaseName: string, callback: (err: any, res: any) => void): void;
	export function dropdb(config: any, databaseName: string, callback: (err: any, res: any) => void): void;
}
