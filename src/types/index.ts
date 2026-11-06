export type UserRole = 'admin' | 'user';
export type SpringAuthority = 'ROLE_ADMIN' | 'ROLE_USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authority: SpringAuthority;
  avatar: string;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLogin: string;
  totalOrders: number;
  totalSpent: number;
  phone?: string;
  address?: string;
}

export interface SpringSecurityError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  requiredAuthority: string;
  grantedAuthorities: string[];
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  category: string;
  price: number;
  originalPrice: number;
  costPrice: number;
  stock: number;
  lowStockThreshold: number;
  rating: number;
  reviewsCount: number;
  sku: string;
  image: string;
  description: string;
  features: string[];
  tags: string[];
  salesCount: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actorEmail: string;
  actorRole: UserRole;
  target: string;
  details: string;
  type: 'role_change' | 'inventory_update' | 'product_create' | 'security_event' | 'config_update';
}

export interface StoreConfig {
  storeName: string;
  currency: string;
  defaultLowStockThreshold: number;
  requireTwoFactorForAdmin: boolean;
  allowGuestCheckout: boolean;
}

export interface SalesDataPoint {
  date: string;
  label: string;
  revenue: number;
  profit: number;
  orders: number;
  averageOrderValue: number;
}

export interface CategorySales {
  category: string;
  revenue: number;
  unitsSold: number;
  percentage: number;
  color: string;
}
