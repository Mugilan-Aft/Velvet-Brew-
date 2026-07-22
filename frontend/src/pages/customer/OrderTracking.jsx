import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { socket } from '../../services/socket';

const STEPS = [
  { label: 'Order Placed', value: 'New', icon: 'check_circle' },
  { label: 'Preparing', value: 'Preparing', icon: 'local_cafe' },
  { label: 'Ready!', value: 'Ready', icon: 'done_all' },
];
import { getOrders, getOrderItems } from '../../services/api';
export default function OrderTracking() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const tabId = state?.tabId;
  const orderId = state?.orderId;
  
  const [status, setStatus] = useState('New');
  const [items, setItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [showStaffToast, setShowStaffToast] = useState(false);

  useEffect(() => {
    if (!tabId) return;

    // Fetch initial order details to get items
    if (orderId) {
       getOrders({ tab_id: tabId }).then(orders => {
          const matched = orders.find(o => o.id === orderId);
          if (matched) {
             setStatus(matched.status);
             setItems(matched.items || []);
             getOrderItems({ order_id: matched.id }).then(setOrderItems).catch(console.error);
          } else if (orders.length > 0) {
             setStatus(orders[0].status);
             setItems(orders[0].items || []);
             getOrderItems({ order_id: orders[0].id }).then(setOrderItems).catch(console.error);
          }
       }).catch(console.error);
    }

    // Join the customer's room to receive updates
    socket.emit('join_room', `customer-${tabId}`);

    const handler = (order) => {
      // Update to the latest status if it matches our tracked order or if we don't have one
      if (!orderId || order.id === orderId) {
         setStatus(order.status);
         if (order.items) setItems(order.items);
         getOrderItems({ order_id: order.id }).then(setOrderItems).catch(console.error);
      }
    };
    const itemHandler = (updatedItem) => {
      setOrderItems(prev => {
        const exists = prev.find(i => i.id === updatedItem.id);
        if (exists) return prev.map(i => i.id === updatedItem.id ? updatedItem : i);
        return [...prev, updatedItem];
      });
    };

    socket.on('order_updated', handler);
    socket.on('new_order', handler);
    socket.on('item_status_updated', itemHandler);
    return () => { 
      socket.off('order_updated', handler); 
      socket.off('new_order', handler); 
      socket.off('item_status_updated', itemHandler);
    };
  }, [tabId]);

  const currentIdx = STEPS.findIndex(s => s.value === status);

  const isReady = status === 'Ready';
  
  const hasKitchenItems = orderItems.some(i => String(i.preparation_type).toLowerCase() !== 'ready');

  return (
    <div className="pb-24 min-h-screen bg-[var(--color-brand-cream)] pt-12 p-6 flex flex-col items-center">
      {/* Toast Notification */}
      {showStaffToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#1A0D08] text-white px-4 py-3 rounded-xl shadow-xl border border-[var(--color-brand-caramel)]/30 flex items-center gap-3 whitespace-nowrap">
            <span className="material-symbols-outlined text-[var(--color-brand-caramel)]">concierge</span>
            <p className="text-sm font-medium">A staff member is on their way!</p>
          </div>
        </div>
      )}

      {/* Success animation */}
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-md transition-all duration-700 ${isReady || (!hasKitchenItems && status !== 'Holding') ? 'bg-[var(--color-brand-caramel)] scale-110' : 'bg-green-100'}`}>
        <span className={`material-symbols-outlined text-5xl ${isReady || (!hasKitchenItems && status !== 'Holding') ? 'text-white' : 'text-green-700'}`}>
          {isReady || (!hasKitchenItems && status !== 'Holding') ? 'restaurant' : 'check'}
        </span>
      </div>

      <h1 className="text-2xl font-serif mb-2 text-center">
        {isReady || (!hasKitchenItems && status !== 'Holding') ? 'Your order is ready! 🎉' : 'Order sent to Kitchen!'}
      </h1>

      {orderItems.length > 0 && !isReady && status !== 'Served' && hasKitchenItems && (
         <div className="text-sm font-semibold text-[var(--color-brand-caramel)] mb-6 text-center bg-white py-2 px-4 rounded-full shadow-sm border border-[var(--color-brand-caramel)]/20 animate-in fade-in duration-500">
            {orderItems.filter(i => i.item_status === 'served' || i.item_status === 'ready_to_serve').length} of {orderItems.length} items ready
         </div>
      )}

      <p className="text-gray-500 mb-10 text-center text-sm leading-relaxed">
        {isReady || (!hasKitchenItems && status !== 'Holding')
          ? 'Your items are on their way to your table.'
          : 'We\'ll update you as your order progresses. Sit back & relax.'}
      </p>

      {/* Stepper OR Served View */}
      {status === 'Served' ? (
        <div className="w-full max-w-sm mb-12 bg-white rounded-[24px] p-8 shadow-sm border border-[var(--color-brand-caramel)]/10 text-center animate-in zoom-in-95 duration-500">
           <span className="material-symbols-outlined text-6xl text-[var(--color-brand-caramel)] mb-4 animate-bounce">room_service</span>
           <h3 className="text-xl font-serif text-[var(--color-brand-umber)] mb-2">Order Served!</h3>
           <p className="text-gray-500 text-sm">Hope you are enjoying your time. Let us know if you need anything else.</p>
        </div>
      ) : hasKitchenItems ? (
        <div className="w-full max-w-sm mb-12">
          <div className="relative flex justify-between">
            {/* Progress bar */}
            <div className="absolute left-0 top-6 w-full h-[2px] bg-gray-200 -z-10" />
            <div
              className="absolute left-0 top-6 h-[2px] bg-[var(--color-brand-caramel)] -z-10 transition-all duration-700"
              style={{ width: `${(Math.max(0, currentIdx) / (STEPS.length - 1)) * 100}%` }}
            />
            {STEPS.map((step, idx) => {
              const isPast = currentIdx >= idx;
              const isCurrent = currentIdx === idx;
              return (
                <div key={step.value} className="flex flex-col items-center relative z-10 w-24">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 mb-3
                    ${isPast ? 'bg-[var(--color-brand-caramel)] text-white shadow-lg scale-110' : 'bg-white border-2 border-gray-200 text-gray-300'}`}>
                    <span className="material-symbols-outlined text-2xl">
                      {step.icon}
                    </span>
                  </div>
                  <span className={`text-sm font-medium transition-colors duration-500 ${isPast ? 'text-[var(--color-brand-umber)]' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Items List */}
      {items.length > 0 && (
         <div className="w-full bg-white p-5 rounded-[16px] shadow-[var(--shadow-brown-sm)] mb-8">
            <h3 className="text-[var(--color-brand-umber)] font-serif font-semibold mb-3">Your Order</h3>
            <div className="space-y-2">
               {items.map((item, i) => {
                  const oItem = orderItems.find(oi => oi.menu_item_id === item.id);
                  const isItemReady = oItem && (oItem.item_status === 'ready_to_serve' || oItem.item_status === 'served');
                  return (
                    <div key={i} className="flex justify-between items-center text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                       <div>
                          <span className="text-gray-500 mr-2">{item.quantity}x</span>
                          <span className={`font-medium ${isItemReady ? 'text-green-600' : 'text-gray-800'}`}>{item.name}</span>
                          {item.customizations?.length > 0 && (
                             <div className="text-xs text-gray-400 pl-6 mt-0.5">
                                {item.customizations.map(c => `${c.name}: ${c.choice}`).join(', ')}
                             </div>
                          )}
                       </div>
                       {oItem && (
                         <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isItemReady ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                           {oItem.item_status.replace(/_/g, ' ')}
                         </span>
                       )}
                    </div>
                  );
               })}
            </div>
         </div>
      )}

      <div className="w-full space-y-3">
        <Button variant="primary" className="w-full h-12" onClick={() => navigate('/')}>
          Add Another Round
        </Button>
        <Button variant="outline" className="w-full h-12" onClick={() => {
           socket.emit('call_staff', { table_number: localStorage.getItem('vb_table') });
           setShowStaffToast(true);
           setTimeout(() => setShowStaffToast(false), 3000);
        }}>
          <span className="material-symbols-outlined text-lg mr-2">support_agent</span>
          Call Staff
        </Button>
      </div>

      <div className="mt-4 mb-6 w-full">
        <Button
          onClick={() => navigate('/pay', { state: { tabId } })}
          variant="primary"
          className="w-full h-14 bg-[var(--color-brand-umber)] hover:bg-[var(--color-brand-espresso)] shadow-md text-base"
        >
          <span className="material-symbols-outlined mr-2">receipt_long</span>
          Ready to Pay?
        </Button>
      </div>
    </div>
  );
}
