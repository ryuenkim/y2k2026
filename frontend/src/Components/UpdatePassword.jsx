import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api';

const schema = yup.object({
    oldPassword: yup.string().required('Current password is required'),
    password: yup.string()
        .min(8, 'New password must be at least 8 characters')
        .matches(/[A-Z]/, 'New password must include an uppercase letter')
        .matches(/[a-z]/, 'New password must include a lowercase letter')
        .matches(/[0-9]/, 'New password must include a number')
        .required('New password is required'),
    confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Please confirm the new password')
});

export default function UpdatePassword() {
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema) });
    const submit = async (values) => {
        setMessage('');
        setError('');
        try {
            const { data } = await api.put('/password/update', values);
            setMessage(data.message || 'Password updated successfully');
            reset();
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to update password');
        }
    };
    return <main className="form-page">
        <Link to="/profile">Back to profile</Link>
        <h1>Change password</h1>
        {message && <p className="success-state">{message}</p>}
        {error && <p className="error-state">{error}</p>}
        <form onSubmit={handleSubmit(submit)}>
            <label htmlFor="current-password">Current password</label>
            <input id="current-password" type="password" autoComplete="current-password" aria-invalid={Boolean(errors.oldPassword)} aria-describedby={errors.oldPassword ? 'current-password-error' : undefined} placeholder="Current password" {...register('oldPassword')} />
            {errors.oldPassword && <small id="current-password-error" className="field-error" role="alert">{errors.oldPassword.message}</small>}
            <label htmlFor="new-password">New password</label>
            <input id="new-password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'new-password-error' : undefined} placeholder="New password" {...register('password')} />
            {errors.password && <small id="new-password-error" className="field-error" role="alert">{errors.password.message}</small>}
            <label htmlFor="confirm-password">Confirm new password</label>
            <input id="confirm-password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined} placeholder="Confirm new password" {...register('confirmPassword')} />
            {errors.confirmPassword && <small id="confirm-password-error" className="field-error" role="alert">{errors.confirmPassword.message}</small>}
            <button className="view-btn" type="submit" disabled={isSubmitting}>Update password</button>
            <button className="text-btn" type="button" onClick={() => navigate('/profile')}>Cancel</button>
        </form>
    </main>;
}
