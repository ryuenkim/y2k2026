import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../actions/productActions';
import { addToCart } from '../actions/cartActions';
import { useDialog } from './dialogContext';
import ImageSlider from './ImageSlider';
import { DEFAULT_CATEGORIES } from '../constants/categories';

const ProductCard = ({ product, location, user, dispatch, navigate, notify }) => {
    const images = product.images?.map((image) => image.url).filter(Boolean) || [];
    const sliderImages = images.length ? images : ['https://via.placeholder.com/200'];

    return <div className="product-card">
        <div className="product-image-wrap">
            <ImageSlider images={sliderImages} alt={product.name} className="image-slider--card" imageClassName="product-img" />
            <Link className="image-detail-link" to={`/product/${product._id}`} state={{ returnTo: `${location.pathname}${location.search}` }}>View details</Link>
        </div>
        <h3>{product.name}</h3>
        <p className="product-card-rating" aria-label={product.numOfReviews ? `${Number(product.ratings || 0).toFixed(1)} out of 5 stars, ${product.numOfReviews} reviews` : 'No reviews yet'}>
            {product.numOfReviews
                ? <><span aria-hidden="true">★</span> {Number(product.ratings || 0).toFixed(1)} <span className="product-review-count">({product.numOfReviews} {product.numOfReviews === 1 ? 'review' : 'reviews'})</span></>
                : <span className="product-review-count">No reviews yet</span>}
        </p>
        <p className="price">₱{product.price}</p>
        <p className={`stock-status ${product.stock === 0 ? 'sold-out' : product.stock <= 5 ? 'low-stock' : ''}`}>
            {product.stock === 0 ? 'Sold out' : product.stock <= 5 ? `Only ${product.stock} left` : `${product.stock} in stock`}
        </p>
        <div className="product-card-actions">
            <button className="view-btn" type="button" disabled={!product.stock} onClick={() => {
                dispatch(addToCart(product, 1));
                notify(`${product.name} added to your cart.`);
            }}>{product.stock ? 'Add to cart' : 'Sold out'}</button>
            <button className="buy-btn" type="button" disabled={!product.stock} onClick={() => {
                const buyNowItem = {
                    product: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.images?.[0]?.url || '',
                    stock: product.stock,
                    quantity: 1
                };
                if (!user) {
                    notify('Please log in before buying a product.', 'info');
                    navigate('/login', { state: { from: { pathname: '/checkout', state: { buyNowItems: [buyNowItem] } } } });
                    return;
                }
                notify(`${product.name} is ready for checkout.`);
                navigate('/checkout', { state: { buyNowItems: [buyNowItem] } });
            }}>Buy now</button>
        </div>
    </div>;
};

