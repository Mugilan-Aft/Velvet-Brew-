import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { QRCodeSVG } from 'qrcode.react';
import { getTab, updateTab, createRazorpayOrder } from '../../services/api';

export default function PayNow() {
  const navigate = useNavigate();
  const [method, setMethod] = useState('UPI'); // 'UPI' or 'Cash'
  const [phone, setPhone] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const tabId = location.state?.tabId || localStorage.getItem('vb_tab_id');
  useEffect(() => {
    if (!tabId) {
      navigate('/');
      return;
    }
    getTab(tabId).then(tab => {
      const sum = (tab.orders || []).reduce((acc, order) => acc + Number(order.total), 0);
      setTotalDue(sum);
      setLoading(false);
    }).catch(console.error);
  }, [tabId, navigate]);

  const processTabCloseAndRedirect = async () => {
    await updateTab(tabId, { 
      status: 'Closed', 
      payment_method: method, 
      total_paid: totalDue,
      customer_phone: phone.trim() !== '' ? phone.trim() : null 
    });
    localStorage.removeItem('vb_tab_id'); // Clear session
    navigate('/feedback'); // Route customer to feedback/loyalty view
  };

  const handlePay = async () => {
    setIsPaying(true);
    try {
      if (method === 'UPI') {
        // Create an order string from the server
        const rpOrder = await createRazorpayOrder(totalDue);
        
        const options = {
          key: rpOrder.key_id, // The Key ID passed back from backend
          amount: rpOrder.amount,
          currency: rpOrder.currency,
          name: "Velvet Brew",
          description: "Cafe Order Payment",
          order_id: rpOrder.id,
          handler: async function (response) {
            // Payment success callback
            try {
              await processTabCloseAndRedirect();
            } catch (err) {
              console.error(err);
              alert("Payment recorded by gateway, but order update failed.");
              window.location.reload();
            }
          },
          prefill: {
            contact: phone.trim()
          },
          theme: {
            color: "#D97B29" // var(--color-brand-caramel)
          },
          modal: {
            ondismiss: function() {
              setIsPaying(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setIsPaying(false);
          alert('Payment failed! Reason: ' + response.error.description);
        });
        rzp.open();
        return; // handlePay completes later via handler or ondismiss
      }
      
      // If Cash method selected
      if (method === 'Cash') {
         import('../../services/socket').then(({ socket }) => {
            socket.emit('call_staff', { table_number: localStorage.getItem('vb_table') });
         }).catch(()=>{});
         await processTabCloseAndRedirect();
      }
    } catch (err) {
      console.error(err);
      setIsPaying(false);
      alert('Payment failed. Please try again or ask counter.');
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Tab Total...</div>;

  // Real Indian UPI string format
  const upiString = `upi://pay?pa=merchant@upi&pn=Velvet%20Brew&am=${totalDue}&cu=INR`;

  return (
    <div className="pb-32 min-h-screen bg-[var(--color-brand-cream)] flex flex-col">
      <div className="p-4 bg-white sticky top-0 z-10 border-b border-[var(--color-surface-2)] flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-3">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-serif">Checkout</h1>
      </div>

      <div className="p-6 flex-1">
        <div className="text-center mb-8 mt-2">
          <p className="text-gray-500 font-medium mb-1 uppercase tracking-widest text-xs">Total Tab Amount</p>
          <h2 className="text-5xl font-serif text-[var(--color-brand-umber)] tabular-nums">₹{totalDue.toFixed(0)}</h2>
        </div>

        {/* Loyalty Section */}
        <div className="mb-8 bg-white p-4 rounded-[16px] border border-orange-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
             <span className="material-symbols-outlined text-6xl">loyalty</span>
          </div>
          <h3 className="font-semibold text-lg text-[var(--color-brand-caramel)] flex items-center gap-2 mb-1">
             <span className="material-symbols-outlined text-sm">stars</span> Velvet Beans
          </h3>
          <p className="text-xs text-gray-500 mb-3">Earn 1 Bean per ₹100 spent! Enter your phone number to collect your beans for this order.</p>
          <input
             type="tel"
             placeholder="Mobile Number (Optional)"
             value={phone}
             onChange={(e) => setPhone(e.target.value)}
             className="w-full bg-orange-50 border border-orange-100/50 rounded-[10px] py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-caramel)] text-sm"
          />
        </div>

        <h3 className="font-semibold text-lg mb-4">Payment Method</h3>
        
        <div className="space-y-4 mb-8">
          <Card 
            hoverable 
            className={`p-4 border-2 transition-all ${method === 'UPI' ? 'border-[var(--color-brand-caramel)] bg-orange-50/30 ring-4 ring-orange-50' : 'border-transparent'}`}
            onClick={() => setMethod('UPI')}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[var(--color-brand-caramel)]">
                  <span className="material-symbols-outlined">qr_code_scanner</span>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--color-brand-umber)]">Pay with UPI</h4>
                  <p className="text-xs text-gray-500">GPay, PhonePe, Paytm</p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${method === 'UPI' ? 'border-[var(--color-brand-caramel)]' : 'border-gray-300'}`}>
                {method === 'UPI' && <div className="w-3 h-3 bg-[var(--color-brand-caramel)] rounded-full text-white"></div>}
              </div>
            </div>
          </Card>

          <Card 
            hoverable 
            className={`p-4 border-2 transition-all ${method === 'Cash' ? 'border-[var(--color-brand-caramel)] bg-orange-50/30 ring-4 ring-orange-50' : 'border-transparent'}`}
            onClick={() => setMethod('Cash')}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[var(--color-brand-umber)]">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--color-brand-umber)]">Cash on Counter</h4>
                  <p className="text-xs text-gray-500">Cash or Card on device</p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${method === 'Cash' ? 'border-[var(--color-brand-caramel)]' : 'border-gray-300'}`}>
                {method === 'Cash' && <div className="w-3 h-3 bg-[var(--color-brand-caramel)] rounded-full text-white"></div>}
              </div>
            </div>
          </Card>
        </div>

        {method === 'UPI' && (
          <div className="bg-white rounded-[20px] p-6 text-center shadow-sm border border-gray-100 flex flex-col items-center">
             <div className="w-16 h-16 bg-[var(--color-brand-caramel)]/20 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px] text-[var(--color-brand-caramel)]">security</span>
             </div>
             <p className="text-sm font-semibold mb-2 opacity-70 uppercase tracking-widest text-gray-500">Secure Payment Checkout</p>
             <p className="text-xs text-gray-400 mt-2 px-4 leading-relaxed">Razorpay supports all major UPI Apps including Google Pay, PhonePe, and Paytm, as well as Credit & Debit networking.</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t border-[var(--color-surface-4)] pb-8 pt-6">
        {method === 'Cash' && (
          <p className="text-sm text-center text-gray-500 mb-4">Please head to the counter to complete your payment.</p>
        )}
        <Button 
          variant="primary" 
          className="w-full h-14 relative"
          onClick={handlePay}
          disabled={isPaying}
        >
          {isPaying ? (
             <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin">sync</span>
                {method === 'UPI' ? 'Awaiting bank confirmation...' : 'Generating Bill...'}
             </span>
          ) : (
            method === 'UPI' ? 'Pay Securely via UPI' : 'Generate Bill'
          )}
        </Button>
      </div>
    </div>
  );
}
