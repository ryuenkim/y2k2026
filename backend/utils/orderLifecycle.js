const ORDER_STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
const TRANSACTION_STATUSES = ['pending', 'paid', 'refunded', 'failed', 'voided'];
const STATUS_ORDER = { Processing: 0, Shipped: 1, Delivered: 2 };

const isValidStatusTransition = (current, next) => {
    if (!ORDER_STATUSES.includes(next)) return false;
    if (next === 'Cancelled') return current === 'Processing' || current === 'Shipped';
    return STATUS_ORDER[next] === STATUS_ORDER[current] + 1;
};

module.exports = {
    ORDER_STATUSES,
    TRANSACTION_STATUSES,
    isValidStatusTransition
};
