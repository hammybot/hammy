import 'reflect-metadata';
import {
	Connection,
	ConnectionOptions,
	createConnection,
	getConnection,
	getConnectionOptions,
	ObjectType
} from 'typeorm';

import * as entities from './entities';

export const createDbConnection = async (): Promise<Connection> => {
	const config = await getConnectionOptions();
	const connectionOptions: ConnectionOptions = {
		...config, ...{
			entities: [
				entities.ChallengeEntity
			],
			synchronize: process.env.NODE_ENV === 'development'
		}
	};

	return await createConnection(connectionOptions);
};

export const getRepository = <T>(customRepository: ObjectType<T>): T => {
	const connection = getConnection();
	return connection.getCustomRepository(customRepository);
};
