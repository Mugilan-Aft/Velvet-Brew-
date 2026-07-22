import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Button } from '../../components/ui/Button';
import { placeOrder, deleteOrder, updateOrderStatus } from '../../services/api';

export default function CartSummary() {
  const { items, updateQuantity, subtotal, clearCart, tabId, tableNumber } = useCart();
  const navigate = useNavigate();
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState(null);
  
  // Phase 6: Grace Period State
  const [holdingOrder, setHoldingOrder] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  
  // Phase 10: Serve with Kitchen Preference
  const [showPrefModal, setShowPrefModal] = useState(false);

  const tax = subtotal * 0.05; // 5% GST
  const total = subtotal + tax;

  useEffect(() => {
    let timer;
    if (holdingOrder && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (holdingOrder && timeLeft === 0) {
      // Time expired! Auto-confirm locally
      const oId = holdingOrder.id;
      clearCart();
      navigate('/tracking', { state: { tabId, orderId: oId } });
    }
    return () => clearInterval(timer);
  }, [holdingOrder, timeLeft, navigate, clearCart, tabId]);

  const initSendToKitchen = () => {
    const hasReady = items.some(i => i.menuItem.preparation_type === 'ready');
    const hasKitchen = items.some(i => i.menuItem.preparation_type === 'kitchen');
    if (hasReady && hasKitchen) {
       setShowPrefModal(true);
    } else {
       executeSendToKitchen(false);
    }
  };

  const executeSendToKitchen = async (serveWithKitchen) => {
    setShowPrefModal(false);
    if (!tabId) {
      clearCart();
      navigate('/tracking');
      return;
    }

    setIsPlacing(true);
    try {
      const orderItems = items.map(i => ({
        id: i.menuItem.id,
        name: i.menuItem.name,
        quantity: i.quantity,
        price: i.menuItem.price,
        preparation_type: i.menuItem.preparation_type,
        customizations: i.customizations,
      }));

      const newOrder = await placeOrder({
        tab_id: tabId,
        table_number: tableNumber,
        items: orderItems,
        subtotal,
        tax,
        total,
        status: 'Holding',
        serve_ready_with_kitchen: serveWithKitchen
      });
      
      setHoldingOrder(newOrder);
      setTimeLeft(60);
    } catch (e) {
      console.error(e);
      setError(`Failed: ${e.message || 'Could not place order.'}`);
    } finally {
      setIsPlacing(false);
    }
  };

  const cancelHold = async () => {
     if (!holdingOrder) return;
     try {
       await deleteOrder(holdingOrder.id);
       setHoldingOrder(null);
     } catch(e) {
       alert("Failed to cancel order: " + e.message);
     }
  };

  const confirmNow = async () => {
     if (!holdingOrder) return;
     try {
       await updateOrderStatus(holdingOrder.id, 'New');
       const oId = holdingOrder.id;
       clearCart();
       navigate('/tracking', { state: { tabId, orderId: oId } });
     } catch(e) {
       alert("Failed to confirm. Please try again.");
     }
  };

  return (
    <div className="pb-24 min-h-screen flex flex-col bg-[var(--color-brand-cream)]">
      <div className="p-4 bg-white sticky top-0 z-10 border-b border-[var(--color-surface-2)] flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-3">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl">Your Cart</h1>
        {items.length > 0 && (
          <span className="ml-auto text-sm text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="p-4 flex-1">
        {items.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <span className="material-symbols-outlined text-6xl text-[var(--color-surface-4)] mb-4">shopping_bag</span>
            <p className="text-gray-500 mb-6">Your cart feels a bit light.</p>
            <Button variant="ghost" onClick={() => navigate('/')}>Add more items</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => {
              const itemPrice = item.menuItem.price + item.customizations.reduce((s, c) => s + (c.priceAdjustment || 0), 0);
              return (
                <div key={item.cartItemId} className="bg-white p-4 rounded-[16px] shadow-[var(--shadow-brown-sm)] flex gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[1.05rem]">{item.menuItem.name}</h3>
                    {item.customizations.length > 0 && (
                      <div className="text-sm border-l-2 border-[var(--color-brand-caramel)] pl-2 text-gray-500 mt-1 mb-3">
                        {item.customizations.map(c => <div key={c.name}>{c.name}: {c.choice}</div>)}
                      </div>
                    )}
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center bg-[var(--color-brand-cream)] rounded-full">
                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-[var(--color-brand-umber)]">
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span className="w-6 text-center tabular-nums text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-[var(--color-brand-umber)]">
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                      <span className="tabular-nums font-semibold">₹{(itemPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-[8px] overflow-hidden shrink-0">
                    <img src={item.menuItem.image} alt={item.menuItem.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              );
            })}

            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[var(--color-brand-caramel)] font-medium text-sm py-2">
              <span className="material-symbols-outlined text-lg">add_circle</span> Add more items
            </button>

            <div className="bg-white p-5 rounded-[16px] shadow-[var(--shadow-brown-sm)] mt-6">
              <h3 className="font-serif text-lg mb-4">Round Summary</h3>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="tabular-nums">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="tabular-nums">₹{tax.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between border-t border-[var(--color-surface-4)] pt-4 font-semibold text-lg text-[var(--color-brand-umber)]">
                <span>Total</span>
                <span className="tabular-nums">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-[10px] p-3 text-center">{error}</p>
            )}
          </div>
        )}
      </div>

      {items.length > 0 && !holdingOrder && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-gradient-to-t from-white via-white to-white/0 pt-8 pb-6">
          <Button variant="primary" className="w-full h-14" onClick={initSendToKitchen} disabled={isPlacing}>
            {isPlacing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-white/40 rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              `Send to Kitchen • ₹${total.toFixed(0)}`
            )}
          </Button>
        </div>
      )}

      {/* Holding Overlay */}
      {holdingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end p-4">
          <div className="bg-white rounded-[20px] p-5 shadow-2xl relative overflow-hidden max-w-[340px] mx-auto w-full mb-2">
            <div className="absolute top-0 left-0 h-1 bg-[var(--color-brand-caramel)]" style={{ width: `${(timeLeft / 60) * 100}%`, transition: 'width 1s linear' }} />
            
            <div className="text-center mb-4 mt-1">
              <span className="material-symbols-outlined text-3xl text-[var(--color-brand-caramel)] mb-1 animate-bounce">timer</span>
              <h2 className="text-xl font-serif text-[var(--color-brand-umber)] mb-1">Holding Order</h2>
              <p className="text-gray-500 text-[13px] leading-tight">You have {timeLeft} seconds to cancel or edit this order before it is sent to the kitchen.</p>
            </div>
            
            <div className="flex flex-col gap-2.5">
              <Button onClick={confirmNow} variant="primary" className="w-full h-12 text-sm font-medium bg-[var(--color-brand-umber)] hover:bg-[var(--color-brand-espresso)]">
                Send to Kitchen Now
              </Button>
              <Button onClick={cancelHold} variant="outline" className="w-full h-12 text-sm font-medium border-red-200 text-red-500 hover:bg-red-50">
                Cancel & Edit Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preference Overlay */}
      {showPrefModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-[20px] p-5 shadow-2xl max-w-[340px] w-full animate-in zoom-in-95 duration-200">
              <h2 className="text-xl font-serif text-[var(--color-brand-umber)] mb-1">Ready Items</h2>
              <p className="text-gray-500 mb-4 text-[13px] leading-tight">Your order contains items that are ready to serve (like cakes or bottled drinks). How would you like them handled?</p>
              
              <div className="space-y-2.5">
                 <Button onClick={() => executeSendToKitchen(false)} variant="outline" className="w-full h-12 border-[var(--color-brand-caramel)] text-[var(--color-brand-caramel)] hover:bg-[var(--color-brand-cream)] flex justify-start px-4 items-center text-sm font-medium">
                    <span className="material-symbols-outlined mr-3 text-lg">flash_on</span>
                    Serve Immediately
                 </Button>
                 <Button onClick={() => executeSendToKitchen(true)} variant="primary" className="w-full h-12 bg-[var(--color-brand-umber)] hover:bg-[var(--color-brand-espresso)] flex justify-start px-4 items-center text-sm font-medium">
                    <span className="material-symbols-outlined mr-3 text-lg">restaurant</span>
                    Serve with Kitchen items
                 </Button>
              </div>
              <button onClick={() => setShowPrefModal(false)} className="mt-3 text-center w-full text-xs font-semibold text-gray-400 hover:text-gray-600">Cancel</button>
           </div>
        </div>
      )}
    </div>
  );
}
