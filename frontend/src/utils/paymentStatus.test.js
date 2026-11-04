import { describe, expect, it } from 'vitest';
import { getPaymentStatusLabel } from './paymentStatus';

describe('getPaymentStatusLabel', () => {
    it('explains COD due state and online payment', () => {
        expect(getPaymentStatusLabel({ paymentMethod: 'COD', transactionStatus: 'pending', orderStatus: 'Processing' }))
            .toBe('Payment due on delivery');
        expect(getPaymentStatusLabel({ paymentMethod: 'ONLINE', transactionStatus: 'paid', paymentInfo: { provider: 'online' } }))
            .toBe('Paid');
    });

    it('does not imply payment is due for cancelled orders', () => {
        expect(getPaymentStatusLabel({ orderStatus: 'Cancelled', transactionStatus: 'pending' }))
            .toBe('Cancelled — no payment due');
    });
});
