import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const INITIAL_TABLES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'Bar-1', 'Bar-2'];

const FRONTEND_URL = window.location.origin;

export default function AdminTables() {
  const [tables, setTables] = useState(() => {
    try {
      const stored = localStorage.getItem('vb_tables');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return INITIAL_TABLES;
  });
  
  const [selectedTable, setSelectedTable] = useState(tables[0]);
  const [newTable, setNewTable] = useState('');

  useEffect(() => {
    localStorage.setItem('vb_tables', JSON.stringify(tables));
  }, [tables]);

  const addTable = () => {
    const trimmed = newTable.trim();
    if (!trimmed) return;
    if (tables.includes(trimmed)) return alert('Table already exists');
    setTables(prev => [...prev, trimmed]);
    setNewTable('');
  };

  const removeTable = (table) => {
    if (!window.confirm(`Delete table ${table}?`)) return;
    const next = tables.filter(t => t !== table);
    setTables(next);
    if (selectedTable === table) setSelectedTable(next[0] || '');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div>
          <h2 className="text-2xl font-serif text-white">Table QR Codes</h2>
          <p className="text-white/40 text-sm mt-1">Generate and print QR codes for ordering at tables.</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[var(--color-brand-caramel)] text-white px-4 py-2.5 rounded-[10px] text-sm font-semibold hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          Print Selected
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1 print:hidden bg-white/5 border border-white/8 rounded-[16px] p-4 text-white">
          <h3 className="font-semibold mb-4 text-white/80">Select Table</h3>
          <div className="flex gap-2 mb-4">
            <input 
              value={newTable} 
              onChange={e => setNewTable(e.target.value)} 
              placeholder="Table Name (e.g. Patio-1)"
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm w-full focus:outline-none focus:border-[var(--color-brand-caramel)]"
              onKeyDown={e => e.key === 'Enter' && addTable()}
            />
            <button onClick={addTable} className="bg-[var(--color-brand-caramel)] text-white px-3 py-2 rounded-lg font-bold hover:brightness-110">
               +
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {tables.map(table => (
              <div key={table} className="relative group">
                 <button
                   onClick={() => setSelectedTable(table)}
                   className={`w-full py-2 rounded-[6px] font-semibold transition-all ${
                     selectedTable === table 
                     ? 'bg-[var(--color-brand-caramel)] text-white' 
                     : 'bg-white/5 text-white/50 hover:bg-white/10'
                   }`}
                 >
                   {table}
                 </button>
                 <button 
                    onClick={() => removeTable(table)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center scale-90 hover:scale-110"
                 >
                    ×
                 </button>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2">
           <div className="bg-white rounded-[24px] p-8 flex flex-col items-center justify-center max-w-sm mx-auto shadow-2xl relative overflow-hidden print:shadow-none print:w-[4in] print:h-[6in]">
             <div className="absolute top-0 left-0 right-0 h-4 bg-[var(--color-brand-caramel)]" />
             
             <span className="material-symbols-outlined text-[var(--color-brand-caramel)] text-4xl mb-2 mt-4 block">local_cafe</span>
             <h2 className="text-2xl font-serif text-[var(--color-brand-umber)] mb-1">Velvet Brew</h2>
             <p className="text-gray-500 text-sm mb-8 uppercase tracking-widest text-center">Scan to Order</p>
             
             <div className="p-4 bg-gray-50 rounded-[16px] border border-gray-100 shadow-inner">
               <QRCodeSVG 
                  value={`${FRONTEND_URL}/?table=${selectedTable}`} 
                  size={200}
                  fgColor="#2E1B12"
               />
             </div>
             
             <div className="mt-8 text-center bg-orange-50 w-full py-4 rounded-[12px] border border-orange-100">
               <p className="text-[var(--color-brand-umber)] font-semibold uppercase tracking-widest text-xs">Table Number</p>
               <p className="text-4xl font-serif font-bold text-[var(--color-brand-caramel)]">{selectedTable}</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
