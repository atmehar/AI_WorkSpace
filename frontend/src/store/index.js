import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from './baseApi';
import authReducer from '../modules/auth/slices/authSlice';
import chatUiReducer from '../modules/chat/slices/chatUiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chatUi: chatUiReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

setupListeners(store.dispatch);

export default store;

