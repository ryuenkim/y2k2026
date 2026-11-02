import { ADD_TO_CART, UPDATE_CART_QUANTITY, REMOVE_FROM_CART, CLEAR_CART, SET_CART_SCOPE } from '../constants/cartConstants';

const getStorageKey = (scope) => `y2kCart:${scope}`;
const readCart = (scope) => {
    if (typeof localStorage === 'undefined') return [];
    try {
        const scopedCart = localStorage.getItem(getStorageKey(scope));
        if (scopedCart) return JSON.parse(scopedCart);
    } catch {
        return [];
    }
    return [];
};

const initialState = { scope: 'guest', cartItems: readCart('guest') };

export const cartReducer = (state = initialState, action) => {
    let cartItems;
    switch (action.type) {
        case SET_CART_SCOPE:
            return { scope: action.payload, cartItems: readCart(action.payload) };
        case ADD_TO_CART: {
            const item = action.payload;
            const existing = state.cartItems.find((cartItem) => cartItem.product === item.product);
            cartItems = existing
                ? state.cartItems.map((cartItem) => cartItem.product === item.product
                    ? { ...cartItem, quantity: Math.min(item.stock, cartItem.quantity + item.quantity) } : cartItem)
                : [...state.cartItems, item];
            return { ...state, cartItems };
        }
        case UPDATE_CART_QUANTITY:
            cartItems = state.cartItems.map((item) => item.product === action.payload.product
                ? { ...item, quantity: Math.max(1, Math.min(item.stock, action.payload.quantity)) } : item);
            return { ...state, cartItems };
        case REMOVE_FROM_CART:
            return { ...state, cartItems: state.cartItems.filter((item) => item.product !== action.payload) };
        case CLEAR_CART:
            return { ...state, cartItems: [] };
        default:
            return state;
    }
};

export { getStorageKey };
