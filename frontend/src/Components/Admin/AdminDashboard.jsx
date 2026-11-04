import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import * as yup from 'yup';
import { fetchAdminAnalytics, refreshAdmin } from '../../actions/adminActions';
import {
    saveAdminProduct, deleteAdminProducts, seedAdminProducts,
    updateAdminUser, updateAdminOrder, deleteAdminReview
} from '../../actions/adminMutationActions';
import { useDialog } from '../dialogContext';
import AdminOverview from './AdminOverview';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminUsers from './AdminUsers';
import AdminReviews from './AdminReviews';

const emptyProduct = { name: '', price: '', description: '', category: 'Y2K Gadgets', seller: 'Y2K Tech Shop', stock: '', images: [], newImages: [] };
const day = (date) => date.toISOString().slice(0, 10);
const defaultRange = { from: day(new Date(Date.now() - 30 * 86400000)), to: day(new Date()) };
const productSchema = yup.object({
    name: yup.string().trim().min(2, 'Product name must be at least 2 characters').max(100, 'Product name must be 100 characters or fewer').required('Product name is required'),
    price: yup.number().typeError('Enter a valid price').min(0, 'Price cannot be negative').required('Price is required'),
    stock: yup.number().typeError('Enter a valid stock quantity').integer('Stock must be a whole number').min(0, 'Stock cannot be negative').required('Stock is required'),
    description: yup.string().trim().min(5, 'Description must be at least 5 characters').required('Description is required'),
    seller: yup.string().trim().min(2, 'Seller name must be at least 2 characters').required('Seller is required'),
    category: yup.string().oneOf(['Laptops', 'Accessories', 'Headphones', 'Cell Phones', 'Cameras', 'Gaming', 'Y2K Gadgets'], 'Choose a valid category').required('Category is required')
});

