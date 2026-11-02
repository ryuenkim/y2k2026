import { describe, expect, it } from 'vitest';
import { productsReducer } from './productReducers';
import { PRODUCTS_SUCCESS } from '../constants/productConstants';

describe('productsReducer catalog metadata', () => {
    it('retains matching-result counts for search feedback', () => {
        const state = productsReducer(undefined, {
            type: PRODUCTS_SUCCESS,
            payload: {
                products: [{ _id: 'product-1' }],
                append: false,
                currentPage: 1,
                filteredProductsCount: 1,
                productsCount: 20,
                resPerPage: 8
            }
        });

        expect(state.filteredProductsCount).toBe(1);
        expect(state.productsCount).toBe(20);
        expect(state.totalPages).toBe(1);
    });
});
