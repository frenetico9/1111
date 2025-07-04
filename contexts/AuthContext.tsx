import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, UserType, BarbershopProfile, BarbershopSubscription, SubscriptionPlanTier, ChatConversation } from '../types';
import { 
  mockLogin, 
  mockSignupClient, 
  mockSignupBarbershop, 
  mockLogout, 
  mockGetBarbershopProfile, 
  mockUpdateBarbershopProfile, 
  mockGetBarbershopSubscription, 
  mockUpdateBarbershopSubscription,
  mockUpdateClientProfile,
  mockGetClientConversations,
  mockGetAdminConversations,
  mockGetUserById
} from '../services/mockApiService';
import { useNotification } from './NotificationContext'; // Re-import if moved or for direct use

interface AuthContextType {
  user: User | null;
  barbershopProfile: BarbershopProfile | null;
  barbershopSubscription: BarbershopSubscription | null;
  loading: boolean;
  unreadChatCount: number;
  login: (email: string, pass: string) => Promise<User | null>; // Return user on success
  signupClient: (name: string, email: string, phone: string, pass: string) => Promise<User | null>;
  signupBarbershop: (barbershopName: string, responsible: string, email: string, phone: string, address: string, pass: string) => Promise<User | null>;
  logout: () => void;
  updateBarbershopProfile: (profileData: Partial<BarbershopProfile>) => Promise<boolean>;
  updateClientProfile: (clientId: string, profileData: Partial<Pick<User, 'name' | 'phone'>>) => Promise<boolean>;
  updateSubscription: (planId: SubscriptionPlanTier) => Promise<boolean>;
  refreshUserData: () => Promise<void>; // To reload user-specific data
  refreshUnreadCount: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [barbershopProfile, setBarbershopProfile] = useState<BarbershopProfile | null>(null);
  const [barbershopSubscription, setBarbershopSubscription] = useState<BarbershopSubscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const { addNotification } = useNotification();

  const handleLogout = useCallback(() => {
    mockLogout();
    localStorage.removeItem('nav_user_NavalhaDigital');
    setUser(null);
    setBarbershopProfile(null);
    setBarbershopSubscription(null);
    setUnreadChatCount(0);
    addNotification({ message: 'Logout realizado com sucesso.', type: 'info' });
  }, [addNotification]);


  const refreshUnreadCount = useCallback(async () => {
    const storedUser = localStorage.getItem('nav_user_NavalhaDigital');
    if (!storedUser) {
        setUnreadChatCount(0);
        return;
    }
    const currentUser: User = JSON.parse(storedUser);

    try {
        let conversations: ChatConversation[] = [];
        if (currentUser.type === UserType.CLIENT) {
            conversations = await mockGetClientConversations(currentUser.id);
        } else if (currentUser.type === UserType.ADMIN) {
            conversations = await mockGetAdminConversations(currentUser.id);
        }
        
        const count = conversations.filter(c => c.hasUnread).length;
        setUnreadChatCount(count);
    } catch (error) {
        console.error("Failed to fetch unread chat count", error);
        setUnreadChatCount(0);
    }
  }, []);

