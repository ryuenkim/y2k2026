import { Link } from 'react-router-dom';
import logo from '../../logo/logo.png';

export default function Landing({ user }) {
    return <main className="landing-page">
        <section className="landing-hero">
            <div className="landing-copy">
                <p className="eyebrow">Y2K TECH SHOP / 2000 AND BEYOND</p>
                <h1>Future-facing tech with a nostalgic pulse.</h1>
                <p className="landing-lede">Discover playful gadgets, metallic accessories, and everyday tech essentials curated for the next version of you.</p>
                <div className="landing-actions">
                    <Link className="primary-action" to="/shop">Shop the collection</Link>
                    {!user && <Link className="secondary-action" to="/register">Create an account</Link>}
                    {user && <Link className="secondary-action" to="/orders">View your orders</Link>}
                </div>
            </div>
            <div className="landing-orbit" aria-hidden="true"><img src={logo} alt="" /><b>TECH<br />REIMAGINED</b></div>
        </section>
        <section className="landing-details">
            <article><span>01</span><h2>Curated drops</h2><p>Retro-futuristic pieces selected for bold desks, bags, and daily setups.</p></article>
            <article><span>02</span><h2>Simple shopping</h2><p>Clear pricing, secure accounts, order tracking, and a clean checkout flow.</p></article>
            <article><span>03</span><h2>Made for today</h2><p>Y2K attitude with modern browsing, responsive design, and verified reviews.</p></article>
        </section>
        {!user && <section className="landing-signin"><p>Already part of the future?</p><Link to="/login">Log in to your account →</Link></section>}
    </main>;
}
