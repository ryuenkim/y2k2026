const Shipping = ({ shippingInfo, setShippingInfo, fieldErrors, setFieldErrors, onNext, error }) => {
    const labels = {
        address: 'Street address',
        city: 'City',
        phoneNo: 'Phone number',
        postalCode: 'Postal code',
        country: 'Country'
    };
    return <section className="checkout-card">
        <p className="eyebrow">STEP 1</p>
        <h1>Shipping information</h1>
        <p className="checkout-copy">Tell us where to send your Y2K pieces.</p>
        <form onSubmit={onNext} noValidate>
            {Object.entries(shippingInfo).map(([key, value]) => (
                <label key={key} htmlFor={`shipping-${key}`}>
                    {labels[key]}
                    <input
                        id={`shipping-${key}`}
                        type={key === 'phoneNo' ? 'tel' : 'text'}
                        required
                        inputMode={key === 'phoneNo' ? 'tel' : key === 'postalCode' ? 'numeric' : undefined}
                        autoComplete={key === 'address' ? 'street-address' : key === 'city' ? 'address-level2' : key === 'postalCode' ? 'postal-code' : key === 'country' ? 'country-name' : 'tel'}
                        value={value}
                        aria-invalid={Boolean(fieldErrors[key])}
                        aria-describedby={fieldErrors[key] ? `shipping-${key}-error` : undefined}
                        onChange={(event) => {
                            setShippingInfo({ ...shippingInfo, [key]: event.target.value });
                            setFieldErrors((current) => ({ ...current, [key]: '' }));
                        }}
                    />
                    {fieldErrors[key] && <small id={`shipping-${key}-error`} className="field-error" role="alert">{fieldErrors[key]}</small>}
                </label>
            ))}
            {error && <p className="error-state" role="alert">{error}</p>}
            <button className="view-btn" type="submit">Continue to confirmation</button>
        </form>
    </section>;
};

export default Shipping;