const Home = ({ user }) => {
    const dispatch = useDispatch();
    const { products, loading, error, currentPage: page, totalPages, filteredProductsCount } = useSelector((state) => state.products);
    const [loadingMore, setLoadingMore] = useState(false);
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { notify } = useDialog();
    const categories = [...new Set([...DEFAULT_CATEGORIES, ...products.map((product) => product.category).filter(Boolean)])];
    const loadMoreRef = useRef(null);
    const readFilters = useCallback(() => ({
        category: searchParams.get('category') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        rating: searchParams.get('rating') || '',
        sort: searchParams.get('sort') || 'newest'
    }), [searchParams]);
    const [filters, setFilters] = useState(readFilters);
    const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
    const [filterError, setFilterError] = useState('');

    useEffect(() => {
        // Keep the search draft in sync with browser back/forward navigation.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setKeyword(searchParams.get('keyword') || '');
        setFilters(readFilters());
        setFilterError('');
    }, [readFilters, searchParams]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const value = keyword.trim();
            const currentValue = searchParams.get('keyword') || '';
            if (value === currentValue) return;
            const nextParams = new URLSearchParams(searchParams);
            if (value) nextParams.set('keyword', value);
            else nextParams.delete('keyword');
            navigate(`/shop${nextParams.size ? `?${nextParams.toString()}` : ''}`, { replace: true });
        }, 250);
        return () => clearTimeout(timer);
    }, [keyword, navigate, searchParams]);

    const buildQuery = useCallback((requestedPage) => {
        const keyword = searchParams.get('keyword') || '';
        return new URLSearchParams({
            keyword,
            page: requestedPage,
            limit: 8,
            ...(searchParams.get('category') && { category: searchParams.get('category') }),
            ...(searchParams.get('minPrice') && { 'price[gte]': searchParams.get('minPrice') }),
            ...(searchParams.get('maxPrice') && { 'price[lte]': searchParams.get('maxPrice') }),
            ...(searchParams.get('rating') && { 'ratings[gte]': searchParams.get('rating') }),
            sort: searchParams.get('sort') || 'newest'
        });
    }, [searchParams]);

    const loadProducts = useCallback(async (requestedPage, append = false) => {
        if (append) setLoadingMore(true);
        try {
            await dispatch(fetchProducts(buildQuery(requestedPage), append));
        } finally {
            setLoadingMore(false);
        }
    }, [buildQuery, dispatch]);

    useEffect(() => {
        // Redux thunk synchronizes the catalog with the current URL filters.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadProducts(1);
    }, [loadProducts]);

    useEffect(() => {
        if (!loadMoreRef.current) return undefined;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !loading && !loadingMore && page < totalPages) {
                loadProducts(page + 1, true);
            }
        }, { rootMargin: '240px' });
        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [loadProducts, loading, loadingMore, page, totalPages]);

    const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));
    const clearFilters = () => {
        const emptyFilters = { category: '', minPrice: '', maxPrice: '', rating: '', sort: 'newest' };
        setFilters(emptyFilters);
        setFilterError('');
        navigate('/shop');
    };
    useEffect(() => {
        const timer = setTimeout(() => {
            const minimum = filters.minPrice === '' ? null : Number(filters.minPrice);
            const maximum = filters.maxPrice === '' ? null : Number(filters.maxPrice);
            if ((minimum !== null && (!Number.isFinite(minimum) || minimum < 0))
                || (maximum !== null && (!Number.isFinite(maximum) || maximum < 0))
                || (minimum !== null && maximum !== null && minimum > maximum)) {
                setFilterError(minimum !== null && maximum !== null && minimum > maximum
                    ? 'Minimum price cannot be greater than maximum price.'
                    : 'Price filters must be zero or more.');
                return;
            }
            setFilterError('');
            const nextParams = new URLSearchParams(searchParams);
            Object.entries(filters).forEach(([name, value]) => {
                if (value && !(name === 'sort' && value === 'newest')) nextParams.set(name, value);
                else nextParams.delete(name);
            });
            const nextQuery = nextParams.toString();
            if (nextQuery !== searchParams.toString()) {
                navigate(`/shop${nextQuery ? `?${nextQuery}` : ''}`, { replace: true });
            }
        }, 200);
        return () => clearTimeout(timer);
    }, [filters, navigate, searchParams]);
    const submitSearch = (event) => {
        event.preventDefault();
        const value = keyword.trim();
        const nextParams = new URLSearchParams(searchParams);
        if (value) nextParams.set('keyword', value);
        else nextParams.delete('keyword');
        navigate(`/shop${nextParams.size ? `?${nextParams.toString()}` : ''}`, { replace: true });
    };

    if (loading && products.length === 0) {
        return <div className="loading-state" role="status">Loading Y2K Collection...</div>;
    }

    return (
        <div className="home-container">
            <div className="shop-heading">
                <div>
                    <p className="eyebrow">Y2K COLLECTION</p>
                    <h1 className="heading">Retro-futuristic essentials</h1>
                </div>
                <form className="shop-search" onSubmit={submitSearch} role="search">
                    <input type="search" placeholder="Search products..." value={keyword} onChange={(event) => setKeyword(event.target.value)} aria-label="Search products" />
                    {keyword && <button className="search-clear" type="button" aria-label="Clear search" onClick={() => setKeyword('')}>×</button>}
                    <button type="submit" className="search-btn">Search</button>
                </form>
            </div>
            {error && <p className="error-state" role="alert">{error}</p>}
            <div className="catalog-filters" aria-busy={loading || loadingMore}>
                <select aria-label="Filter by category" value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}>
                    <option value="">All categories</option>
                    {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
                <input type="number" min="0" aria-label="Minimum price" aria-invalid={Boolean(filterError)} aria-describedby={filterError ? 'catalog-filter-error' : undefined} placeholder="Min price" value={filters.minPrice} onChange={(event) => { updateFilter('minPrice', event.target.value); setFilterError(''); }} />
                <input type="number" min="0" aria-label="Maximum price" aria-invalid={Boolean(filterError)} aria-describedby={filterError ? 'catalog-filter-error' : undefined} placeholder="Max price" value={filters.maxPrice} onChange={(event) => { updateFilter('maxPrice', event.target.value); setFilterError(''); }} />
                <select aria-label="Filter by minimum rating" value={filters.rating} onChange={(event) => updateFilter('rating', event.target.value)}>
                    <option value="">Any rating</option><option value="4">4+ stars</option><option value="3">3+ stars</option><option value="2">2+ stars</option>
                </select>
                <select aria-label="Sort products" value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: low to high</option>
                    <option value="price_desc">Price: high to low</option>
                    <option value="rating">Highest rated</option>
                    <option value="reviews">Most reviewed</option>
                </select>
                <button type="button" className="clear-filters" onClick={clearFilters}>Clear filters</button>
            </div>
            {filterError && <p id="catalog-filter-error" className="field-error filter-error" role="alert">{filterError}</p>}
            <p className="catalog-result-count" role="status" aria-live="polite">
                {loading ? 'Updating results…' : `${filteredProductsCount} ${filteredProductsCount === 1 ? 'product' : 'products'} found`}
            </p>
            <div className="product-grid" aria-busy={loading || loadingMore}>
                {products.length === 0 ? (
                    <section className="empty-state catalog-empty">
                        <h2>No products found</h2>
                        <p>Try a different search or remove some filters to see more of the collection.</p>
                        <button className="view-btn" type="button" onClick={clearFilters}>Clear search and filters</button>
                    </section>
                ) : (
                    products.map((product) => (
                        <ProductCard key={product._id} product={product} location={location} user={user} dispatch={dispatch} navigate={navigate} notify={notify} />
                    ))
                )}
            </div>
            <div ref={loadMoreRef} className="product-list-status">
                {loadingMore && <p className="loading-state">Loading more products...</p>}
                {!loadingMore && page >= totalPages && products.length > 0 && <p className="no-products">You have reached the end of the collection.</p>}
            </div>
        </div>
    );
};

export default Home;
