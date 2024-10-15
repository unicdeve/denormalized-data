import { Pool } from 'pg';
import { env } from './constants';

export const createDbPool = () => {
	return new Pool({
		...env.db,
	});
};
