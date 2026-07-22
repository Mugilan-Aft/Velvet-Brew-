import React, { useState, useEffect } from 'react';
import { getMenu, openTab, placeOrder, createRazorpayOrder, updateTab } from '../../services/api';

export default function AdminPOS() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [table, setTable] = useState('Counter');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [pendingMethod, setPendingMethod] = useState(null);

  useEffect(() => {
    getMenu().then(m => setMenu(m.filter(x => x.in_stock))).catch(console.error);
  }, []);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, customizations: [] }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        return { ...i, quantity: Math.max(0, i.quantity + delta) };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const handleCheckoutClick = (method) => {
    if (cart.length === 0) return alert('Cart is empty!');
    const hasReady = cart.some(i => i.preparation_type === 'ready');
    const hasKitchen = cart.some(i => i.preparation_type === 'kitchen');
    
    if (hasReady && hasKitchen) {
       setPendingMethod(method);
       setShowPrefModal(true);
    } else {
       handleCheckout(method, false);
    }
  };

  const handleCheckout = async (method = 'UPI', serveWithKitchen = false) => {
    setShowPrefModal(false);
    if (cart.length === 0) return alert('Cart is empty!');
    setLoading(true);
    try {
      const sub = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
      const taxAmt = sub * 0.05;
      const tot = sub + taxAmt;

      const executeOrder = async (isUpi = false) => {
        const newTab = await openTab({
          table_number: table,
          session_token: 'pos-' + Date.now(),
          status: 'Closed',
          total_paid: tot,
          payment_method: isUpi ? 'UPI' : 'Cash'
        });

        const orderItems = cart.map(i => ({
          id: i.id, name: i.name, quantity: i.quantity, price: i.price, preparation_type: i.preparation_type, customizations: []
        }));

        await placeOrder({
          tab_id: newTab.id,
          table_number: table,
          items: orderItems,
          status: 'New',
          subtotal: sub, tax: taxAmt, total: tot,
          serve_ready_with_kitchen: serveWithKitchen
        });
        
        window.open(`/admin/print/${newTab.id}`, '_blank');
        setCart([]);
        setLoading(false);
      };

      if (method === 'UPI') {
        const rpOrder = await createRazorpayOrder(tot);
        const options = {
          key: rpOrder.key_id,
          amount: rpOrder.amount,
          currency: rpOrder.currency,
          name: "Velvet Brew POS",
          description: "Counter Order",
          order_id: rpOrder.id,
          handler: async function (response) {
            try {
              await executeOrder(true);
            } catch (err) {
              alert("Order update failed");
              setLoading(false);
            }
          },
          theme: { color: "#D97B29" },
          modal: { ondismiss: () => setLoading(false) }
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (res) {
          setLoading(false);
          alert('Payment failed: ' + res.error.description);
        });
        rzp.open();
      } else {
        await executeOrder(false);
      }
    } catch(err) {
      alert(err.message);
      setLoading(false);
    }
  };

  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const categories = ['All', ...new Set(menu.map(m => m.category))];
  const filteredMenu = menu.filter(m => {
    const matchesCategory = filter === 'All' || m.category === filter;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 flex flex-col p-8 overflow-y-auto">
         <h2 className="text-2xl font-serif text-white mb-6">Point of Sale</h2>
         <div className="flex justify-between items-start mb-6 gap-4">
            <div className="flex flex-wrap gap-2">
               {categories.map(cat => (
                 <button
                   key={cat}
                   onClick={() => setFilter(cat)}
                   className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                     filter === cat ? 'bg-[var(--color-brand-caramel)] text-white' : 'bg-white/10 text-white/90 hover:bg-white/20 hover:text-white border border-white/5'
                   }`}
                 >
                   {cat}
                 </button>
               ))}
            </div>
            <input 
              type="text" 
              placeholder="Search menu..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white/5 text-white px-4 py-2 rounded-full border border-white/10 focus:outline-none focus:border-[var(--color-brand-caramel)] text-sm w-64 shrink-0"
            />
         </div>
         <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenu.map(item => (
              <div 
                 key={item.id} 
                 onClick={() => addToCart(item)}
                 className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-[16px] p-4 cursor-pointer transition select-none active:scale-95"
              >
                 <div className="h-24 w-full rounded-lg overflow-hidden mb-3">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80" />
                 </div>
                 <h3 className="text-white font-semibold text-sm leading-tight mb-1">{item.name}</h3>
                 <span className="text-[var(--color-brand-caramel)] font-bold text-sm">₹{item.price}</span>
              </div>
            ))}
         </div>
      </div>
      <div className="w-80 shrink-0 bg-[#0A0503] border-l border-white/5 flex flex-col pt-6">
         <div className="px-5 mb-4">
            <label className="text-xs uppercase text-white/40 font-bold mb-1 block">Table / Customer</label>
            <input 
              value={table} 
              onChange={e => setTable(e.target.value)}
              className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-[var(--color-brand-caramel)]" 
            />
         </div>
         <div className="flex-1 overflow-y-auto px-5 divide-y divide-white/5">
            {cart.map(item => (
              <div key={item.id} className="py-3 flex justify-between items-start">
                 <div className="flex-1 pr-2">
                    <h4 className="text-white text-sm font-medium">{item.name}</h4>
                    <p className="text-white/40 text-xs">₹{item.price}</p>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <span className="text-white font-bold text-sm">₹{item.price * item.quantity}</span>
                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-2 py-0.5">
                       <button onClick={() => updateQty(item.id, -1)} className="text-white/60 hover:text-white">-</button>
                       <span className="text-white text-xs w-4 text-center">{item.quantity}</span>
                       <button onClick={() => updateQty(item.id, 1)} className="text-white/60 hover:text-white">+</button>
                    </div>
                 </div>
              </div>
            ))}
            {cart.length === 0 && (
               <div className="py-10 text-center text-white/30 text-sm">Cart is empty</div>
            )}
         </div>
         <div className="p-5 bg-white/5 border-t border-white/10">
            <div className="space-y-1 mb-4 text-white/60 text-sm">
               <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">₹{subtotal.toFixed(2)}</span></div>
               <div className="flex justify-between"><span>GST (5%)</span><span className="tabular-nums">₹{tax.toFixed(2)}</span></div>
            </div>
            <div className="flex gap-2">
              <button 
                 onClick={() => handleCheckoutClick('Cash')} 
                 disabled={cart.length===0 || loading}
                 className="flex-1 h-14 bg-white/10 text-white font-bold rounded-[12px] hover:bg-white/20 disabled:opacity-50 flex items-center justify-center px-4 transition-colors text-sm"
              >
                 Cash (₹{total.toFixed(2)})
              </button>
              <button 
                 onClick={() => handleCheckoutClick('UPI')} 
                 disabled={cart.length===0 || loading}
                 className="flex-1 h-14 bg-[var(--color-brand-caramel)] text-white font-bold rounded-[12px] hover:brightness-110 disabled:opacity-50 flex items-center justify-center px-4 transition-colors text-sm"
              >
                 Online (₹{total.toFixed(2)})
              </button>
            </div>
         </div>
      </div>

      {showPrefModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-[#1A0D08] border border-white/10 rounded-[24px] p-6 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
              <h2 className="text-2xl font-serif text-white mb-2">Ready Items</h2>
              <p className="text-white/60 mb-6 text-sm">This order contains items that are ready to serve. How should they be handled?</p>
              
              <div className="space-y-3">
                 <button onClick={() => handleCheckout(pendingMethod, false)} className="w-full h-14 border border-white/20 text-white hover:bg-white/5 rounded-[12px] flex items-center px-4 transition-colors">
                    <span className="material-symbols-outlined mr-3 text-white/60">flash_on</span>
                    Serve Immediately
                 </button>
                 <button onClick={() => handleCheckout(pendingMethod, true)} className="w-full h-14 bg-[var(--color-brand-caramel)] text-white hover:brightness-110 rounded-[12px] flex items-center px-4 transition-all">
                    <span className="material-symbols-outlined mr-3">restaurant</span>
                    Serve with Kitchen items
                 </button>
              </div>
              <button onClick={() => setShowPrefModal(false)} className="mt-4 text-center w-full text-sm text-white/40 hover:text-white transition-colors">Cancel</button>
           </div>
        </div>
      )}
    </div>
  );
}
