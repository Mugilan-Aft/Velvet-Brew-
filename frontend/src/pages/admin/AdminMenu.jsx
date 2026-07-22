import React, { useState, useEffect, useRef } from 'react';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem, getCategories, createCategory, deleteCategory, uploadImage, getStations, BASE_URL } from '../../services/api';

const DIETARY_TAGS = ['none', 'veg', 'non-veg', 'vegan'];
const PREP_TYPES = ['kitchen', 'ready'];
const EMPTY_FORM = {
  name: '', description: '', price: '', category: '',
  image: '', in_stock: true, preparation_type: 'kitchen', station_id: '', dietary_tag: 'veg', customization_options: '[]'
};

export default function AdminMenu() {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  
  const [showCatMod, setShowCatMod] = useState(false);
  const [newCat, setNewCat] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  
  const [catOpen, setCatOpen] = useState(false);
  const [dietOpen, setDietOpen] = useState(false);
  const [prepOpen, setPrepOpen] = useState(false);
  const [stationOpen, setStationOpen] = useState(false);
  
  const fileInputRef = useRef(null);

  const load = () => {
    setLoading(true);
    Promise.all([getMenu(), getCategories(), getStations()]).then(([m, c, s]) => {
      setMenu(m);
      setCategories(c.map(cat => cat.name));
      setStations(s);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, category: categories[0] || '', station_id: stations[0]?.id || '' });
    setEditId(null);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({
      name: item.name, description: item.description || '', price: item.price,
      category: item.category, image: item.image || '', in_stock: item.in_stock,
      preparation_type: item.preparation_type || 'kitchen',
      station_id: item.station_id || stations[0]?.id || '',
      dietary_tag: item.dietary_tag, customization_options: JSON.stringify(item.customization_options || [], null, 2)
    });
    setEditId(item.id);
    setError(null);
    setShowForm(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSaving(true);
      const { url } = await uploadImage(file);
      const fullUrl = `${BASE_URL}${url}`;
      setForm(f => ({ ...f, image: fullUrl }));
    } catch (err) {
      setError('Image upload failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCat) return;
    await createCategory({ name: newCat }).catch(() => alert('Category exists or error'));
    setNewCat('');
    const c = await getCategories();
    setCategories(c.map(cat => cat.name));
  };
  
  const handleDelCategory = async (catName) => {
    if (!window.confirm(`Delete category "${catName}"? Make sure no items are using it.`)) return;
    const catsData = await getCategories();
    const cObj = catsData.find(c => c.name === catName);
    if(cObj) {
      await deleteCategory(cObj.id);
      load();
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) {
      setError('Name, price and category are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let opts = [];
      try { opts = JSON.parse(form.customization_options || '[]'); } catch { }
      const payload = {
        name: form.name, description: form.description, price: Number(form.price),
        category: form.category, image: form.image, in_stock: form.in_stock,
        preparation_type: form.preparation_type, station_id: form.station_id, dietary_tag: form.dietary_tag, customization_options: opts,
      };
      if (editId) {
        await updateMenuItem(editId, payload);
      } else {
        await createMenuItem(payload);
      }
      setShowForm(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    await deleteMenuItem(id).catch(console.error);
    load();
  };

  const toggleStock = async (item) => {
    await updateMenuItem(item.id, { in_stock: !item.in_stock }).catch(console.error);
    setMenu(prev => prev.map(m => m.id === item.id ? { ...m, in_stock: !m.in_stock } : m));
  };

  const allFilteredCategories = ['All', ...categories];
  const filtered = filter === 'All' ? menu : menu.filter(i => i.category === filter);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-serif text-white">Menu Management</h2>
          <p className="text-white/40 text-sm mt-1">{menu.length} items total</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowCatMod(true)}
            className="flex items-center gap-2 bg-white/10 text-white px-4 py-2.5 rounded-[10px] text-sm font-semibold hover:bg-white/20 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">category</span>
            Categories
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[var(--color-brand-caramel)] text-white px-4 py-2.5 rounded-[10px] text-sm font-semibold hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Item
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {allFilteredCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === cat ? 'bg-[var(--color-brand-caramel)] text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-[160px] bg-white/5 rounded-[16px] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className={`bg-white/5 border border-white/8 rounded-[16px] overflow-hidden transition-all ${!item.in_stock ? 'opacity-50' : ''}`}>
              <div className="h-36 relative overflow-hidden">
                <img src={item.image || 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                  <span className="text-white font-semibold text-sm leading-tight">{item.name}</span>
                  <span className="text-white font-semibold tabular-nums text-sm">₹{item.price}</span>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">{item.category}</span>
                <div className="flex items-center gap-2 ml-auto">
                  {/* Stock toggle */}
                  <button
                    onClick={() => toggleStock(item)}
                    title={item.in_stock ? 'Mark Out of Stock' : 'Mark In Stock'}
                    className={`text-xs px-2 py-1 rounded transition-all ${item.in_stock ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                  >
                    {item.in_stock ? 'In Stock' : 'Out of Stock'}
                  </button>
                  <button onClick={() => openEdit(item)} className="text-white/40 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-white/40 hover:text-red-400 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Categories Manager Modal */}
      {showCatMod && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-[#1A0D08] border border-white/10 rounded-[20px] w-full max-w-sm overflow-auto">
             <div className="p-6 border-b border-white/8 flex items-center justify-between">
               <h3 className="text-xl font-serif text-white">Categories</h3>
               <button onClick={() => setShowCatMod(false)} className="text-white/40 hover:text-white">
                 <span className="material-symbols-outlined">close</span>
               </button>
             </div>
             <div className="p-6">
                <div className="flex gap-2 mb-6">
                   <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New Category Name..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-[10px] px-4 py-2 text-white text-sm focus:outline-none" />
                   <button onClick={handleAddCategory} className="bg-[var(--color-brand-caramel)] text-white px-4 rounded-[10px] hover:brightness-110">Add</button>
                </div>
                <div className="space-y-2">
                   {categories.map(c => (
                      <div key={c} className="flex justify-between items-center bg-white/5 p-3 rounded-[10px] border border-white/5">
                         <span className="text-white text-sm">{c}</span>
                         <button onClick={() => handleDelCategory(c)} className="text-red-400 hover:text-red-300">
                           <span className="material-symbols-outlined text-[16px]">delete</span>
                         </button>
                      </div>
                   ))}
                </div>
             </div>
           </div>
         </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A0D08] border border-white/10 rounded-[20px] w-full max-w-lg overflow-auto max-h-[90vh]">
            <div className="p-6 border-b border-white/8 flex items-center justify-between">
              <h3 className="text-xl font-serif text-white">{editId ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-[8px]">{error}</p>}

              <label className="block">
                <span className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Name *</span>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-brand-caramel)] text-sm" />
              </label>

              <label className="block">
                <span className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Description</span>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-brand-caramel)] text-sm resize-none" />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Price (₹) *</span>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-brand-caramel)] text-sm" />
                </label>
                <div className="block relative">
                  <span className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Category *</span>
                  <button 
                    onClick={() => setCatOpen(!catOpen)}
                    className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--color-brand-caramel)] hover:bg-white/10 transition"
                  >
                    <span>{form.category || 'Select...'}</span>
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </button>
                  {catOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setCatOpen(false)} />
                      <div className="absolute left-0 right-0 mt-1 bg-[#1A0D08] border border-white/10 rounded-[10px] shadow-xl z-50 overflow-hidden py-1 max-h-48 overflow-y-auto">
                        {categories.map(c => (
                          <button key={c} onClick={() => { setForm(f => ({ ...f, category: c })); setCatOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${form.category===c ? 'bg-[var(--color-brand-caramel)]/20 text-[var(--color-brand-caramel)]' : 'text-white hover:bg-white/5'}`}>{c}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="block relative">
                  <span className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Dietary Tag</span>
                  <button 
                    onClick={() => setDietOpen(!dietOpen)}
                    className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--color-brand-caramel)] hover:bg-white/10 transition capitalize"
                  >
                    <span>{form.dietary_tag}</span>
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </button>
                  {dietOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDietOpen(false)} />
                      <div className="absolute left-0 right-0 mt-1 bg-[#1A0D08] border border-white/10 rounded-[10px] shadow-xl z-50 overflow-hidden py-1 max-h-48 overflow-y-auto">
                        {DIETARY_TAGS.map(t => (
                          <button key={t} onClick={() => { setForm(f => ({ ...f, dietary_tag: t })); setDietOpen(false); }} className={`w-full text-left capitalize px-4 py-2.5 text-sm transition-colors ${form.dietary_tag===t ? 'bg-[var(--color-brand-caramel)]/20 text-[var(--color-brand-caramel)]' : 'text-white hover:bg-white/5'}`}>{t}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 pt-6 cursor-pointer">
                    <div
                      onClick={() => setForm(f => ({ ...f, in_stock: !f.in_stock }))}
                      className={`w-9 h-5 rounded-full relative transition-all ${form.in_stock ? 'bg-green-500' : 'bg-white/20'}`}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${form.in_stock ? 'left-[20px]' : 'left-[3px]'}`} />
                    </div>
                    <span className="text-white/70 text-xs">In Stock</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="block relative">
                   <span className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Station *</span>
                   <button 
                     onClick={() => setStationOpen(!stationOpen)}
                     className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--color-brand-caramel)] hover:bg-white/10 transition"
                   >
                     <span>{stations.find(s => s.id === form.station_id)?.name || 'Select...'}</span>
                     <span className="material-symbols-outlined text-[18px]">expand_more</span>
                   </button>
                   {stationOpen && (
                     <>
                       <div className="fixed inset-0 z-40" onClick={() => setStationOpen(false)} />
                       <div className="absolute left-0 right-0 mt-1 bg-[#1A0D08] border border-white/10 rounded-[10px] shadow-xl z-50 overflow-hidden py-1 max-h-48 overflow-y-auto">
                         {stations.map(s => (
                           <button key={s.id} onClick={() => { setForm(f => ({ ...f, station_id: s.id })); setStationOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${form.station_id===s.id ? 'bg-[var(--color-brand-caramel)]/20 text-[var(--color-brand-caramel)]' : 'text-white hover:bg-white/5'}`}>{s.name}</button>
                         ))}
                       </div>
                     </>
                   )}
                </div>
                  
                <div className="block relative">
                    <span className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Prep Type</span>
                    <button 
                      onClick={() => setPrepOpen(!prepOpen)}
                      className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--color-brand-caramel)] hover:bg-white/10 transition"
                    >
                      <span>{form.preparation_type}</span>
                      <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </button>
                    {prepOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setPrepOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1 bg-[#1A0D08] border border-white/10 rounded-[10px] shadow-xl z-50 overflow-hidden py-1 max-h-48 overflow-y-auto">
                          {PREP_TYPES.map(t => (
                            <button key={t} onClick={() => { setForm(f => ({ ...f, preparation_type: t })); setPrepOpen(false); }} className={`w-full text-left capitalize px-4 py-2.5 text-sm transition-colors ${form.preparation_type===t ? 'bg-[var(--color-brand-caramel)]/20 text-[var(--color-brand-caramel)]' : 'text-white hover:bg-white/5'}`}>{t}</button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
              </div>


              <label className="block mt-4">
                <span className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Item Image</span>
                <div className="flex gap-3 items-center">
                   <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-white/50 text-sm cursor-pointer hover:bg-white/10 transition flex justify-between items-center"
                   >
                     {form.image ? 'Image Uploaded' : 'Browse Files...'}
                     <span className="material-symbols-outlined text-[18px]">upload</span>
                   </div>
                   {form.image && <img src={form.image} className="w-10 h-10 rounded object-cover" />}
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
              </label>


            </div>

            <div className="p-6 border-t border-white/8 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-[10px] border border-white/10 text-white/60 hover:text-white text-sm transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-[10px] bg-[var(--color-brand-caramel)] text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-60">
                {saving ? 'Saving...' : (editId ? 'Save Changes' : 'Add to Menu')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
