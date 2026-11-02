import {
    ADMIN_PRODUCTS_REQUEST, ADMIN_PRODUCTS_SUCCESS, ADMIN_PRODUCTS_FAIL,
    ADMIN_USERS_REQUEST, ADMIN_USERS_SUCCESS, ADMIN_USERS_FAIL,
    ADMIN_ORDERS_REQUEST, ADMIN_ORDERS_SUCCESS, ADMIN_ORDERS_FAIL,
    ADMIN_ANALYTICS_REQUEST, ADMIN_ANALYTICS_SUCCESS, ADMIN_ANALYTICS_FAIL,
    NEW_PRODUCT_REQUEST, NEW_PRODUCT_SUCCESS, NEW_PRODUCT_FAIL, NEW_PRODUCT_RESET
} from '../constants/adminConstants';

export const adminProductsReducer = (state = { products: [], loading: false, error: null }, action) => {
    switch (action.type) {
        case ADMIN_PRODUCTS_REQUEST: return { ...state, loading: true, error: null };
        case ADMIN_PRODUCTS_SUCCESS: return { products: action.payload, loading: false, error: null };
        case ADMIN_PRODUCTS_FAIL: return { ...state, loading: false, error: action.payload };
        default: return state;
    }
};

export const allUsersReducer = (state = { users: [], loading: false, error: null }, action) => {
    switch (action.type) {
        case ADMIN_USERS_REQUEST: return { ...state, loading: true, error: null };
        case ADMIN_USERS_SUCCESS: return { users: action.payload, loading: false, error: null };
        case ADMIN_USERS_FAIL: return { ...state, loading: false, error: action.payload };
        default: return state;
    }
};

export const allOrdersReducer = (state = { orders: [], loading: false, error: null }, action) => {
    switch (action.type) {
        case ADMIN_ORDERS_REQUEST: return { ...state, loading: true, error: null };
        case ADMIN_ORDERS_SUCCESS: return { orders: action.payload, loading: false, error: null };
        case ADMIN_ORDERS_FAIL: return { ...state, loading: false, error: action.payload };
        default: return state;
    }
};

export const adminAnalyticsReducer = (state = {
    analytics: { sales: [], totalSales: 0, orderCount: 0 }, loading: false, error: null
}, action) => {
    switch (action.type) {
        case ADMIN_ANALYTICS_REQUEST: return { ...state, loading: true, error: null };
        case ADMIN_ANALYTICS_SUCCESS: return { analytics: action.payload, loading: false, error: null };
        case ADMIN_ANALYTICS_FAIL: return { ...state, loading: false, error: action.payload };
        default: return state;
    }
};

export const newProductReducer = (state = { product: null, loading: false, error: null }, action) => {
    switch (action.type) {
        case NEW_PRODUCT_REQUEST: return { ...state, loading: true, error: null };
        case NEW_PRODUCT_SUCCESS: return { product: action.payload, loading: false, error: null };
        case NEW_PRODUCT_FAIL: return { ...state, loading: false, error: action.payload };
        case NEW_PRODUCT_RESET: return { product: null, loading: false, error: null };
        default: return state;
    }
};
