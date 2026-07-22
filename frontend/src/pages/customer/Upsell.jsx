import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

// Mock upsell items
const UPSELL_ITEMS = [
  {
    id: "u1",
    name: "Classic Chocolate Chip Cookie",
    price: 90,
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "u2",
    name: "Takeaway Cold Brew",
    price: 180,
    image: "https://images.unsplash.com/photo-1461023058943-0708f52992e1?auto=format&fit=crop&w=400&q=80"
  }
];

export default function Upsell() {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(null);

  const handleAdd = (id) => {
    setAdding(id);
    // Simulate API call to add the item directly to the tab
    setTimeout(() => {
      setAdding(null);
      navigate('/pay');
    }, 800);
  };

  return (
    <div className="pb-8 min-h-screen bg-[var(--color-brand-cream)] flex flex-col items-center justify-center p-6 relative">
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-6 left-4 hover:text-[var(--color-brand-caramel)]"
      >
        <span className="material-symbols-outlined">close</span>
      </button>

      <div className="w-24 h-24 bg-[var(--color-surface-2)] rounded-full mb-6 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
        {/* Placeholder for barista avatar, using an icon for now */}
        <span className="material-symbols-outlined text-5xl text-[var(--color-brand-caramel)]">face</span>
      </div>

      <div className="bg-white p-6 rounded-[24px] rounded-tl-none shadow-[var(--shadow-brown)] relative mb-10 max-w-sm w-full">
        <p className="text-lg font-serif text-[var(--color-brand-umber)] leading-relaxed text-center">
          "Table 04, before we bring the bill... treat yourself to a little dessert?" 🍪
        </p>
      </div>

      <div className="w-full space-y-4 mb-20 max-w-sm">
        {UPSELL_ITEMS.map(item => (
          <div key={item.id} className="bg-white p-3 rounded-[12px] shadow-sm flex items-center justify-between border border-[var(--color-surface-2)]">
            <div className="flex items-center space-x-3">
              <img src={item.image} alt={item.name} className="w-12 h-12 rounded-[8px] object-cover" />
              <div>
                <p className="font-medium text-sm text-[var(--color-brand-umber)]">{item.name}</p>
                <p className="text-gray-500 text-xs tabular-nums font-semibold mt-0.5">₹{item.price}</p>
              </div>
            </div>
            <button 
              onClick={() => handleAdd(item.id)}
              disabled={adding === item.id}
              className="bg-[var(--color-surface-2)] text-[var(--color-brand-caramel)] hover:bg-[var(--color-brand-caramel)] hover:text-white transition-colors px-3 py-1.5 rounded-full text-xs font-bold"
            >
              {adding === item.id ? 'Adding...' : 'Add'}
            </button>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-gradient-to-t from-[var(--color-brand-cream)] via-[var(--color-brand-cream)] to-transparent">
        <Button 
          variant="primary" 
          className="w-full h-14 bg-[var(--color-brand-espresso)] hover:bg-[var(--color-brand-espresso-light)]"
          onClick={() => navigate('/pay')}
        >
          No thanks, bring the bill
        </Button>
      </div>
    </div>
  );
}
