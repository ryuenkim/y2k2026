import api from '../api';
import { MY_ORDERS_REQUEST, MY_ORDERS_SUCCESS, MY_ORDERS_FAIL } from '../constants/orderConstants';

export const fetchMyOrders = () => async (dispatch) => {
    dispatch({ type: MY_ORDERS_REQUEST });
    try {
        const { data } = await api.get('/orders/me');
        dispatch({ type: MY_ORDERS_SUCCESS, payload: data.orders });
        return data.orders;
    } catch (error) {
        const message = error.response?.data?.message || 'Please log in to view orders';
        dispatch({ type: MY_ORDERS_FAIL, payload: message });
        throw error;
    }
};
