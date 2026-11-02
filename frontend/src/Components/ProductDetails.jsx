import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api';
import { fetchProductDetails } from '../actions/detailActions';
import { useNavigate } from 'react-router-dom';
import { useDialog } from './dialogContext';
import { maskReviewProfanity } from '../utils/reviewModeration';
import ImageSlider from './ImageSlider';

const reviewSchema = yup.object({
    rating: yup.number().min(1).max(5).required('Choose a rating'),
    comment: yup.string().trim().min(5, 'Review must be at least 5 characters').max(500).required('Write a review')
});

const ProductDetails = ({ addToCart, user }) => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { notify } = useDialog();
    const { product, loading, error } = useSelector((state) => state.productDetails);
    const [quantity, setQuantity] = useState(1);
    const [imageSelection, setImageSelection] = useState({ productId: id, index: 0 });
    const [reviewMessage, setReviewMessage] = useState('');
    const [reviewEligibility, setReviewEligibility] = useState({ key: '', canReview: false });
    const [reviewSort, setReviewSort] = useState('newest');
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(reviewSchema), defaultValues: { rating: 5 } });

    useEffect(() => {
        dispatch(fetchProductDetails(id, reviewSort)).catch(() => {});
    }, [dispatch, id, reviewSort]);

    useEffect(() => {
        let active = true;
        const userId = user?._id;
        if (!userId) return () => { active = false; };
        const eligibilityKey = `${userId}:${id}`;
        api.get(`/review/eligibility/${id}`)
            .then(({ data }) => { if (active) setReviewEligibility({ key: eligibilityKey, canReview: data.canReview }); })
            .catch(() => { if (active) setReviewEligibility({ key: eligibilityKey, canReview: false }); });
        return () => { active = false; };
    }, [id, user?._id]);

    const eligibilityKey = `${user?._id || ''}:${id}`;
    const canReview = reviewEligibility.key === eligibilityKey && reviewEligibility.canReview;
    const reviewEligibilityLoading = Boolean(user?._id) && reviewEligibility.key !== eligibilityKey;
    const ownReview = user && product?.reviews?.find((review) => String(review.user) === String(user._id));

    useEffect(() => {
        if (ownReview) reset({ rating: ownReview.rating, comment: maskReviewProfanity(ownReview.comment) });
    }, [ownReview, reset]);

    const submitReview = async (values) => {
        try {
            const { data } = await api.put('/review', { ...values, productId: id });
            dispatch({ type: 'PRODUCT_DETAILS_SUCCESS', payload: data.product });
            setReviewMessage('Your review was saved.');
            notify('Review created successfully.');
            reset({ rating: 5, comment: '' });
        } catch (requestError) {
            setReviewMessage(requestError.response?.data?.message || 'Unable to save review');
            notify(requestError.response?.data?.message || 'Unable to save review.', 'error');
        }
    };

    if (error) return <p className="error-state">{error}</p>;
    if (loading || !product) return <p className="loading-state">Loading Y2K item...</p>;

    const productImages = product.images?.filter((image) => image.url) || [];
    const activeImageIndex = imageSelection.productId === id
        ? Math.min(imageSelection.index, Math.max(0, productImages.length - 1))
        : 0;
    const selectProductImage = (index) => setImageSelection({ productId: id, index });
    const returnTo = location.state?.returnTo || '/shop';
    const commentField = register('comment');

    return (
        <main className="product-detail">
            <Link to={returnTo} className="back-link">← Back to collection</Link>
            <div className="product-gallery">
                <ImageSlider
                    images={productImages.map((image) => image.url)}
                    alt={product.name}
                    className="image-slider--detail"
                    imageClassName="detail-image"
                    activeIndex={activeImageIndex}
                    onIndexChange={selectProductImage}
                />
                {productImages.length > 1 && <div className="product-gallery-thumbnails" aria-label="Product images">
                    {productImages.map((image, index) => <button
                        key={image.public_id || image.url}
                        type="button"
                        className={activeImageIndex === index ? 'active' : ''}
                        aria-label={`View image ${index + 1} of ${productImages.length}`}
                        aria-pressed={activeImageIndex === index}
                        onClick={() => selectProductImage(index)}
                    ><img src={image.url} alt="" /></button>)}
                </div>}
            </div>
            <section>
                <p className="eyebrow">{product.category}</p>
                <h1>{product.name}</h1>
                <p className="price">₱{product.price.toFixed(2)}</p>
                <p>{product.description}</p>
                <p className="product-seller">Sold by: <strong>{product.seller}</strong></p>
                <p className={`stock-status ${product.stock === 0 ? 'sold-out' : product.stock <= 5 ? 'low-stock' : ''}`}>
                    {product.stock === 0 ? 'Sold out' : product.stock <= 5 ? `Only ${product.stock} left in stock` : `${product.stock} in stock`}
                </p>
                <aside className="product-delivery-note" aria-label="Delivery and returns information">
                    <p><strong>Delivery:</strong> Free for orders over PHP 200; PHP 25 otherwise.</p>
                    <p><strong>Returns:</strong> Contact the shop to confirm return eligibility before ordering.</p>
                </aside>
                <div className="quantity-control">
                    <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
                    <span>{quantity}</span>
                    <button type="button" onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}>+</button>
                </div>
                <div className="detail-actions">
                    <button className="view-btn" disabled={!product.stock} onClick={() => {
                        addToCart(product, quantity);
                        notify(`${product.name} added to your cart.`);
                    }}>{product.stock ? 'Add to cart' : 'Sold out'}</button>
                    <button className="buy-btn" disabled={!product.stock} onClick={() => {
                        const checkoutItem = {
                            product: product._id,
                            name: product.name,
                            price: product.price,
                            image: product.images?.[0]?.url || '',
                            stock: product.stock,
                            quantity
                        };
                        if (!user) {
                            notify('Please log in before buying a product.', 'info');
                            navigate('/login', { state: { from: { pathname: '/checkout', state: { buyNowItems: [checkoutItem] } } } });
                            return;
                        }
                        notify(`${product.name} is ready for checkout.`);
                        navigate('/checkout', { state: { buyNowItems: [checkoutItem] } });
                    }}>Buy now</button>
                </div>
            </section>
            <section className="reviews-section">
                <div className="section-heading">
                    <h2>Reviews ({product.numOfReviews})</h2>
                    <select aria-label="Sort reviews" value={reviewSort} onChange={(event) => setReviewSort(event.target.value)}>
                        <option value="newest">Newest</option>
                        <option value="highest">Highest rating</option>
                        <option value="lowest">Lowest rating</option>
                        <option value="verified">Verified purchases</option>
                    </select>
                </div>
                {product.reviews?.map((review) => <article className="review-card" key={review._id}><strong>{review.name}</strong>{review.verifiedPurchase && <small className="verified-purchase">Verified purchase</small>}<span>{'★'.repeat(review.rating)}</span><p>{review.comment}</p></article>)}
                {user && canReview ? <form className="review-form" onSubmit={handleSubmit(submitReview)}>
                    <h3>{ownReview ? 'Update your review' : 'Review this product'}</h3>
                    <label htmlFor="review-rating">Your rating</label>
                    <select id="review-rating" required aria-invalid={Boolean(errors.rating)} aria-describedby={errors.rating ? 'review-rating-error' : undefined} {...register('rating')}><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select>
                    {errors.rating && <small id="review-rating-error" className="field-error" role="alert">{errors.rating.message}</small>}
                    <label htmlFor="review-comment">Your review</label>
                    <textarea id="review-comment" required minLength={5} maxLength={500} placeholder="Share what you liked or what could be better" aria-invalid={Boolean(errors.comment)} aria-describedby={errors.comment ? 'review-comment-error' : undefined} {...commentField} onChange={(event) => {
                        event.target.value = maskReviewProfanity(event.target.value);
                        commentField.onChange(event);
                    }} />
                    {errors.comment && <small id="review-comment-error" className="field-error" role="alert">{errors.comment.message}</small>}
                    <button className="view-btn" type="submit" disabled={isSubmitting}>Save review</button>
                    {reviewMessage && <p>{reviewMessage}</p>}
                </form> : user
                    ? <p>{reviewEligibilityLoading ? 'Checking purchase eligibility...' : 'You can review this product after an order containing it has been delivered.'}</p>
                    : <p><Link to="/login">Log in</Link> to review this product after a delivered purchase.</p>}
            </section>
        </main>
    );
};

export default ProductDetails;
