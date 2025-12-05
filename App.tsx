import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, ShoppingBag, User as UserIcon, Menu, Sparkles, 
  ChevronLeft, X, CreditCard, Send, Plus, 
  BarChart3, ScanLine, Package, LogOut, CheckCircle,
  Truck, Store, Banknote, Trash2
} from 'lucide-react';
import { Button, Badge, QuantitySelector } from './components/Components';
import { Product, CartItem, ViewState, ChatMessage, Category, User } from './types';
import { generateFabricAdvice } from './services/geminiService';
import { databaseService } from './services/databaseService';

// --- Main App ---

export default function App() {
  // Global State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('home');
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');

  // Checkout & Auth Modals
  const [showCustomerAuth, setShowCustomerAuth] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ id: '1', role: 'model', text: 'Hello! Finovex AI here. How can I assist with your inventory or shopping?' }]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load Data on Mount
  useEffect(() => {
    refreshData();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (isChatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const refreshData = () => {
    setProducts(databaseService.getProducts());
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('home');
    setCart([]);
    setIsMenuOpen(false);
  };

  // Cart Logic
  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: newQty > 0 ? newQty : 1 };
      }
      return item;
    }));
  };

  // Chat Logic
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      // Using the import to fix unused variable error
      const responseText = await generateFabricAdvice(userMsg.text);
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I'm having trouble connecting right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- Auth View (Admin/Worker Only) ---
  const AdminAuthView = () => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'admin' | 'worker'>('admin');

    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const user = databaseService.login(email, role);
      if (user) {
        setCurrentUser(user);
        setView('admin-dashboard');
      } else {
        alert("Login failed. For Admin use 'admin@...', for Worker use 'worker@...'");
      }
    };

    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center px-6 relative overflow-hidden">
        <div className="absolute top-4 left-4">
           <button onClick={() => setView('home')} className="text-white flex items-center gap-2"><ChevronLeft /> Back to Shop</button>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Staff Access</h2>
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            {(['admin', 'worker'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                  role === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
              <input type="email" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border" placeholder={`${role}@finovex.com`} value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <Button fullWidth type="submit">Login</Button>
          </form>
        </div>
      </div>
    );
  };

  // --- Customer Login Modal ---
  const CustomerLoginModal = () => {
    if (!showCustomerAuth) return null;
    const [email, setEmail] = useState('');
    const [isRegister, setIsRegister] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
       e.preventDefault();
       // Simulate customer login/register
       const user = databaseService.login(email, 'customer');
       if (user) {
         setCurrentUser(user);
         setShowCustomerAuth(false);
         setShowCheckout(true); // Proceed to checkout
       }
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
         <div className="bg-white w-full max-w-sm p-6 rounded-3xl shadow-2xl relative">
            <button onClick={() => setShowCustomerAuth(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
            <h2 className="text-xl font-bold mb-1">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="text-sm text-gray-500 mb-6">Please log in to complete your purchase.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                  <input type="email" required className="w-full px-4 py-3 bg-gray-50 border rounded-xl" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
               </div>
               {isRegister && (
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                    <input type="password" required className="w-full px-4 py-3 bg-gray-50 border rounded-xl" placeholder="••••••••" />
                 </div>
               )}
               <Button fullWidth type="submit">{isRegister ? 'Register & Checkout' : 'Login & Checkout'}</Button>
            </form>
            
            <p className="text-center text-xs text-gray-400 mt-4 cursor-pointer hover:text-burgundy-700" onClick={() => setIsRegister(!isRegister)}>
               {isRegister ? 'Already have an account? Login' : 'New customer? Create account'}
            </p>
         </div>
      </div>
    );
  };

  // --- Checkout Modal ---
  const CheckoutModal = () => {
    if (!showCheckout) return null;
    
    const [step, setStep] = useState<1|2|3>(1);
    const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery');
    const [payment, setPayment] = useState<'card' | 'cash'>('card');
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleConfirm = () => {
      cart.forEach(item => {
        databaseService.processTransaction('online_order', item.id, item.quantity, currentUser?.id || 'guest', fulfillment, payment);
      });
      setCart([]);
      refreshData();
      setShowCheckout(false);
      setView('home');
      alert(`Order Confirmed! \nMode: ${fulfillment.toUpperCase()}\nPayment: ${payment.toUpperCase()}`);
    };

    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
         <div className="px-4 py-4 border-b flex items-center justify-between">
            <h2 className="font-bold text-lg">Checkout</h2>
            <button onClick={() => setShowCheckout(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
         </div>

         <div className="flex-1 overflow-y-auto p-4">
            <div className={`mb-8 transition-opacity ${step !== 1 && 'opacity-50 pointer-events-none'}`}>
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-burgundy-900 text-white flex items-center justify-center font-bold">1</div>
                  <h3 className="font-bold">Receive Method</h3>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setFulfillment('delivery')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${fulfillment === 'delivery' ? 'border-burgundy-600 bg-burgundy-50 text-burgundy-900' : 'border-gray-200 text-gray-500'}`}>
                     <Truck />
                     <span className="text-sm font-bold">Delivery</span>
                  </button>
                  <button onClick={() => setFulfillment('pickup')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${fulfillment === 'pickup' ? 'border-burgundy-600 bg-burgundy-50 text-burgundy-900' : 'border-gray-200 text-gray-500'}`}>
                     <Store />
                     <span className="text-sm font-bold">Shop Pickup</span>
                  </button>
               </div>
               {fulfillment === 'delivery' && (
                 <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <input className="w-full bg-transparent border-b border-gray-300 p-2 text-sm outline-none" placeholder="Enter Delivery Address..." />
                 </div>
               )}
               {fulfillment === 'pickup' && (
                 <p className="mt-4 text-xs text-gray-500 text-center">Ready for pickup at: 123 Fabric Lane, Textile City within 2 hours.</p>
               )}
            </div>

            {step >= 2 && (
              <div className={`mb-8 transition-opacity ${step !== 2 && 'opacity-50 pointer-events-none'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-burgundy-900 text-white flex items-center justify-center font-bold">2</div>
                    <h3 className="font-bold">Payment Method</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setPayment('card')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${payment === 'card' ? 'border-burgundy-600 bg-burgundy-50 text-burgundy-900' : 'border-gray-200 text-gray-500'}`}>
                      <CreditCard />
                      <span className="text-sm font-bold">Online Card</span>
                    </button>
                    <button onClick={() => setPayment('cash')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${payment === 'cash' ? 'border-burgundy-600 bg-burgundy-50 text-burgundy-900' : 'border-gray-200 text-gray-500'}`}>
                      <Banknote />
                      <span className="text-sm font-bold">{fulfillment === 'pickup' ? 'Pay at Shop' : 'Cash on Delivery'}</span>
                    </button>
                </div>
                {payment === 'card' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                     <CreditCard className="text-gray-400" />
                     <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Card Number (Stripe Mock)" />
                  </div>
                )}
              </div>
            )}
         </div>

         <div className="p-4 border-t bg-white safe-area-bottom">
            <div className="flex justify-between mb-4 font-bold text-lg">
               <span>Total</span>
               <span>${cartTotal.toFixed(2)}</span>
            </div>
            {step === 1 && <Button fullWidth onClick={() => setStep(2)}>Continue to Payment</Button>}
            {step === 2 && <Button fullWidth onClick={handleConfirm}>Confirm Order</Button>}
         </div>
      </div>
    );
  };

  // --- Admin Views ---
  
  const AdminDashboard = () => {
    const stats = databaseService.getReportStats();

    return (
      <div className="pb-24 pt-20 px-4 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-sm text-gray-500">Welcome back, {currentUser?.name}</p>
          </div>
          <div className="bg-white p-2 rounded-full shadow-sm">
             <UserIcon className="text-burgundy-900" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 font-medium uppercase">Sales Today</p>
            <p className="text-2xl font-bold text-burgundy-900">${stats.salesToday.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 font-medium uppercase">Inventory Value</p>
            <p className="text-2xl font-bold text-gray-900">${stats.totalInventoryValue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
             <p className="text-xs text-gray-400 font-medium uppercase">Total SKUs</p>
             <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-2xl shadow-sm border border-red-100">
             <p className="text-xs text-red-400 font-medium uppercase">Low Stock Alerts</p>
             <p className="text-2xl font-bold text-red-600">{stats.lowStockCount}</p>
          </div>
        </div>

        <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4 mb-8">
           <button onClick={() => setView('admin-scanner')} className="p-4 bg-burgundy-900 text-white rounded-2xl shadow-lg shadow-burgundy-900/20 flex flex-col items-center justify-center gap-2">
              <ScanLine size={32} />
              <span className="font-medium text-sm">Offline Scanner</span>
           </button>
           <button onClick={() => setView('admin-inventory')} className="p-4 bg-white text-burgundy-900 border border-gray-200 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2">
              <Package size={32} />
              <span className="font-medium text-sm">Manage Inventory</span>
           </button>
        </div>

        <h3 className="font-bold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           {stats.recentTransactions.length === 0 ? (
             <p className="p-6 text-center text-gray-400 text-sm">No recent transactions.</p>
           ) : (
             <div className="divide-y divide-gray-100">
               {stats.recentTransactions.map(tx => (
                 <div key={tx.id} className="p-4 flex justify-between items-center">
                   <div>
                     <p className="font-semibold text-gray-900 text-sm">{tx.productName}</p>
                     <p className="text-xs text-gray-500 capitalize flex items-center gap-1">
                       {tx.fulfillmentMethod === 'pickup' && <Store size={10} />}
                       {tx.fulfillmentMethod === 'delivery' && <Truck size={10} />}
                       {tx.type.replace('_', ' ')} • {new Date(tx.timestamp).toLocaleTimeString()}
                     </p>
                   </div>
                   <div className={`text-sm font-bold ${tx.type === 'restock' ? 'text-green-600' : 'text-red-600'}`}>
                     {tx.type === 'restock' ? '+' : '-'}{tx.quantity}
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    );
  };

  const AdminScanner = () => {
    const [skuInput, setSkuInput] = useState('');
    const [lastScan, setLastScan] = useState<{product: Product, msg: string} | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      inputRef.current?.focus();
    }, []);

    const handleScan = (e: React.FormEvent) => {
      e.preventDefault();
      if (!skuInput) return;

      const product = databaseService.getProductBySku(skuInput);
      if (product) {
        const result = databaseService.processTransaction('offline_sale', product.id, 1, currentUser?.id || 'admin', 'pickup', 'cash');
        if (result.success) {
          setLastScan({ product, msg: 'Scanned Successfully' });
          refreshData();
        } else {
          alert(result.message);
        }
      } else {
        alert('Product SKU Not Found');
      }
      setSkuInput('');
    };

    return (
      <div className="pb-24 pt-20 px-4 min-h-screen bg-gray-900 text-white">
        <div className="flex items-center gap-4 mb-8">
           <button onClick={() => setView('admin-dashboard')} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
             <ChevronLeft />
           </button>
           <h2 className="text-2xl font-bold">Offline POS Scanner</h2>
        </div>

        <div className="bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-700 text-center mb-8">
           <ScanLine size={64} className="mx-auto text-green-400 mb-6 animate-pulse" />
           <p className="text-gray-400 mb-6">Scan barcode or type SKU to record offline sale immediately.</p>
           
           <form onSubmit={handleScan}>
             <input 
               ref={inputRef}
               value={skuInput}
               onChange={e => setSkuInput(e.target.value)}
               className="w-full bg-gray-900 border-2 border-green-500/50 text-center text-2xl font-mono py-4 rounded-xl text-white focus:outline-none focus:border-green-500 placeholder-gray-700"
               placeholder="SCAN SKU HERE"
             />
           </form>
        </div>

        {lastScan && (
          <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-4 animate-in slide-in-from-bottom duration-300">
             <div className="p-3 bg-green-500 rounded-full text-black">
               <CheckCircle size={24} />
             </div>
             <div>
               <p className="font-bold text-green-400">{lastScan.msg}</p>
               <p className="text-sm text-gray-300">{lastScan.product.name}</p>
               <p className="text-xs text-gray-500">New Stock: {lastScan.product.stock - 1}</p>
             </div>
          </div>
        )}
      </div>
    );
  };

  const AdminInventory = () => {
    const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = () => {
      if (!editingProduct.name || !editingProduct.sku || !editingProduct.price) return;
      
      const newProduct = {
        id: editingProduct.id || Date.now().toString(),
        sku: editingProduct.sku,
        name: editingProduct.name,
        category: editingProduct.category || 'fabric',
        price: Number(editingProduct.price),
        moq: Number(editingProduct.moq) || 1,
        stock: Number(editingProduct.stock) || 0,
        image: editingProduct.image || `https://picsum.photos/400/400?random=${Date.now()}`,
        description: editingProduct.description || '',
        rating: editingProduct.rating || 5
      } as Product;

      databaseService.saveProduct(newProduct);
      refreshData();
      setIsEditing(false);
      setEditingProduct({});
    };

    return (
      <div className="pb-24 pt-20 px-4 min-h-screen bg-gray-50">
        {!isEditing ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                 <button onClick={() => setView('admin-dashboard')}><ChevronLeft /></button>
                 <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
              </div>
              <Button onClick={() => setIsEditing(true)}>
                <Plus size={20} className="mr-2" /> Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                       <img src={p.image} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{p.name}</h4>
                      <p className="text-xs text-gray-500 font-mono">SKU: {p.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className={`font-bold ${p.stock < p.moq ? 'text-red-500' : 'text-green-600'}`}>
                       {p.stock} Units
                     </p>
                     <button 
                       onClick={() => { setEditingProduct(p); setIsEditing(true); }}
                       className="text-xs text-burgundy-700 underline mt-1"
                     >
                       Edit
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-xl font-bold mb-4">{editingProduct.id ? 'Edit Product' : 'New Product'}</h3>
             <div className="space-y-4">
               <input className="w-full border p-2 rounded-lg" value={editingProduct.sku || ''} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} placeholder="SKU" />
               <input className="w-full border p-2 rounded-lg" value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} placeholder="Name" />
               <input type="number" className="w-full border p-2 rounded-lg" value={editingProduct.price || ''} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} placeholder="Price" />
               <input type="number" className="w-full border p-2 rounded-lg" value={editingProduct.stock || ''} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} placeholder="Stock" />
               
               <div className="flex gap-2 mt-4">
                  <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSave} className="flex-1">Save Changes</Button>
               </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  // --- Customer Views ---

  const HomeView = () => (
    <div className="pb-24">
      <div className="relative h-64 bg-burgundy-900 text-white overflow-hidden rounded-b-3xl shadow-xl">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/800/600?blur=2')] bg-cover opacity-30 mix-blend-overlay"></div>
        <div className="relative z-10 p-6 flex flex-col justify-end h-full">
          <Badge active>Wholesale Portal</Badge>
          <h1 className="text-3xl font-bold mt-2">Finovex Enterprise</h1>
          <p className="text-burgundy-100 mt-1 mb-4">Stock Sync Active • Real-time Inventory</p>
          <Button onClick={() => setView('shop')} className="w-fit bg-white text-burgundy-900 hover:bg-gray-100">
            Order Inventory
          </Button>
        </div>
      </div>
      <div className="px-4 mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">In Stock Ready to Ship</h2>
        <div className="grid grid-cols-2 gap-4">
          {products.filter(p => p.stock > 0).slice(0, 4).map(product => (
            <div 
              key={product.id} 
              onClick={() => setSelectedProduct(product)}
              className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3 relative">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-1">
                   <p className="text-[10px] text-white text-center font-medium">{product.stock} units available</p>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight">{product.name}</h3>
              <p className="font-bold text-burgundy-900 mt-1">${product.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ShopView = () => {
    const filteredProducts = activeCategory === 'all' 
      ? products 
      : products.filter(p => p.category === activeCategory);

    return (
      <div className="pb-24 pt-20 px-4">
         <h2 className="text-2xl font-bold text-gray-900 mb-6">Catalog</h2>
         <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
           {[{ id: 'all', label: 'All' }, { id: 'thread', label: 'Threads' }, { id: 'fabric', label: 'Fabrics' }, { id: 'accessory', label: 'Accessories' }].map(cat => (
             <button
               key={cat.id}
               onClick={() => setActiveCategory(cat.id as any)}
               className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                 activeCategory === cat.id ? 'bg-burgundy-800 text-white' : 'bg-white border'
               }`}
             >
               {cat.label}
             </button>
           ))}
         </div>

         <div className="space-y-4">
            {filteredProducts.map(product => (
              <div key={product.id} onClick={() => setSelectedProduct(product)} className={`flex bg-white rounded-2xl p-3 shadow-sm border border-gray-100 cursor-pointer ${product.stock === 0 ? 'opacity-60' : ''}`}>
                <img src={product.image} className="w-24 h-24 rounded-xl object-cover bg-gray-100" />
                <div className="ml-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">SKU: {product.sku}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-400">Stock: {product.stock}</p>
                      <p className="font-bold text-burgundy-900 text-lg">${product.price.toFixed(2)}</p>
                    </div>
                    {product.stock > 0 ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(product, product.moq); }}
                        className="p-2 bg-burgundy-50 text-burgundy-900 rounded-lg hover:bg-burgundy-100"
                      >
                        <Plus size={20} />
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Out of Stock</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
         </div>
      </div>
    );
  };

  const CartView = () => {
    const handleCheckoutInit = () => {
       if (cart.length === 0) return;
       
       if (!currentUser) {
         setShowCustomerAuth(true);
       } else {
         setShowCheckout(true);
       }
    };

    return (
      <div className="pb-24 pt-20 px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Cart</h2>
        {cart.length === 0 ? (
           <div className="text-center py-20 text-gray-400">Your cart is empty</div>
        ) : (
           <>
             {cart.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 flex gap-4">
                   <img src={item.image} className="w-16 h-16 rounded object-cover" />
                   <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold">{item.name}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">${item.price}</p>
                      
                      {/* Used the QuantitySelector here */}
                      <div className="flex items-center justify-between">
                         <QuantitySelector 
                           quantity={item.quantity} 
                           min={item.moq}
                           onIncrease={() => updateQuantity(item.id, 1)}
                           onDecrease={() => updateQuantity(item.id, -1)}
                         />
                         <div className="font-bold text-burgundy-900">${(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                   </div>
                </div>
             ))}
             <Button fullWidth onClick={handleCheckoutInit}>Proceed to Checkout</Button>
           </>
        )}
      </div>
    );
  };

  // --- Chat Overlay ---
  const ChatOverlay = () => {
    if (!isChatOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-md h-[85vh] sm:h-[600px] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
          <div className="bg-burgundy-900 text-white p-4 flex justify-between items-center">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-white/10 rounded-full">
                 <Sparkles size={20} className="text-yellow-300" />
               </div>
               <div>
                 <h3 className="font-bold">Finovex AI</h3>
                 <p className="text-xs text-burgundy-200">Inventory Assistant</p>
               </div>
             </div>
             <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
               <X size={20} />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-burgundy-800 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
               <div className="flex justify-start">
                 <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-gray-200 shadow-sm flex gap-1">
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                 </div>
               </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about thread types..."
                className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isTyping}
                className="bg-burgundy-800 text-white p-3 rounded-xl disabled:opacity-50 hover:bg-burgundy-900 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Rendering ---

  if (view === 'auth') return <AdminAuthView />;

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto shadow-2xl relative overflow-hidden">
      {/* Header */}
      {view !== 'admin-scanner' && (
        <header className={`fixed top-0 left-0 right-0 z-30 ${view.includes('home') ? 'bg-transparent' : 'bg-white shadow-sm'} max-w-md mx-auto h-16 flex justify-between items-center px-4 transition-all`}>
           <button onClick={() => setIsMenuOpen(true)} className={`${view === 'home' ? 'text-white' : 'text-gray-900'}`}><Menu /></button>
           <span className={`font-bold ${view === 'home' ? 'text-white' : 'text-burgundy-900'}`}>{currentUser?.role === 'admin' ? 'Admin Panel' : 'Finovex'}</span>
           <div className="flex gap-4">
              {currentUser?.role !== 'admin' && (
                <button onClick={() => setView('cart')} className={`relative ${view === 'home' ? 'text-white' : 'text-gray-900'}`}>
                  <ShoppingBag />
                  {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center">{cart.length}</span>}
                </button>
              )}
           </div>
        </header>
      )}

      {/* Main Routes */}
      <main className="min-h-screen">
        {view === 'home' && <HomeView />}
        {view === 'shop' && <ShopView />}
        {view === 'cart' && <CartView />}
        {view === 'admin-dashboard' && <AdminDashboard />}
        {view === 'admin-inventory' && <AdminInventory />}
        {view === 'admin-scanner' && <AdminScanner />}
      </main>

      {/* Bottom Nav (Customer Only) */}
      {!view.startsWith('admin') && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center z-30 max-w-md mx-auto">
          <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-burgundy-800' : 'text-gray-400'}`}>
             <Home size={24} strokeWidth={view === 'home' ? 2.5 : 2} />
             <span className="text-[10px]">Home</span>
          </button>
          <div className="relative -top-8">
             <button onClick={() => setIsChatOpen(true)} className="bg-burgundy-800 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform"><Sparkles size={24} /></button>
          </div>
          <button onClick={() => setView('shop')} className={`flex flex-col items-center gap-1 ${view === 'shop' ? 'text-burgundy-800' : 'text-gray-400'}`}>
             <ShoppingBag size={24} strokeWidth={view === 'shop' ? 2.5 : 2} />
             <span className="text-[10px]">Shop</span>
          </button>
        </nav>
      )}

      {/* Admin Bottom Nav */}
      {view.startsWith('admin') && view !== 'admin-scanner' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center z-30 max-w-md mx-auto">
          <button onClick={() => setView('admin-dashboard')} className={`flex flex-col items-center gap-1 ${view === 'admin-dashboard' ? 'text-burgundy-800' : 'text-gray-400'}`}>
             <BarChart3 size={24} />
             <span className="text-[10px]">Stats</span>
          </button>
          <button onClick={() => setView('admin-scanner')} className="bg-burgundy-900 text-white p-3 rounded-full -mt-8 shadow-lg">
             <ScanLine size={24} />
          </button>
          <button onClick={() => setView('admin-inventory')} className={`flex flex-col items-center gap-1 ${view === 'admin-inventory' ? 'text-burgundy-800' : 'text-gray-400'}`}>
             <Package size={24} />
             <span className="text-[10px]">Stock</span>
          </button>
        </nav>
      )}

      {/* Side Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsMenuOpen(false)}>
          <div className="bg-white w-64 h-full p-6 shadow-xl animate-in slide-in-from-left duration-200" onClick={e => e.stopPropagation()}>
             <h2 className="text-2xl font-bold text-burgundy-900 mb-2">Finovex</h2>
             {currentUser ? (
               <p className="text-sm text-gray-500 mb-8">{currentUser.name} <br/> <span className="uppercase text-xs font-bold text-burgundy-600">{currentUser.role}</span></p>
             ) : (
               <p className="text-sm text-gray-400 mb-8 italic">Guest Visitor</p>
             )}
             
             <ul className="space-y-4 font-medium text-gray-600">
               <li onClick={() => { setView(currentUser?.role === 'admin' ? 'admin-dashboard' : 'home'); setIsMenuOpen(false); }} className="flex items-center gap-3 cursor-pointer"><Home size={20} /> Dashboard</li>
               <li onClick={() => { setView('shop'); setIsMenuOpen(false); }} className="flex items-center gap-3 cursor-pointer"><ShoppingBag size={20} /> Browse Catalog</li>
               
               {currentUser ? (
                 <li onClick={handleLogout} className="flex items-center gap-3 cursor-pointer text-red-600 mt-8 pt-8 border-t border-gray-100"><LogOut size={20} /> Log Out</li>
               ) : (
                 <li onClick={() => { setView('auth'); setIsMenuOpen(false); }} className="flex items-center gap-3 cursor-pointer text-burgundy-800 mt-8 pt-8 border-t border-gray-100"><CheckCircle size={20} /> Staff Access</li>
               )}
             </ul>
          </div>
        </div>
      )}

      {/* Modals & Overlays */}
      <CustomerLoginModal />
      <CheckoutModal />
      <ChatOverlay />

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-40 flex flex-col bg-white animate-in slide-in-from-bottom">
           <div className="relative h-1/2 bg-gray-100">
             <img src={selectedProduct.image} className="w-full h-full object-cover" />
             <button onClick={() => setSelectedProduct(null)} className="absolute top-4 left-4 bg-white/80 p-2 rounded-full"><ChevronLeft /></button>
           </div>
           <div className="flex-1 p-6 bg-white -mt-6 rounded-t-3xl relative flex flex-col">
              <h2 className="text-2xl font-bold mb-2">{selectedProduct.name}</h2>
              <p className="text-gray-500 text-sm mb-4">SKU: {selectedProduct.sku}</p>
              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-bold text-burgundy-900">${selectedProduct.price}</span>
                <Badge>{selectedProduct.stock > 0 ? `In Stock: ${selectedProduct.stock}` : 'Out of Stock'}</Badge>
              </div>
              <p className="text-gray-600 flex-1">{selectedProduct.description}</p>
              
              {(!currentUser || currentUser.role === 'customer') && selectedProduct.stock > 0 && (
                <div className="mt-4">
                  <Button fullWidth onClick={() => { addToCart(selectedProduct, selectedProduct.moq); setSelectedProduct(null); }}>
                    Add {selectedProduct.moq} to Order
                  </Button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}