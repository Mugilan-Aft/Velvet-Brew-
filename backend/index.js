import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { supabase } from './supabase.js';
import Razorpay from 'razorpay';

dotenv.config();
// Node server restarted to load Razorpay keys


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Setup static uploads folder
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

app.get('/api/inventory', async (req, res) => {
  const { data, error } = await supabase.from('inventory').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch('/api/inventory/:id', async (req, res) => {
  const { data, error } = await supabase.from('inventory').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/categories', async (req, res) => {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/categories', async (req, res) => {
  const { data, error } = await supabase.from('categories').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.delete('/api/categories/:id', async (req, res) => {
  const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }
});

// ─────────────────────────────────────────────
//  SOCKET.IO
// ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Clients join rooms: 'kitchen', 'admin', or 'customer-{tabId}'
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ─────────────────────────────────────────────
//  HEALTH
// ─────────────────────────────────────────────
app.get('/', (req, res) => res.send('Velvet Brew API'));

// ==========================================
// TEMPORARY SEED ROUTE (Phase 4 Analytics)
// ==========================================
app.post('/api/seed-history', async (req, res) => {
  try {
    const { menu } = req.body;
    const now = new Date();
    
    for (let i = 0; i < 30; i++) { // Past 30 days
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const numTabs = Math.floor(Math.random() * 20) + 5; // 5-25 tabs a day
      for (let j = 0; j < numTabs; j++) {
        const h = Math.floor(Math.random() * 12) + 8; // 8am to 8pm
        date.setHours(h, Math.floor(Math.random() * 60), 0);
        
        let tabTotal = 0;
        const items = [];
        const numItems = Math.floor(Math.random() * 4) + 1;
        for (let k = 0; k < numItems; k++) {
          const menuItem = menu[Math.floor(Math.random() * menu.length)];
          const qty = Math.floor(Math.random() * 2) + 1;
          items.push({ name: menuItem.name, quantity: qty, price: menuItem.price });
          tabTotal += (menuItem.price * qty);
        }

        // Insert Tab
        const { data: tab } = await supabase.from('tabs').insert({
          table_number: Math.floor(Math.random() * 10) + 1,
          session_token: 'seed_' + Date.now() + '_' + i + '_' + j,
          status: 'Closed',
          payment_method: Math.random() > 0.5 ? 'UPI' : 'Cash',
          total_paid: tabTotal,
          created_at: date.toISOString()
        }).select().single();

        if (tab) {
          // Insert Order
          await supabase.from('orders').insert({
            tab_id: tab.id,
            table_number: tab.table_number,
            items: items,
            status: 'Served',
            subtotal: tabTotal * 0.95,
            tax: tabTotal * 0.05,
            total: tabTotal,
            created_at: date.toISOString()
          });
        }
      }
    }
    res.json({ success: true, message: 'Seeded 30 days of data' });
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

// ─────────────────────────────────────────────
//  RAZORPAY CHECKOUT
// ─────────────────────────────────────────────
app.post('/api/razorpay/order', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
       return res.status(500).json({ error: 'Razorpay keys missing from .env' });
    }
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    
    const options = {
      amount: Math.round(Number(amount) * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: "receipt_" + Date.now()
    };
    
    const order = await instance.orders.create(options);
    res.json({ ...order, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('Razorpay Error:', error);
    res.status(500).json({ error: error.message || 'Payment initiation failed' });
  }
});

// ─────────────────────────────────────────────
//  MENU
// ─────────────────────────────────────────────
app.get('/api/stats/historical', async (req, res) => {
  const { timeframe } = req.query;
  let q = supabase
    .from('tabs')
    .select('status, total_paid, created_at')
    .eq('status', 'Closed')
    .order('created_at', { ascending: true });

  let oQ = supabase
    .from('orders')
    .select('items, created_at, served_at')
    .eq('status', 'Served');

  if (timeframe && timeframe !== 'all') {
    const now = new Date();
    if (timeframe === 'today') now.setHours(0,0,0,0);
    else if (timeframe === '1w') now.setDate(now.getDate() - 7);
    else if (timeframe === '1m') now.setMonth(now.getMonth() - 1);
    else if (timeframe === '6m') now.setMonth(now.getMonth() - 6);
    else if (timeframe === '1y') now.setFullYear(now.getFullYear() - 1);
    q = q.gte('created_at', now.toISOString());
    oQ = oQ.gte('created_at', now.toISOString());
  }

  const { data: tabs, error: tErr } = await q;
  if (tErr) return res.status(500).json({ error: tErr.message });

  // Group by date
  const timelineData = {};
  let totalRevenue = 0;

  tabs.forEach(t => {
    const dateStr = t.created_at.split('T')[0];
    if (!timelineData[dateStr]) timelineData[dateStr] = 0;
    timelineData[dateStr] += Number(t.total_paid || 0);
    totalRevenue += Number(t.total_paid || 0);
  });

  // Top Items
  const { data: orders, error: oErr } = await oQ;

  if (oErr) return res.status(500).json({ error: oErr.message });

  const itemCounts = {};
  let totalPrepTimeMs = 0;
  let validPrepOrders = 0;

  orders.forEach(o => {
    // Prep time metric
    if (o.served_at && o.created_at) {
      const duration = new Date(o.served_at).getTime() - new Date(o.created_at).getTime();
      if (duration > 0) {
        totalPrepTimeMs += duration;
        validPrepOrders++;
      }
    }

    o.items?.forEach(reqItem => {
      if (!itemCounts[reqItem.name]) itemCounts[reqItem.name] = 0;
      itemCounts[reqItem.name] += reqItem.quantity;
    });
  });

  const avgPrepTimeMins = validPrepOrders > 0 ? (totalPrepTimeMs / validPrepOrders) / 60000 : 0;

  const topItems = Object.entries(itemCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const timelineList = Object.entries(timelineData).map(([date, revenue]) => ({
    date,
    revenue
  }));

  res.json({ 
    timeline: timelineList, 
    topItems, 
    totalRevenue, 
    totalCompletedTabs: tabs.length,
    avgPrepTimeMins: Math.round(avgPrepTimeMins)
  });
});

app.get('/api/menu', async (req, res) => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('category')
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/menu', async (req, res) => {
  const { data, error } = await supabase
    .from('menu_items')
    .insert(req.body)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.patch('/api/menu/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('menu_items')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/menu/:id', async (req, res) => {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Purge Mock Data
app.delete('/api/orders/mock', async (req, res) => {
  try {
    const { error: e1 } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Deletes all
    const { error: e2 } = await supabase.from('tabs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e1) throw e1;
    if (e2) throw e2;
    res.json({ success: true, message: 'All orders wiped successfully.' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────
//  TABS
// ─────────────────────────────────────────────
app.post('/api/tabs', async (req, res) => {
  const { table_number, session_token, phone_number } = req.body;
  // Check for existing open tab for this table
  const { data: existing } = await supabase
    .from('tabs')
    .select('*')
    .eq('table_number', table_number)
    .eq('status', 'Open')
    .single();
  if (existing) return res.json(existing);

  const { data, error } = await supabase
    .from('tabs')
    .insert({ table_number, session_token, phone_number })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.get('/api/tabs/:id', async (req, res) => {
  const { data: tab, error: tabError } = await supabase
    .from('tabs')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (tabError) return res.status(404).json({ error: 'Tab not found' });

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('tab_id', req.params.id)
    .order('created_at');

  res.json({ ...tab, orders: orders || [] });
});

app.get('/api/tabs', async (req, res) => {
  const { status } = req.query;
  let query = supabase.from('tabs').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch('/api/tabs/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('tabs')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  // Phase 5 Loyalty Logic
  if (req.body.status === 'Closed' && req.body.customer_phone) {
    const points = Math.floor(Number(req.body.total_paid) / 100);
    
    // Check if customer exists
    const { data: cust } = await supabase.from('customers').select('*').eq('phone_number', req.body.customer_phone).single();
    if (cust) {
      await supabase.from('customers').update({ 
        beans_balance: cust.beans_balance + points,
        total_spent: Number(cust.total_spent) + Number(req.body.total_paid)
      }).eq('phone_number', req.body.customer_phone);
    } else {
      await supabase.from('customers').insert({
        phone_number: req.body.customer_phone,
        name: 'New Customer',
        beans_balance: points,
        total_spent: Number(req.body.total_paid)
      });
    }
  }

  io.to('admin').emit('tab_updated', data);
  res.json(data);
});

// ─────────────────────────────────────────────
//  STATIONS & ROUTING
// ─────────────────────────────────────────────
app.get('/api/stations', async (req, res) => {
  const { data, error } = await supabase.from('stations').select('*').eq('is_active', true).order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/order-items', async (req, res) => {
  const { station_slug, status, order_id } = req.query;
  let query = supabase.from('order_items').select('*, orders!inner(table_number, created_at, tab_id, status), stations!inner(slug)').order('created_at', { ascending: true });
  
  if (station_slug) query = query.eq('stations.slug', station_slug);
  if (status) query = query.eq('item_status', status);
  if (order_id) query = query.eq('order_id', order_id);
  
  query = query.neq('orders.status', 'Holding'); // Hide holding

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch('/api/order-items/:id/status', async (req, res) => {
  const { status: newStatus } = req.body;
  const { data: updatedItem, error } = await supabase.from('order_items')
    .update({ item_status: newStatus })
    .eq('id', req.params.id)
    .select('*, stations(slug)')
    .single();
    
  if (error) return res.status(500).json({ error: error.message });

  const stationSlug = updatedItem.stations?.slug;
  if (stationSlug) io.to(stationSlug).emit('item_status_updated', updatedItem);
  io.to('admin').emit('item_status_updated', updatedItem);

  const { data: allItems } = await supabase.from('order_items').select('id, item_status, preparation_type, customizations').eq('order_id', updatedItem.order_id);
  if (allItems) {
     const kitchenItems = allItems.filter(i => String(i.preparation_type).toLowerCase() !== 'ready');
     const allKitchenReady = kitchenItems.length === 0 || kitchenItems.every(i => i.item_status === 'ready_to_serve' || i.item_status === 'served');
     const anyKitchenPreparing = kitchenItems.some(i => i.item_status === 'preparing' || i.item_status === 'prepared');

     if (allKitchenReady) {
        const heldItems = allItems.filter(i => i.item_status === 'pending' && i.customizations?.some(c => c.name === '_held' && c.choice === 'true'));
        if (heldItems.length > 0) {
           for (const hi of heldItems) {
              const newCusts = hi.customizations.filter(c => c.name !== '_held');
              const { data: released } = await supabase.from('order_items').update({ item_status: 'ready_to_serve', customizations: newCusts }).eq('id', hi.id).select('*, stations(slug)').single();
              if (released) {
                 if (released.stations?.slug) io.to(released.stations.slug).emit('item_status_updated', released);
                 io.to('admin').emit('item_status_updated', released);
              }
           }
        }
     }

     // Compute overall order status
     let computedStatus = 'New';
     if (allItems.every(i => i.item_status === 'served')) {
        computedStatus = 'Served';
     } else if (allKitchenReady) {
        computedStatus = 'Ready';
     } else if (anyKitchenPreparing) {
        computedStatus = 'Preparing';
     }

     const { data: existingOrder } = await supabase.from('orders').select('status').eq('id', updatedItem.order_id).single();
     if (existingOrder && existingOrder.status !== computedStatus && existingOrder.status !== 'Holding') {
         const updatePayload = { status: computedStatus };
         if (computedStatus === 'Served') updatePayload.served_at = new Date().toISOString();
         
         const { data: orderData } = await supabase.from('orders').update(updatePayload).eq('id', updatedItem.order_id).select().single();
         if (orderData) {
            io.to('kitchen').emit('order_updated', orderData);
            io.to('admin').emit('order_updated', orderData);
            io.to(`customer-${orderData.tab_id}`).emit('order_updated', orderData);
         }
     }
  }

  res.json(updatedItem);
});

// ─────────────────────────────────────────────
//  ORDERS
// ─────────────────────────────────────────────
app.post('/api/orders', async (req, res) => {
  const { tab_id, table_number, items, subtotal, tax, total, status, serve_ready_with_kitchen } = req.body;
  
  const prep_status = {};
  const hasKdsItems = items.some(i => i.preparation_type === 'BARISTA' || i.preparation_type === 'KITCHEN');
  const hasReadyItems = items.some(i => i.preparation_type === 'READY');
  
  if (hasKdsItems) prep_status['KDS'] = 'New';
  if (hasReadyItems) prep_status['READY'] = 'New';

  let initialStatus = status || 'New';
  
  const { data, error } = await supabase
    .from('orders')
    .insert({ tab_id, table_number, items, subtotal, tax, total, status: initialStatus, prep_status })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  try {
    const itemIds = items.map(i => i.id).filter(Boolean);
    if (itemIds.length > 0) {
      const { data: menuData } = await supabase.from('menu_items').select('id, station_id, preparation_type').in('id', itemIds);
      const orderItemsInsert = items.map(reqItem => {
        const menuInfo = menuData?.find(m => m.id === reqItem.id) || {};
        const prepType = menuInfo.preparation_type || 'kitchen';
        let initStatus = prepType === 'ready' ? 'ready_to_serve' : 'pending';
        const custs = reqItem.customizations || [];
        
        if (serve_ready_with_kitchen && prepType === 'ready') {
           initStatus = 'pending';
           custs.push({ name: '_held', choice: 'true' });
        }

        return {
          order_id: data.id,
          menu_item_id: reqItem.id,
          name: reqItem.name,
          quantity: reqItem.quantity,
          price: reqItem.price,
          station_id: menuInfo.station_id || null,
          preparation_type: prepType,
          item_status: initStatus,
          customizations: custs
        };
      });
      console.log('Inserting order_items:', orderItemsInsert);
      const { data: inserted, error: itemsErr } = await supabase.from('order_items').insert(orderItemsInsert).select();
      if (itemsErr) console.error('Failed to insert order items', itemsErr);
      else console.log('Successfully inserted order_items', inserted);
    }
  } catch(e) {
    console.error('Error inserting order items', e);
  }

  // Only broadcast to kitchen/admin if it isn't in Holding state
  if (data.status !== 'Holding') {
    io.to('kitchen').emit('new_order', data);
    io.to('admin').emit('new_order', data);
  }
  // Notify customer
  io.to(`customer-${tab_id}`).emit('order_created', data);
  
  if (data.status === 'Holding') {
     setTimeout(async () => {
        try {
           const { data: check, error: checkErr } = await supabase.from('orders').select('status').eq('id', data.id).single();
           if (!checkErr && check && check.status === 'Holding') {
              const { data: updated } = await supabase.from('orders').update({ status: 'New' }).eq('id', data.id).select().single();
              if (updated) {
                 io.to('kitchen').emit('new_order', updated);
                 io.to('admin').emit('new_order', updated);
                 io.to(`customer-${tab_id}`).emit('order_updated', updated);
              }
           }
        } catch (err) {
           // Ignore if order was deleted
        }
     }, 60000);
  }

  res.status(201).json(data);
});

app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('orders').delete().eq('id', id).eq('status', 'Holding'); // Security: only delete holding orders
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

app.get('/api/orders', async (req, res) => {
  const { status, tab_id } = req.query;
  let query = supabase
    .from('orders')
    .select('*, tabs(status, payment_method, total_paid)')
    .order('created_at', { ascending: false })
    .neq('status', 'Holding'); // Hide holding orders from dashboards
    
  if (status) query = query.eq('status', status);
  if (tab_id) query = query.eq('tab_id', tab_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch('/api/orders/:id/status', async (req, res) => {
  let { status } = req.body;

  const updatePayload = { status };
  if (status === 'Served') {
    updatePayload.served_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  // Phase 5 Inventory Deduction
  if (status === 'Served' && data.items) {
    try {
      const { data: inv } = await supabase.from('inventory').select('*');
      if (inv) {
         let espresso = inv.find(i => i.name === 'Espresso Beans');
         let milk = inv.find(i => i.name === 'Oat Milk');
         let pastries = inv.find(i => i.name === 'Pastry Box');

         for (const item of data.items) {
           const qty = item.quantity || 1;
           const isCoffee = item.name.toLowerCase().includes('coffee') || item.name.toLowerCase().includes('espresso') || item.name.toLowerCase().includes('macchiato');
           const isPastry = item.name.toLowerCase().includes('croissant') || item.name.toLowerCase().includes('cookie');
           
           if (isCoffee && espresso) {
              await supabase.from('inventory').update({ stock_level: Math.max(0, espresso.stock_level - (18 * qty)) }).eq('id', espresso.id);
              if (item.name.toLowerCase().includes('latte') || item.name.toLowerCase().includes('macchiato')) {
                 if (milk) await supabase.from('inventory').update({ stock_level: Math.max(0, milk.stock_level - (200 * qty)) }).eq('id', milk.id);
              }
           }
           if (isPastry && pastries) {
              await supabase.from('inventory').update({ stock_level: Math.max(0, pastries.stock_level - qty) }).eq('id', pastries.id);
           }
         }
      }
    } catch (e) {
      console.error('Inventory deduction failed', e);
    }
  }

  // Broadcast status change everywhere
  if (status === 'New') {
    io.to('kitchen').emit('new_order', data);
    io.to('admin').emit('new_order', data);
  } else {
    io.to('kitchen').emit('order_updated', data);
    io.to('admin').emit('order_updated', data);
  }
  io.to(`customer-${data.tab_id}`).emit('order_updated', data);

  res.json(data);
});

app.patch('/api/orders/:id/prep-status', async (req, res) => {
  const { prep_status_updates } = req.body;

  const { data: order, error: fetchErr } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
  if (fetchErr) return res.status(500).json({ error: fetchErr.message });

  const currentPrepStatus = order.prep_status || {};
  const updatedPrepStatus = { ...currentPrepStatus, ...prep_status_updates };

  const statuses = Object.values(updatedPrepStatus);
  let overallStatus = 'New';
  
  if (statuses.every(s => s === 'Served')) overallStatus = 'Served';
  else if (statuses.every(s => s === 'Ready' || s === 'Served')) overallStatus = 'Ready';
  else if (statuses.some(s => s === 'Preparing')) overallStatus = 'Preparing';
  else if (statuses.some(s => s === 'Ready' || s === 'Served') && statuses.some(s => s === 'New')) overallStatus = 'Preparing';

  const updatePayload = { prep_status: updatedPrepStatus, status: overallStatus };
  if (overallStatus === 'Served' && order.status !== 'Served') {
    updatePayload.served_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', req.params.id)
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });

  // Phase 5 Inventory Deduction
  if (overallStatus === 'Served' && order.status !== 'Served' && data.items) {
    try {
      const { data: inv } = await supabase.from('inventory').select('*');
      if (inv) {
         let espresso = inv.find(i => i.name === 'Espresso Beans');
         let milk = inv.find(i => i.name === 'Oat Milk');
         let pastries = inv.find(i => i.name === 'Pastry Box');

         for (const item of data.items) {
           const qty = item.quantity || 1;
           const isCoffee = item.name.toLowerCase().includes('coffee') || item.name.toLowerCase().includes('espresso') || item.name.toLowerCase().includes('macchiato');
           const isPastry = item.name.toLowerCase().includes('croissant') || item.name.toLowerCase().includes('cookie');
           
           if (isCoffee && espresso) {
              await supabase.from('inventory').update({ stock_level: Math.max(0, espresso.stock_level - (18 * qty)) }).eq('id', espresso.id);
              if (item.name.toLowerCase().includes('latte') || item.name.toLowerCase().includes('macchiato')) {
                 if (milk) await supabase.from('inventory').update({ stock_level: Math.max(0, milk.stock_level - (200 * qty)) }).eq('id', milk.id);
              }
           }
           if (isPastry && pastries) {
              await supabase.from('inventory').update({ stock_level: Math.max(0, pastries.stock_level - qty) }).eq('id', pastries.id);
           }
         }
      }
    } catch (e) {
      console.error('Inventory deduction failed', e);
    }
  }

  io.to('kitchen').emit('order_updated', data);
  io.to('admin').emit('order_updated', data);
  io.to(`customer-${data.tab_id}`).emit('order_updated', data);

  res.json(data);
});

// ─────────────────────────────────────────────
//  ANALYTICS (Admin dashboard stats)
// ─────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [openTabs, todayOrders, queueOrders] = await Promise.all([
    supabase.from('tabs').select('id', { count: 'exact' }).eq('status', 'Open'),
    supabase.from('orders').select('total').gte('created_at', today.toISOString()),
    supabase.from('orders').select('id', { count: 'exact' }).in('status', ['New', 'Preparing'])
  ]);

  const revenue = (todayOrders.data || []).reduce((sum, o) => sum + Number(o.total), 0);

  res.json({
    openTabs: openTabs.count || 0,
    todayRevenue: revenue,
    ordersInQueue: queueOrders.count || 0,
    todayOrderCount: (todayOrders.data || []).length
  });
});

// ─────────────────────────────────────────────
//  SOCKET.IO
// ─────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join_room', (room) => {
    socket.join(room);
  });
  
  socket.on('call_staff', (data) => {
    // Broadcast to admin and kitchen rooms
    io.to('admin').emit('staff_called', data);
    io.to('kitchen').emit('staff_called', data);
  });

  socket.on('disconnect', () => {});
});

// ─────────────────────────────────────────────
//  REVIEWS
// ─────────────────────────────────────────────
app.get('/api/reviews', async (req, res) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/reviews', async (req, res) => {
  const { tab_id, table_number, rating, tags, comment } = req.body;
  const { data, error } = await supabase
    .from('reviews')
    .insert({ tab_id, table_number, rating, tags, comment })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`\n🫗  Velvet Brew API running on port ${PORT}`);
  supabase.from('menu_items').select('id', { count: 'exact', head: true }).then(({ error, count }) => {
    if (error) console.error('❌ Supabase error:', error.message);
    else console.log(`✅ Supabase connected — ${count} menu items`);
  });
});
