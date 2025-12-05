export type Category = 'thread' | 'fabric' | 'accessory' | 'pattern';
export type UserRole = 'customer' | 'admin' | 'worker';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Product {
  id: string;
  sku: string; // Barcode/Stock Keeping Unit
  name: string;
  category: Category;
  price: number;
  image: string;
  moq: number;
  stock: number; // Current inventory level
  description: string;
  rating: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  type: 'online_order' | 'offline_sale' | 'restock';
  productId: string;
  productName: string;
  quantity: number;
  timestamp: number;
  totalAmount: number;
  performedBy?: string; // User ID
  fulfillmentMethod?: 'delivery' | 'pickup';
  paymentMethod?: 'card' | 'cash';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export type ViewState = 'auth' | 'home' | 'shop' | 'cart' | 'profile' | 'assistant' | 'admin-dashboard' | 'admin-scanner' | 'admin-inventory' | 'admin-reports';
