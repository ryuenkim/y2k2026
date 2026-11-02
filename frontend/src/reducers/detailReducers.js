import {
    PRODUCT_DETAILS_REQUEST, PRODUCT_DETAILS_SUCCESS, PRODUCT_DETAILS_FAIL, PRODUCT_DETAILS_CLEAR,
    ORDER_DETAILS_REQUEST, ORDER_DETAILS_SUCCESS, ORDER_DETAILS_FAIL,
    NEW_ORDER_REQUEST, NEW_ORDER_SUCCESS, NEW_ORDER_FAIL, NEW_ORDER_RESET
} from '../constants/detailConstants';

export const productDetailsReducer = (state = { product: null, loading: false, error: null }, action) => {
    switch (action.type) {
        case PRODUCT_DETAILS_REQUEST: return { ...state, loading: true, error: null };
        case PRODUCT_DETAILS_SUCCESS: return { product: action.payload, loading: false, error: null };
        case PRODUCT_DETAILS_FAIL: return { ...state, loading: false, error: action.payload };
        case PRODUCT_DETAILS_CLEAR: return { product: null, loading: false, error: null };
        default: return state;
    }
};

export const orderDetailsReducer = (state = { order: null, loading: false, error: null }, action) => {
    switch (action.type) {
        case ORDER_DETAILS_REQUEST: return { ...state, loading: true, error: null };
        case ORDER_DETAILS_SUCCESS: return { order: action.payload, loading: false, error: null };
        case ORDER_DETAILS_FAIL: return { ...state, loading: false, error: action.payload };
        default: return state;
    }
};

export const newOrderReducer = (state = { order: null, loading: false, error: null }, action) => {
    switch (action.type) {
        case NEW_ORDER_REQUEST: return { ...state, loading: true, error: null };
        case NEW_ORDER_SUCCESS: return { order: action.payload, loading: false, error: null };
        case NEW_ORDER_FAIL: return { ...state, loading: false, error: action.payload };
        case NEW_ORDER_RESET: return { order: null, loading: false, error: null };
        default: return state;
    }
};
