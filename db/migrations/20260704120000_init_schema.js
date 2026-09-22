// db/migrations/20260704120000_init_schema.js
// Versioned migration initializing the database tables (PostgreSQL & MySQL compatible)

exports.up = async function(knex) {
    // 1. DISHES (Product Catalog)
    await knex.schema.createTable('dishes', (table) => {
        table.string('id', 100).primary();
        table.string('name', 255).notNullable();
        table.string('price', 50).notNullable();
        table.decimal('price_value', 10, 2).notNullable();
        table.string('category', 50).notNullable().index('idx_dishes_category');
        table.text('description').notNullable();
        table.text('image_url');
        table.string('badge', 100);
        table.boolean('is_spicy').defaultTo(false);
        table.string('allergens', 255).defaultTo('None');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // 2. TABLE RESERVATIONS
    await knex.schema.createTable('reservations', (table) => {
        table.string('id', 100).primary();
        table.string('guest_name', 255).notNullable();
        table.string('phone_number', 100).notNullable();
        table.integer('num_guests').notNullable();
        table.date('reservation_date').notNullable().index('idx_reservations_date');
        table.time('reservation_time').notNullable();
        table.string('special_requests', 1000).defaultTo('None');
        table.string('status', 50).defaultTo('pending');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // 3. FOOD & ROOM SERVICE ORDERS
    await knex.schema.createTable('orders', (table) => {
        table.string('id', 100).primary();
        table.string('guest_name', 255).notNullable();
        table.string('room_number', 50);
        table.string('phone_number', 100).notNullable();
        table.string('order_type', 50).defaultTo('delivery');
        table.text('delivery_address');
        table.string('delivery_area', 100);
        table.string('table_number', 50);
        table.time('pickup_time');
        table.string('payment_method', 50).notNullable();
        table.string('payment_detail', 100);
        table.text('special_instructions');
        table.json('items').notNullable();
        table.decimal('total_price', 12, 2).notNullable();
        table.string('status', 50).defaultTo('Pending').index('idx_orders_status');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // 4. M-PESA TRANSACTION LOGS
    await knex.schema.createTable('mpesa_transactions', (table) => {
        table.string('checkout_request_id', 100).primary();
        table.string('order_id', 50).notNullable().index('idx_mpesa_tx_order');
        table.string('status', 50).defaultTo('Pending');
        table.string('receipt_number', 100);
        table.decimal('payment_amount', 10, 2);
        table.string('sender_phone', 50);
        table.text('error_description');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // 5. STAFF USERS (Authentication & MFA)
    await knex.schema.createTable('users', (table) => {
        table.string('username', 100).primary();
        table.string('password_hash', 255).notNullable();
        table.string('mfa_secret', 255);
        table.boolean('mfa_enabled').defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
    return knex.schema
        .dropTableIfExists('users')
        .dropTableIfExists('mpesa_transactions')
        .dropTableIfExists('orders')
        .dropTableIfExists('reservations')
        .dropTableIfExists('dishes');
};

