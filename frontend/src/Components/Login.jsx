import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { facebookLogin, googleLogin, loginUser } from '../actions/authActions';
import { isFirebaseConfigured } from '../config/firebaseConfig';
import { useDialog } from './dialogContext';

const loginSchema = yup.object({
    email: yup.string().email('Enter a valid email').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
});

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const loading = useSelector((state) => state.auth.loading);
    const { notify } = useDialog();
    const [error, setError] = useState('');
    const [socialProviderLoading, setSocialProviderLoading] = useState('');
    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(loginSchema) });
    const completeLogin = (user) => {
        const requestedLocation = location.state?.from;
        const requestedPath = typeof requestedLocation === 'string'
            ? requestedLocation
            : requestedLocation
                ? `${requestedLocation.pathname || ''}${requestedLocation.search || ''}${requestedLocation.hash || ''}`
                : '';
        const safeRequestedPath = requestedPath && !requestedPath.startsWith('/admin') ? requestedPath : '/shop';
        if (user.role !== 'admin' && !user.email) {
            navigate('/profile', { replace: true });
            notify('You are signed in. Add an email address to your profile to receive order updates and receipts.', 'info');
            return;
        }
        navigate(user.role === 'admin' ? '/admin' : (requestedLocation && typeof requestedLocation === 'object' ? requestedLocation : safeRequestedPath));
        notify('Welcome back to Y2K Tech Shop.');
    };
    const submit = async (form) => {
        try {
            const user = await dispatch(loginUser(form));
            completeLogin(user);
        } catch (requestError) {
            setError(requestError.message || 'Unable to log in');
        }
    };
    const signInWithProvider = async (providerName) => {
        setError('');
        setSocialProviderLoading(providerName);
        try {
            const [firebaseAuth, { getFirebaseAuth }] = await Promise.all([
                import('firebase/auth'),
                import('../config/firebase')
            ]);
            const provider = providerName === 'google'
                ? new firebaseAuth.GoogleAuthProvider()
                : new firebaseAuth.FacebookAuthProvider();
            if (providerName === 'facebook') provider.addScope('email');
            const result = await firebaseAuth.signInWithPopup(getFirebaseAuth(), provider);
            const login = providerName === 'google' ? googleLogin : facebookLogin;
            const user = await dispatch(login(await result.user.getIdToken()));
            completeLogin(user);
        } catch (requestError) {
            setError(requestError.message || `Unable to sign in with ${providerName === 'google' ? 'Google' : 'Facebook'}`);
        } finally {
            setSocialProviderLoading('');
        }
    };
    const socialLoginBusy = Boolean(socialProviderLoading);
    return <main className="auth-page"><section className="auth-panel"><Link className="auth-brand" to="/">Y2K<span>TECH</span></Link><p className="eyebrow">WELCOME BACK</p><h1>Good to see you.</h1><p className="auth-intro">Sign in to continue to your collection, orders, and account space.</p><form onSubmit={handleSubmit(submit)}>
        {error && <p className="error-state" role="alert" aria-live="polite">{error}</p>}
        <label htmlFor="login-email">Email address</label><input id="login-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'login-email-error' : undefined} placeholder="you@example.com" {...register('email')} />{errors.email && <small id="login-email-error" className="field-error" role="alert">{errors.email.message}</small>}
        <label htmlFor="login-password">Password</label><input id="login-password" type="password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'login-password-error' : undefined} placeholder="Enter your password" {...register('password')} />{errors.password && <small id="login-password-error" className="field-error" role="alert">{errors.password.message}</small>}
        <button className="view-btn auth-submit" type="submit" disabled={loading || socialLoginBusy}>{loading ? 'Logging in...' : 'Log in'} <span>→</span></button>
        <button className="secondary-action social-signin google-signin" type="button" onClick={() => signInWithProvider('google')} disabled={loading || socialLoginBusy}>
            <span className="social-provider-mark google-mark" aria-hidden="true">G</span>
            {socialProviderLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
        </button>
        <button className="secondary-action social-signin facebook-signin" type="button" onClick={() => signInWithProvider('facebook')} disabled={loading || socialLoginBusy}>
            <span className="social-provider-mark facebook-mark" aria-hidden="true">f</span>
            {socialProviderLoading === 'facebook' ? 'Connecting to Facebook...' : 'Continue with Facebook'}
        </button>
        {!isFirebaseConfigured && <small className="field-error">Google and Facebook sign-in need Firebase web app settings in the frontend environment.</small>}
        <div className="auth-switch"><span>New to Y2K?</span><Link to="/register">Create your account</Link></div>
    </form></section><aside className="auth-aside"><span>Y2K</span><p>Technology<br />with attitude.</p><b>CURATED / CURRENT / CYBER</b></aside></main>;
};

export default Login;
