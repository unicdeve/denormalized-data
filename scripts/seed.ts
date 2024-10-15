import { faker, simpleFaker } from '@faker-js/faker';
import { createDbPool } from '../db';
import { Pool } from 'pg';
import { createTables } from './create-tables';

faker.setDefaultRefDate('2023-01-01T00:00:00.000Z');

export const seed = async (dbPool: Pool) => {
	const CUSTOMER_COUNTS = 1000;
	const PRODUCTS_COUNT = 100;
	const PAYMENT_METHOD_COUNT = 5;
	const DISCOUNTS_COUNT = 20;
	const ORDERS_COUNT = 10000;

	const client = await dbPool.connect();

	try {
		console.log('Inserting dummy data...');
		await client.query('BEGIN');

		// Insert Customers
		for (let i = 0; i < CUSTOMER_COUNTS; i++) {
			await client.query(
				'INSERT INTO Customers (name, email) VALUES ($1, $2)',
				[faker.person.fullName(), faker.internet.email()]
			);
		}

		// Insert Products
		for (let i = 0; i < PRODUCTS_COUNT; i++) {
			await client.query('INSERT INTO Products (name, price) VALUES ($1, $2)', [
				faker.commerce.productName(),
				faker.commerce.price(),
			]);
		}

		// Insert PaymentMethods
		for (let i = 0; i < PAYMENT_METHOD_COUNT; i++) {
			await client.query('INSERT INTO PaymentMethods (name) VALUES ($1)', [
				faker.finance.transactionType(),
			]);
		}

		// Insert Discounts
		for (let i = 0; i < DISCOUNTS_COUNT; i++) {
			await client.query(
				'INSERT INTO Discounts (code, amount) VALUES ($1, $2)',
				[
					simpleFaker.string.alphanumeric(6),
					faker.number.int({ min: 5, max: 50 }),
				]
			);
		}

		// Insert Orders and related data
		for (let i = 0; i < ORDERS_COUNT; i++) {
			const customerId = faker.number.int({ min: 1, max: CUSTOMER_COUNTS });
			const orderDate = faker.date.soon();
			const paymentMethodId = faker.number.int({
				min: 1,
				max: PAYMENT_METHOD_COUNT,
			});
			const discountId = faker.number.int({ min: 1, max: DISCOUNTS_COUNT });

			const orderResult = await client.query(
				'INSERT INTO Orders (customer_id, order_date, payment_method_id, discount_id) VALUES ($1, $2, $3, $4) RETURNING order_id',
				[customerId, orderDate, paymentMethodId, discountId]
			);
			const orderId = orderResult.rows[0].order_id;

			// Insert 1-3 order items per order
			const itemCount = faker.number.int({ min: 1, max: 3 });
			for (let j = 0; j < itemCount; j++) {
				const productId = faker.number.int({ min: 1, max: PRODUCTS_COUNT });
				const quantity = faker.number.int({ min: 1, max: 5 });
				const price = faker.commerce.price();
				await client.query(
					'INSERT INTO OrderItems (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
					[orderId, productId, quantity, price]
				);
			}

			// Insert shipment
			const shipmentDate = faker.date.between({
				from: orderDate,
				to: new Date(),
			});
			const trackingNumber = simpleFaker.string.alphanumeric(10);
			await client.query(
				'INSERT INTO Shipments (order_id, shipment_date, tracking_number) VALUES ($1, $2, $3)',
				[orderId, shipmentDate, trackingNumber]
			);
		}

		await client.query('COMMIT');
		console.log('Dummy data inserted successfully');
	} catch (e) {
		await client.query('ROLLBACK');
		throw e;
	} finally {
		client.release();
	}
};

(async () => {
	try {
		const dbPool = createDbPool();

		await createTables(dbPool);
		await seed(dbPool);

		await dbPool.end();
	} catch (e) {
		console.error('An error occurred:', e);
	}
})();
