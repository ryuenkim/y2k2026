import {
    LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAIL,
    REGISTER_USER_REQUEST, REGISTER_USER_SUCCESS, REGISTER_USER_FAIL,
    LOAD_USER_REQUEST, LOAD_USER_SUCCESS, LOAD_USER_FAIL,
    LOGOUT_SUCCESS
} from '../constants/authConstants';
import {
    FORGOT_PASSWORD_REQUEST, FORGOT_PASSWORD_SUCCESS, FORGOT_PASSWORD_FAIL,
    RESET_PASSWORD_REQUEST, RESET_PASSWORD_SUCCESS, RESET_PASSWORD_FAIL
} from '../constants/passwordConstants';

const initialState = { user: null, loading: false, error: null };

export const userReducer = (state = initialState, action) => {
    switch (action.type) {
        case LOGIN_REQUEST:
        case REGISTER_USER_REQUEST:
        case LOAD_USER_REQUEST:
            return { ...state, loading: true, error: null };
        case LOGIN_SUCCESS:
        case REGISTER_USER_SUCCESS:
        case LOAD_USER_SUCCESS:
        case 'USER_DETAILS_SUCCESS':
            return { user: action.payload, loading: false, error: null };
        case LOGIN_FAIL:
        case REGISTER_USER_FAIL:
        case LOAD_USER_FAIL:
            return { user: null, loading: false, error: action.payload };
        case LOGOUT_SUCCESS:
            return initialState;
        default:
            return state;
    }
};

export const forgotPasswordReducer = (state = { message: null, loading: false, error: null }, action) => {
    switch (action.type) {
        case FORGOT_PASSWORD_REQUEST:
        case RESET_PASSWORD_REQUEST:
            return { ...state, loading: true, error: null, message: null };
        case FORGOT_PASSWORD_SUCCESS:
        case RESET_PASSWORD_SUCCESS:
            return { loading: false, error: null, message: action.payload };
        case FORGOT_PASSWORD_FAIL:
        case RESET_PASSWORD_FAIL:
            return { loading: false, error: action.payload, message: null };
        default:
            return state;
    }
};

export const userDetailsReducer = (state = { user: null, loading: false, error: null }, action) => {
    switch (action.type) {
        case 'USER_DETAILS_REQUEST': return { ...state, loading: true, error: null };
        case 'USER_DETAILS_SUCCESS': return { user: action.payload, loading: false, error: null };
        case 'USER_DETAILS_FAIL': return { ...state, loading: false, error: action.payload };
        default: return state;
    }
};
