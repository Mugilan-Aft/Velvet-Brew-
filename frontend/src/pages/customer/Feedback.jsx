import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

import { useCart } from '../../context/CartContext';
import { submitReview } from '../../services/api';

export default function Feedback() {
  const navigate = useNavigate();
  const { tabId, tableNumber } = useCart();
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableTags = ['Great taste', 'Fast service', 'Friendly staff', 'Cozy vibe', 'Too slow'];

  const handleToggleTag = (tag) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async () => {
    if (rating > 0) {
      setSubmitting(true);
      try {
        await submitReview({
          tab_id: tabId,
          table_number: tableNumber,
          rating,
          tags,
          comment
        });
      } catch (err) {
        console.error('Failed to submit review', err);
      }
    }
    navigate('/loyalty'); // Move to loyalty after feedback
  };

  return (
    <div className="pb-32 min-h-screen bg-[var(--color-brand-cream)] flex flex-col items-center pt-16 p-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <span className="material-symbols-outlined text-4xl text-green-700">check_circle</span>
      </div>
      
      <h1 className="text-2xl font-serif mb-2 text-[var(--color-brand-umber)]">Payment Successful!</h1>
      <p className="text-gray-500 mb-10 text-center">How was your experience at Table {tableNumber || '04'} today?</p>

      <div className="bg-white p-6 rounded-[24px] shadow-[var(--shadow-brown-sm)] w-full mb-6">
        <div className="flex justify-center space-x-2 mb-8">
          {[1,2,3,4,5].map(star => (
            <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
              <span className={`material-symbols-outlined text-4xl ${rating >= star ? 'text-[var(--color-brand-caramel)]' : 'text-gray-200'}`} style={{ fontVariationSettings: rating >= star ? "'FILL' 1" : "'FILL' 0" }}>
                star
              </span>
            </button>
          ))}
        </div>

        {rating > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm font-medium mb-3 text-[var(--color-brand-umber)] text-center">What stood out?</p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    tags.includes(tag) 
                    ? 'bg-[var(--color-brand-caramel)] text-white border-[var(--color-brand-caramel)]' 
                    : 'bg-[var(--color-surface-2)] text-[var(--color-brand-umber)] border-transparent'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a little love note (optional)..."
              className="w-full bg-[var(--color-surface-1)] border border-[var(--color-surface-4)] rounded-[12px] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-caramel)] resize-none h-24"
            ></textarea>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-gradient-to-t from-[var(--color-brand-cream)] via-[var(--color-brand-cream)] to-transparent pt-10">
        <Button variant="primary" className="w-full h-14" onClick={handleSubmit}>
          {rating > 0 ? 'Submit & View Rewards' : 'Skip & View Rewards'}
        </Button>
      </div>
    </div>
  );
}
