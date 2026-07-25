import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [stationName, setStationName] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [splitRatio, setSplitRatio] = useState('4-1'); // '4-1' proportional or '50-50' equal

  const isCombined = stationSlug === 'combined' || stationSlug === 'all';

  useEffect(() => {
    // Fetch station name
    if (isCombined) {
      setStationName('Combined Kitchen & Ready Stock');
    } else {
      getStations().then(stations => {
        const st = stations.find(s => s.slug === stationSlug);
        if (st) setStationName(st.name);
      }).catch(console.error);
    }

    // Fetch initial items
    fetchQueue();

    // Join Socket Room
    if (isCombined) {
      socket.emit('join_room', 'kitchen');
      socket.emit('join_room', 'ready_stock');
      socket.emit('join_room', 'tea_counter');
    } else {
      socket.emit('join_room', stationSlug);
    }
    socket.emit('join_room', 'admin'); // Receive global new_order events

    const handleUpdate = (updatedItem) => {
      if (isCombined || updatedItem.stations?.slug === stationSlug) {
        setItems(prev => {
          if (updatedItem.item_status === 'served') return prev.filter(i => i.id !== updatedItem.id);
          
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
  }, [stationSlug, isCombined]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await getOrderItems({ station_slug: isCombined ? 'combined' : stationSlug });
      setItems(data.filter(i => i.item_status !== 'served'));
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
      try {
        await updateOrderItemStatus(item.id, 'served');
        setItems(prev => prev.filter(i => i.id !== item.id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getItemsForCol = (colId, sourceItems = items) => sourceItems.filter(i => i.item_status === colId).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));

  const kitchenItems = items.filter(i => 
    i.stations?.slug === 'kitchen' || 
    (i.preparation_type && String(i.preparation_type).toLowerCase() !== 'ready' && i.stations?.slug !== 'ready_stock')
  );
  const readyStockItems = items.filter(i => 
    i.stations?.slug === 'ready_stock' || 
    (i.preparation_type && String(i.preparation_type).toLowerCase() === 'ready')
  );

  const renderItemCard = (item, colId, isLate, elapsed) => (
    <div key={item.id} className={`bg-[#1A0D08] p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all shadow-md ${isLate ? 'border-red-500/40 bg-red-950/10' : ''}`}>
      <div className="flex justify-between items-start mb-2">
         <div className="flex items-center gap-2">
           <span className="text-xl font-serif font-bold text-white">T-{item.orders?.table_number || '?'}</span>
           {isLate && <span className="bg-red-500/20 text-red-400 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded animate-pulse">Urgent</span>}
         </div>
         <span className={`text-xs ${isLate ? 'text-red-400 font-bold' : 'text-white/40'}`}>{elapsed}m ago</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
         <span className="text-[var(--color-brand-caramel)] font-bold text-base">{item.quantity}x</span>
         <span className="text-white font-medium text-base">{item.name}</span>
      </div>
      {item.customizations?.length > 0 && (
         <div className="flex flex-wrap gap-1.5 mb-3">
            {item.customizations.map((c, index) => {
              if (c.name === '_held' && c.choice === 'true') {
                return (
                  <span key={index} className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-xs">restaurant</span>
                    Serve with Kitchen
                  </span>
                );
              }
              return (
                <span key={index} className="bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded border border-white/10">
                  {c.name}: {c.choice}
                </span>
              );
            })}
         </div>
      )}
      
      <button 
         onClick={() => advanceStatus(item)}
         className={`w-full mt-2 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm ${
           colId === 'ready_to_serve' 
             ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20' 
             : 'bg-[var(--color-brand-caramel)]/20 hover:bg-[var(--color-brand-caramel)] text-[var(--color-brand-caramel)] hover:text-black border border-[var(--color-brand-caramel)]/40'
         }`}
      >
         {colId === 'ready_to_serve' ? '✓ Mark Served' : 'Advance →'}
      </button>
    </div>
  );

  if (loading && items.length === 0) return <div className="p-8 text-white">Loading Station Queue...</div>;

  return (
    <div className="h-screen flex flex-col bg-[#0A0503] overflow-hidden p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/kds')}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            title="Back to Station Selection"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-serif text-white">{stationName || (isCombined ? 'Combined Station Board' : stationSlug)}</h2>
              {isCombined && (
                <span className="bg-[var(--color-brand-caramel)]/20 text-[var(--color-brand-caramel)] border border-[var(--color-brand-caramel)]/40 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Split Screen
                </span>
              )}
            </div>
            <p className="text-white/40 text-xs sm:text-sm mt-0.5">{items.length} items active in queue</p>
          </div>
        </div>

        {/* View Switcher Top Bar */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1.5 rounded-xl shadow-inner overflow-x-auto max-w-full">
          <button
            onClick={() => navigate('/station/combined')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              isCombined
                ? 'bg-gradient-to-r from-[var(--color-brand-caramel)] to-[#e59d57] text-black shadow-md scale-[1.02]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-base">splitscreen</span>
            <span>Split-Screen (Combined)</span>
          </button>
          <button
            onClick={() => navigate('/station/kitchen')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              stationSlug === 'kitchen' && !isCombined
                ? 'bg-white/20 text-white shadow-md border border-white/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-base">soup_kitchen</span>
            <span>Kitchen Only</span>
          </button>
          <button
            onClick={() => navigate('/station/ready_stock')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              stationSlug === 'ready_stock' && !isCombined
                ? 'bg-white/20 text-white shadow-md border border-white/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-base">inventory_2</span>
            <span>Ready Stock Only</span>
          </button>
        </div>
      </div>

      {isCombined ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Split Screen Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl shrink-0">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <span className="material-symbols-outlined text-[var(--color-brand-caramel)] text-xl">dashboard</span>
              <span className="font-semibold text-white">Live Split-Screen Active:</span>
              <span className="text-white/50 text-xs hidden sm:inline">Simultaneous monitoring of Kitchen & Ready Stock queues</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 mr-1 font-medium">Layout Ratio:</span>
              <button
                onClick={() => setSplitRatio('4-1')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  splitRatio === '4-1'
                    ? 'bg-[var(--color-brand-caramel)] text-black shadow-md scale-105'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-sm">view_week</span>
                <span>4 : 1 Proportional</span>
              </button>
              <button
                onClick={() => setSplitRatio('50-50')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  splitRatio === '50-50'
                    ? 'bg-[var(--color-brand-caramel)] text-black shadow-md scale-105'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-sm">space_dashboard</span>
                <span>50 : 50 Equal Half</span>
              </button>
            </div>
          </div>

          {/* Divided Screen Grid */}
          <div className={`flex-1 grid gap-6 min-h-0 ${splitRatio === '4-1' ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1 lg:grid-cols-2'}`}>
            {/* Left Side: Kitchen Station Panel */}
            <div className={`${splitRatio === '4-1' ? 'lg:col-span-4' : 'lg:col-span-1'} flex flex-col bg-[#140A07]/70 border-2 border-yellow-500/20 rounded-2xl p-4 overflow-hidden shadow-2xl`}>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/40 shadow-inner">
                    <span className="material-symbols-outlined text-yellow-400 text-xl">soup_kitchen</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white tracking-wide flex items-center gap-2">
                      Kitchen Station
                      <span className="text-xs font-sans font-normal text-yellow-400/80 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">Cook to Order</span>
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">{kitchenItems.length} active items in cooking workflow</p>
                  </div>
                </div>
                <span className="bg-white/5 text-white/70 text-xs font-bold px-3 py-1 rounded-lg border border-white/10">
                  4 Status Stages
                </span>
              </div>

              <div className={`flex-1 grid gap-4 min-h-0 overflow-y-auto lg:overflow-visible ${splitRatio === '4-1' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {STATUS_COLUMNS.map(col => {
                  const colItems = getItemsForCol(col.id, kitchenItems);
                  return (
                    <div key={col.id} className="flex flex-col h-full bg-white/[0.03] rounded-xl border border-white/5 overflow-hidden">
                      <div className={`px-3 py-2.5 border-b border-white/5 bg-black/30 flex items-center justify-between ${col.color}`}>
                        <span className="font-semibold text-white/90 text-sm">{col.label}</span>
                        <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded text-white/70">{colItems.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-[150px]">
                        {colItems.map(item => {
                          const elapsed = Math.floor((Date.now() - new Date(item.created_at)) / 60000);
                          return renderItemCard(item, col.id, elapsed > 10, elapsed);
                        })}
                        {colItems.length === 0 && (
                          <div className="text-center text-white/20 text-xs mt-8">No items</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Ready Stock Panel */}
            <div className={`${splitRatio === '4-1' ? 'lg:col-span-1' : 'lg:col-span-1'} flex flex-col bg-[#140A07]/70 border-2 border-[var(--color-brand-caramel)]/30 rounded-2xl p-4 overflow-hidden shadow-2xl`}>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--color-brand-caramel)]/20 flex items-center justify-center border border-[var(--color-brand-caramel)]/40 shadow-inner">
                    <span className="material-symbols-outlined text-[var(--color-brand-caramel)] text-xl">inventory_2</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white tracking-wide flex items-center gap-2">
                      Ready Stock
                      <span className="text-xs font-sans font-normal text-[var(--color-brand-caramel)] bg-[var(--color-brand-caramel)]/10 px-2 py-0.5 rounded-full border border-[var(--color-brand-caramel)]/20">Grab & Serve</span>
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">{readyStockItems.length} items ready to grab</p>
                  </div>
                </div>
                <span className="bg-[var(--color-brand-caramel)]/10 text-[var(--color-brand-caramel)] text-xs font-bold px-3 py-1 rounded-lg border border-[var(--color-brand-caramel)]/20">
                  Direct Serve
                </span>
              </div>

              <div className="flex-1 flex flex-col min-h-0 bg-white/[0.03] rounded-xl border border-white/5 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-white/5 bg-black/30 border-[var(--color-brand-caramel)]/40 flex items-center justify-between">
                  <span className="font-semibold text-white/90 text-sm">Ready to Serve</span>
                  <span className="text-xs font-bold bg-[var(--color-brand-caramel)]/20 text-[var(--color-brand-caramel)] px-2 py-0.5 rounded">{readyStockItems.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-[150px]">
                  {readyStockItems.map(item => {
                    const elapsed = Math.floor((Date.now() - new Date(item.created_at)) / 60000);
                    return renderItemCard(item, 'ready_to_serve', elapsed > 10, elapsed);
                  })}
                  {readyStockItems.length === 0 && (
                    <div className="text-center text-white/20 text-xs mt-12 flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-2xl text-white/20">check_circle</span>
                      <span>Queue Clear</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Single-station view */
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
                    return renderItemCard(item, col.id, elapsed > 10, elapsed);
                  })}
                  {colItems.length === 0 && (
                    <div className="text-center text-white/20 text-sm mt-10">No items</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
