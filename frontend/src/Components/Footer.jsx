import { Link } from 'react-router-dom';
import logo from '../../logo/logo.png';

const Footer = () => (
    <footer className="site-footer">
        <div className="site-footer-inner">
            <div className="site-footer-brand">
                <Link to="/" className="site-footer-logo">
                    <img src={logo} alt="Y2K Tech Shop" />
                </Link>
                <p>Tech reimagined for the next version of you.</p>
            </div>
            <div className="site-footer-links" aria-label="Footer navigation">
                <Link to="/shop">Shop</Link>
                <Link to="/orders">Orders</Link>
                <Link to="/profile">Account</Link>
            </div>
            <p className="site-footer-copy">© {new Date().getFullYear()} Y2K Tech Shop</p>
        </div>
    </footer>
);

export default Footer;
