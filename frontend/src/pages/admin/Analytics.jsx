import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

import { BASE_URL } from '../../services/api';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('30d');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/api/stats/historical?timeframe=${timeframe}`)
      .then(res => res.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [timeframe]);

  const downloadCSV = () => {
    if (!data || !data.timeline) return;
    const header = ['Date', 'Revenue (INR)'];
    const rows = data.timeline.map(t => [t.date, t.revenue]);
    const csvContent = [header, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `velvetbrew_revenue_${timeframe}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-10 animate-pulse text-white/50">Loading historical sales engine...</div>;
  if (error) return <div className="p-10 text-red-500">Error loading analytics: {error}</div>;

  return (
    <div className="p-8 pb-32">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-serif text-white">Historical Analytics</h2>
          <p className="text-white/40 text-sm mt-1">Revenue trends and top selling products.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative z-50">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-between min-w-[140px] bg-white/10 text-white text-sm px-4 py-2 rounded-[10px] border border-white/10 focus:outline-none hover:bg-white/20 transition-colors cursor-pointer"
            >
              <span>{
                timeframe === 'today' ? 'Today' : 
                timeframe === '1w' ? 'Past Week' : 
                timeframe === '30d' ? 'Past 30 Days' : 
                timeframe === '6m' ? 'Past 6 Months' : 
                timeframe === '1y' ? 'Past Year' : 'All Time'
              }</span>
              <span className="material-symbols-outlined text-[18px] ml-2">expand_more</span>
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-[#1A0D08] border border-white/10 rounded-[12px] shadow-xl z-50 overflow-hidden py-1">
                  {[
                    { val: 'today', label: 'Today' },
                    { val: '1w', label: 'Past Week' },
                    { val: '30d', label: 'Past 30 Days' },
                    { val: '6m', label: 'Past 6 Months' },
                    { val: '1y', label: 'Past Year' },
                    { val: 'all', label: 'All Time' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => { setTimeframe(opt.val); setDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 transition-colors text-sm ${
                        timeframe === opt.val ? 'bg-[var(--color-brand-caramel)]/20 text-[var(--color-brand-caramel)] font-semibold' : 'text-white/80 hover:bg-white/5'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button 
             onClick={downloadCSV}
             className="bg-[var(--color-brand-caramel)] text-white text-sm font-semibold px-4 py-2 rounded-[10px] hover:brightness-110 flex items-center gap-2 transition"
          >
             <span className="material-symbols-outlined text-[18px]">download</span>
             Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 border border-white/8 rounded-[16px] p-6">
           <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Total Historic Revenue</h3>
           <p className="text-4xl text-white font-serif tabular-nums">₹{data.totalRevenue?.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-[16px] p-6">
           <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Total Settled Tabs</h3>
           <p className="text-4xl text-white font-serif tabular-nums">{data.totalCompletedTabs?.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--color-brand-cherry)]/10 border border-[var(--color-brand-cherry)]/30 rounded-[16px] p-6">
           <h3 className="text-[var(--color-brand-cherry)] text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
             <span className="material-symbols-outlined text-[14px]">timer</span> Avg Prep Time
           </h3>
           <p className="text-4xl text-white font-serif tabular-nums">{data.avgPrepTimeMins || '--'} min</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/8 rounded-[16px] p-6 mb-8 w-full h-[400px]">
         <h3 className="text-white font-semibold mb-6">Revenue Timeline (30 Days)</h3>
         <ResponsiveContainer width="100%" height="85%">
           <AreaChart data={data.timeline}>
             <defs>
               <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="5%" stopColor="var(--color-brand-caramel)" stopOpacity={0.4}/>
                 <stop offset="95%" stopColor="var(--color-brand-caramel)" stopOpacity={0}/>
               </linearGradient>
             </defs>
             <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
             <XAxis 
                dataKey="date" 
                stroke="#666" 
                tick={{fill: '#666', fontSize: 12}} 
                tickFormatter={(tick) => {
                  const parts = tick.split('-');
                  return `${parts[1]}/${parts[2]}`;
                }}
              />
             <YAxis 
                stroke="#666" 
                tick={{fill: '#666', fontSize: 12}} 
                width={60} 
                tickFormatter={val => `₹${val}`}
              />
             <Tooltip 
               contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
               itemStyle={{ color: 'var(--color-brand-caramel)' }}
             />
             <Area type="monotone" dataKey="revenue" stroke="var(--color-brand-caramel)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
           </AreaChart>
         </ResponsiveContainer>
      </div>

      <div className="bg-white/5 border border-white/8 rounded-[16px] p-6 w-full h-[350px]">
         <h3 className="text-white font-semibold mb-6">Top Sellers (Units Sold)</h3>
         <ResponsiveContainer width="100%" height="85%">
           <BarChart data={data.topItems} layout="vertical" margin={{ left: 50 }}>
             <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
             <XAxis type="number" stroke="#666" />
             <YAxis dataKey="name" type="category" stroke="#fff" tick={{fill: '#aaa', fontSize: 13}} width={150} />
             <Tooltip 
                cursor={{fill: '#ffffff0a'}} 
                contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
             />
             <Bar dataKey="count" fill="var(--color-brand-caramel)" radius={[0, 4, 4, 0]} barSize={25} />
           </BarChart>
         </ResponsiveContainer>
      </div>

    </div>
  );
}
