import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import GamesPage from './pages/GamesPage';
import UsersPage from './pages/UsersPage';
import OrdersPage from './pages/OrdersPage';
import BlogPostsPage from './pages/BlogPostsPage';
import TransactionsPage from './pages/TransactionsPage';
import G2ASyncPage from './pages/G2ASyncPage';
import PaymentManagementPage from './pages/PaymentManagementPage';
import CartManagementPage from './pages/CartManagementPage';
import WishlistManagementPage from './pages/WishlistManagementPage';
import FAQManagementPage from './pages/FAQManagementPage';
import G2AOffersPage from './pages/G2AOffersPage';
import G2AReservationsPage from './pages/G2AReservationsPage';
import CacheManagementPage from './pages/CacheManagementPage';

const AdminApp: React.FC = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="games" element={<GamesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="blog" element={<BlogPostsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="payments" element={<PaymentManagementPage />} />
        <Route path="carts" element={<CartManagementPage />} />
        <Route path="wishlists" element={<WishlistManagementPage />} />
        <Route path="faqs" element={<FAQManagementPage />} />
        <Route path="g2a" element={<G2ASyncPage />} />
        <Route path="g2a/offers" element={<G2AOffersPage />} />
        <Route path="g2a/reservations" element={<G2AReservationsPage />} />
        <Route path="cache" element={<CacheManagementPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminApp;

