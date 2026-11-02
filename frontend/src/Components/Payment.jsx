import { useState } from 'react';

const Payment = ({ totalPrice, onSubmit, onBack, submitting, disabled, error }) => {
    const [paymentMethod, setPaymentMethod] = useState('ONLINE');
    const [paymentSimulation, setPaymentSimulation] = useState('approved');

    return (
        <section className="checkout-card">
            <p className="eyebrow">STEP 3</p>
            <h1>Payment method</h1>
            <p className="admin-message" role="note">Demo checkout only. No card details are collected and no real payment or refund is processed.</p>
            <form onSubmit={(event) => {
                event.preventDefault();
                onSubmit(event, { paymentMethod, paymentSimulation });
            }}>
                <fieldset className="payment-options">
                    <legend>Choose how you want to pay</legend>
                    <label className="payment-option">
                        <input type="radio" name="paymentMethod" value="ONLINE" checked={paymentMethod === 'ONLINE'} onChange={() => setPaymentMethod('ONLINE')} />
                        <span><strong>Online payment</strong><small>Simulate an approved or declined payment.</small></span>
                    </label>
                    <label className="payment-option">
                        <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                        <span><strong>Cash on Delivery</strong><small>Pay PHP {totalPrice.toFixed(2)} when your order arrives.</small></span>
                    </label>
                </fieldset>
                {paymentMethod === 'ONLINE' && (
                    <label>Simulation result
                        <select value={paymentSimulation} onChange={(event) => setPaymentSimulation(event.target.value)}>
                            <option value="approved">Payment approved</option>
                            <option value="declined">Payment declined</option>
                        </select>
                    </label>
                )}
                {error && <p className="error-state">{error}</p>}
                <div className="checkout-actions">
                    <button className="text-btn" type="button" onClick={onBack}>Back</button>
                    <button className="view-btn" type="submit" disabled={submitting || disabled}>
                        {submitting ? 'Processing...' : paymentMethod === 'COD' ? 'Place COD order' : `Simulate payment · PHP ${totalPrice.toFixed(2)}`}
                    </button>
                </div>
            </form>
        </section>
    );
};

export default Payment;
