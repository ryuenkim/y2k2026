import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import Home from './Components/Home';
import Landing from './Components/Landing';
import ProductDetails from './Components/Products/ProductDetails';
import Cart from './Components/Cart/Cart';
import Login from './Components/Login';
import Register from './Components/Register';
import Profile from './Components/Profile';
import UpdatePassword from './Components/UpdatePassword';
import Checkout from './Components/Cart/Checkout';
import Orders from './Components/Orders/Orders';
import OrderDetails from './Components/Orders/OrderDetails';
import AdminDashboard from './Components/Admin/AdminDashboard';
import { loadUser, logoutUser } from './actions/authActions';
import { addToCart, updateCartQuantity, removeFromCart, clearCart, setCartScope } from './actions/cartActions';
import DialogProvider from './Components/Dialog';
import './App.css';

function AdminRoute({ user, authChecked, initialTab = 'overview' }) {
  const location = useLocation();

  if (!authChecked) return <p className="loading-state">Checking authentication...</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== 'admin') {
    return (
      <main className="access-denied">
        <p className="eyebrow">ACCESS RESTRICTED</p>
        <h1>Admin access required</h1>
        <p>Your account does not have permission to open the Y2K control room.</p>
        <button type="button" className="view-btn" onClick={() => window.history.back()}>
          Go back
        </button>
      </main>
    );
  }

  return <AdminDashboard key={initialTab} user={user} initialTab={initialTab} />;
}

function ProtectedRoute({ user, authChecked, children }) {
  const location = useLocation();
  if (!authChecked) return <p className="loading-state">Checking authentication...</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function App() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const cart = useSelector((state) => state.cart.cartItems);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    dispatch(loadUser()).finally(() => setAuthChecked(true));
  }, [dispatch]);

  useEffect(() => {
    dispatch(setCartScope(user?._id ? `user:${user._id}` : 'guest'));
  }, [dispatch, user?._id]);

  const updateQuantity = (id, quantity) => dispatch(updateCartQuantity(id, quantity));
  const removeItem = (id) => dispatch(removeFromCart(id));
  const logout = async () => {
    await dispatch(logoutUser());
  };

  return (
    <Router>
      <DialogProvider>
      <div className="App">
        <Navbar cartCount={cart.reduce((count, item) => count + item.quantity, 0)} user={user} onLogout={logout} />
        <Routes>
          <Route path="/" element={<Landing user={user} />} />
          <Route path="/shop" element={<Home user={user} />} />
          <Route path="/product/:id" element={<ProductDetails addToCart={(product, quantity) => dispatch(addToCart(product, quantity))} user={user} />} />
          <Route path="/cart" element={<Cart items={cart} updateQuantity={updateQuantity} removeItem={removeItem} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<ProtectedRoute user={user} authChecked={authChecked}><Profile user={user} onProfileUpdate={(updated) => dispatch({ type: 'USER_DETAILS_SUCCESS', payload: updated })} /></ProtectedRoute>} />
          <Route path="/password/update" element={<ProtectedRoute user={user} authChecked={authChecked}><UpdatePassword /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute user={user} authChecked={authChecked}><Checkout items={cart} user={user} clearCart={(product) => dispatch(product ? removeFromCart(product) : clearCart())} /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute user={user} authChecked={authChecked}><Orders /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute user={user} authChecked={authChecked}><OrderDetails /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute user={user} authChecked={authChecked} />} />
          <Route path="/admin/product" element={<AdminRoute user={user} authChecked={authChecked} initialTab="products" />} />
          <Route path="/admin/products" element={<AdminRoute user={user} authChecked={authChecked} initialTab="products" />} />
        </Routes>
        <Footer />
      </div>
      </DialogProvider>
    </Router>
  );
}

export default App;
