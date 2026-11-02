import api from '../api';
import {
    PRODUCT_DETAILS_REQUEST, PRODUCT_DETAILS_SUCCESS, PRODUCT_DETAILS_FAIL,
    ORDER_DETAILS_REQUEST, ORDER_DETAILS_SUCCESS, ORDER_DETAILS_FAIL,
    NEW_ORDER_REQUEST, NEW_ORDER_SUCCESS, NEW_ORDER_FAIL
} from '../constants/detailConstants';

export const fetchProductDetails = (id, reviewSort) => async (dispatch) => {
    dispatch({ type: PRODUCT_DETAILS_REQUEST });
    try {
        const { data } = await api.get(`/product/${id}?reviewSort=${reviewSort}`);
        dispatch({ type: PRODUCT_DETAILS_SUCCESS, payload: data.product });
        return data.product;
    } catch (error) {
        const message = error.response?.data?.message || 'Product unavailable';
        dispatch({ type: PRODUCT_DETAILS_FAIL, payload: message });
        throw error;
    }
};

export const fetchOrderDetails = (id) => async (dispatch) => {
    dispatch({ type: ORDER_DETAILS_REQUEST });
    try {
        const { data } = await api.get(`/order/${id}`);
        dispatch({ type: ORDER_DETAILS_SUCCESS, payload: data.order });
        return data.order;
    } catch (error) {
        const message = error.response?.data?.message || 'Order unavailable';
        dispatch({ type: ORDER_DETAILS_FAIL, payload: message });
        throw error;
    }
};

export const createOrder = (payload) => async (dispatch) => {
    dispatch({ type: NEW_ORDER_REQUEST });
    try {
        const { data } = await api.post('/order/new', payload);
        dispatch({ type: NEW_ORDER_SUCCESS, payload: data.order });
        return data;
    } catch (error) {
        const message = error.response?.data?.message || 'Unable to place order';
        dispatch({ type: NEW_ORDER_FAIL, payload: message });
        throw error;
    }
};
