import { http } from './client';
import type {
  AppUser,
  Cart,
  Me,
  Notification,
  Order,
  Page,
  Product,
  ProductRequest,
  Role,
  Wallet,
  WalletTransaction,
} from './types';

/** Moi endpoint deu di qua API Gateway; gateway route xuong service tuong ung. */
export const api = {
  // api-gateway
  me: () => http.get<Me>('/api/me'),

  // product-service (GET public, ghi can ADMIN)
  products: (q = '', page = 0, size = 12) =>
    http.get<Page<Product>>(`/api/products?q=${encodeURIComponent(q)}&page=${page}&size=${size}`),
  createProduct: (body: ProductRequest) => http.post<Product>('/api/products', body),
  updateProduct: (id: string, body: ProductRequest) => http.put<Product>(`/api/products/${id}`, body),
  deleteProduct: (id: string) => http.del<void>(`/api/products/${id}`),

  // order-service: gio hang
  cart: () => http.get<Cart>('/api/cart'),
  addToCart: (productId: string, quantity = 1) => http.post<Cart>('/api/cart/items', { productId, quantity }),
  updateCartItem: (productId: string, quantity: number) =>
    http.put<Cart>(`/api/cart/items/${productId}`, { quantity }),
  removeCartItem: (productId: string) => http.del<Cart>(`/api/cart/items/${productId}`),
  clearCart: () => http.del<void>('/api/cart'),

  // order-service: don hang (thanh toan tra 202, ket qua den qua Kafka -> polling)
  orders: () => http.get<Order[]>('/api/orders'),
  order: (id: string) => http.get<Order>(`/api/orders/${id}`),
  checkout: () => http.post<Order>('/api/orders'),
  pay: (id: string) => http.post<Order>(`/api/orders/${id}/payment`),

  // payment-service
  wallet: () => http.get<Wallet>('/api/wallet'),
  transactions: () => http.get<WalletTransaction[]>('/api/wallet/transactions'),
  topUp: (amount: number) => http.post<Wallet>('/api/wallet/top-up', { amount }),

  // notification-service
  notifications: () => http.get<Notification[]>('/api/notifications'),

  // admin (gateway chan /api/admin/** neu khong co ROLE_ADMIN)
  adminOrders: () => http.get<Order[]>('/api/admin/orders'),
  adminUsers: () => http.get<AppUser[]>('/api/admin/users'),
  changeRoles: (id: string, roles: Role[]) => http.put<AppUser>(`/api/admin/users/${id}/roles`, { roles }),
};

export type * from './types';
export { ApiError, LOGIN_URL, csrfToken } from './client';
