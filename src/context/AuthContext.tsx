import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, UserRole, SpringAuthority, SpringSecurityError } from '../types';
import { INITIAL_USERS } from '../data/initialUsers';
import {
  AdminAccount,
  getAdminAccounts,
  authenticateAdminCredentials,
  createAdminAccount,
  updateAdminPassword,
  subscribeAdminAccounts,
  FIRESTORE_CONSOLE_URL
} from '../services/adminDatabase';
import {
  generateSpringSecurityJwt,
  parseSpringSecurityJwt,
  checkSpringSecurityAuthorization,
  JwtClaims
} from '../services/springSecurity';

interface AuthContextType {
  currentUser: User;
  users: User[];
  jwtToken: string;
  jwtClaims: JwtClaims | null;
  isAuthenticated: boolean;
  springSecurityError: SpringSecurityError | null;
  
  // Admin Session & Credentials Management
  isAdminAuthenticated: boolean;
  adminSession: AdminAccount | null;
  isAdminLoginOpen: boolean;
  setIsAdminLoginOpen: (open: boolean) => void;
  loginAdmin: (usernameOrEmail: string, plainPassword: string) => { success: boolean; error?: string };
  logoutAdmin: () => void;
  adminAccounts: AdminAccount[];
  firestoreConsoleUrl: string;
  addNewAdminAccount: (params: { username: string; email: string; password: string; name: string }) => Promise<{ success: boolean; message: string }>;
  changeAdminPassword: (adminId: string, newPassword: string) => Promise<{ success: boolean; message: string }>;

  // Customer Authentication & Storefront operations
  loginCustomer: (email: string) => boolean;
  logoutCustomer: () => void;
  updateUserRole: (targetUserId: string, newRole: UserRole) => { success: boolean; message: string };
  updateUserStatus: (targetUserId: string, status: 'active' | 'suspended') => { success: boolean; message: string };
  addUser: (userData: Omit<User, 'id' | 'createdAt' | 'lastLogin' | 'totalOrders' | 'totalSpent' | 'authority'>) => void;
  recordOrder: (userId: string, amount: number) => void;
  clearSpringSecurityError: () => void;
  validateSpringSecurityAccess: (path?: string) => boolean;

  // Spring Security Authority and Role Checks
  canAccessAdmin: boolean;
  canManageInventory: boolean;
  canViewAnalytics: boolean;
  canManageRoles: boolean;
  canConfigureDashboard: boolean;
  hasAuthority: (authority: SpringAuthority) => boolean;
}

