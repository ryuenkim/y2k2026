import api from '../api';
import {
    LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAIL,
    REGISTER_USER_REQUEST, REGISTER_USER_SUCCESS, REGISTER_USER_FAIL,
    LOAD_USER_REQUEST, LOAD_USER_SUCCESS, LOAD_USER_FAIL,
    LOGOUT_SUCCESS, LOGOUT_FAIL
} from '../constants/authConstants';

const messageFrom = (error, fallback) => error.response?.data?.message || fallback;

export const loginUser = (credentials) => async (dispatch) => {
    dispatch({ type: LOGIN_REQUEST });
    try {
        const { data } = await api.post('/login', credentials);
        dispatch({ type: LOGIN_SUCCESS, payload: data.user });
        return data.user;
    } catch (error) {
        const message = messageFrom(error, 'Unable to log in');
        dispatch({ type: LOGIN_FAIL, payload: message });
        throw new Error(message, { cause: error });
    }
};

const firebaseSocialLogin = (provider, idToken) => async (dispatch) => {
    dispatch({ type: LOGIN_REQUEST });
    try {
        const { data } = await api.post(`/${provider}`, { idToken });
        dispatch({ type: LOGIN_SUCCESS, payload: data.user });
        return data.user;
    } catch (error) {
        const providerName = provider === 'google' ? 'Google' : 'Facebook';
        const message = messageFrom(error, `Unable to sign in with ${providerName}`);
        dispatch({ type: LOGIN_FAIL, payload: message });
        throw new Error(message, { cause: error });
    }
};

export const googleLogin = (idToken) => firebaseSocialLogin('google', idToken);
export const facebookLogin = (idToken) => firebaseSocialLogin('facebook', idToken);

export const registerUser = (details) => async (dispatch) => {
    dispatch({ type: REGISTER_USER_REQUEST });
    try {
        const { data } = await api.post('/register', details);
        dispatch({ type: REGISTER_USER_SUCCESS, payload: data.user });
        return data.user;
    } catch (error) {
        const message = messageFrom(error, 'Unable to create your account');
        dispatch({ type: REGISTER_USER_FAIL, payload: message });
        throw new Error(message, { cause: error });
    }
};

export const loadUser = () => async (dispatch) => {
    dispatch({ type: LOAD_USER_REQUEST });
    try {
        const { data } = await api.get('/me');
        dispatch({ type: LOAD_USER_SUCCESS, payload: data.user });
        return data.user;
    } catch (error) {
        dispatch({ type: LOAD_USER_FAIL, payload: messageFrom(error, 'Not authenticated') });
        return null;
    }
};

export const logoutUser = () => async (dispatch) => {
    try {
        await api.get('/logout');
        dispatch({ type: LOGOUT_SUCCESS });
    } catch (error) {
        dispatch({ type: LOGOUT_FAIL, payload: messageFrom(error, 'Unable to log out') });
        throw error;
    }
};
