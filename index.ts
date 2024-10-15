import { createDenormalizedOrder } from './scripts/create-denormalized-orders';
import { analyzeQueries } from './scripts/analyze-queries';
import { createDbPool } from './db';

(async () => {
	try {
		const dbPool = createDbPool();

		await createDenormalizedOrder(dbPool);
		await analyzeQueries(dbPool);

		await dbPool.end();
	} catch (e) {
		console.error('An error occurred:', e);
	}
})();
