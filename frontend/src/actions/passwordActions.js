import api from '../api';
import {
    FORGOT_PASSWORD_REQUEST, FORGOT_PASSWORD_SUCCESS, FORGOT_PASSWORD_FAIL,
    RESET_PASSWORD_REQUEST, RESET_PASSWORD_SUCCESS, RESET_PASSWORD_FAIL
} from '../constants/passwordConstants';

export const forgotPassword = (email) => async (dispatch) => {
    dispatch({ type: FORGOT_PASSWORD_REQUEST });
    try {
        const { data } = await api.post('/password/forgot', { email });
        dispatch({ type: FORGOT_PASSWORD_SUCCESS, payload: data.message });
        return data;
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data?.error || 'Unable to send password reset email';
        dispatch({ type: FORGOT_PASSWORD_FAIL, payload: message });
        throw error;
    }
};

export const resetPassword = (token, password, confirmPassword) => async (dispatch) => {
    dispatch({ type: RESET_PASSWORD_REQUEST });
    try {
        const { data } = await api.put(`/password/reset/${token}`, { password, confirmPassword });
        dispatch({ type: RESET_PASSWORD_SUCCESS, payload: 'Password reset successfully' });
        return data;
    } catch (error) {
        const message = error.response?.data?.message || 'Unable to reset password';
        dispatch({ type: RESET_PASSWORD_FAIL, payload: message });
        throw error;
    }
};
