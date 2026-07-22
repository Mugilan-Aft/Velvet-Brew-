import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getOrderItems, updateOrderItemStatus, getStations } from '../../services/api';
import { socket } from '../../services/socket';

const STATUS_COLUMNS = [
  { id: 'pending', label: 'Pending', color: 'border-white/10' },
  { id: 'preparing', label: 'Preparing', color: 'border-yellow-500/30' },
  { id: 'prepared', label: 'Prepared', color: 'border-green-500/30' },
  { id: 'ready_to_serve', label: 'Ready to Serve', color: 'border-[var(--color-brand-caramel)]/50' },
];

export default function StationBoard() {
  const { stationSlug } = useParams();
  const [stationName, setStationName] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch station name
    getStations().then(stations => {
      const st = stations.find(s => s.slug === stationSlug);
      if (st) setStationName(st.name);
    }).catch(console.error);

    // Fetch initial items
    fetchQueue();

    // Join Socket Room
    socket.emit('join_room', stationSlug);
    socket.emit('join_room', 'admin'); // Receive global new_order events

    const handleUpdate = (updatedItem) => {
      if (updatedItem.stations?.slug === stationSlug) {
        setItems(prev => {
          if (updatedItem.item_status === 'served') return prev.filter(i => i.id !== updatedItem.id);
          const isHeld = updatedItem.item_status === 'pending' && updatedItem.customizations?.some(c => c.name === '_held' && c.choice === 'true');
          if (isHeld) return prev.filter(i => i.id !== updatedItem.id);
          
          const exists = prev.find(i => i.id === updatedItem.id);
          if (exists) return prev.map(i => i.id === updatedItem.id ? updatedItem : i);
          return [...prev, updatedItem]; // new item
        });
      }
    };

    const handleNewOrder = () => {
      fetchQueue(); // refresh queue when a new order drops
    };

    socket.on('item_status_updated', handleUpdate);
    socket.on('new_order', handleNewOrder);
    
    return () => {
      socket.off('item_status_updated', handleUpdate);
      socket.off('new_order', handleNewOrder);
    };
  }, [stationSlug]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await getOrderItems({ station_slug: stationSlug });
      setItems(data.filter(i => {
        if (i.item_status === 'served') return false;
        if (i.item_status === 'pending' && i.customizations?.some(c => c.name === '_held' && c.choice === 'true')) return false;
        return true;
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const advanceStatus = async (item) => {
    const idx = STATUS_COLUMNS.findIndex(c => c.id === item.item_status);
    if (idx >= 0 && idx < STATUS_COLUMNS.length - 1) {
      const nextStatus = STATUS_COLUMNS[idx + 1].id;
      // Optimistic update
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, item_status: nextStatus } : i));
      try {
        await updateOrderItemStatus(item.id, nextStatus);
      } catch (e) {
        console.error(e);
        fetchQueue(); // rollback on error
      }
    } else if (item.item_status === 'ready_to_serve') {
      // Typically waiter handles 'served', but if staff taps it here:
      try {
        await updateOrderItemStatus(item.id, 'served');
        setItems(prev => prev.filter(i => i.id !== item.id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getItemsForCol = (colId) => items.filter(i => i.item_status === colId).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));

  if (loading && items.length === 0) return <div className="p-8 text-white">Loading Station Queue...</div>;

  return (
    <div className="h-screen flex flex-col bg-[#0A0503] overflow-hidden p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-serif text-white">{stationName || stationSlug} Queue</h2>
          <p className="text-white/40 text-sm mt-1">{items.length} items active</p>
        </div>
      </div>

      <div className={`flex-1 grid gap-6 min-h-0 ${stationSlug === 'ready_stock' ? 'grid-cols-1 max-w-md mx-auto w-full' : 'grid-cols-4'}`}>
        {(stationSlug === 'ready_stock' ? STATUS_COLUMNS.filter(c => c.id === 'ready_to_serve') : STATUS_COLUMNS).map(col => {
          const colItems = getItemsForCol(col.id);
          return (
            <div key={col.id} className="flex flex-col h-full bg-white/5 rounded-xl border border-white/5 overflow-hidden">
              <div className={`px-4 py-3 border-b border-white/5 bg-black/20 ${col.color}`}>
                <h3 className="font-semibold text-white/90">{col.label}</h3>
                <p className="text-xs text-white/40">{colItems.length} items</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {colItems.map(item => {
                  const elapsed = Math.floor((Date.now() - new Date(item.created_at)) / 60000);
                  const isLate = elapsed > 10;
                  return (
                    <div key={item.id} className={`bg-[#1A0D08] p-4 rounded-lg border border-white/10 ${isLate ? 'border-red-500/30' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-xl font-serif font-bold text-white">T-{item.orders?.table_number}</span>
                         <span className={`text-xs ${isLate ? 'text-red-400 font-bold' : 'text-white/40'}`}>{elapsed}m ago</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-[var(--color-brand-caramel)] font-bold">{item.quantity}x</span>
                         <span className="text-white font-medium">{item.name}</span>
                      </div>
                      {item.customizations?.length > 0 && (
                         <div className="text-xs text-white/50 mb-3 bg-white/5 p-2 rounded">
                            {item.customizations.map(c => `${c.name}: ${c.choice}`).join(', ')}
                         </div>
                      )}
                      
                      <button 
                         onClick={() => advanceStatus(item)}
                         className="w-full mt-2 py-2 rounded-[8px] bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
                      >
                         {col.id === 'ready_to_serve' ? 'Mark Served' : 'Advance'} →
                      </button>
                    </div>
                  );
                })}
                {colItems.length === 0 && (
                   <div className="text-center text-white/20 text-sm mt-10">No items</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
