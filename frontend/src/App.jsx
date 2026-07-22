import React from 'react'
import { Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { CartProvider } from './context/CartContext'

// Components
import ProtectedRoute from './components/ProtectedRoute'

// Customer
import Menu from './pages/customer/Menu'
import ItemDetail from './pages/customer/ItemDetail'
import CartSummary from './pages/customer/CartSummary'
import OrderTracking from './pages/customer/OrderTracking'
import OpenTab from './pages/customer/OpenTab'
import Upsell from './pages/customer/Upsell'
import PayNow from './pages/customer/PayNow'
import Feedback from './pages/customer/Feedback'
import Loyalty from './pages/customer/Loyalty'

// Admin
import Login from './pages/admin/Login'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrders from './pages/admin/AdminOrders'
import AdminMenu from './pages/admin/AdminMenu'
import AdminTables from './pages/admin/AdminTables'

// KDS
import KDSBoard from './pages/kds/KDSBoard'
import ReadyBoard from './pages/kds/ReadyBoard'
import Analytics from './pages/admin/Analytics'
import PrintReceipt from './pages/admin/PrintReceipt'
import AdminInventory from './pages/admin/AdminInventory'
import AdminPOS from './pages/admin/AdminPOS'
import AdminReviews from './pages/admin/AdminReviews'
import ServingQueue from './pages/admin/ServingQueue'
import StationBoard from './pages/station/StationBoard'

const CustomerLayout = () => (
  <CartProvider>
    <div className="max-w-md mx-auto min-h-screen relative shadow-[var(--shadow-brown)] border-x border-[var(--color-surface-4)] bg-[var(--color-brand-cream)]">
      <Outlet />
    </div>
  </CartProvider>
)

export default function App() {
  return (
    <Routes>
      {/* Customer */}
      <Route path="/" element={<CustomerLayout />}>
        <Route index element={<Menu />} />
        <Route path="item/:id" element={<ItemDetail />} />
        <Route path="cart" element={<CartSummary />} />
        <Route path="tracking" element={<OrderTracking />} />
        <Route path="tab" element={<OpenTab />} />
        <Route path="upsell" element={<Upsell />} />
        <Route path="pay" element={<PayNow />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="loyalty" element={<Loyalty />} />
      </Route>

      {/* Admin Auth */}
      <Route path="/login" element={<Login />} />

      {/* Print receipt without layout */}
      <Route path="/admin/print/:id" element={<PrintReceipt />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="menu" element={<AdminMenu />} />
        <Route path="tables" element={<AdminTables />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="pos" element={<AdminPOS />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="serving" element={<ServingQueue />} />
        <Route path="kds" element={<Navigate to="/kds" replace />} />
      </Route>

      {/* Station Boards — standalone full-screen */}
      <Route path="/station/:stationSlug" element={<StationBoard />} />

      {/* KDS — standalone full-screen */}
      <Route path="/kds" element={<KDSBoard />} />
      <Route path="/kds/ready" element={<ReadyBoard />} />
    </Routes>
  )
}

