const MENU_ITEMS = [
  {
    name: 'Velvet Pour Over',
    description: 'Our signature single-origin Ethiopian roast, slow-dripped.',
    price: 180, category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=400&q=80',
    in_stock: true, dietary_tag: 'vegan',
    customization_options: [
      { name: 'Size', choices: [{ name: 'Regular', priceAdjustment: 0 }, { name: 'Large', priceAdjustment: 40 }] },
      { name: 'Milk Type', choices: [{ name: 'None', priceAdjustment: 0 }, { name: 'Oat Milk', priceAdjustment: 50 }, { name: 'Almond Milk', priceAdjustment: 50 }] }
    ]
  },
  {
    name: 'Iced Caramel Macchiato',
    description: 'Espresso with vanilla syrup, milk and ice, topped with caramel drizzle.',
    price: 240, category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1461023058943-0708f52992e1?auto=format&fit=crop&w=400&q=80',
    in_stock: true, dietary_tag: 'veg',
    customization_options: [
      { name: 'Size', choices: [{ name: 'Regular', priceAdjustment: 0 }, { name: 'Large', priceAdjustment: 50 }] },
      { name: 'Sweetness', choices: [{ name: 'Regular', priceAdjustment: 0 }, { name: 'Less Sweet', priceAdjustment: 0 }] }
    ]
  },
  {
    name: 'Almond Croissant',
    description: 'Flaky pastry filled with sweet almond frangipane.',
    price: 150, category: 'Pastries',
    image: 'https://images.unsplash.com/photo-1579624535316-860e6e7fb636?auto=format&fit=crop&w=400&q=80',
    in_stock: true, dietary_tag: 'veg', customization_options: []
  },
  {
    name: 'Matcha Latte',
    description: 'Ceremonial grade matcha whisked with steamed oat milk.',
    price: 220, category: 'Tea',
    image: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=400&q=80',
    in_stock: true, dietary_tag: 'vegan',
    customization_options: [
      { name: 'Size', choices: [{ name: 'Regular', priceAdjustment: 0 }, { name: 'Large', priceAdjustment: 40 }] },
      { name: 'Sweetness', choices: [{ name: 'Regular', priceAdjustment: 0 }, { name: 'Less Sweet', priceAdjustment: 0 }, { name: 'Unsweetened', priceAdjustment: 0 }] }
    ]
  },
  {
    name: 'Classic Chocolate Chip Cookie',
    description: 'Warm, gooey cookie baked fresh every hour.',
    price: 90, category: 'Pastries',
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=80',
    in_stock: true, dietary_tag: 'veg', customization_options: []
  },
  {
    name: 'Cold Brew Concentrate',
    description: 'Smooth 18-hour cold brew served over ice.',
    price: 200, category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1461023058943-0708f52992e1?auto=format&fit=crop&w=400&q=80',
    in_stock: true, dietary_tag: 'vegan',
    customization_options: [
      { name: 'Add Milk', choices: [{ name: 'Black', priceAdjustment: 0 }, { name: 'With Milk', priceAdjustment: 30 }] }
    ]
  },
  {
    name: 'Masala Chai',
    description: 'Traditional spiced brew with ginger, cardamom and cinnamon.',
    price: 120, category: 'Tea',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80',
    in_stock: true, dietary_tag: 'veg',
    customization_options: [
      { name: 'Milk', choices: [{ name: 'Full Cream', priceAdjustment: 0 }, { name: 'Oat Milk', priceAdjustment: 30 }] }
    ]
  },
  {
    name: 'Avocado Toast',
    description: 'Sourdough with smashed avocado, cherry tomatoes and a poached egg.',
    price: 280, category: 'Food',
    image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?auto=format&fit=crop&w=400&q=80',
    in_stock: true, dietary_tag: 'veg',
    customization_options: [
      { name: 'Egg', choices: [{ name: 'With Egg', priceAdjustment: 0 }, { name: 'Without Egg', priceAdjustment: -30 }] }
    ]
  }
];

async function seed() {
  console.log('Sending items to local API...');
  for (const item of MENU_ITEMS) {
    try {
      const res = await fetch('http://localhost:3000/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        console.log(`✅ Inserted: ${item.name}`);
      } else {
        console.error(`❌ Failed: ${item.name}`, await res.text());
      }
    } catch (e) {
      console.error(`❌ Fetch error for ${item.name}: ${e.message}`);
    }
  }
}

seed();