const STORAGE_KEY_CURRENT_USER = 'apex_current_user_id';
const STORAGE_KEY_USERS = 'apex_users_db';
const STORAGE_KEY_ADMIN_SESSION = 'apex_admin_session_v1';
const STORAGE_KEY_ADMIN_JWT = 'apex_admin_jwt_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize users database from localStorage or fallback
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((u: any) => ({
            ...u,
            role: (u.role === 'admin' ? 'admin' : 'user') as UserRole,
            authority: (u.role === 'admin' ? 'ROLE_ADMIN' : 'ROLE_USER') as SpringAuthority
          }));
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_USERS;
  });

  // Admin Database accounts (synced in real-time from Cloud Firestore)
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>(() => getAdminAccounts());

  useEffect(() => {
    const unsubscribe = subscribeAdminAccounts((remoteAccounts) => {
      setAdminAccounts(remoteAccounts);
    });
    return () => unsubscribe();
  }, []);

  // Admin Session State (Strictly authenticated via Admin Database with username + password)
  const [adminSession, setAdminSession] = useState<AdminAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADMIN_SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.authority === 'ROLE_ADMIN') {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return null; // Not logged in as admin by default!
  });

  // Admin Login Modal visibility
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Standard Customer user ID (defaults to customer Alex Morgan usr-003, so regular users browse as customer)
  const [customerUserId, setCustomerUserId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (savedId) return savedId;
    } catch {
      // fallback
    }
    // Default to Alex Morgan (Customer ROLE_USER)
    return INITIAL_USERS[2]?.id || INITIAL_USERS[0].id;
  });

  // Spring Security Error State (simulates AccessDeniedException)
  const [springSecurityError, setSpringSecurityError] = useState<SpringSecurityError | null>(null);

  // Check if admin is currently authenticated
  const isAdminAuthenticated = Boolean(adminSession && adminSession.authority === 'ROLE_ADMIN');

  // Active user object: If admin is authenticated, returns admin principal; otherwise returns active customer
  const currentUser: User = useMemo(() => {
    if (isAdminAuthenticated && adminSession) {
      return {
        id: adminSession.id,
        name: adminSession.name,
        email: adminSession.email,
        role: 'admin',
        authority: 'ROLE_ADMIN',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        status: adminSession.status,
        createdAt: adminSession.createdAt,
        lastLogin: adminSession.lastLogin,
        totalOrders: 24,
        totalSpent: 4890.00
      };
    }

    const customer = users.find(u => u.id === customerUserId);
    if (customer) {
      return {
        ...customer,
        role: 'user',
        authority: 'ROLE_USER'
      };
    }
    return users[0];
  }, [isAdminAuthenticated, adminSession, users, customerUserId]);

  // Active Spring Security JWT Token
  const [jwtToken, setJwtToken] = useState<string>(() => {
    try {
      if (adminSession) {
        const savedAdminJwt = localStorage.getItem(STORAGE_KEY_ADMIN_JWT);
        if (savedAdminJwt) return savedAdminJwt;
      }
    } catch {
      // fallback
    }
    return generateSpringSecurityJwt(currentUser);
  });

  // Regenerate JWT token whenever currentUser or admin session changes
  useEffect(() => {
    const token = generateSpringSecurityJwt(currentUser);
    setJwtToken(token);
    try {
      if (isAdminAuthenticated) {
        localStorage.setItem(STORAGE_KEY_ADMIN_JWT, token);
      } else {
        localStorage.removeItem(STORAGE_KEY_ADMIN_JWT);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser, isAdminAuthenticated]);

  const jwtClaims = useMemo(() => parseSpringSecurityJwt(jwtToken), [jwtToken]);

  // Save users whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users to localStorage', e);
    }
  }, [users]);

  // Save customer user ID
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, customerUserId);
    } catch (e) {
      console.error('Error saving current user ID', e);
    }
  }, [customerUserId]);

  // Save admin session state
  useEffect(() => {
    try {
      if (adminSession) {
        localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(adminSession));
      } else {
        localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
      }
    } catch (e) {
      console.error('Error saving admin session', e);
    }
  }, [adminSession]);

  const isAuthenticated = !!currentUser && currentUser.status === 'active';

  // STRICT SPRING SECURITY PERMISSIONS: Only authenticated Admin with ROLE_ADMIN
  const hasAuthority = (authority: SpringAuthority): boolean => {
    return currentUser.authority === authority;
  };

  const canAccessAdmin = isAdminAuthenticated && currentUser.authority === 'ROLE_ADMIN';
  const canManageInventory = canAccessAdmin;
  const canViewAnalytics = canAccessAdmin;
  const canManageRoles = canAccessAdmin;
  const canConfigureDashboard = canAccessAdmin;

  /**
   * Admin Authentication against Admin Database
   * Validates username or email + password
   */
  const loginAdmin = (usernameOrEmail: string, plainPassword: string): { success: boolean; error?: string } => {
    const result = authenticateAdminCredentials(usernameOrEmail, plainPassword);
    if (!result.success || !result.admin) {
      return {
        success: false,
        error: result.error || 'Authentication failed. Please verify your admin username and password.'
      };
    }

    setAdminSession(result.admin);
    setAdminAccounts(getAdminAccounts());
    setSpringSecurityError(null);
    setIsAdminLoginOpen(false);

    return { success: true };
  };

  /**
   * Log out of admin session
   */
  const logoutAdmin = () => {
    setAdminSession(null);
    localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
    localStorage.removeItem(STORAGE_KEY_ADMIN_JWT);
    setSpringSecurityError(null);
  };

  /**
   * Add a new Administrator to the Admin Database
   */
  const addNewAdminAccount = async (params: { username: string; email: string; password: string; name: string }) => {
    if (!canAccessAdmin) {
      return { success: false, message: 'Spring Security AccessDeniedException: User lacks ROLE_ADMIN authority.' };
    }

    const res = await createAdminAccount(params);
    if (res.success) {
      setAdminAccounts(getAdminAccounts());
    }
    return res;
  };

  /**
   * Update an Admin's password
   */
  const changeAdminPassword = async (adminId: string, newPassword: string) => {
    if (!canAccessAdmin) {
      return { success: false, message: 'Spring Security AccessDeniedException: User lacks ROLE_ADMIN authority.' };
    }

    const res = await updateAdminPassword(adminId, newPassword);
    if (res.success) {
      setAdminAccounts(getAdminAccounts());
      if (adminSession?.id === adminId) {
        setAdminSession(prev => prev ? { ...prev, passwordHash: newPassword } : null);
      }
    }
    return res;
  };

  // Spring Security Authorization Filter check
  const validateSpringSecurityAccess = (path: string = '/api/admin/dashboard'): boolean => {
    if (!isAdminAuthenticated) {
      setSpringSecurityError({
        timestamp: new Date().toISOString(),
        status: 403,
        error: 'Forbidden',
        message: `Access Denied: Principal [${currentUser.email}] has authority [ROLE_USER]. Administrative access requires authenticating with credentials from the Admin Database.`,
        path,
        requiredAuthority: 'ROLE_ADMIN',
        grantedAuthorities: ['ROLE_USER']
      });
      return false;
    }

    const result = checkSpringSecurityAuthorization(jwtToken, 'ADMIN', path);
    if (!result.authorized && result.error) {
      setSpringSecurityError(result.error);
      return false;
    }
    setSpringSecurityError(null);
    return true;
  };

  const clearSpringSecurityError = () => {
    setSpringSecurityError(null);
  };

  const loginCustomer = (email: string): boolean => {
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      if (existing.status === 'suspended') {
        return false;
      }
      setCustomerUserId(existing.id);
      return true;
    }

    const newUser: User = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: email.split('@')[0],
      email: email,
      role: 'user',
      authority: 'ROLE_USER',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Just now',
      totalOrders: 0,
      totalSpent: 0
    };

    setUsers(prev => [newUser, ...prev]);
    setCustomerUserId(newUser.id);
    return true;
  };

  const logoutCustomer = () => {
    const defaultCust = users.find(u => u.role === 'user' && u.id !== customerUserId) || users[2] || users[0];
    if (defaultCust) {
      setCustomerUserId(defaultCust.id);
    }
  };

  const updateUserRole = (targetUserId: string, newRole: UserRole): { success: boolean; message: string } => {
    // Spring Security Authority Check: strictly requires active ROLE_ADMIN
    if (!canAccessAdmin) {
      return {
        success: false,
        message: 'Spring Security AccessDeniedException: User lacks required authority [ROLE_ADMIN]. Standard users cannot modify roles.'
      };
    }

    const assignedAuthority: SpringAuthority = newRole === 'admin' ? 'ROLE_ADMIN' : 'ROLE_USER';

    setUsers(prev => prev.map(u => {
      if (u.id === targetUserId) {
        return { ...u, role: newRole, authority: assignedAuthority };
      }
      return u;
    }));

    return {
      success: true,
      message: `User authority successfully updated to ${assignedAuthority}.`
    };
  };

  const updateUserStatus = (targetUserId: string, status: 'active' | 'suspended'): { success: boolean; message: string } => {
    if (!canAccessAdmin) {
      return {
        success: false,
        message: 'Spring Security AccessDeniedException: Only authenticated administrators can modify account status.'
      };
    }

    if (targetUserId === currentUser.id) {
      return {
        success: false,
        message: 'Action Denied: You cannot suspend your own active administrator account.'
      };
    }

    setUsers(prev => prev.map(u => {
      if (u.id === targetUserId) {
        return { ...u, status };
      }
      return u;
    }));

    return {
      success: true,
      message: `User status changed to ${status}.`
    };
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'lastLogin' | 'totalOrders' | 'totalSpent' | 'authority'>) => {
    if (!canAccessAdmin) return;

    const assignedRole: UserRole = userData.role === 'admin' ? 'admin' : 'user';
    const assignedAuthority: SpringAuthority = assignedRole === 'admin' ? 'ROLE_ADMIN' : 'ROLE_USER';

    const newUser: User = {
      ...userData,
      role: assignedRole,
      authority: assignedAuthority,
      id: `usr-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      totalOrders: 0,
      totalSpent: 0
    };

    setUsers(prev => [newUser, ...prev]);
  };

  const recordOrder = (userId: string, amount: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          totalOrders: (u.totalOrders || 0) + 1,
          totalSpent: (u.totalSpent || 0) + amount,
          lastLogin: 'Just now'
        };
      }
      return u;
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        jwtToken,
        jwtClaims,
        isAuthenticated,
        springSecurityError,
        isAdminAuthenticated,
        adminSession,
        isAdminLoginOpen,
        setIsAdminLoginOpen,
        loginAdmin,
        logoutAdmin,
        adminAccounts,
        firestoreConsoleUrl: FIRESTORE_CONSOLE_URL,
        addNewAdminAccount,
        changeAdminPassword,
        loginCustomer,
        logoutCustomer,
        updateUserRole,
        updateUserStatus,
        addUser,
        recordOrder,
        clearSpringSecurityError,
        validateSpringSecurityAccess,
        canAccessAdmin,
        canManageInventory,
        canViewAnalytics,
        canManageRoles,
        canConfigureDashboard,
        hasAuthority
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
