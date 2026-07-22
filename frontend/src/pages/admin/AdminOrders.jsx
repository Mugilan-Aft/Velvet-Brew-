import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from '../../services/api';
import { socket } from '../../services/socket';

const STATUS_TABS = ['All', 'New', 'Preparing', 'Ready', 'Served'];

const STATUS_STYLE = {
  New: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Preparing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Ready: 'bg-green-500/20 text-green-400 border-green-500/30',
  Served: 'bg-white/10 text-white/40 border-white/10',
};
const ORDER_FLOW = ['New', 'Preparing', 'Ready', 'Served'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders().then(setOrders).catch(console.error).finally(() => setLoading(false));

    socket.emit('join_room', 'admin');
    const onNew = (o) => setOrders(p => [o, ...p]);
    const onUpd = (o) => setOrders(p => p.map(x => x.id === o.id ? o : x));
    socket.on('new_order', onNew);
    socket.on('order_updated', onUpd);
    return () => { socket.off('new_order', onNew); socket.off('order_updated', onUpd); };
  }, []);

  const advance = async (order) => {
    const next = ORDER_FLOW[ORDER_FLOW.indexOf(order.status) + 1];
    if (next) await updateOrderStatus(order.id, next).catch(console.error);
  };

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-white">All Orders</h2>
        <p className="text-white/40 text-sm mt-1">{orders.length} total orders</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === tab ? 'bg-[var(--color-brand-caramel)] text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {tab}
            <span className="ml-2 text-xs opacity-60">
              {tab === 'All' ? orders.length : orders.filter(o => o.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-[16px] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-white/20 block mb-3">inbox</span>
          <p className="text-white/30 text-sm">No {filter !== 'All' ? filter.toLowerCase() : ''} orders</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const next = ORDER_FLOW[ORDER_FLOW.indexOf(order.status) + 1];
            const elapsed = Math.floor((Date.now() - new Date(order.created_at)) / 60000);
            return (
              <div key={order.id} className="bg-white/5 border border-white/8 rounded-[16px] p-5 flex items-start gap-4 hover:bg-white/7 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-semibold text-white text-lg">Table {order.table_number}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${STATUS_STYLE[order.status]}`}>
                      {order.status}
                    </span>
                    {order.tabs?.status === 'Closed' ? (
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase font-bold border border-green-500/30">Paid</span>
                    ) : (
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase font-bold border border-red-500/30">Unpaid</span>
                    )}
                    <span className="text-white/30 text-xs ml-auto">{elapsed}m ago</span>
                  </div>
                  <div className="space-y-0.5 mb-3">
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="text-white/50 text-sm flex items-center gap-2">
                        <span className="text-[var(--color-brand-caramel)] font-semibold text-xs">{item.quantity}×</span>
                        {item.name}
                        {item.customizations?.length > 0 && (
                          <span className="text-white/30 text-xs">· {item.customizations.map(c => `${c.name}: ${c.choice}`).join(', ')}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-white/40">Sub: <span className="tabular-nums">₹{Number(order.subtotal).toFixed(0)}</span></span>
                    <span className="text-white/40">GST: <span className="tabular-nums">₹{Number(order.tax).toFixed(0)}</span></span>
                    <span className="text-white font-semibold">Total: <span className="tabular-nums">₹{Number(order.total).toFixed(0)}</span></span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {next && (
                    <button
                      onClick={() => advance(order)}
                      className="px-4 py-2 bg-[var(--color-brand-caramel)]/20 text-[var(--color-brand-caramel)] text-sm font-semibold rounded-[10px] hover:bg-[var(--color-brand-caramel)] hover:text-white transition-all whitespace-nowrap"
                    >
                      Mark {next}
                    </button>
                  )}
                  {order.status === 'Served' && (
                    <a
                      href={`/admin/print/${order.tab_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-white/10 text-white/80 text-sm font-semibold rounded-[10px] hover:bg-white/20 transition-all text-center flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">print</span>
                      Print Ticket
                    </a>
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
