import { Pool } from 'pg';

const pool = new Pool();

pool.on('error', (err, client) => {
	console.error('DB Pool: Unexpected error on idle db client', err);
});

export const getDbPool = () => pool;

export const closeDbPool = async () => {
	await pool.end();
	console.log('DB Pool: Connection successfully closed');
};
