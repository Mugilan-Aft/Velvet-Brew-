import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats, getOrders, updateOrderStatus, purgeMockOrders } from '../../services/api';
import { socket } from '../../services/socket';

const STATUS_CONFIG = {
  New: { label: 'New', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  Preparing: { label: 'Preparing', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  Ready: { label: 'Ready', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  Served: { label: 'Served', color: 'bg-white/10 text-white/40 border-white/10' },
};

const ORDER_FLOW = ['New', 'Preparing', 'Ready', 'Served'];

const StatCard = ({ icon, label, value, sub, accent }) => (
  <div className="bg-white/5 border border-white/8 rounded-[16px] p-5 flex items-start gap-4">
    <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${accent}`}>
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </div>
    <div>
      <p className="text-white/50 text-xs uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-serif font-semibold text-white">{value}</p>
      {sub && <p className="text-white/40 text-xs mt-1">{sub}</p>}
    </div>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [orderItems, setOrderItems] = useState([]);
  const [stations, setStations] = useState([]);

  const fetchData = useCallback(async () => {
    const [statsData, ordersData, itemsData, stationsData] = await Promise.all([
      getStats().catch(() => null),
      getOrders().catch(() => []),
      import('../../services/api').then(m => m.getOrderItems()).catch(() => []),
      import('../../services/api').then(m => m.getStations()).catch(() => []),
    ]);
    setStats(statsData);
    setOrders(ordersData);
    setOrderItems(itemsData);
    setStations(stationsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    socket.emit('join_room', 'admin');

    const onNew = (order) => {
      setOrders(prev => [order, ...prev]);
      setStats(s => s ? { ...s, ordersInQueue: s.ordersInQueue + 1, todayOrderCount: s.todayOrderCount + 1, todayRevenue: s.todayRevenue + Number(order.total) } : s);
      import('../../services/api').then(m => m.getOrderItems()).then(setOrderItems).catch(console.error);
    };
    const onUpdated = (order) => {
      setOrders(prev => prev.map(o => o.id === order.id ? order : o));
    };
    const onItemUpdated = (item) => {
      setOrderItems(prev => {
         const exists = prev.find(i => i.id === item.id);
         if(exists) return prev.map(i => i.id === item.id ? item : i);
         return [...prev, item];
      });
    };

    socket.on('new_order', onNew);
    socket.on('order_updated', onUpdated);
    socket.on('item_status_updated', onItemUpdated);
    return () => {
      socket.off('new_order', onNew);
      socket.off('order_updated', onUpdated);
      socket.off('item_status_updated', onItemUpdated);
    };
  }, [fetchData]);

  const advance = async (order) => {
    const idx = ORDER_FLOW.indexOf(order.status);
    if (idx < ORDER_FLOW.length - 1) {
      await updateOrderStatus(order.id, ORDER_FLOW[idx + 1]).catch(console.error);
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'Served');

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-[88px] bg-white/5 rounded-[16px] animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-serif text-white">Dashboard</h2>
          <p className="text-white/40 text-sm mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/kds')} className="flex items-center gap-2 bg-[#1A0D08] text-white/90 border border-white/10 px-4 py-2 rounded-[8px] text-sm font-semibold hover:bg-white/10 transition-all">
             <span className="material-symbols-outlined text-[18px]">kitchen</span>
             Station Boards
          </button>
          <button onClick={() => navigate('/admin/pos')} className="flex items-center gap-2 bg-[var(--color-brand-caramel)] text-white px-4 py-2 rounded-[8px] text-sm font-semibold hover:brightness-110 transition-all">
            <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
            Launch POS
          </button>
          <button onClick={fetchData} className="flex items-center gap-2 text-sm text-white/50 hover:text-white bg-white/5 px-3 py-2 rounded-[8px] transition-colors">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="table_restaurant" label="Open Tabs" value={stats?.openTabs ?? '—'} accent="bg-blue-500/20 text-blue-400" />
        <StatCard icon="receipt" label="In Queue" value={stats?.ordersInQueue ?? '—'} sub="Active orders" accent="bg-yellow-500/20 text-yellow-400" />
        <StatCard icon="payments" label="Today's Revenue" value={stats ? `₹${stats.todayRevenue.toFixed(0)}` : '—'} accent="bg-green-500/20 text-green-400" />
        <StatCard icon="local_cafe" label="Today's Orders" value={stats?.todayOrderCount ?? '—'} accent="bg-[var(--color-brand-caramel)]/20 text-[var(--color-brand-caramel)]" />
      </div>

      {/* Live Orders */}
      <div className="bg-white/5 border border-white/8 rounded-[16px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h3 className="font-semibold text-white">Live Orders</h3>
          <span className="text-xs text-white/40 bg-white/5 px-2.5 py-1 rounded-full">{activeOrders.length} active</span>
        </div>

        {activeOrders.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-white/20 block mb-3">inbox</span>
            <p className="text-white/30 text-sm">No active orders right now</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {activeOrders.map(order => {
              const cfg = STATUS_CONFIG[order.status];
              const nextStatus = ORDER_FLOW[ORDER_FLOW.indexOf(order.status) + 1];
              const elapsed = Math.floor((Date.now() - new Date(order.created_at)) / 60000);
              return (
                <div key={order.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/3 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-white">Table {order.table_number}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {order.tabs?.status === 'Closed' ? (
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase font-bold ml-2 border border-green-500/30">Paid</span>
                      ) : (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase font-bold ml-2 border border-red-500/30">Unpaid</span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                       {(() => {
                         const itemsForOrder = orderItems.filter(oi => oi.order_id === order.id);
                         const sourceItems = itemsForOrder.length > 0 ? itemsForOrder : (order.items || []);
                         
                         return sourceItems.map((i, idx) => {
                           const status = i.item_status ? i.item_status.toLowerCase() : '';
                           const isServed = status === 'served';
                           
                           return (
                             <div key={i.id || idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded px-2.5 py-1.5 max-w-[180px]">
                               <div className={`w-2 h-2 rounded-full shrink-0 ${isServed ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]'}`} title={isServed ? 'Served' : 'Not Served'} />
                               <div className="flex gap-1.5 text-xs min-w-0">
                                 <span className="text-[var(--color-brand-caramel)] font-bold shrink-0">{i.quantity}×</span>
                                 <span className="text-white/90 truncate">{i.name}</span>
                               </div>
                             </div>
                           );
                         });
                       })()}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-white/60 text-xs mb-1">{elapsed}m ago</div>
                    <div className="text-white font-semibold text-sm tabular-nums">₹{Number(order.total).toFixed(0)}</div>
                  </div>
                  {nextStatus && (
                    <button
                      onClick={() => advance(order)}
                      className="ml-2 px-3 py-1.5 bg-[var(--color-brand-caramel)]/20 text-[var(--color-brand-caramel)] text-xs font-semibold rounded-[8px] hover:bg-[var(--color-brand-caramel)] hover:text-white transition-all whitespace-nowrap"
                    >
                      → {nextStatus}
                    </button>
                  )}
                  {order.tabs?.status === 'Closed' ? (
                     <button
                        onClick={() => window.open(`/admin/print/${order.tab_id}`, '_blank')}
                        className="ml-2 px-3 py-1.5 bg-white/10 text-white text-xs font-semibold rounded-[8px] hover:bg-white/20 transition-all whitespace-nowrap border border-white/10"
                     >
                       Print Bill
                     </button>
                  ) : (
                     <button
                        onClick={async () => {
                           if(window.confirm(`Settle Bill for Table ${order.table_number}?`)) {
                              await import('../../services/api').then(({ updateTab }) => updateTab(order.tab_id, { status: 'Closed', payment_method: 'Cash', total_paid: order.total }));
                              window.open(`/admin/print/${order.tab_id}`, '_blank');
                              fetchData();
                           }
                        }}
                        className="ml-2 px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-[8px] hover:bg-green-500 hover:text-white transition-all whitespace-nowrap"
                     >
                       Settle Tab
                     </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
