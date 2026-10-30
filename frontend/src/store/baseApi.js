import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setToken, logout } from '../modules/auth/slices/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState()?.auth?.token || localStorage.getItem('access_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Custom baseQuery handling silent JWT refresh on 401 responses
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = api.getState()?.auth?.refreshToken || localStorage.getItem('refresh_token');

    if (refreshToken) {
      // Attempt token refresh
      const refreshResult = await rawBaseQuery(
        {
          url: '/auth/token/refresh/',
          method: 'POST',
          body: { refresh: refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data?.access) {
        // Store new access token
        api.dispatch(setToken({ access: refreshResult.data.access }));
        // Retry initial query with new token
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        // Refresh token expired or revoked
        api.dispatch(logout());
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } else {
      api.dispatch(logout());
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Quota', 'Documents', 'DocumentStatus', 'Conversations', 'Conversation'],
  endpoints: () => ({}),
});

