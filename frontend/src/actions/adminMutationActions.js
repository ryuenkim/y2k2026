import api from '../api';
import { NEW_PRODUCT_REQUEST, NEW_PRODUCT_SUCCESS, NEW_PRODUCT_FAIL } from '../constants/adminConstants';

const runAdminMutation = (request) => async () => request();

export const saveAdminProduct = (formData, editingId) => async (dispatch) => {
    dispatch({ type: NEW_PRODUCT_REQUEST });
    try {
        const { data } = editingId
            ? await api.put(`/admin/product/${editingId}`, formData)
            : await api.post('/admin/product/new', formData);
        dispatch({ type: NEW_PRODUCT_SUCCESS, payload: data.product });
        return data.product;
    } catch (error) {
        dispatch({ type: NEW_PRODUCT_FAIL, payload: error.response?.data?.message || 'Unable to save product' });
        throw error;
    }
};
export const deleteAdminProducts = (ids) => runAdminMutation(() => api.post('/admin/products/bulk-delete', { ids }));
export const seedAdminProducts = () => runAdminMutation(() => api.post('/admin/products/seed'));
export const updateAdminUser = (id, values) => runAdminMutation(() => api.put(`/admin/user/${id}`, values));
export const updateAdminOrder = (id, values) => runAdminMutation(() => api.put(`/admin/order/${id}`, values));
export const deleteAdminReview = (productId, reviewId) => runAdminMutation(
    () => api.delete(`/reviews?productId=${productId}&id=${reviewId}`)
);
