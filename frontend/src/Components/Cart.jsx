import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDialog } from './dialogContext';

const Cart = ({ items, updateQuantity, removeItem }) => {
    const navigate = useNavigate();
    const { confirm, notify } = useDialog();
    const [selectedProducts, setSelectedProducts] = useState(() => items.map((item) => item.product));
    const selectedItems = items.filter((item) => selectedProducts.includes(item.product));
    const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return (
        <main className="page-container">
            <h1>Your Y2K cart</h1>
            {!items.length ? <p className="no-products">Your cart is empty. <Link to="/">Explore the collection.</Link></p> : (
                <>
                    <div className="cart-list">
                        {items.map((item) => (
                            <article className="cart-item" key={item.product}>
                                <label className="cart-select">
                                    <input
                                        type="checkbox"
                                        aria-label={`Select ${item.name} for checkout`}
                                        checked={selectedProducts.includes(item.product)}
                                        onChange={(event) => setSelectedProducts((selected) => event.target.checked
                                            ? [...selected, item.product]
                                            : selected.filter((product) => product !== item.product))}
                                    />
                                </label>
                                <img src={item.image} alt={item.name} />
                                <div><h2>{item.name}</h2><p>₱{item.price.toFixed(2)}</p></div>
                                <div className="quantity-control">
                                    <button type="button" onClick={() => updateQuantity(item.product, item.quantity - 1)}>−</button>
                                    <span>{item.quantity}</span>
                                    <button type="button" onClick={() => updateQuantity(item.product, item.quantity + 1)}>+</button>
                                </div>
                                <button type="button" className="text-button" onClick={async () => {
                                    if (await confirm(`Remove ${item.name} from your cart?`, 'Remove cart item?')) {
                                        setSelectedProducts((selected) => selected.filter((product) => product !== item.product));
                                        removeItem(item.product);
                                        notify(`${item.name} removed from your cart.`, 'info');
                                    }
                                }}>Remove</button>
                            </article>
                        ))}
                    </div>
                    <section className="cart-summary">
                        <h2>Subtotal: ₱{subtotal.toFixed(2)}</h2>
                        <button className="view-btn" onClick={() => {
                            if (!selectedItems.length) {
                                notify('Select at least one product to check out.', 'error');
                                return;
                            }
                            notify('Opening secure checkout.', 'info');
                            navigate('/checkout', { state: { checkoutItems: selectedItems, checkoutSource: 'cart' } });
                        }} disabled={!selectedItems.length}>Continue to checkout ({selectedItems.length})</button>
                    </section>
                </>
            )}
        </main>
    );
};

export default Cart;
