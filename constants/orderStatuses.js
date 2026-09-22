// constants/orderStatuses.js
// Single source of truth for the order status state machine.
// Import this wherever order statuses need to be validated or listed —
// both in controllers and in any future test files.
//
// If you add a new status, update this file only.

const ORDER_STATUSES = Object.freeze([
    'Pending',
    'Confirmed',
    'Cooking',
    'Dispatched',
    'Completed'
]);

module.exports = { ORDER_STATUSES };
