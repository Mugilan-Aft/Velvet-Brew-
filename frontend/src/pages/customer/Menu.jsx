import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { getMenu } from '../../services/api';
import { socket } from '../../services/socket';

const DietDot = ({ tag }) => {
  if (tag === 'none') return null;
  const color = tag === 'non-veg' ? 'bg-red-500' : 'bg-green-500';
  return (
    <div className={`absolute bottom-1 right-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] uppercase font-bold flex items-center gap-1 ${tag === 'non-veg' ? 'text-red-700' : 'text-green-700'}`}>
      <span className={`w-2 h-2 rounded-sm ${color}`} />
      {tag}
    </div>
  );
};

export default function Menu() {
  const { totalItems, subtotal, addToCart } = useCart();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('none');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStaffToast, setShowStaffToast] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const tableNumber = urlParams.get('table') || localStorage.getItem('vb_table') || '04';

  useEffect(() => {
    localStorage.setItem('vb_table', tableNumber);
    getMenu()
      .then(setMenu)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tableNumber]);

  let filteredMenu = menu.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (sortOrder === 'low') {
    filteredMenu.sort((a,b) => a.price - b.price);
  } else if (sortOrder === 'high') {
    filteredMenu.sort((a,b) => b.price - a.price);
  }

  // Derive real categories from loaded menu
  const categories = ['All', ...new Set(menu.map(i => i.category))];

  const handleCallStaff = () => {
    socket.emit('call_staff', { table_number: tableNumber });
    setShowStaffToast(true);
    setTimeout(() => setShowStaffToast(false), 3000);
  };

  return (
    <div className="pb-24">
      {/* Toast Notification */}
      {showStaffToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#1A0D08] text-white px-4 py-3 rounded-xl shadow-xl border border-[var(--color-brand-caramel)]/30 flex items-center gap-3 whitespace-nowrap">
            <span className="material-symbols-outlined text-[var(--color-brand-caramel)]">concierge</span>
            <p className="text-sm font-medium">A staff member is on their way!</p>
          </div>
        </div>
      )}

      {/* Call Waiter Floating Button */}
      <div className="fixed inset-x-0 bottom-[100px] max-w-md mx-auto pointer-events-none z-50 flex justify-end px-4">
        <button 
          onClick={handleCallStaff}
          className="pointer-events-auto bg-[#2D2D2D] text-[var(--color-brand-caramel)] w-14 h-14 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center border-2 border-[var(--color-brand-caramel)] hover:scale-105 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[24px]">concierge</span>
          <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Staff</span>
        </button>
      </div>

      {/* Header & Hero */}
      {window.location.search.includes('paid=true') && (
        <div className="bg-green-500 text-white px-4 py-3 text-center text-sm font-medium animate-pulse">
          Payment successful! Thank you for choosing Velvet Brew.
        </div>
      )}
      <div className="bg-[var(--color-brand-espresso)] text-white px-4 py-8 rounded-b-[24px]">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl mb-2">Morning, Table {tableNumber}</h1>
            <p className="text-[var(--color-brand-cream-light)] opacity-90 text-sm">Treat yourself to our seasonal roast.</p>
          </div>
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[12px] bg-white/10 hover:bg-white/20 transition-colors border border-white/10 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">room_service</span>
            <span className="text-[12px] font-bold tracking-wider">Cart</span>
          </button>
        </div>

        <div className="mt-6 flex gap-3 items-center">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-espresso-light)]">search</span>
            <input
              type="text"
              placeholder="Search our menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 bg-white text-[var(--color-brand-umber)] rounded-full pr-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-caramel)]"
            />
          </div>
          <div className="relative shrink-0 text-[13px]">
             <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="h-11 flex items-center justify-between min-w-[130px] bg-white/10 text-white rounded-full px-4 font-medium border border-white/10 hover:bg-white/20 transition focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-caramel)]"
             >
                <span>{sortOrder === 'none' ? 'Sort By' : sortOrder === 'low' ? 'Price: Low-High' : 'Price: High-Low'}</span>
                <span className="material-symbols-outlined text-[18px] ml-2">expand_more</span>
             </button>
             
             {dropdownOpen && (
               <>
                 <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                 <div className="absolute right-0 mt-2 w-48 bg-[#1A0D08] border border-white/10 rounded-[12px] shadow-xl z-50 overflow-hidden py-1">
                    {[
                      { val: 'none', label: 'Default' }, 
                      { val: 'low', label: 'Price: Low-High' }, 
                      { val: 'high', label: 'Price: High-Low' }
                    ].map(opt => (
                       <button
                         key={opt.val}
                         onClick={() => { setSortOrder(opt.val); setDropdownOpen(false); }}
                         className={`w-full text-left px-4 py-2.5 transition-colors ${
                           sortOrder === opt.val ? 'bg-[var(--color-brand-caramel)]/20 text-[var(--color-brand-caramel)] font-semibold' : 'text-white/80 hover:bg-white/5'
                         }`}
                       >
                         {opt.label}
                       </button>
                    ))}
                 </div>
               </>
             )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-6 overflow-x-auto whitespace-nowrap hide-scrollbar flex space-x-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-[var(--color-brand-caramel)] text-white'
                : 'bg-white text-[var(--color-brand-umber)] shadow-sm'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Item Grid */}
      <div className="px-4">
        {loading && (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-[16px] h-[120px] animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-red-300 mb-4 block">wifi_off</span>
            <p className="text-gray-500">Could not load menu. {error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-[var(--color-brand-caramel)] font-medium underline">Try again</button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 gap-4 pb-20">
            {filteredMenu.length === 0 && (
              <div className="text-center py-12 text-gray-400 col-span-2">
                <span className="material-symbols-outlined text-5xl block mb-3">search_off</span>
                No items found
              </div>
            )}
            {filteredMenu.map(item => (
              <Card key={item.id} hoverable onClick={() => navigate(`/item/${item.id}`)} className="flex flex-col p-2 overflow-hidden bg-white shadow-[0_2px_10px_rgba(46,27,18,0.05)] border border-[var(--color-surface-4)] group">
                <div className="w-full h-[140px] rounded-[12px] overflow-hidden relative mb-3">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-2 right-2">
                     <DietDot tag={item.dietary_tag} />
                  </div>
                </div>
                <div className="flex flex-col flex-1 px-1 justify-between">
                  <div>
                    <h3 className="font-serif text-[0.95rem] leading-tight mb-1 text-[var(--color-brand-umber)] font-bold line-clamp-2">{item.name}</h3>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold tabular-nums text-sm text-[var(--color-brand-caramel)]">₹{item.price}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(item, 1, []);
                      }}
                      className="bg-[#2E1B12] text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#8A5A44] transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] font-bold">add</span>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>



      {/* Sticky Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-6 bg-gradient-to-t from-[var(--color-brand-cream)] via-[var(--color-brand-cream)] to-[var(--color-brand-cream)]/0 z-40">
          <Button
            variant="primary"
            className="w-full h-14 shadow-[var(--shadow-brown)] flex justify-between px-6 bg-[var(--color-brand-umber)] hover:bg-[#2E1B12] text-white"
            onClick={() => navigate('/cart')}
          >
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 px-2.5 py-0.5 rounded text-sm font-semibold tabular-nums">{totalItems}</div>
              <span>View Cart</span>
            </div>
            <span className="font-semibold tabular-nums">₹{subtotal.toFixed(2)}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
