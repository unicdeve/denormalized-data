import { Pool } from 'pg';

export const createTables = async (dbPool: Pool) => {
	const client = await dbPool.connect();
	try {
		await client.query('BEGIN');

		// await client.query('SET search_path TO public');

		await client.query(`
      CREATE TABLE IF NOT EXISTS Customers (
        customer_id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT
      )`);

		await client.query(`
      CREATE TABLE IF NOT EXISTS Products (
        product_id SERIAL PRIMARY KEY,
        name TEXT,
        price NUMERIC(10, 2)
      )`);

		await client.query(`
      CREATE TABLE IF NOT EXISTS PaymentMethods (
        payment_method_id SERIAL PRIMARY KEY,
        name TEXT
      )`);

		await client.query(`
      CREATE TABLE IF NOT EXISTS Discounts (
        discount_id SERIAL PRIMARY KEY,
        code TEXT,
        amount NUMERIC(10, 2)
      )`);

		await client.query(`
      CREATE TABLE IF NOT EXISTS Orders (
        order_id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES Customers(customer_id),
        order_date TIMESTAMP,
        payment_method_id INTEGER REFERENCES PaymentMethods(payment_method_id),
        discount_id INTEGER REFERENCES Discounts(discount_id)
      )`);

		await client.query(`
      CREATE TABLE IF NOT EXISTS OrderItems (
        order_item_id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES Orders(order_id),
        product_id INTEGER REFERENCES Products(product_id),
        quantity INTEGER,
        price NUMERIC(10, 2)
      )`);

		await client.query(`
      CREATE TABLE IF NOT EXISTS Shipments (
        shipment_id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES Orders(order_id),
        shipment_date TIMESTAMP,
        tracking_number TEXT
      )`);

		await client.query('COMMIT');
		console.log('Tables created successfully');
	} catch (e) {
		await client.query('ROLLBACK');
		throw e;
	} finally {
		client.release();
	}
};
