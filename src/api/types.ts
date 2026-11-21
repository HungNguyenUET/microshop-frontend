// Kieu du lieu khop voi cac record Java o backend (BigDecimal -> number, Instant/UUID -> string).

export type Role = 'USER' | 'ADMIN';

/** GET /api/me (api-gateway, GatewayController) */
export interface Me {
  id: string;
  username: string;
  name: string;
  picture: string;
  roles: Role[];
}

/** product-service: ProductDtos.ProductResponse */
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  active: boolean;
}

/** product-service: ProductDtos.ProductRequest */
export interface ProductRequest {
  sku: string;
  name: string;
  description?: string;
  price: number;
  category: string;
}

/** product-service: ProductDtos.PageResponse */
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** order-service: CartService.CartLine / CartView */
export interface CartLine {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  available: boolean;
}

export interface Cart {
  items: CartLine[];
  total: number;
}

/** order-service: OrderStatus */
export type OrderStatus = 'PENDING_PAYMENT' | 'PAYMENT_PROCESSING' | 'PAID' | 'PAYMENT_FAILED';

/** order-service: OrderController.OrderResponse */
export interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  failureReason: string | null;
  items: { productId: string; productName: string; unitPrice: number; quantity: number }[];
  createdAt: string;
  updatedAt: string;
  username: string;
}

/** payment-service: WalletController */
export interface Wallet {
  userId: string;
  balance: number;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  type: 'TOP_UP' | 'PAYMENT';
  amount: number;
  status: 'SUCCESS' | 'FAILED';
  orderId: string | null;
  reason: string | null;
  createdAt: string;
}

/** notification-service: NotificationController.NotificationResponse */
export interface Notification {
  id: string;
  orderId: string | null;
  type: 'ORDER_PLACED' | 'ORDER_PAID' | 'PAYMENT_FAILED' | string;
  title: string;
  message: string;
  createdAt: string;
}

/** auth-service: UserController.UserResponse */
export interface AppUser {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  provider: 'LOCAL' | 'GITHUB';
  roles: Role[];
  createdAt: string;
  lastLoginAt: string | null;
}
