import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import {
  ShoppingBag,
  ShieldCheck,
  Lock,
  ChevronDown,
  Package,
  Sliders,
  LogOut,
  User as UserIcon,
  Key
} from 'lucide-react';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onNavigateToAdmin: () => void;
  isAdminViewActive: boolean;
  onNavigateToCatalog: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCart,
  onOpenOrders,
  onNavigateToAdmin,
  isAdminViewActive,
  onNavigateToCatalog
}) => {
  const {
    currentUser,
    canAccessAdmin,
    isAdminAuthenticated,
    setIsAdminLoginOpen,
    logoutAdmin
  } = useAuth();
  const { cart } = useStore();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAdminConsoleClick = () => {
    if (canAccessAdmin) {
      onNavigateToAdmin();
    } else {
      // Prompt for Spring Security Admin Credentials
      setIsAdminLoginOpen(true);
    }
  };

  const handleAdminLogout = () => {
    logoutAdmin();
    setIsAccountMenuOpen(false);
    onNavigateToCatalog();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-8">
          <button
            onClick={onNavigateToCatalog}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-black text-sm flex items-center justify-center shadow-xs group-hover:scale-105 transition">
              ▲
            </div>
            <span className="font-black text-lg tracking-tight text-stone-900 dark:text-stone-100">
              APEX
            </span>
          </button>

          <nav className="hidden sm:flex items-center gap-6 text-xs font-semibold">
            <button
              onClick={onNavigateToCatalog}
              className={`transition ${!isAdminViewActive ? 'text-stone-900 dark:text-white font-bold' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'}`}
            >
              Shop
            </button>
            <button
              onClick={onOpenOrders}
              className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition"
            >
              Orders
            </button>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Admin Console Entry Button */}
          <button
            onClick={handleAdminConsoleClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              isAdminViewActive
                ? 'bg-indigo-600 text-white'
                : canAccessAdmin
                ? 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
                : 'bg-stone-100/80 hover:bg-stone-200/90 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700/80'
            }`}
            title={canAccessAdmin ? 'Access Admin Operations' : 'Spring Security: Requires Admin Username & Password'}
          >
            {canAccessAdmin ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-stone-500" />
            )}
            <span>Admin Console</span>
            {!canAccessAdmin && (
              <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 font-bold bg-stone-200 dark:bg-stone-700 px-1.5 py-0.2 rounded">
                Login
              </span>
            )}
          </button>

          {/* User Account & Profile */}
          <div className="relative">
            <button
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center gap-2 p-1.5 pr-2.5 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 rounded-full text-xs font-medium transition"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-stone-700 dark:text-stone-300 font-medium hidden md:inline text-xs">
                {currentUser.name.split(' ')[0]}
              </span>
              <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${canAccessAdmin ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'}`}>
                {canAccessAdmin ? 'ROLE_ADMIN' : 'ROLE_USER'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {isAccountMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl p-2 z-50 text-xs space-y-1 animate-in fade-in duration-100">
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800">
                  <div className="font-bold text-stone-900 dark:text-stone-100">{currentUser.name}</div>
                  <div className="text-[11px] text-stone-400 truncate font-mono">{currentUser.email}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Authority:</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {canAccessAdmin ? 'ROLE_ADMIN (Verified)' : 'ROLE_USER (Customer)'}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onOpenOrders();
                      setIsAccountMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                  >
                    <Package className="w-4 h-4 text-stone-400" />
                    <span>My Orders</span>
                  </button>

                  {canAccessAdmin ? (
                    <>
                      <button
                        onClick={() => {
                          onNavigateToAdmin();
                          setIsAccountMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                      >
                        <Sliders className="w-4 h-4" />
                        <span>Open Admin Console</span>
                      </button>

                      <button
                        onClick={handleAdminLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out of Admin Session</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setIsAdminLoginOpen(true);
                        setIsAccountMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                    >
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-indigo-500" />
                        <span>Admin Sign In</span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400">Requires Auth</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative p-2 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
