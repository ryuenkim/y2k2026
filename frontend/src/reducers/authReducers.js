import {
    LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAIL,
    REGISTER_USER_REQUEST, REGISTER_USER_SUCCESS, REGISTER_USER_FAIL,
    LOAD_USER_REQUEST, LOAD_USER_SUCCESS, LOAD_USER_FAIL,
    LOGOUT_SUCCESS, LOGOUT_FAIL, CLEAR_AUTH_ERRORS
} from '../constants/authConstants';

const initialState = { user: null, loading: false, isAuthenticated: false, error: null };

export const authReducer = (state = initialState, action) => {
    switch (action.type) {
        case LOGIN_REQUEST:
        case REGISTER_USER_REQUEST:
        case LOAD_USER_REQUEST:
            return { ...state, loading: true, error: null };
        case LOGIN_SUCCESS:
        case REGISTER_USER_SUCCESS:
        case LOAD_USER_SUCCESS:
            return { ...state, user: action.payload, loading: false, isAuthenticated: true, error: null };
        case LOGIN_FAIL:
        case REGISTER_USER_FAIL:
        case LOAD_USER_FAIL:
            return { ...state, user: null, loading: false, isAuthenticated: false, error: action.payload };
        case LOGOUT_SUCCESS:
            return { ...initialState };
        case LOGOUT_FAIL:
            return { ...state, error: action.payload };
        case CLEAR_AUTH_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};
