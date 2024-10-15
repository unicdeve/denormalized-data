import 'dotenv/config';

export const env = {
	db: {
		user: process.env.DB_USER,
		password: process.env.DB_PASS,
		host: process.env.DB_HOST,
		database: 'postgres',
		port: parseInt(process.env.DB_PORT || '', 10) || 5432,
		max: 10,
	},
};
