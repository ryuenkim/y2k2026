import api from '../api';
import {
    ADMIN_PRODUCTS_REQUEST, ADMIN_PRODUCTS_SUCCESS, ADMIN_PRODUCTS_FAIL,
    ADMIN_USERS_REQUEST, ADMIN_USERS_SUCCESS, ADMIN_USERS_FAIL,
    ADMIN_ORDERS_REQUEST, ADMIN_ORDERS_SUCCESS, ADMIN_ORDERS_FAIL,
    ADMIN_ANALYTICS_REQUEST,
    ADMIN_ANALYTICS_SUCCESS,
    ADMIN_ANALYTICS_FAIL
} from '../constants/adminConstants';

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

export const fetchAdminData = () => async (dispatch) => {
    dispatch({ type: ADMIN_PRODUCTS_REQUEST });
    dispatch({ type: ADMIN_USERS_REQUEST });
    dispatch({ type: ADMIN_ORDERS_REQUEST });
    const results = await Promise.allSettled([
        api.get('/admin/products'),
        api.get('/admin/users'),
        api.get('/admin/orders')
    ]);
    const [productResult, userResult, orderResult] = results;
    const data = {};
    if (productResult.status === 'fulfilled') {
        data.products = productResult.value.data.products;
        dispatch({ type: ADMIN_PRODUCTS_SUCCESS, payload: data.products });
    } else dispatch({ type: ADMIN_PRODUCTS_FAIL, payload: getErrorMessage(productResult.reason, 'Unable to load admin products') });
    if (userResult.status === 'fulfilled') {
        data.users = userResult.value.data.users;
        dispatch({ type: ADMIN_USERS_SUCCESS, payload: data.users });
    } else dispatch({ type: ADMIN_USERS_FAIL, payload: getErrorMessage(userResult.reason, 'Unable to load admin users') });
    if (orderResult.status === 'fulfilled') {
        data.orders = orderResult.value.data.orders;
        dispatch({ type: ADMIN_ORDERS_SUCCESS, payload: data.orders });
    } else dispatch({ type: ADMIN_ORDERS_FAIL, payload: getErrorMessage(orderResult.reason, 'Unable to load admin orders') });
    const failedResources = [
        ['products', productResult],
        ['users', userResult],
        ['orders', orderResult]
    ].filter(([, result]) => result.status === 'rejected');

    if (!failedResources.length) return data;

    const message = failedResources.map(([resource, result]) => {
        const fallback = `Unable to load admin ${resource}`;
        return `${resource}: ${getErrorMessage(result.reason, fallback)}`;
    }).join(' | ');
    if (failedResources.length === 3) throw productResult.reason;
    data.error = message;
    return data;
};

export const fetchAdminAnalytics = (range) => async (dispatch) => {
    dispatch({ type: ADMIN_ANALYTICS_REQUEST });
    try {
        const { data } = await api.get(`/admin/analytics/sales?from=${range.from}&to=${range.to}`);
        dispatch({ type: ADMIN_ANALYTICS_SUCCESS, payload: data });
        return data;
    } catch (error) {
        const message = getErrorMessage(error, 'Unable to load sales analytics');
        dispatch({ type: ADMIN_ANALYTICS_FAIL, payload: message });
        throw error;
    }
};

export const refreshAdmin = (range) => async (dispatch) => {
    await Promise.all([dispatch(fetchAdminData()), dispatch(fetchAdminAnalytics(range))]);
};
