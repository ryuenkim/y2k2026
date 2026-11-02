import { PRODUCTS_REQUEST, PRODUCTS_SUCCESS, PRODUCTS_FAIL } from '../constants/productConstants';

const initialState = {
    products: [],
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    filteredProductsCount: 0,
    productsCount: 0
};

export const productsReducer = (state = initialState, action) => {
    switch (action.type) {
        case PRODUCTS_REQUEST:
            return { ...state, loading: true, error: null };
        case PRODUCTS_SUCCESS:
            return {
                ...state,
                loading: false,
                products: action.payload.append
                    ? [...state.products, ...action.payload.products]
                    : action.payload.products,
                currentPage: action.payload.currentPage,
                totalPages: Math.max(1, Math.ceil(action.payload.filteredProductsCount / action.payload.resPerPage)),
                filteredProductsCount: action.payload.filteredProductsCount,
                productsCount: action.payload.productsCount
            };
        case PRODUCTS_FAIL:
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};
