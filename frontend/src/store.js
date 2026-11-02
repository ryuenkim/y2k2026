import { legacy_createStore as createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import { authReducer } from './reducers/authReducers';
import { cartReducer } from './reducers/cartReducers';
import { productsReducer } from './reducers/productReducers';
import { myOrdersReducer } from './reducers/orderReducers';
import { getStorageKey } from './reducers/cartReducers';
import { adminProductsReducer, allUsersReducer, allOrdersReducer, adminAnalyticsReducer, newProductReducer } from './reducers/adminReducers';
import { userReducer, forgotPasswordReducer, userDetailsReducer } from './reducers/userReducers';
import { productDetailsReducer, orderDetailsReducer, newOrderReducer } from './reducers/detailReducers';

const reducer = combineReducers({
    auth: authReducer,
    user: userReducer,
    forgotPassword: forgotPasswordReducer,
    userDetails: userDetailsReducer,
    cart: cartReducer,
    products: productsReducer,
    myOrders: myOrdersReducer,
    adminProducts: adminProductsReducer,
    allUsers: allUsersReducer,
    allOrders: allOrdersReducer,
    adminAnalytics: adminAnalyticsReducer,
    newProduct: newProductReducer,
    productDetails: productDetailsReducer,
    orderDetails: orderDetailsReducer,
    newOrder: newOrderReducer
});

const store = createStore(reducer, applyMiddleware(thunk));

let previousCart = store.getState().cart.cartItems;
let previousScope = store.getState().cart.scope;
store.subscribe(() => {
    const { cartItems, scope } = store.getState().cart;
    if (cartItems !== previousCart || scope !== previousScope) {
        localStorage.setItem(getStorageKey(scope), JSON.stringify(cartItems));
        previousCart = cartItems;
        previousScope = scope;
    }
});

export default store;
