import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export const analyzeQueries = async (dbPool: Pool) => {
	const queries = [
		{
			name: '1 - Normalized Query',
			sql: `
        EXPLAIN ANALYZE
        SELECT 
          O.order_id, O.order_date,
          C.name AS customer_name, C.email,
          P.name AS product_name, OI.quantity, OI.price,
          S.shipment_date, S.tracking_number,
          PM.name AS payment_method,
          D.code AS discount_code, D.amount AS discount_amount
        FROM 
          Orders O
          INNER JOIN Customers C ON O.customer_id = C.customer_id
          INNER JOIN OrderItems OI ON O.order_id = OI.order_id
          INNER JOIN Products P ON OI.product_id = P.product_id
          INNER JOIN Shipments S ON O.order_id = S.order_id
          INNER JOIN PaymentMethods PM ON O.payment_method_id = PM.payment_method_id
          LEFT JOIN Discounts D ON O.discount_id = D.discount_id
        LIMIT 1000
      `,
		},
		{
			name: '2 - Denormalized Query',
			sql: `
        EXPLAIN ANALYZE
        SELECT *
        FROM DenormalizedOrders
        LIMIT 1000
      `,
		},
	];

	const client = await dbPool.connect();

	const report: Record<string, any> = {};
	const reportDate = new Date().toISOString();

	report[reportDate] = {
		'Planning Time': {},
		'Execution Time': {},
	};

	try {
		for (const query of queries) {
			console.time(query.name);
			const result = await client.query(query.sql);
			console.timeEnd(query.name);

			let planningTime = '';
			let executionTime = '';

			result.rows.forEach((row) => {
				const queryPlan = row['QUERY PLAN'];

				if (queryPlan.includes('Planning Time')) {
					planningTime =
						queryPlan.match(/Planning Time: (\d+\.\d+) ms/)?.[1] ?? '';
				}
				if (queryPlan.includes('Execution Time')) {
					executionTime =
						queryPlan.match(/Execution Time: (\d+\.\d+) ms/)?.[1] ?? '';
				}
			});

			result.rows.forEach((row) => console.log(row['QUERY PLAN']));
			console.log('\n');
			console.log('\n');

			report[reportDate]['Planning Time'][query.name] = planningTime;
			report[reportDate]['Execution Time'][query.name] = executionTime;
		}

		const projectRootDir = process.cwd();
		const reportDir = path.join(projectRootDir, 'docs');
		const reportFilePath = path.join(reportDir, 'reports.json');

		if (!fs.existsSync(reportDir)) {
			fs.mkdirSync(reportDir, { recursive: true });
		}

		let existingReports = {};
		if (fs.existsSync(reportFilePath)) {
			const fileContent = fs.readFileSync(reportFilePath, 'utf-8');
			existingReports = JSON.parse(fileContent);
		}

		const updatedReports = { ...existingReports, ...report };

		fs.writeFileSync(reportFilePath, JSON.stringify(updatedReports, null, 2));

		console.log('Query analysis reports saved successfully.');
	} catch (e) {
		throw e;
	} finally {
		client.release();
	}
};
