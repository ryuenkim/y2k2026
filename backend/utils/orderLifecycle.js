const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const TRANSACTION_STATUSES = ['pending', 'paid'];
const STATUS_ORDER = { Pending: 0, Processing: 1, Shipped: 2, Delivered: 3 };

const isValidStatusTransition = (current, next) => {
    if (!ORDER_STATUSES.includes(next)) return false;
    if (next === 'Cancelled') return ['Pending', 'Processing', 'Shipped'].includes(current);
    return STATUS_ORDER[next] === STATUS_ORDER[current] + 1;
};

module.exports = {
    ORDER_STATUSES,
    TRANSACTION_STATUSES,
    isValidStatusTransition
};
