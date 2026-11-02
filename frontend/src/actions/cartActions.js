import { ADD_TO_CART, UPDATE_CART_QUANTITY, REMOVE_FROM_CART, CLEAR_CART, SET_CART_SCOPE } from '../constants/cartConstants';

export const addToCart = (product, quantity) => ({
    type: ADD_TO_CART,
    payload: {
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.url || '',
        stock: product.stock,
        quantity
    }
});

export const updateCartQuantity = (product, quantity) => ({
    type: UPDATE_CART_QUANTITY,
    payload: { product, quantity }
});

export const removeFromCart = (product) => ({ type: REMOVE_FROM_CART, payload: product });
export const clearCart = () => ({ type: CLEAR_CART });
export const setCartScope = (scope) => (dispatch) => {
    const scopedKey = `y2kCart:${scope}`;
    if (scope === 'guest') {
        localStorage.removeItem(scopedKey);
    } else {
        localStorage.removeItem('y2kCart:guest');
        localStorage.removeItem('y2kCart');
    }
    dispatch({ type: SET_CART_SCOPE, payload: scope });
};
