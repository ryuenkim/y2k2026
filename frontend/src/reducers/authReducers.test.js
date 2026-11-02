import { describe, expect, it } from 'vitest';
import { authReducer } from './authReducers';
import { LOGIN_SUCCESS, LOGOUT_SUCCESS, LOGIN_FAIL } from '../constants/authConstants';

describe('authentication reducer', () => {
    it('stores the authenticated user', () => {
        const user = { _id: 'u1', role: 'user' };
        const state = authReducer(undefined, { type: LOGIN_SUCCESS, payload: user });
        expect(state.user).toEqual(user);
        expect(state.isAuthenticated).toBe(true);
    });

    it('clears the user on logout', () => {
        const state = authReducer({ user: { _id: 'u1' }, isAuthenticated: true }, { type: LOGOUT_SUCCESS });
        expect(state.user).toBe(null);
        expect(state.isAuthenticated).toBe(false);
    });

    it('retains a visible login error', () => {
        const state = authReducer(undefined, { type: LOGIN_FAIL, payload: 'Invalid credentials' });
        expect(state.error).toBe('Invalid credentials');
        expect(state.loading).toBe(false);
    });
});
