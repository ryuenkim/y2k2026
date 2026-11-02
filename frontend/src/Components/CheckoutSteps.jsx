const CheckoutSteps = ({ step }) => (
    <nav className="checkout-steps" aria-label="Checkout progress">
        {['Shipping', 'Confirm order', 'Payment'].map((label, index) => (
            <span className={step >= index + 1 ? 'active' : ''} key={label}>
                {index + 1}. {label}
            </span>
        ))}
    </nav>
);

export default CheckoutSteps;
