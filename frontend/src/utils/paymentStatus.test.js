import { describe, expect, it } from 'vitest';
import { getPaymentStatusLabel } from './paymentStatus';

describe('getPaymentStatusLabel', () => {
    it('explains COD due state and simulated online payment', () => {
        expect(getPaymentStatusLabel({ paymentMethod: 'COD', transactionStatus: 'pending', orderStatus: 'Processing' }))
            .toBe('Payment due on delivery');
        expect(getPaymentStatusLabel({ paymentMethod: 'ONLINE', transactionStatus: 'paid', paymentInfo: { provider: 'simulation' } }))
            .toBe('Paid (simulation only)');
    });

    it('does not imply an actual refund or payment for cancelled orders', () => {
        expect(getPaymentStatusLabel({ orderStatus: 'Cancelled', transactionStatus: 'refunded' }))
            .toBe('Refund status marked (simulation only; not confirmed)');
        expect(getPaymentStatusLabel({ orderStatus: 'Cancelled', transactionStatus: 'voided' }))
            .toBe('Cancelled — no refund issued');
    });
});
