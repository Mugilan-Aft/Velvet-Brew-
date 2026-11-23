import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStations } from '../../services/api';

export default function KDSBoard() {
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStations()
      .then((data) => {
        setStations(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0604] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center mb-12">
        <span className="material-symbols-outlined text-[var(--color-brand-caramel)] text-6xl mb-4">
          kitchen
        </span>
        <h1 className="font-serif text-4xl text-white mb-2">
          Select Your Station
        </h1>
        <p className="text-white/40">
          Choose a station to view its real-time order queue.
        </p>
      </div>

      {loading ? (
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-48 h-32 bg-white/5 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="w-full max-w-4xl flex flex-col items-center gap-8">
          {/* Combined Split-Screen Hero Card */}
          <div
            onClick={() => navigate('/station/combined')}
            className="w-full cursor-pointer bg-gradient-to-r from-[var(--color-brand-caramel)]/20 via-[#1A0D08] to-[var(--color-brand-caramel)]/20 hover:from-[var(--color-brand-caramel)]/30 hover:to-[var(--color-brand-caramel)]/30 border-2 border-[var(--color-brand-caramel)]/60 hover:border-[var(--color-brand-caramel)] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 shadow-2xl hover:shadow-[0_0_35px_rgba(217,143,78,0.3)] group relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-[var(--color-brand-caramel)]/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-6 text-left z-10">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[var(--color-brand-caramel)]/20 flex items-center justify-center border border-[var(--color-brand-caramel)]/50 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner">
                <span className="material-symbols-outlined text-4xl md:text-5xl text-[var(--color-brand-caramel)]">
                  splitscreen
                </span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-white group-hover:text-[var(--color-brand-caramel)] transition-colors">
                    Combined Station View
                  </h2>
                  <span className="bg-[var(--color-brand-caramel)] text-black text-xs font-extrabold uppercase px-3 py-0.5 rounded-full shadow-sm">
                    ⚡ Split Screen
                  </span>
                </div>
                <p className="text-white/70 text-sm md:text-base max-w-xl leading-relaxed">
                  Eliminate screen switching! View and manage both{' '}
                  <strong className="text-white">Kitchen</strong> and{' '}
                  <strong className="text-white">Ready Stock</strong> queues
                  simultaneously on one divided screen.
                </p>
              </div>
            </div>

            <div className="w-full md:w-auto flex items-center justify-center gap-2 bg-[var(--color-brand-caramel)] hover:bg-[#e59d57] text-black font-bold px-6 py-4 rounded-2xl transition-all duration-200 shadow-lg group-hover:translate-x-1 shrink-0 z-10">
              <span className="text-base">Launch Split Screen</span>
              <span className="material-symbols-outlined font-bold">
                arrow_forward
              </span>
            </div>
          </div>

          <div className="w-full flex items-center gap-4 my-2">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">
              Or Select Individual Station
            </span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          {/* Individual Stations Grid */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-6 w-full ${stations.length <= 2 ? 'max-w-2xl' : 'lg:grid-cols-3 max-w-4xl'}`}
          >
            {stations.map((station) => (
              <button
                key={station.id}
                onClick={() => navigate(`/station/${station.slug}`)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--color-brand-caramel)]/50 rounded-2xl p-8 flex flex-col items-center gap-4 transition-all group"
              >
                <span className="material-symbols-outlined text-4xl text-white/40 group-hover:text-[var(--color-brand-caramel)] transition-colors">
                  {station.slug.includes('tea')
                    ? 'emoji_food_beverage'
                    : station.slug.includes('ready')
                      ? 'inventory_2'
                      : 'soup_kitchen'}
                </span>
                <span className="font-serif text-xl">{station.name}</span>
              </button>
            ))}
          </div>
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
