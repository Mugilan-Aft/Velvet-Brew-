import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

// Mock loyalty state
const CUSTOMER_DATA = {
  name: "Brew Lover",
  points: 450,
  nextReward: 500,
  history: [
    { id: '1', date: 'Today', points: '+57', desc: 'Table 04 Visit' },
    { id: '2', date: 'Oct 14', points: '+120', desc: 'Bean bag purchase' },
  ]
};

export default function Loyalty() {
  const navigate = useNavigate();
  const progressPercent = Math.min(100, (CUSTOMER_DATA.points / CUSTOMER_DATA.nextReward) * 100);

  return (
    <div className="pb-32 min-h-screen bg-[var(--color-brand-cream)] flex flex-col">
      <div className="bg-[var(--color-brand-espresso)] text-white px-4 py-6 rounded-b-[24px] shadow-md relative overflow-hidden">
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-[var(--color-brand-espresso-light)] rounded-full opacity-50"></div>
        <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 bg-[var(--color-brand-cherry)] rounded-full opacity-20"></div>
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <button onClick={() => navigate('/')} className="hover:text-[var(--color-brand-caramel)]">
            <span className="material-symbols-outlined mb-1">close</span>
          </button>
          <span className="text-sm font-semibold tracking-widest uppercase">My Profile</span>
        </div>
        
        <div className="flex flex-col items-center relative z-10 mb-4">
          <div className="relative w-36 h-36 flex flex-col items-center justify-center">
            {/* SVG Ring Progress */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="72" cy="72" r="66" className="text-white/20 stroke-current" strokeWidth="8" fill="none" />
              <circle 
                cx="72" cy="72" r="66" 
                className="text-[var(--color-brand-caramel)] stroke-current transition-all duration-1000 ease-out" 
                strokeWidth="8" 
                fill="none" 
                strokeDasharray="414" 
                strokeDashoffset={414 - (414 * progressPercent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-4xl font-serif text-white tabular-nums drop-shadow-md">{CUSTOMER_DATA.points}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/80 mt-1">Beans</span>
          </div>
          <p className="mt-4 text-sm text-[var(--color-brand-cream-light)] drop-shadow-sm font-medium">
            {CUSTOMER_DATA.nextReward - CUSTOMER_DATA.points} beans away from a free coffee!
          </p>
        </div>
      </div>

      <div className="p-4 flex-1 mt-2">
        <div className="bg-white p-5 rounded-[16px] shadow-[var(--shadow-brown-sm)] mb-6 flex items-center justify-between border border-[var(--color-surface-2)]">
          <div>
            <h3 className="font-semibold text-[var(--color-brand-umber)] mb-1">Refer a Friend</h3>
            <p className="text-xs text-gray-500">Give a free coffee, get 100 beans!</p>
          </div>
          <button className="bg-[var(--color-surface-2)] text-[var(--color-brand-caramel)] w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--color-brand-caramel)] hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[20px]">ios_share</span>
          </button>
        </div>

        <h3 className="font-serif text-lg mb-4 text-[var(--color-brand-umber)] px-1">Bean History</h3>
        <div className="space-y-3">
          {CUSTOMER_DATA.history.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-[12px] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{item.desc}</p>
                <p className="text-xs text-gray-500 mt-1">{item.date}</p>
              </div>
              <span className="text-[var(--color-brand-caramel)] font-bold tabular-nums pl-4">{item.points}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-gradient-to-t from-[var(--color-brand-cream)] via-[var(--color-brand-cream)] to-transparent pt-10 pb-6">
        <Button variant="primary" className="w-full h-14" onClick={() => navigate('/')}>
          Back to Menu
        </Button>
      </div>
    </div>
  );
}
