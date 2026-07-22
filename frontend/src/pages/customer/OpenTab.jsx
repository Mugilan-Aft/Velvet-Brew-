import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useCart } from '../../context/CartContext';
import { getTab } from '../../services/api';

export default function OpenTab() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [tab, setTab] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const tabId = localStorage.getItem('vb_tab_id');

  useEffect(() => {
    if (!tabId) { navigate('/'); return; }
    getTab(tabId).then(setTab).catch(console.error).finally(() => setLoading(false));
  }, [tabId, navigate]);

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Tab...</div>;
  if (!tab) return <div className="p-10 text-center">No active tab found.</div>;

  const orders = tab.orders || [];
  const grandTotal = orders.reduce((sum, order) => sum + Number(order.total), 0);

  const handleReorder = (item) => {
    // Reconstruct item for cart
    addToCart({
      id: Math.random().toString(), // fake ID since we only have name here
      name: item.name,
      price: item.price
    }, 1, item.customizations || []);
    alert(`${item.name} added to cart!`);
  };

  return (
    <div className="pb-36 min-h-screen bg-[var(--color-brand-cream)] flex flex-col">
      <div className="bg-[var(--color-brand-espresso)] text-white px-4 py-6 rounded-b-[24px] sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate(-1)} className="hover:text-[var(--color-brand-caramel)]">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="text-xs font-bold px-2 py-1 bg-white/20 rounded uppercase tracking-wider">{tab.status}</span>
        </div>
        <h1 className="text-2xl font-serif">Open Tab</h1>
        <p className="text-[var(--color-brand-cream-light)] opacity-90 text-sm">Table {tab.table_number}</p>
      </div>

      <div className="p-4 flex-1 space-y-6 mt-4">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">No orders placed yet.</p>
        ) : (
          orders.map((round, idx) => (
            <div key={round.id} className="bg-white p-4 rounded-[16px] shadow-[var(--shadow-brown-sm)]">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--color-surface-2)]">
                <span className="font-semibold text-[var(--color-brand-umber)]">Round {orders.length - idx}</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                  round.status === 'Served' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                }`}>{round.status}</span>
              </div>
              <div className="space-y-4">
                {(round.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <p className="text-sm font-medium"><span className="text-[var(--color-brand-caramel)] font-bold mr-1">{item.quantity}x</span> {item.name}</p>
                      {item.customizations?.length > 0 && (
                        <p className="text-[11px] text-gray-400 pl-5 mt-0.5 leading-tight">
                          {item.customizations.map(c => `${c.name}: ${c.choice}`).join(', ')}
                        </p>
                      )}
                      
                      {/* Smart Reorder for past drinks */}
                      {round.status === 'Served' && (
                        <button 
                          onClick={() => handleReorder(item)}
                          className="ml-5 mt-2 flex items-center gap-1 text-[10px] uppercase font-bold text-[var(--color-brand-caramel)] hover:text-black transition-colors bg-orange-50 px-2 py-1 rounded-full border border-orange-100"
                        >
                          <span className="material-symbols-outlined text-[12px]">replay</span>
                          Order Again
                        </button>
                      )}
                    </div>
                    <span className="tabular-nums text-sm font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 flex justify-between border-t border-dashed border-[var(--color-surface-4)] font-medium text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="tabular-nums font-bold">₹{Number(round.total).toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-gradient-to-t from-[var(--color-brand-cream)] via-[var(--color-brand-cream)] to-[var(--color-brand-cream)] pt-10">
        <div className="bg-white rounded-[16px] shadow-[var(--shadow-brown)] p-5 mb-4 flex justify-between items-center">
          <span className="font-serif text-lg text-[var(--color-brand-umber)]">Total Due</span>
          <span className="font-serif text-2xl text-[var(--color-brand-cherry)] tabular-nums">₹{grandTotal.toFixed(2)}</span>
        </div>
        <Button variant="primary" className="w-full h-14" onClick={() => navigate('/pay', { state: { tabId } })}>
          Ready to Pay
        </Button>
      </div>
    </div>
  );
}