  const loadUserDataForAdmin = useCallback(async (adminUser: User) => {
    if (adminUser.type === UserType.ADMIN) {
      const profile = await mockGetBarbershopProfile(adminUser.id);
      setBarbershopProfile(profile);
      const subscription = await mockGetBarbershopSubscription(adminUser.id);
      setBarbershopSubscription(subscription);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const storedUser = localStorage.getItem('nav_user_NavalhaDigital');
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.type === UserType.ADMIN) {
          await loadUserDataForAdmin(parsedUser);
        }
        await refreshUnreadCount();
      }
      setLoading(false);
    };
    initializeAuth();
  }, [loadUserDataForAdmin, refreshUnreadCount]);

  const handleAuthSuccess = async (loggedInUser: User): Promise<User | null> => {
    localStorage.setItem('nav_user_NavalhaDigital', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    if (loggedInUser.type === UserType.ADMIN) {
      await loadUserDataForAdmin(loggedInUser);
    }
    await refreshUnreadCount();
    // addNotification({ message: 'Login bem-sucedido!', type: 'success' }); // Usually handled by page
    return loggedInUser;
  };
  
  const login = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    try {
      const loggedInUser = await mockLogin(email, pass);
      if (loggedInUser) {
        return await handleAuthSuccess(loggedInUser);
      }
      addNotification({ message: 'Credenciais inválidas.', type: 'error' });
      return null;
    } catch (error) {
      addNotification({ message: `Erro no login: ${(error as Error).message}`, type: 'error' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signupClient = async (name: string, email: string, phone: string, pass: string): Promise<User | null> => {
    setLoading(true);
    try {
      const newUser = await mockSignupClient(name, email, phone, pass);
      if (newUser) {
        // addNotification({ message: 'Cadastro de cliente realizado com sucesso!', type: 'success' }); // Usually handled by page
        return newUser; 
      }
      return null;
    } catch (error) {
      addNotification({ message: `Erro no cadastro: ${(error as Error).message}`, type: 'error' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signupBarbershop = async (barbershopName: string, responsible: string, email: string, phone: string, address: string, pass: string): Promise<User | null> => {
    setLoading(true);
    try {
      const newUser = await mockSignupBarbershop(barbershopName, responsible, email, phone, address, pass);
      if (newUser) {
        // addNotification({ message: 'Cadastro da barbearia realizado com sucesso!', type: 'success' }); // Usually handled by page
        return newUser; 
      }
      return null;
    } catch (error) {
      addNotification({ message: `Erro no cadastro: ${(error as Error).message}`, type: 'error' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshUserDataInternal = useCallback(async () => {
    if (!user) {
      handleLogout();
      return;
    }
    setLoading(true);
    try {
      const updatedUser = await mockGetUserById(user.id);
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('nav_user_NavalhaDigital', JSON.stringify(updatedUser));
        if (updatedUser.type === UserType.ADMIN) {
          await loadUserDataForAdmin(updatedUser);
        }
        await refreshUnreadCount();
      } else {
        // User not found in DB, probably deleted. Log out.
        handleLogout();
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
      // Don't log out, maybe a temporary network issue. Keep stale data.
    } finally {
      setLoading(false);
    }
  }, [user, loadUserDataForAdmin, refreshUnreadCount, handleLogout]);

  const updateBarbershopProfileInternal = async (profileData: Partial<BarbershopProfile>) => {
    if (user && user.type === UserType.ADMIN) {
      setLoading(true);
      try {
        const success = await mockUpdateBarbershopProfile(user.id, profileData);
        if (success) {
          await refreshUserDataInternal(); // This will reload profile and subscription
          // addNotification({ message: 'Perfil da barbearia atualizado!', type: 'success' }); // Usually handled by page
          return true;
        }
        return false;
      } catch (error) {
        addNotification({ message: `Erro ao atualizar perfil: ${(error as Error).message}`, type: 'error' });
        return false;
      } finally {
        setLoading(false);
      }
    }
    return false;
  };

  const updateClientProfileInternal = async (clientId: string, profileData: Partial<Pick<User, 'name' | 'phone'>>) => {
    if (user && user.id === clientId && user.type === UserType.CLIENT) {
        setLoading(true);
        try {
            const success = await mockUpdateClientProfile(clientId, profileData);
            if (success) {
                await refreshUserDataInternal();
                // addNotification({ message: 'Perfil atualizado com sucesso!', type: 'success' }); // Handled by page
                return true;
            }
            return false;
        } catch (error) {
            addNotification({ message: `Erro ao atualizar perfil: ${(error as Error).message}`, type: 'error' });
            return false;
        } finally {
            setLoading(false);
        }
    }
    return false;
  };
  
  const updateSubscriptionInternal = async (planId: SubscriptionPlanTier) => {
    if (user && user.type === UserType.ADMIN) {
      setLoading(true);
      try {
        const success = await mockUpdateBarbershopSubscription(user.id, planId);
        if (success) {
          await refreshUserDataInternal(); // Reload subscription
          // addNotification({ message: 'Assinatura atualizada com sucesso!', type: 'success' }); // Usually handled by page
          return true;
        }
        return false;
      } catch (error) {
        addNotification({ message: `Erro ao atualizar assinatura: ${(error as Error).message}`, type: 'error' });
        return false;
      } finally {
        setLoading(false);
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        barbershopProfile, 
        barbershopSubscription, 
        loading, 
        unreadChatCount,
        login, 
        signupClient, 
        signupBarbershop, 
        logout: handleLogout, 
        updateBarbershopProfile: updateBarbershopProfileInternal, 
        updateClientProfile: updateClientProfileInternal,
        updateSubscription: updateSubscriptionInternal, 
        refreshUserData: refreshUserDataInternal,
        refreshUnreadCount
    }}>
      {children}
    </AuthContext.Provider>
  );
};
