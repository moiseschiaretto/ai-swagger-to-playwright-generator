// src/config/endpoints.js
export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    me: '/auth/me'
  },
  users: {
    base: '/users',
    byId: (id) => `/users/${id}`
  },
  categories: {
    base: '/categories',
    byId: (id) => `/categories/${id}`
  },
  products: {
    base: '/products',
    byId: (id) => `/products/${id}`
  },
  orders: {
    base: '/orders',
    byId: (id) => `/orders/${id}`
  },
  reviews: {
    base: '/reviews',
    byId: (id) => `/reviews/${id}`
  }
};