import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../actions/authActions';
import { useDialog } from './dialogContext';

const registerSchema = yup.object({
    name: yup.string().trim().min(2, 'Name must be at least 2 characters').max(30).required('Name is required'),
    email: yup.string().email('Enter a valid email').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
});

const Register = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const loading = useSelector((state) => state.auth.loading);
    const { notify } = useDialog();
    const [error, setError] = useState('');
    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(registerSchema) });
    const submit = async (form) => {
        try {
            await dispatch(registerUser(form));
            notify('Your Y2K account was created successfully.');
            navigate('/shop');
        } catch (requestError) {
            setError(requestError.message || 'Unable to create account');
        }
    };
    return <main className="auth-page"><section className="auth-panel"><Link className="auth-brand" to="/">Y2K<span>TECH</span></Link><p className="eyebrow">NEW ACCOUNT</p><h1>Make it yours.</h1><p className="auth-intro">Create your account for faster checkout, order tracking, and verified reviews.</p><form onSubmit={handleSubmit(submit)}>
        {error && <p className="error-state">{error}</p>}
        <label htmlFor="register-name">Full name</label><input id="register-name" autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'register-name-error' : undefined} placeholder="Your name" {...register('name')} />{errors.name && <small id="register-name-error" className="field-error" role="alert">{errors.name.message}</small>}
        <label htmlFor="register-email">Email address</label><input id="register-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'register-email-error' : undefined} placeholder="you@example.com" {...register('email')} />{errors.email && <small id="register-email-error" className="field-error" role="alert">{errors.email.message}</small>}
        <label htmlFor="register-password">Password</label><input id="register-password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'register-password-error' : undefined} placeholder="At least 6 characters" {...register('password')} />{errors.password && <small id="register-password-error" className="field-error" role="alert">{errors.password.message}</small>}
        <button className="view-btn auth-submit" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'} <span>→</span></button>
        <div className="auth-switch"><span>Already a member?</span><Link to="/login">Log in instead</Link></div>
    </form></section><aside className="auth-aside"><span>2000+</span><p>Retro energy.<br />Modern shopping.</p><b>RETRO ENERGY / MODERN FLOW</b></aside></main>;
};

export default Register;
