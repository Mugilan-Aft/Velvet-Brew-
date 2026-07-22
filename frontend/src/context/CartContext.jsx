import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { openTab } from '../services/api';

const CartContext = createContext();

// Derive/persist tabId per session
const getOrCreateSessionToken = () => {
  let token = sessionStorage.getItem('vb_session');
  if (!token) {
    token = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2);
    sessionStorage.setItem('vb_session', token);
  }
  return token;
};

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [tabId, setTabId] = useState(null);

  // Resolve table number from URL param or default
  const tableNumber = new URLSearchParams(window.location.search).get('table') || '04';

  // Open / get tab when context mounts
  useEffect(() => {
    const token = getOrCreateSessionToken();
    openTab({ table_number: tableNumber, session_token: token })
      .then(tab => {
         setTabId(tab.id);
         localStorage.setItem('vb_tab_id', tab.id);
      })
      .catch(err => console.warn('Tab open failed (offline?):', err.message));
  }, [tableNumber]);

  const addToCart = (menuItem, quantity, customizations = []) => {
    const customString = customizations.map(c => c.name + ':' + c.choice).sort().join('|');
    const cartItemId = `${menuItem.id}-${customString}`;

    setItems(prev => {
      const existing = prev.find(i => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map(i => i.cartItemId === cartItemId
          ? { ...i, quantity: i.quantity + quantity }
          : i
        );
      }
      return [...prev, { cartItemId, menuItem, quantity, customizations }];
    });
  };

  const removeFromCart = (cartItemId) => {
    setItems(prev => prev.filter(i => i.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) return removeFromCart(cartItemId);
    setItems(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: newQuantity } : i));
  };

  const clearCart = () => setItems([]);

  const { totalItems, subtotal } = useMemo(() => {
    return items.reduce((acc, item) => {
      let itemPrice = item.menuItem.price;
      item.customizations.forEach(c => { itemPrice += c.priceAdjustment || 0; });
      return {
        totalItems: acc.totalItems + item.quantity,
        subtotal: acc.subtotal + (itemPrice * item.quantity)
      };
    }, { totalItems: 0, subtotal: 0 });
  }, [items]);

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity, clearCart,
      totalItems, subtotal, tabId, tableNumber
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
