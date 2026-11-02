import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as yup from 'yup';
import api from '../api';
import { useDialog } from './dialogContext';
import ImageSlider from './ImageSlider';

const profileSchema = yup.object({
    name: yup.string().trim().min(2, 'Enter at least 2 characters').max(30, 'Name must be 30 characters or fewer').required('Enter your full name'),
    email: yup.string().trim().email('Enter a valid email address').max(254, 'Email must be 254 characters or fewer').required('Enter your email address')
});

const readFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read the selected image'));
    reader.readAsDataURL(file);
});

const getProfileImages = (user) => {
    const images = user.profileImages?.length ? user.profileImages : user.avatar?.url ? [user.avatar] : [];
    return images.map((image) => ({ public_id: image.public_id || '', url: image.url }));
};

export default function Profile({ user, onProfileUpdate }) {
    const fileInput = useRef(null);
    const { confirm, notify } = useDialog();
    const [profileImages, setProfileImages] = useState(() => getProfileImages(user || {}));
    const [profileImagesChanged, setProfileImagesChanged] = useState(false);
    const [selectedProfileImage, setSelectedProfileImage] = useState(0);
    const [profileImageError, setProfileImageError] = useState('');
    const [readingPhotos, setReadingPhotos] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [deletionRequested, setDeletionRequested] = useState(Boolean(user?.deletionRequestedAt));

    if (!user) return null;

    const submit = async (values) => {
        setMessage('');
        setError('');
        try {
            const formData = new FormData();
            formData.append('name', values.name.trim());
            formData.append('email', values.email.trim());
            if (profileImagesChanged) {
                formData.append('retainedProfileImages', JSON.stringify(profileImages
                    .filter((image) => !image.file)
                    .map(({ public_id, url }) => ({ public_id, url }))));
                profileImages.filter((image) => image.file).forEach((image) => {
                    formData.append('profileImages', image.file);
                });
            }
            const { data } = await api.put('/me/update', formData);
            onProfileUpdate(data.user);
            setProfileImages(getProfileImages(data.user));
            setProfileImagesChanged(false);
            setProfileImageError('');
            if (fileInput.current) fileInput.current.value = '';
            setMessage('Profile updated successfully');
            notify('Profile updated successfully.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to update profile');
            notify(requestError.response?.data?.message || 'Unable to update profile.', 'error');
        }
    };

    const requestDeletion = async () => {
        if (!await confirm('Submit an account deletion request? Your order history will be retained for review.', 'Request account deletion?')) return;
        setError('');
        try {
            await api.post('/account/deletion-request', {});
            setDeletionRequested(true);
            setMessage('Your account deletion request was submitted for review.');
            notify('Account deletion request submitted for review.', 'info');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to submit deletion request');
            notify(requestError.response?.data?.message || 'Unable to submit deletion request.', 'error');
        }
    };

    const profileImageSources = profileImages.map((image) => image.preview || image.url).filter(Boolean);

    const selectProfilePhotos = async (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;
        const invalidFile = files.find((file) => !['image/png', 'image/jpeg', 'image/webp'].includes(file.type));
        if (invalidFile) {
            const validationMessage = 'Choose PNG, JPG, or WebP profile photos.';
            setProfileImageError(validationMessage);
            notify(validationMessage, 'error');
            event.target.value = '';
            return;
        }
        if (files.some((file) => file.size > 2 * 1024 * 1024)) {
            const validationMessage = 'Each profile photo must be 2 MB or smaller.';
            setProfileImageError(validationMessage);
            notify(validationMessage, 'error');
            event.target.value = '';
            return;
        }
        if (profileImages.length + files.length > 8) {
            const validationMessage = 'A profile can have up to 8 photos.';
            setProfileImageError(validationMessage);
            notify(validationMessage, 'error');
            event.target.value = '';
            return;
        }
        setReadingPhotos(true);
        try {
            const previews = await Promise.all(files.map(readFile));
            setProfileImages((current) => [...current, ...files.map((file, index) => ({
                file,
                preview: previews[index]
            }))]);
            setProfileImagesChanged(true);
            setProfileImageError('');
            setError('');
        } catch (readError) {
            setProfileImageError(readError.message);
            notify(readError.message, 'error');
        } finally {
            setReadingPhotos(false);
            event.target.value = '';
        }
    };

    const removeSelectedProfilePhoto = () => {
        setProfileImages((current) => current.filter((_, index) => index !== selectedProfileImage));
        setSelectedProfileImage((current) => Math.max(0, current - 1));
        setProfileImagesChanged(true);
        setProfileImageError('');
    };

    return <main className="form-page profile-page">
        <header className="profile-heading">
            <p className="eyebrow">ACCOUNT SETTINGS</p>
            <h1>Your profile</h1>
            <p>Manage your personal information, security, and account preferences.</p>
        </header>
        <div className="profile-layout">
            <aside className="profile-overview" aria-label="Account overview">
                <div className="profile-avatar-frame">
                    {profileImageSources.length
                        ? <ImageSlider
                            images={profileImageSources}
                            alt={`${user.name || 'Your'} profile`}
                            className="image-slider--profile"
                            imageClassName="profile-avatar"
                            activeIndex={selectedProfileImage}
                            onIndexChange={setSelectedProfileImage}
                        />
                        : <span aria-hidden="true">{user.name?.trim().charAt(0).toUpperCase() || '?'}</span>}
                </div>
                <div className="profile-overview-copy">
                    <h2>{user.name || 'Your account'}</h2>
                    <p>{user.email || 'Add an email for order updates'}</p>
                </div>
                <span className={`profile-status ${user.isActive === false ? 'is-inactive' : ''}`}>
                    <span aria-hidden="true" />
                    {user.isActive === false ? 'Deactivated' : 'Active account'}
                </span>
            </aside>

            <section className="profile-panel" aria-labelledby="profile-details-title">
                <div className="profile-panel-heading">
                    <div>
                        <h2 id="profile-details-title">Personal information</h2>
                        <p>Keep your account details up to date.</p>
                    </div>
                </div>
                {!user.email && <p className="profile-email-notice" role="status">Add an email address to receive order updates and digital receipts.</p>}
                {message && <p className="success-state" role="status" aria-live="polite">{message}</p>}
                {error && <p className="error-state" role="alert">{error}</p>}
                <Formik initialValues={{ name: user.name || '', email: user.email || '' }} enableReinitialize validationSchema={profileSchema} onSubmit={submit}>
                    {({ isSubmitting, errors, touched }) => <Form className="profile-form" noValidate>
                        <div className="profile-fields">
                            <div className="profile-field">
                                <label htmlFor="profile-name">Full name</label>
                                <Field id="profile-name" name="name" autoComplete="name" aria-required="true" aria-invalid={Boolean(touched.name && errors.name)} aria-describedby={touched.name && errors.name ? 'profile-name-error' : 'profile-name-help'} placeholder="Enter your full name" />
                                <small id="profile-name-help" className="profile-field-help">2–30 characters</small>
                                <ErrorMessage id="profile-name-error" name="name" component="small" className="field-error" role="alert" />
                            </div>
                            <div className="profile-field">
                                <label htmlFor="profile-email">Email address</label>
                                <Field id="profile-email" name="email" type="email" autoComplete="email" aria-required="true" aria-invalid={Boolean(touched.email && errors.email)} aria-describedby={touched.email && errors.email ? 'profile-email-error' : 'profile-email-help'} placeholder="you@example.com" />
                                <small id="profile-email-help" className="profile-field-help">Used for order updates and account access</small>
                                <ErrorMessage id="profile-email-error" name="email" component="small" className="field-error" role="alert" />
                            </div>
                            <div className="profile-field profile-photo-field">
                                <label htmlFor="profile-photos">Profile photos <span>Optional</span></label>
                                <p id="profile-photos-help" className="profile-field-help">Add up to 8 PNG, JPG, or WebP photos. Maximum 2 MB each.</p>
                                <input id="profile-photos" ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={readingPhotos} aria-invalid={Boolean(profileImageError)} aria-describedby={profileImageError ? 'profile-photos-error' : 'profile-photos-help'} onChange={selectProfilePhotos} />
                                <small className="profile-field-help">{profileImages.length} of 8 photos in your profile gallery.</small>
                                {profileImageError && <small id="profile-photos-error" className="field-error" role="alert">{profileImageError}</small>}
                                {profileImages.length > 0 && <button className="profile-remove-photo" type="button" onClick={removeSelectedProfilePhoto}>Remove displayed photo</button>}
                            </div>
                        </div>
                        <div className="profile-form-footer">
                            <p>Changes are saved to your account when you select save.</p>
                            <button className="view-btn" type="submit" disabled={isSubmitting || readingPhotos}>
                                {readingPhotos ? 'Preparing photos…' : isSubmitting ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </Form>}
                </Formik>
            </section>

            <section className="profile-panel profile-actions-panel" aria-labelledby="profile-actions-title">
                <div className="profile-panel-heading">
                    <div>
                        <h2 id="profile-actions-title">Account & security</h2>
                        <p>Shortcuts to your orders and account security.</p>
                    </div>
                </div>
                <div className="profile-actions">
                    <Link className="profile-action-link" to="/password/update">
                        <span><strong>Change password</strong><small>Update your sign-in credentials</small></span>
                        <span aria-hidden="true">→</span>
                    </Link>
                    <Link className="profile-action-link" to="/orders">
                        <span><strong>Order history</strong><small>Review your purchases and delivery status</small></span>
                        <span aria-hidden="true">→</span>
                    </Link>
                </div>
                <div className="profile-delete-area">
                    <div>
                        <strong>Delete account</strong>
                        <p>Request account deletion. Your order history may be retained for review.</p>
                    </div>
                    <button className="danger-btn" type="button" onClick={requestDeletion} disabled={deletionRequested}>
                        {deletionRequested ? 'Request pending' : 'Request deletion'}
                    </button>
                </div>
            </section>
        </div>
    </main>;
}
