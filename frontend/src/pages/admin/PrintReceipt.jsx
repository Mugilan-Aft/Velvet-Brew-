import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTab } from '../../services/api';

export default function PrintReceipt() {
  const { id } = useParams();
  const [tab, setTab] = useState(null);

  useEffect(() => {
    getTab(id).then(t => {
      setTab(t);
      // Auto print after a tiny delay for render
      setTimeout(() => window.print(), 500);
    }).catch(console.error);
  }, [id]);

  if (!tab) return <div>Loading receipt...</div>;

  const orders = tab.orders || [];
  const subtotal = orders.reduce((acc, o) => acc + Number(o.subtotal), 0);
  const tax = orders.reduce((acc, o) => acc + Number(o.tax), 0);
  const total = orders.reduce((acc, o) => acc + Number(o.total), 0);

  return (
    <div className="bg-white text-black bg-white min-h-screen p-4 flex justify-center print:p-0 print:bg-transparent text-sm">
      <div className="w-[80mm] font-mono leading-tight">
         <div className="text-center mb-4 border-b border-black pb-4 border-dashed">
            <h1 className="text-xl font-bold mb-1">VELVET BREW</h1>
            <p className="text-xs">123 Coffee Lane, Roasters Dist.</p>
            <p className="text-xs">GST: 23AABCV1234M1Z2</p>
         </div>

         <div className="mb-4 text-xs">
            <p>Table: <span className="font-bold">{tab.table_number}</span></p>
            <p>Date: {new Date(tab.created_at).toLocaleString()}</p>
            <p>Recpt: {tab.id.split('-')[0].toUpperCase()}</p>
         </div>

         <div className="border-b border-black border-dashed pb-2 mb-2 font-bold flex justify-between text-xs">
            <span>ITEM</span>
            <span>TOTAL</span>
         </div>

         <div className="mb-4 space-y-2 text-xs">
            {orders.map(order => 
              (order.items || []).map((item, i) => (
                <div key={i} className="flex justify-between items-start">
                   <div className="flex-1 pr-2">
                     <p>{item.quantity}x {item.name}</p>
                     {item.customizations?.length > 0 && (
                        <p className="text-[10px] pl-4 italic">
                          - {item.customizations.map(c => c.choice).join(', ')}
                        </p>
                     )}
                   </div>
                   <div className="tabular-nums">{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))
            )}
         </div>

         <div className="border-t border-black border-dashed pt-2 space-y-1 mb-4 text-xs">
            <div className="flex justify-between">
               <span>Subtotal</span>
               <span className="tabular-nums">{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
               <span>SGST + CGST (5%)</span>
               <span className="tabular-nums">{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-black">
               <span>TOTAL</span>
               <span className="tabular-nums">Rs. {total.toFixed(2)}</span>
            </div>
         </div>

         <div className="text-center text-xs mt-6">
            <p>Payment: {tab.payment_method}</p>
            <p className="mt-4 break-words">Thank you for visiting Velvet Brew!</p>
            <p className="mt-2 text-[10px]">Generate via Admin POS</p>
         </div>
      </div>
    </div>
  );
}
