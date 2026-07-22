import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { socket } from '../../services/socket';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/admin/orders', label: 'Orders', icon: 'receipt_long' },
  { to: '/admin/serving', label: 'Serving Queue', icon: 'room_service' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'monitoring' },
  { to: '/admin/inventory', label: 'Inventory', icon: 'inventory_2' },
  { to: '/admin/menu', label: 'Menu', icon: 'menu_book' },
  { to: '/admin/tables', label: 'Tables', icon: 'table_restaurant' },
  { to: '/admin/reviews', label: 'Reviews', icon: 'reviews' },
];

export default function AdminLayout() {
  const [callAlerts, setCallAlerts] = useState([]);

  useEffect(() => {
    socket.emit('join_room', 'admin');
    
    const handleCall = (data) => {
      const id = Date.now();
      setCallAlerts(prev => [...prev, { id, table: data.table_number }]);
      // auto remove after 15s
      setTimeout(() => {
        setCallAlerts(prev => prev.filter(c => c.id !== id));
      }, 15000);
    };

    socket.on('staff_called', handleCall);
    return () => socket.off('staff_called', handleCall);
  }, []);

  const dismissAlert = (id) => {
    setCallAlerts(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="flex h-screen bg-[#0E0806] text-white overflow-hidden relative">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
         {callAlerts.map(alert => (
            <div key={alert.id} className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-xl shadow-red-500/20 flex items-center justify-between min-w-[300px] animate-bounce">
               <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[24px]">notifications_active</span>
                  <div>
                    <p className="font-bold">Staff Needed!</p>
                    <p className="text-sm">Table {alert.table} is requesting assistance.</p>
                  </div>
               </div>
               <button onClick={() => dismissAlert(alert.id)} className="bg-black/20 hover:bg-black/40 p-1.5 rounded-full transition-colors ml-4">
                  <span className="material-symbols-outlined text-[18px]">close</span>
               </button>
            </div>
         ))}
      </div>

      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-white/5 flex flex-col py-6 px-4">
        <div className="mb-8 px-2">
          <h1 className="text-xl font-serif text-[var(--color-brand-caramel)] tracking-wide">Velvet Brew</h1>
          <p className="text-[11px] text-white/40 uppercase tracking-widest mt-0.5">Admin</p>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm transition-all ${
                  isActive
                    ? 'bg-[var(--color-brand-caramel)] text-white font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 pt-4 px-2 space-y-3">
          <NavLink to="/login" className="flex items-center gap-3 text-white/40 hover:text-red-400 text-sm transition-colors w-full">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </NavLink>
          <p className="text-[11px] text-white/30 pt-2">Velvet Brew POS v1.0</p>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto bg-[#120A06]">
        <Outlet />
      </main>
    </div>
  );
}
