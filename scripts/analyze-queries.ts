import { Pool } from 'pg';

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
	try {
		for (const query of queries) {
			console.time(query.name);
			const result = await client.query(query.sql);
			console.timeEnd(query.name);
			console.log(`${query.name} execution plan:`);
			result.rows.forEach((row) => console.log(row['QUERY PLAN']));
		}
	} catch (e) {
		throw e;
	} finally {
		client.release();
	}
};
