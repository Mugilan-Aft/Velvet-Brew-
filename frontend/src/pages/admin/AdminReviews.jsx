import React, { useState, useEffect } from 'react';
import { getReviews } from '../../services/api';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getReviews()
      .then(setReviews)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`material-symbols-outlined text-[18px] ${i <= rating ? 'text-[var(--color-brand-caramel)]' : 'text-white/20'}`} style={{ fontVariationSettings: i <= rating ? "'FILL' 1" : "'FILL' 0" }}>
          star
        </span>
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  const getSentimentVariant = (rating) => {
    if (rating >= 4) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (rating === 3) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <div className="p-8 pb-32 min-h-screen">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-serif text-white">Customer Reviews</h2>
          <p className="text-white/40 text-sm mt-1">Feedback provided by customers after checkout.</p>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded-[16px] animate-pulse" />)}
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-[16px] text-red-400 text-sm">
          Failed to load reviews. Did you create the `reviews` table in Supabase via `phase7_reviews.sql`? Error: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {reviews.length === 0 ? (
             <div className="py-20 text-center flex flex-col items-center border border-white/5 bg-white/5 rounded-[24px]">
               <span className="material-symbols-outlined text-5xl text-white/20 mb-4">reviews</span>
               <p className="text-white/50 text-sm">No reviews yet. Check back soon!</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map(review => (
                <div key={review.id} className="bg-white/5 border border-white/8 rounded-[16px] p-6 hover:bg-white/10 transition-colors flex flex-col items-start gap-4 h-full">
                  <div className="flex justify-between items-start w-full">
                     <div>
                       <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase flex items-center ${getSentimentVariant(review.rating)}`}>
                         Table {review.table_number || 'N/A'}
                       </span>
                     </div>
                     <span className="text-xs text-white/30">
                       {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                     </span>
                  </div>
                  
                  {renderStars(review.rating)}
                  
                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                       {review.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-white/10 text-white/70 rounded-full text-[10px] font-medium border border-white/10">
                            {tag}
                          </span>
                       ))}
                    </div>
                  )}

                  {review.comment && (
                    <p className="text-sm text-white/90 leading-relaxed italic border-l-2 border-white/10 pl-3">
                      "{review.comment}"
                    </p>
                  )}
                  
                  {!review.comment && !review.tags?.length && (
                    <p className="text-sm text-white/30 italic">No additional feedback provided.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
