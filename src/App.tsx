import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { UserOrdersModal } from './components/UserOrdersModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminLayout } from './components/admin/AdminLayout';
import { Product } from './types';

function StorefrontApp() {
  const { canAccessAdmin, setIsAdminLoginOpen } = useAuth();
  const { products } = useStore();

  const [isAdminView, setIsAdminView] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  const handleOpenAdmin = () => {
    if (canAccessAdmin) {
      setIsAdminView(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Main Navbar */}
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onNavigateToAdmin={handleOpenAdmin}
        isAdminViewActive={isAdminView}
        onNavigateToCatalog={() => setIsAdminView(false)}
      />

      {/* Main Content Area: Storefront vs Admin Hub */}
      <div className="flex-1">
        {isAdminView && canAccessAdmin ? (
          <AdminLayout onReturnToStore={() => setIsAdminView(false)} />
        ) : (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ProductCatalog
              onQuickView={prod => setQuickViewProduct(prod)}
              onNavigateToAdmin={handleOpenAdmin}
            />
          </main>
        )}
      </div>

      {/* Clean Modern E-Commerce Footer */}
      {!isAdminView && (
        <footer className="bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 mt-16 py-8 text-xs text-stone-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900 dark:text-stone-100">APEX</span>
              <span>© {new Date().getFullYear()} Apex Commerce. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-stone-500 dark:text-stone-400">
              <button onClick={() => setIsOrdersOpen(true)} className="hover:text-stone-900 dark:hover:text-white">
                Orders & Tracking
              </button>
              <button onClick={handleOpenAdmin} className="hover:text-stone-900 dark:hover:text-white">
                Admin Console
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Interactive Modals */}
      <AdminLoginModal onSuccess={() => setIsAdminView(true)} />

      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      <UserOrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <StorefrontApp />
      </StoreProvider>
    </AuthProvider>
  );
}
