import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { updateInventory } from '../../services/api';

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('inventory').select('*').order('name');
    if (!error && data) setItems(data);
    setLoading(false);
  };

  const handleAdjust = async (id, amount) => {
    const newStock = Math.max(0, amount);
    setItems(items.map(i => i.id === id ? { ...i, stock_level: newStock } : i));
    await updateInventory(id, { stock_level: newStock }).catch(console.error);
  };

  return (
    <div className="p-8 pb-32">
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-white">Raw Inventory</h2>
        <p className="text-white/40 text-sm mt-1">Live tracking of ingredients deducted automatically on order completion.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {loading ? (
             <div className="p-10 text-white/50 animate-pulse">Loading inventory sensors...</div>
        ) : items.length === 0 ? (
             <div className="p-10 text-white/50">No inventory tracked yet. Seed database to begin tracking.</div>
        ) : items.map(item => {
           const percent = Math.min(100, Math.max(0, (item.stock_level / (item.minimum_threshold * 2)) * 100));
           const isLow = item.stock_level < item.minimum_threshold;
           return (
             <div key={item.id} className={`border rounded-[16px] p-6 relative overflow-hidden ${isLow ? 'bg-red-500/10 border-red-500/50' : 'bg-white/5 border-white/8'}`}>
               {isLow && (
                 <div className="absolute top-4 right-4 flex items-center gap-1 text-red-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                    <span className="material-symbols-outlined text-[14px]">warning</span> Low Stock
                 </div>
               )}
               <h3 className="text-white font-semibold mb-1 truncate pr-20">{item.name}</h3>
               <p className="text-white/40 text-xs mb-4 uppercase tracking-widest">Threshold: {item.minimum_threshold} {item.unit}</p>
               
               <div className="flex items-end justify-between mb-3">
                 <div className="flex items-end gap-2">
                   <span className={`text-4xl font-serif tabular-nums ${isLow ? 'text-red-400' : 'text-white'}`}>{Number(item.stock_level).toFixed(0)}</span>
                   <span className="text-white/50 pb-1">{item.unit}</span>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      value={Math.round(item.stock_level)}
                      onChange={(e) => handleAdjust(item.id, parseInt(e.target.value) || 0)}
                      className="w-20 bg-white/10 text-white px-2 py-1.5 rounded-lg border border-white/5 focus:outline-none focus:border-[var(--color-brand-caramel)] text-center tabular-nums"
                    />
                 </div>
               </div>
               
               <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-4">
                 <div 
                   className={`h-full transition-all duration-1000 ${isLow ? 'bg-red-500' : 'bg-[var(--color-brand-caramel)]'}`} 
                   style={{ width: `${percent}%` }}
                 />
               </div>
             </div>
           );
        })}
      </div>
    </div>
  );
}
