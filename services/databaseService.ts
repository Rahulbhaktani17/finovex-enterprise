import { Product, Transaction, User, UserRole } from '../types';

const KEYS = {
  PRODUCTS: 'finovex_db_products',
  USERS: 'finovex_db_users',
  TRANSACTIONS: 'finovex_db_transactions',
  SESSION: 'finovex_session'
};

// Seed Data
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: '1',
    sku: 'THREAD-SILK-BURG-001',
    name: 'Royal Burgundy Silk Thread',
    category: 'thread',
    price: 12.50,
    image: 'https://picsum.photos/400/400?random=1',
    moq: 10,
    stock: 1500,
    description: 'High-tensile strength pure silk thread.',
    rating: 4.8
  },
  {
    id: '2',
    sku: 'FABRIC-EGY-COT-WHT',
    name: 'Egyptian Cotton Bolt - White',
    category: 'fabric',
    price: 145.00,
    image: 'https://picsum.photos/400/400?random=2',
    moq: 2,
    stock: 50,
    description: 'Premium 800 thread count Egyptian cotton.',
    rating: 4.9
  },
  {
    id: '3',
    sku: 'ACC-NEEDLE-IND-14',
    name: 'Industrial Sewing Needles (Size 14)',
    category: 'accessory',
    price: 25.00,
    image: 'https://picsum.photos/400/400?random=3',
    moq: 5,
    stock: 200,
    description: 'Titanium-coated needles.',
    rating: 4.6
  }
];

const DEFAULT_ADMIN: User = {
  id: 'admin_01',
  email: 'admin@finovex.com',
  name: 'System Administrator',
  role: 'admin'
};

export const databaseService = {
  // --- Auth ---
  login: (email: string, role: UserRole): User | null => {
    // Simulation: In a real app, verify password hash
    if (role === 'admin' && email.includes('admin')) return DEFAULT_ADMIN;
    if (role === 'worker' && email.includes('worker')) return { id: 'worker_01', email, name: 'Shop Worker', role: 'worker' };
    
    // For customers, we simulate a successful login/registration for any email
    if (role === 'customer') {
      return { id: `cust_${Date.now()}`, email, name: email.split('@')[0], role: 'customer' };
    }
    return null;
  },

  // --- Inventory ---
  getProducts: (): Product[] => {
    const stored = localStorage.getItem(KEYS.PRODUCTS);
    return stored ? JSON.parse(stored) : DEFAULT_PRODUCTS;
  },

  getProductBySku: (sku: string): Product | undefined => {
    const products = databaseService.getProducts();
    return products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
  },

  saveProduct: (product: Product): void => {
    const products = databaseService.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    
    if (index >= 0) {
      products[index] = product;
    } else {
      products.unshift(product);
    }
    
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  // --- Transactions & Stock Sync ---
  processTransaction: (
    type: Transaction['type'], 
    productId: string, 
    quantity: number, 
    performedBy: string,
    fulfillmentMethod?: 'delivery' | 'pickup',
    paymentMethod?: 'card' | 'cash'
  ): { success: boolean; message: string } => {
    const products = databaseService.getProducts();
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) return { success: false, message: 'Product not found' };

    const product = products[productIndex];

    // Stock Validation
    if ((type === 'online_order' || type === 'offline_sale') && product.stock < quantity) {
      return { success: false, message: `Insufficient stock. Only ${product.stock} available.` };
    }

    // Update Stock
    if (type === 'restock') {
      product.stock += quantity;
    } else {
      product.stock -= quantity;
    }

    products[productIndex] = product;
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));

    // Log Transaction
    const transactions: Transaction[] = JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || '[]');
    const newTx: Transaction = {
      id: Date.now().toString(),
      type,
      productId,
      productName: product.name,
      quantity,
      timestamp: Date.now(),
      totalAmount: product.price * quantity,
      performedBy,
      fulfillmentMethod,
      paymentMethod
    };
    transactions.unshift(newTx);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));

    return { success: true, message: 'Transaction processed successfully' };
  },

  getTransactions: (): Transaction[] => {
    return JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || '[]');
  },

  getReportStats: () => {
    const products = databaseService.getProducts();
    const transactions = databaseService.getTransactions();

    const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const lowStockItems = products.filter(p => p.stock < p.moq * 2);
    
    // Calculate sales today
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const salesToday = transactions
      .filter(t => t.timestamp >= startOfDay.getTime() && (t.type === 'offline_sale' || t.type === 'online_order'))
      .reduce((acc, t) => acc + t.totalAmount, 0);

    return {
      totalProducts: products.length,
      totalInventoryValue,
      lowStockCount: lowStockItems.length,
      salesToday,
      recentTransactions: transactions.slice(0, 10),
      lowStockList: lowStockItems
    };
  }
};
