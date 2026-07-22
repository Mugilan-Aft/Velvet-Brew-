import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Button } from '../../components/ui/Button';
import { getMenu } from '../../services/api';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState({});

  useEffect(() => {
    getMenu().then(menu => {
      const found = menu.find(i => i.id === id);
      setItem(found || null);
      if (found?.customization_options?.length) {
        const init = {};
        found.customization_options.forEach(opt => { init[opt.name] = opt.choices[0]; });
        setSelections(init);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="pb-24 bg-white min-h-screen">
        <div className="h-64 bg-[var(--color-surface-2)] animate-pulse" />
        <div className="p-4 space-y-4">
          <div className="h-8 bg-[var(--color-surface-2)] rounded animate-pulse w-3/4" />
          <div className="h-4 bg-[var(--color-surface-2)] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!item) return (
    <div className="p-4 min-h-screen flex flex-col items-center justify-center">
      <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">no_food</span>
      <p className="text-gray-500">Item not found</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-[var(--color-brand-caramel)] font-medium">Go back</button>
    </div>
  );

  let currentPrice = item.price;
  Object.values(selections).forEach(choice => {
    if (choice?.priceAdjustment) currentPrice += choice.priceAdjustment;
  });

  const handleAdd = () => {
    const formattedCustomizations = Object.entries(selections).map(([key, val]) => ({
      name: key,
      choice: val.name,
      priceAdjustment: val.priceAdjustment
    }));
    addToCart(item, quantity, formattedCustomizations);
    navigate(-1);
  };

  const opts = item.customization_options || [];

  return (
    <div className="pb-24 bg-white min-h-screen">
      <div className="relative h-64">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/60 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-brand-umber)]"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        {item.dietary_tag !== 'none' && (
          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[11px] font-bold uppercase ${item.dietary_tag === 'non-veg' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {item.dietary_tag}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl flex-1 pr-4">{item.name}</h1>
          <span className="text-xl font-semibold tabular-nums text-[var(--color-brand-caramel)]">₹{item.price}</span>
        </div>
        <p className="text-gray-500 mb-6 leading-relaxed text-sm">{item.description}</p>

        {opts.map(opt => (
          <div key={opt.name} className="mb-6 flex flex-col items-center">
            <h3 className="font-semibold mb-3 text-[var(--color-brand-umber)] text-center">{opt.name}</h3>
            <div className="space-y-2 w-full max-w-[280px]">
              {opt.choices.map(choice => (
                <label
                  key={choice.name}
                  className={`flex items-center justify-between px-3 py-1.5 border-[1.5px] rounded-lg cursor-pointer transition-all ${
                    selections[opt.name]?.name === choice.name
                      ? 'border-[var(--color-brand-caramel)] bg-orange-50/50'
                      : 'border-[var(--color-surface-4)] hover:border-[var(--color-brand-caramel)]/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                     <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center ${
                       selections[opt.name]?.name === choice.name ? 'border-[var(--color-brand-caramel)]' : 'border-gray-300'
                     }`}>
                        {selections[opt.name]?.name === choice.name && <div className="w-2 h-2 bg-[var(--color-brand-caramel)] rounded-full" />}
                     </div>
                     <span className={`text-sm ${selections[opt.name]?.name === choice.name ? 'text-[var(--color-brand-umber)] font-medium' : 'text-gray-600'}`}>
                       {choice.name}
                     </span>
                  </div>
                  {choice.priceAdjustment > 0 && <span className="text-gray-400 text-xs font-medium">+₹{choice.priceAdjustment}</span>}
                  {choice.priceAdjustment < 0 && <span className="text-sm text-green-600">−₹{Math.abs(choice.priceAdjustment)}</span>}
                  <input
                    type="radio"
                    name={opt.name}
                    value={choice.name}
                    checked={selections[opt.name]?.name === choice.name}
                    onChange={() => setSelections(s => ({ ...s, [opt.name]: choice }))}
                    className="sr-only"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-center space-x-6 mt-8 mb-4">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined">remove</span>
          </button>
          <span className="text-xl tabular-nums font-semibold w-6 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t border-[var(--color-surface-2)]">
        <Button variant="primary" className="w-full flex justify-between h-14" onClick={handleAdd}>
          <span>Add to Cart ({quantity})</span>
          <span className="tabular-nums">₹{currentPrice * quantity}</span>
        </Button>
      </div>
    </div>
  );
}
