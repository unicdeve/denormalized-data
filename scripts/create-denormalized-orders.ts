import { Pool } from 'pg';

export const createDenormalizedOrder = async (dbPool: Pool) => {
	const client = await dbPool.connect();
	try {
		await client.query(`
      CREATE TABLE IF NOT EXISTS DenormalizedOrders AS
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
    `);
		console.log('Denormalized table created successfully');
	} catch (e) {
		throw e;
	} finally {
		client.release();
	}
};
