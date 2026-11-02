const ConfirmOrder = ({ items, shippingInfo, prices, inventoryCheck, error, onNext, onBack, onReturnToCart, onRetryInventory }) => (
    <section className="checkout-card">
        <p className="eyebrow">STEP 2</p>
        <h1>Confirm order</h1>
        <div className="checkout-summary">
            <h2>Shipping info</h2>
            <p>{shippingInfo.address}, {shippingInfo.city}, {shippingInfo.postalCode}, {shippingInfo.country}</p>
            <p>{shippingInfo.phoneNo}</p>
            <h2>Your cart items</h2>
            {items.map((item) => (
                <div className="checkout-item" key={item.product}>
                    <img className="checkout-item-image" src={item.image} alt="" />
                    <span>{item.name} × {item.quantity}<small>₱{Number(item.price).toFixed(2)} each · {item.stock} in stock</small></span>
                    <strong>₱{(item.price * item.quantity).toFixed(2)}</strong>
                </div>
            ))}
            <aside className="checkout-inventory-status" aria-live="polite">
                {inventoryCheck.checking && <p role="status">{inventoryCheck.message}</p>}
                {!inventoryCheck.checking && inventoryCheck.message && <p role={inventoryCheck.blocking ? 'alert' : 'status'}>{inventoryCheck.message}</p>}
                {error && error !== inventoryCheck.message && <p role="alert">{error}</p>}
                {!inventoryCheck.checking && inventoryCheck.needsReview && !inventoryCheck.blocking && <p>Current prices and stock are shown above. Confirm the updated order to proceed.</p>}
                {inventoryCheck.blocking && <div className="checkout-actions">
                    <button className="text-btn" type="button" onClick={onRetryInventory}>Check again</button>
                    <button className="text-btn" type="button" onClick={onReturnToCart}>Return to cart</button>
                </div>}
            </aside>
            <aside className="product-delivery-note">
                <p><strong>Delivery:</strong> Free for orders over PHP 200; PHP 25 otherwise.</p>
                <p><strong>Returns:</strong> Contact the shop to confirm return eligibility.</p>
            </aside>
            <div className="checkout-total">
                <span>Subtotal</span><strong>₱{prices.itemsPrice.toFixed(2)}</strong>
                <span>Shipping</span><strong>₱{prices.shippingPrice.toFixed(2)}</strong>
                <span>Tax</span><strong>₱{prices.taxPrice.toFixed(2)}</strong>
                <span>Total</span><strong>₱{prices.totalPrice.toFixed(2)}</strong>
            </div>
        </div>
        <div className="checkout-actions">
            <button className="text-btn" type="button" onClick={onBack}>Back</button>
            <button className="view-btn" type="button" onClick={onNext} disabled={inventoryCheck.checking || inventoryCheck.blocking}>
                {inventoryCheck.checking ? 'Checking stock…' : inventoryCheck.needsReview ? 'Confirm updated order' : 'Proceed to payment'}
            </button>
        </div>
    </section>
);

export default ConfirmOrder;
