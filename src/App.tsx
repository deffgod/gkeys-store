import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Layout from './components/Layout';
import PageTransition from './components/PageTransition';
import ProtectedRoute from './components/ProtectedRoute';
import AdminApp from './admin/AdminApp';
import { Toaster } from './components/ui/sonner';

// @ts-expect-error - Dynamic import
import HomePage from './pages/HomePage';
// @ts-expect-error - Dynamic import
import ProfilePage from './pages/ProfilePage';
// @ts-expect-error - Dynamic import
import ProfileOrdersPage from './pages/ProfileOrdersPage';
// @ts-expect-error - Dynamic import
import ProfileWishlistPage from './pages/ProfileWishlistPage';
// @ts-expect-error - Dynamic import
import ProfileBalancePage from './pages/ProfileBalancePage';
// @ts-expect-error - Dynamic import
import GameDetailPage from './pages/GameDetailPage';
// @ts-expect-error - Dynamic import
import CatalogPage from './pages/CatalogPage';
// @ts-expect-error - Dynamic import
import CartPage from './pages/CartPage';
// @ts-expect-error - Dynamic import
import CheckoutPage from './pages/CheckoutPage';
// @ts-expect-error - Dynamic import
import WishlistPage from './pages/WishlistPage';
// @ts-expect-error - Dynamic import
import SupportPage from './pages/SupportPage';
// @ts-expect-error - Dynamic import
import ProfileEditPage from './pages/ProfileEditPage';
// @ts-expect-error - Dynamic import
import BlogPage from './pages/BlogPage';
// @ts-expect-error - Dynamic import
import ArticlePage from './pages/ArticlePage';
// @ts-expect-error - Dynamic import
import MediaPage from './pages/MediaPage';
// @ts-expect-error - Dynamic import
import PrivacyPage from './pages/PrivacyPage';
// @ts-expect-error - Dynamic import
import TermsPage from './pages/TermsPage';
// @ts-expect-error - Dynamic import
import LoginPage from './pages/LoginPage';
// @ts-expect-error - Dynamic import
import RegisterPage from './pages/RegisterPage';
// @ts-expect-error - Dynamic import
import ForgotPasswordPage from './pages/ForgotPasswordPage';
// @ts-expect-error - Dynamic import
import ComponentShowcase from './pages/ComponentShowcase';




function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <HomePage />
            </PageTransition>
          }
        />
        <Route
          path="/catalog"
          element={
            <PageTransition>
              <CatalogPage />
            </PageTransition>
          }
        />
        <Route
          path="/game/:slug"
          element={
            <PageTransition>
              <GameDetailPage />
            </PageTransition>
          }
        />
        <Route
          path="/cart"
          element={
            <PageTransition>
              <CartPage />
            </PageTransition>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <PageTransition>
                <CheckoutPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <PageTransition>
              <WishlistPage />
            </PageTransition>
          }
        />
        <Route
          path="/support"
          element={
            <PageTransition>
              <SupportPage />
            </PageTransition>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PageTransition>
                <ProfilePage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/orders"
          element={
            <ProtectedRoute>
              <PageTransition>
                <ProfileOrdersPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/wishlist"
          element={
            <ProtectedRoute>
              <PageTransition>
                <ProfileWishlistPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/balance"
          element={
            <ProtectedRoute>
              <PageTransition>
                <ProfileBalancePage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <PageTransition>
                <ProfileEditPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/blog"
          element={
            <PageTransition>
              <BlogPage />
            </PageTransition>
          }
        />
        <Route
          path="/blog/:slug"
          element={
            <PageTransition>
              <ArticlePage />
            </PageTransition>
          }
        />
        <Route
          path="/media"
          element={
            <PageTransition>
              <MediaPage />
            </PageTransition>
          }
        />
        <Route
          path="/privacy"
          element={
            <PageTransition>
              <PrivacyPage />
            </PageTransition>
          }
        />
        <Route
          path="/terms"
          element={
            <PageTransition>
              <TermsPage />
            </PageTransition>
          }
        />
        <Route
          path="/login" 
          element={
            <PageTransition>
              <LoginPage />
            </PageTransition>
          }
        />
        <Route
          path="/register"
          element={
            <PageTransition>
              <RegisterPage />
            </PageTransition>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PageTransition>
              <ForgotPasswordPage />
            </PageTransition>
          }
        />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute redirectTo="/login">
              <AdminApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/component-showcase"
          element={
            <PageTransition>
              <ComponentShowcase />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isAuthRoute = ['/login', '/register', '/forgot-password'].includes(location.pathname);
  const isShowcaseRoute = location.pathname === '/component-showcase';
  const isProfileRoute = location.pathname.startsWith('/profile');
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Auth pages and showcase don't need the main layout
  if (isAuthRoute || isShowcaseRoute) {
    return (
      <AnimatedRoutes />
    );
  }

  // Profile pages don't need Header/Footer (they use ProfileLayout)
  if (isProfileRoute) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0D0D0D' }}>
        <AnimatedRoutes />
      </div>
    );
  }

  // Admin pages don't need Header/Footer (they use AdminLayout)
  if (isAdminRoute) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0D0D0D' }}>
        <AnimatedRoutes />
      </div>
    );
  }

  return (
    <Layout>
      <AnimatedRoutes />
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <AppRoutes />
            <Toaster position="top-right" richColors />
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
