import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FaBolt, FaShoppingCart, FaUser } from 'react-icons/fa';
import { useDialog } from './dialogContext';

const Navbar = ({ cartCount = 0, user, onLogout }) => {
    const [logoutError, setLogoutError] = useState('');
    const [loggingOut, setLoggingOut] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { confirm } = useDialog();
    const isAdmin = user?.role === 'admin';
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    const handleLogout = async () => {
        if (!await confirm('Are you sure you want to log out?', 'Log out of Y2K Tech Shop?')) return;
        setLogoutError('');
        setLoggingOut(true);
        try {
            await onLogout();
            navigate('/');
        } catch (requestError) {
            setLogoutError(requestError.response?.data?.message || 'Unable to log out. Please try again.');
        } finally {
            setLoggingOut(false);
        }
    };
    return (
        <nav className="navbar">
            <div className="nav-container">
                {!isAuthPage && <div className="nav-links">
                    {isAdmin ? (
                        <>
                            <NavLink to="/admin">Dashboard</NavLink>
                            <NavLink to="/shop">Shop</NavLink>
                        </>
                    ) : <>
                        <NavLink to="/" end>Home</NavLink>
                        <NavLink to="/shop">Shop</NavLink>
                    </>}
                </div>}

                <Link to={isAdmin ? '/admin' : '/'} className="brand-logo">
                    <span className="brand-mark" aria-hidden="true"><FaBolt /></span>
                    <span className="brand-wordmark">Y2K <strong>TECH SHOP</strong></span>
                </Link>

                <div className="nav-actions">
                    {!isAuthPage && <Link to="/cart" className="nav-btn">
                        <FaShoppingCart />
                        <span className="cart-count">{cartCount}</span>
                    </Link>}
                    {user ? (
                        <Link to={isAdmin ? '/admin' : '/profile'} className="profile-nav-link">
                            <span className="nav-avatar-frame">
                                {user.avatar?.url ? <img src={user.avatar.url} alt="" /> : <span>{user.name?.charAt(0).toUpperCase() || <FaUser />}</span>}
                            </span>
                            <span className="profile-nav-name">{user.name || 'Account'}</span>
                        </Link>
                    ) : !isAuthPage && <NavLink to="/login" className="login-btn"><FaUser /> <span>Log in</span></NavLink>}
                    {user && <NavLink to="/orders" className="login-btn">Orders</NavLink>}
                    {user && <button type="button" className="login-btn" onClick={handleLogout} disabled={loggingOut}>{loggingOut ? 'Logging out...' : 'Logout'}</button>}
                </div>
                {logoutError && <small className="nav-error">{logoutError}</small>}
            </div>
        </nav>
    );
};

export default Navbar;