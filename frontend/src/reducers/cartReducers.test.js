import { describe, expect, it } from 'vitest';
import { cartReducer } from './cartReducers';
import { ADD_TO_CART, SET_CART_SCOPE, CLEAR_CART } from '../constants/cartConstants';

describe('scoped cart reducer', () => {
    it('adds and merges a product quantity', () => {
        const product = { product: 'p1', name: 'Test', price: 10, quantity: 1, stock: 5 };
        let state = cartReducer(undefined, { type: ADD_TO_CART, payload: product });
        state = cartReducer(state, { type: ADD_TO_CART, payload: product });
        expect(state.cartItems[0].quantity).toBe(2);
    });

    it('switches scopes and clears cart explicitly', () => {
        const product = { product: 'p1', name: 'Test', price: 10, quantity: 1, stock: 5 };
        let state = cartReducer(undefined, { type: ADD_TO_CART, payload: product });
        state = cartReducer(state, { type: SET_CART_SCOPE, payload: 'user:u1' });
        expect(state.scope).toBe('user:u1');
        state = cartReducer(state, { type: CLEAR_CART });
        expect(state.cartItems).toEqual([]);
    });
});