const AdminDashboard = ({ user, initialTab = 'overview' }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { confirm, prompt, notify } = useDialog();
    const products = useSelector((state) => state.adminProducts.products);
    const users = useSelector((state) => state.allUsers.users);
    const orders = useSelector((state) => state.allOrders.orders);
    const { analytics, loading: analyticsLoading, error: analyticsError } = useSelector((state) => state.adminAnalytics);
    const productsLoading = useSelector((state) => state.adminProducts.loading);
    const usersLoading = useSelector((state) => state.allUsers.loading);
    const ordersLoading = useSelector((state) => state.allOrders.loading);
    const productsError = useSelector((state) => state.adminProducts.error);
    const usersError = useSelector((state) => state.allUsers.error);
    const ordersError = useSelector((state) => state.allOrders.error);
    const dataErrors = [productsError, usersError, ordersError].filter(Boolean);
    const adminLoading = productsLoading || usersLoading || ordersLoading;
    const adminError = dataErrors.join(' | ');
    const [tab, setTab] = useState(initialTab);
    const [selected, setSelected] = useState([]);
    const [productForm, setProductForm] = useState(emptyProduct);
    const [editingProduct, setEditingProduct] = useState(null);
    const [range, setRange] = useState(defaultRange);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [productErrors, setProductErrors] = useState({});
    const [actionLoading, setActionLoading] = useState(false);
    const showAdminError = (errorMessage) => {
        setError(errorMessage);
        notify(errorMessage, 'error');
    };

    const load = async () => {
        try {
            await dispatch(refreshAdmin(range));
        } catch (requestError) {
            showAdminError(requestError.response?.data?.message || 'Unable to load admin data');
        }
    };

    const loadAnalytics = async () => {
        try {
            await dispatch(fetchAdminAnalytics(range));
        } catch (requestError) {
            showAdminError(requestError.response?.data?.message || 'Unable to load sales analytics');
        }
    };

    useEffect(() => {
        if (!user) return;
        if (user.role !== 'admin') {
            navigate('/');
            return;
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
        // Load admin resources when the authenticated administrator becomes available.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, navigate]);

    const stats = useMemo(() => ({
        revenue: analytics.totalSales || 0,
        products: products.length,
        users: users.length,
        pending: orders.filter((order) => order.orderStatus === 'Processing').length
    }), [analytics, products, users, orders]);

    const submitProduct = async (event) => {
        event.preventDefault();
        setProductErrors({});
        const imageCount = (productForm.images?.length || 0) + (productForm.newImages?.length || 0);
        if (!imageCount) {
            const message = 'Add at least one product image before saving.';
            setProductErrors({ images: message });
            setError(message);
            notify(message, 'error');
            return;
        }
        try {
            await productSchema.validate(
                { ...productForm, price: productForm.price === '' ? undefined : Number(productForm.price), stock: productForm.stock === '' ? undefined : Number(productForm.stock) },
                { abortEarly: false }
            );
        } catch (validationError) {
            const fieldErrors = Object.fromEntries((validationError.inner || []).map((item) => [item.path, item.message]));
            if (!Object.keys(fieldErrors).length && validationError.path) fieldErrors[validationError.path] = validationError.message;
            setProductErrors(fieldErrors);
            const firstError = Object.values(fieldErrors)[0] || 'Check the product information and try again.';
            setError(firstError);
            notify(firstError, 'error');
            return;
        }
        setError('');
        setActionLoading(true);
        try {
            const formData = new FormData();
            ['name', 'price', 'description', 'category', 'seller', 'stock'].forEach((field) => formData.append(field, productForm[field]));
            formData.append('existingImages', JSON.stringify(productForm.images || []));
            (productForm.newImages || []).forEach((file) => formData.append('images', file));
            await dispatch(saveAdminProduct(formData, editingProduct?._id));
            setProductForm(emptyProduct);
            setEditingProduct(null);
            setMessage(editingProduct ? 'Product updated.' : 'Product created.');
            notify(editingProduct ? 'Product updated successfully.' : 'Product created successfully.');
            setProductErrors({});
            await load();
        } catch (requestError) {
            showAdminError(requestError.response?.data?.message || 'Unable to save product');
        } finally {
            setActionLoading(false);
        }
    };

    const editProduct = (product) => {
        const { images = [], ...fields } = product;
        setEditingProduct(product);
        setProductForm({ ...emptyProduct, ...fields, images, newImages: [] });
        setProductErrors({});
        setError('');
        setTab('products');
    };

    const cancelProductEdit = () => {
        setEditingProduct(null);
        setProductForm(emptyProduct);
        setProductErrors({});
        setError('');
    };

    const deleteSelected = async () => {
        if (!selected.length || !await confirm(`Delete ${selected.length} selected products?`, 'Delete selected products?')) return;
        setActionLoading(true);
        try {
            await dispatch(deleteAdminProducts(selected));
            setSelected([]);
            setMessage('Selected products deleted.');
            notify('Selected products removed from the catalog.', 'info');
            await load();
        } catch (requestError) {
            showAdminError(requestError.response?.data?.message || 'Unable to delete selected products');
        } finally {
            setActionLoading(false);
        }
    };

    const seedProducts = async () => {
        if (!await confirm('Add the mock products for testing?', 'Add mock products?')) return;
        setActionLoading(true);
        try {
            await dispatch(seedAdminProducts());
            setMessage('Mock products added.');
            notify('Mock products added to the catalog.');
            await load();
        } catch (requestError) {
            showAdminError(requestError.response?.data?.message || 'Unable to add sample products');
        } finally {
            setActionLoading(false);
        }
    };

    const updateUser = async (account, values = {}) => {
        if (values.isActive !== undefined && !await confirm(`${values.isActive ? 'Activate' : 'Deactivate'} ${account.name}'s account?`, 'Update account status?')) return;
        const role = values.role || await prompt('Choose the access level for this account.', account.role, 'Update account role', ['user', 'admin']);
        if (role === null) return;
        if (!['user', 'admin'].includes(role)) {
            const message = 'Choose either user or admin for the account role.';
            showAdminError(message);
            return;
        }
        try {
            await dispatch(updateAdminUser(account._id, { name: account.name, email: account.email, role, isActive: values.isActive ?? account.isActive !== false }));
            setMessage(`Updated ${account.name}.`);
            notify(`Updated ${account.name}'s account.`);
            await load();
        } catch (requestError) {
            showAdminError(requestError.response?.data?.message || 'Unable to update user');
        }
    };

    const updateOrder = async (order, field, value) => {
        if (field === 'status' && value === 'Cancelled' && !await confirm('Cancel this order and restore its reserved stock?', 'Cancel order?')) return;
        if (field === 'status' && value === 'Shipped' && !await confirm('Move this order to Shipped? Its stock was reserved when the order was placed.', 'Ship order?')) return;
        if (field === 'status' && value === 'Delivered' && !await confirm('Mark this order as delivered?', 'Mark order delivered?')) return;
        if (field === 'transactionStatus' && value === 'refunded' && !await confirm('Record the refund status for this simulated payment? This does not issue a real refund.', 'Mark simulated refund status?')) return;
        try {
            const { data } = await dispatch(updateAdminOrder(order._id, { [field]: value }));
            if (data.receiptEmailSent === false) {
                const emailMessage = 'Order updated, but the customer email could not be sent. Check the email configuration.';
                setError(emailMessage);
                notify(emailMessage, 'error');
            } else {
                setMessage(data.receiptEmailSent ? 'Order updated and customer email sent.' : 'Order updated.');
                notify(data.receiptEmailSent ? 'Order updated and customer email sent.' : 'Order updated.');
            }
            await load();
        } catch (requestError) {
            showAdminError(requestError.response?.data?.message || 'Unable to update order');
        }
    };

    const deleteReview = async (productId, reviewId) => {
        if (!await confirm('Delete this review? This action cannot be undone.', 'Delete review?')) return;
        try {
            await dispatch(deleteAdminReview(productId, reviewId));
            setMessage('Review deleted.');
            notify('Review removed.', 'info');
            await load();
        } catch (requestError) {
            showAdminError(requestError.response?.data?.message || 'Unable to delete review');
        }
    };

    if (!user || user.role !== 'admin') return <p className="loading-state">Checking admin access...</p>;

    return (
        <main className="admin-page modern-admin">
            <header className="admin-heading"><div><p className="eyebrow">Y2K CONTROL ROOM</p><h1>Store administration</h1><p className="admin-subtitle">Manage catalog, customers, orders and growth.</p></div><div className="admin-heading-actions"><Link to="/shop" className="back-link">Back to shop</Link><Link to="/admin" className="back-link">Dashboard</Link></div></header>
            {(error || adminError || analyticsError) && <p className="error-state admin-alert" role="alert">{error || adminError || analyticsError}</p>}
            {message && <p className="admin-message" role="status">{message}</p>}
            {(actionLoading || adminLoading) && <p className="admin-message" role="status" aria-live="polite">{adminLoading ? 'Loading admin data...' : 'Processing action...'}</p>}
            <nav className="admin-tabs modern-tabs" aria-label="Administration sections">{['overview', 'products', 'orders', 'users', 'reviews'].map((name) => <button type="button" aria-current={tab === name ? 'page' : undefined} className={tab === name ? 'active' : ''} key={name} onClick={() => { setTab(name); setError(''); setMessage(''); }}>{name}</button>)}</nav>
            {tab === 'overview' && <AdminOverview stats={stats} analytics={analytics} analyticsLoading={analyticsLoading} range={range} setRange={setRange} onApply={loadAnalytics} />}
            {tab === 'products' && <AdminProducts products={products} selected={selected} setSelected={setSelected} productForm={productForm} setProductForm={setProductForm} productErrors={productErrors} setProductErrors={setProductErrors} editingProduct={editingProduct} actionLoading={actionLoading} onSubmit={submitProduct} onEdit={editProduct} onCancelEdit={cancelProductEdit} onSeed={seedProducts} onDeleteSelected={deleteSelected} />}
            {tab === 'orders' && <AdminOrders orders={orders} onUpdate={updateOrder} />}
            {tab === 'users' && <AdminUsers users={users} onUpdate={updateUser} />}
            {tab === 'reviews' && <AdminReviews products={products} onDelete={deleteReview} />}
        </main>
    );
};

export default AdminDashboard;
