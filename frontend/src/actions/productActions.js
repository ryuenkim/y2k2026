import api from '../api';
import { PRODUCTS_REQUEST, PRODUCTS_SUCCESS, PRODUCTS_FAIL } from '../constants/productConstants';

export const fetchProducts = (query, append = false) => async (dispatch) => {
    dispatch({ type: PRODUCTS_REQUEST });
    try {
        const { data } = await api.get(`/products?${query.toString()}`);
        dispatch({ type: PRODUCTS_SUCCESS, payload: { ...data, append } });
        return data;
    } catch (error) {
        const message = error.response?.data?.message || 'Failed to fetch products';
        dispatch({ type: PRODUCTS_FAIL, payload: message });
        throw error;
    }
};
