import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderPrepStatus } from '../../services/api';
import { socket } from '../../services/socket';

const COLUMNS = [
  { status: 'New', label: '🆕 New', next: 'Ready', color: 'border-blue-500/40', headerBg: 'bg-blue-500/10', btnColor: 'bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white' },
  { status: 'Ready', label: '✅ Ready', next: 'Served', color: 'border-green-500/40', headerBg: 'bg-green-500/10', btnColor: 'bg-green-500/20 text-green-300 hover:bg-green-500 hover:text-white' },
];

function elapsed(dateStr) {
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (mins < 1) return 'just now';
  return `${mins}m ago`;
}

function OrderCard({ order, column, onAdvance }) {
  const mins = Math.floor((Date.now() - new Date(order.created_at)) / 60000);
  const isUrgent = mins >= 10;

  return (
    <div className={`bg-[#0E0806] border-2 rounded-[14px] p-4 ${isUrgent ? 'border-red-500/60' : column.color} transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg">T{order.table_number}</span>
          {isUrgent && (
            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded animate-pulse">Urgent</span>
          )}
        </div>
        <span className={`text-xs font-semibold ${isUrgent ? 'text-red-400' : 'text-white/40'}`}>
          {elapsed(order.created_at)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {(order.items || []).map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[var(--color-brand-caramel)] font-bold text-sm w-6 shrink-0">{item.quantity}×</span>
            <div>
              <p className="text-white text-sm font-medium leading-tight">{item.name}</p>
              {item.customizations?.length > 0 && (
                <p className="text-white/40 text-xs mt-0.5">
                  {item.customizations.map(c => `${c.name}: ${c.choice}`).join(' · ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onAdvance(order)}
        className={`w-full py-2 rounded-[8px] text-sm font-semibold transition-all ${column.btnColor}`}
      >
        {column.next === 'Served' ? 'Mark Served' : `→ ${column.next}`}
      </button>
    </div>
  );
}

export default function ReadyBoard() {
  const [orders, setOrders] = useState([]);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Load active orders
    getOrders().then(orders => {
      const active = orders.filter(o => o.status !== 'Served');
      setOrders(active);
    }).catch(console.error);

    // Join kitchen room to receive order updates
    socket.emit('join_room', 'kitchen');

    const onNew = (o) => setOrders(prev => [o, ...prev]);
    const onUpd = (o) => setOrders(prev => {
      const next = prev.map(x => x.id === o.id ? o : x);
      // Remove if served
      return next.filter(x => x.status !== 'Served');
    });

    socket.on('new_order', onNew);
    socket.on('order_updated', onUpd);

    // Refresh elapsed times every minute
    const tick = setInterval(() => forceUpdate(n => n + 1), 60000);

    return () => {
      socket.off('new_order', onNew);
      socket.off('order_updated', onUpd);
      clearInterval(tick);
    };
  }, []);

  const advance = async (order) => {
    // Ready board skips preparing, goes New -> Ready -> Served
    const flow = ['New', 'Ready', 'Served'];
    const current = order.prep_status?.READY || 'New';
    const next = flow[flow.indexOf(current) + 1];
    if (!next) return;
    await updateOrderPrepStatus(order.id, { READY: next }).catch(console.error);
    // Optimistically update
    setOrders(prev =>
      next === 'Served'
        ? prev.filter(o => o.id !== order.id)
        : prev.map(o => o.id === order.id ? { ...o, prep_status: { ...o.prep_status, READY: next } } : o)
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0604] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0E0806]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[var(--color-brand-caramel)] text-2xl">takeout_dining</span>
          <div>
            <h1 className="font-serif text-xl text-white">Ready Counter Display</h1>
            <p className="text-white/40 text-xs">Velvet Brew — Ready-to-Serve Items</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-6 overflow-hidden max-w-4xl mx-auto w-full">
        {COLUMNS.map(col => {
          const colOrders = orders.filter(o => o.prep_status?.READY === col.status)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // oldest first

          return (
            <div key={col.status} className="flex flex-col min-h-0">
              {/* Column header */}
              <div className={`${col.headerBg} rounded-[10px] px-4 py-2.5 mb-3 flex items-center justify-between`}>
                <span className="font-semibold text-white">{col.label}</span>
                <span className="bg-white/10 text-white/60 text-xs font-bold px-2 py-0.5 rounded-full">
                  {colOrders.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colOrders.length === 0 ? (
                  <div className="text-center py-12 text-white/20 text-sm">
                    <span className="material-symbols-outlined text-3xl block mb-2">inbox</span>
                    Empty
                  </div>
                ) : (
                  colOrders.map(order => {
                    const readyItems = (order.items || []).filter(i => i.preparation_type === 'READY');
                    if (readyItems.length === 0) return null;
                    return (
                      <OrderCard
                        key={order.id}
                        order={{ ...order, items: readyItems }}
                        column={col}
                        onAdvance={advance}
                      />
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
