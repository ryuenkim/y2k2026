import { MY_ORDERS_REQUEST, MY_ORDERS_SUCCESS, MY_ORDERS_FAIL, CLEAR_ORDER_ERRORS } from '../constants/orderConstants';

const initialState = { orders: [], loading: false, error: null };

export const myOrdersReducer = (state = initialState, action) => {
    switch (action.type) {
        case MY_ORDERS_REQUEST:
            return { ...state, loading: true, error: null };
        case MY_ORDERS_SUCCESS:
            return { ...state, loading: false, orders: action.payload };
        case MY_ORDERS_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CLEAR_ORDER_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};
