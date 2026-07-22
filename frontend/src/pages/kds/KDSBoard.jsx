import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStations } from '../../services/api';

export default function KDSBoard() {
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStations().then(data => {
      setStations(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0604] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center mb-12">
        <span className="material-symbols-outlined text-[var(--color-brand-caramel)] text-6xl mb-4">kitchen</span>
        <h1 className="font-serif text-4xl text-white mb-2">Select Your Station</h1>
        <p className="text-white/40">Choose a station to view its real-time order queue.</p>
      </div>

      {loading ? (
        <div className="flex gap-4">
           {[1,2,3].map(i => <div key={i} className="w-48 h-32 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 w-full ${stations.length <= 2 ? 'max-w-2xl' : 'lg:grid-cols-3 max-w-4xl'}`}>
          {stations.map(station => (
            <button
              key={station.id}
              onClick={() => navigate(`/station/${station.slug}`)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--color-brand-caramel)]/50 rounded-2xl p-8 flex flex-col items-center gap-4 transition-all group"
            >
              <span className="material-symbols-outlined text-4xl text-white/40 group-hover:text-[var(--color-brand-caramel)] transition-colors">
                {station.slug.includes('tea') ? 'emoji_food_beverage' : station.slug.includes('ready') ? 'inventory_2' : 'soup_kitchen'}
              </span>
              <span className="font-serif text-xl">{station.name}</span>
            </button>
          ))}
        </div>
      )}
      
      <button 
        onClick={() => navigate('/admin')}
        className="mt-16 text-white/40 hover:text-white text-sm flex items-center gap-2 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Admin Dashboard
      </button>
    </div>
  );
}
