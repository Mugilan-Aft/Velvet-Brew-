import React, { useState, useEffect } from 'react';
import { getOrderItems, updateOrderItemStatus } from '../../services/api';
import { socket } from '../../services/socket';

export default function ServingQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReadyItems();

    // The admin room receives updates for all items
    socket.emit('join_room', 'admin');

    const handleUpdate = (updatedItem) => {
      setItems(prev => {
        if (updatedItem.item_status !== 'ready_to_serve') {
          return prev.filter(i => i.id !== updatedItem.id);
        }
        const exists = prev.find(i => i.id === updatedItem.id);
        if (exists) return prev.map(i => i.id === updatedItem.id ? updatedItem : i);
        return [...prev, updatedItem];
      });
    };

    socket.on('item_status_updated', handleUpdate);
    return () => socket.off('item_status_updated', handleUpdate);
  }, []);

  const fetchReadyItems = async () => {
    try {
      setLoading(true);
      const data = await getOrderItems({ status: 'ready_to_serve' });
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markServed = async (item) => {
    try {
      // Optimistic
      setItems(prev => prev.filter(i => i.id !== item.id));
      await updateOrderItemStatus(item.id, 'served');
    } catch (e) {
      console.error(e);
      fetchReadyItems();
    }
  };

  // Group by table number
  const grouped = items.reduce((acc, item) => {
    const table = item.orders?.table_number || 'Unknown';
    if (!acc[table]) acc[table] = { items: [], time: item.created_at };
    acc[table].items.push(item);
    // Keep the oldest time for the table
    if (new Date(item.created_at) < new Date(acc[table].time)) {
      acc[table].time = item.created_at;
    }
    return acc;
  }, {});

  const sortedTables = Object.entries(grouped).sort((a, b) => new Date(a[1].time) - new Date(b[1].time));

  if (loading && items.length === 0) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-serif text-white mb-6">Serving Queue</h2>
        <p className="text-white/50">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-serif text-white">Serving Queue</h2>
          <p className="text-white/40 text-sm mt-1">{items.length} items ready to serve</p>
        </div>
      </div>

      {sortedTables.length === 0 ? (
        <div className="py-16 text-center bg-white/5 rounded-xl border border-white/5">
          <span className="material-symbols-outlined text-5xl text-white/20 block mb-3">room_service</span>
          <p className="text-white/30 text-sm">No items waiting to be served</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTables.map(([table, data]) => {
            const elapsed = Math.floor((Date.now() - new Date(data.time)) / 60000);
            const isLate = elapsed > 5; // 5 mins waiting on counter is late
            
            return (
              <div key={table} className={`bg-white/5 border rounded-[16px] overflow-hidden ${isLate ? 'border-red-500/30' : 'border-[var(--color-brand-caramel)]/30'}`}>
                <div className={`px-4 py-3 border-b flex justify-between items-center ${isLate ? 'bg-red-500/20 border-red-500/30' : 'bg-[var(--color-brand-caramel)]/20 border-[var(--color-brand-caramel)]/30'}`}>
                  <h3 className="font-serif font-bold text-lg text-white">Table {table}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${isLate ? 'bg-red-500/30 text-red-400' : 'bg-black/20 text-[var(--color-brand-caramel)]'}`}>
                    {elapsed}m waiting
                  </span>
                </div>
                
                <div className="p-4 space-y-3">
                  {data.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex flex-col">
                         <div className="flex items-center gap-2">
                            <span className="text-[var(--color-brand-caramel)] font-bold">{item.quantity}x</span>
                            <span className="text-white">{item.name}</span>
                         </div>
                         {item.customizations?.length > 0 && (
                            <div className="text-xs text-white/50 pl-5">
                               {item.customizations.map(c => `${c.name}: ${c.choice}`).join(', ')}
                            </div>
                         )}
                         <span className="text-[10px] uppercase tracking-wider text-white/30 pl-5 mt-0.5">
                            From: {item.stations?.slug}
                         </span>
                      </div>
                      <button 
                        onClick={() => markServed(item)}
                        className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-[var(--color-brand-caramel)] hover:text-white transition-colors ml-4 shrink-0"
                      >
                        <span className="material-symbols-outlined text-[20px]">done</span>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-4 pt-0 border-t border-white/5 mt-2">
                   <button 
                      onClick={() => data.items.forEach(i => markServed(i))}
                      className="w-full mt-3 py-2.5 rounded-[10px] border border-[var(--color-brand-caramel)]/50 text-[var(--color-brand-caramel)] font-semibold text-sm hover:bg-[var(--color-brand-caramel)] hover:text-white transition-colors"
                   >
                      Serve All
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
