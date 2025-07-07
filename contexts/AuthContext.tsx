import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, UserType, BarbershopProfile, BarbershopSubscription, SubscriptionPlanTier } from '../types';
import { 
  mockLogin, 
  mockSignupClient, 
  mockLogout, 
  mockGetBarbershopProfile, 
  mockUpdateBarbershopProfile, 
  mockUpdateClientProfile,
  mockGetUserById,
  mockSignupBarbershop as apiSignupBarbershop,
  mockGetBarbershopSubscription,
  mockUpdateSubscription,
} from '../services/mockApiService';
import { useNotification } from './NotificationContext';

interface AuthContextType {
  user: User | null;
  barbershopProfile: BarbershopProfile | null;
  barbershopSubscription: BarbershopSubscription | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User | null>; // Return user on success
  signupClient: (name: string, email: string, phone: string, pass: string) => Promise<User | null>;
  signupBarbershop: (barbershopName: string, responsibleName: string, email: string, phone: string, address: string, pass: string) => Promise<User | null>;
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
  const { addNotification } = useNotification();

  const handleLogout = useCallback(() => {
    mockLogout();
    localStorage.removeItem('user_CorteCerto');
    setUser(null);
    setBarbershopProfile(null);
    setBarbershopSubscription(null);
    addNotification({ message: 'Logout realizado com sucesso.', type: 'info' });
  }, [addNotification]);


  const loadUserDataForAdmin = useCallback(async (adminUser: User) => {
    if (adminUser.type === UserType.ADMIN) {
        try {
            const [profile, subscription] = await Promise.all([
                mockGetBarbershopProfile(adminUser.id),
                mockGetBarbershopSubscription(adminUser.id)
            ]);
            setBarbershopProfile(profile);
            setBarbershopSubscription(subscription);
        } catch (error) {
            console.error("Failed to load admin user data", error);
        }
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const storedUser = localStorage.getItem('user_CorteCerto');
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.type === UserType.ADMIN) {
          await loadUserDataForAdmin(parsedUser);
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, [loadUserDataForAdmin]);

  const handleAuthSuccess = async (loggedInUser: User): Promise<User | null> => {
    localStorage.setItem('user_CorteCerto', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    if (loggedInUser.type === UserType.ADMIN) {
      await loadUserDataForAdmin(loggedInUser);
    }
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
  
  const signupBarbershop = async (barbershopName: string, responsibleName: string, email: string, phone: string, address: string, pass: string): Promise<User | null> => {
    setLoading(true);
    try {
        const newAdminUser = await apiSignupBarbershop(barbershopName, responsibleName, email, phone, address, pass);
        if (newAdminUser) {
            return newAdminUser;
        }
        return null;
    } catch(error) {
        addNotification({ message: `Erro no cadastro da barbearia: ${(error as Error).message}`, type: 'error' });
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
        localStorage.setItem('user_CorteCerto', JSON.stringify(updatedUser));
        if (updatedUser.type === UserType.ADMIN) {
          await loadUserDataForAdmin(updatedUser);
        }
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, loadUserDataForAdmin, handleLogout]);

  const updateBarbershopProfileInternal = async (profileData: Partial<BarbershopProfile>) => {
    if (user && user.type === UserType.ADMIN) {
      setLoading(true);
      try {
        const success = await mockUpdateBarbershopProfile(user.id, profileData);
        if (success) {
          await refreshUserDataInternal();
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
  
  const updateSubscriptionInternal = async (planId: SubscriptionPlanTier): Promise<boolean> => {
    if(user && user.type === UserType.ADMIN) {
        setLoading(true);
        try {
            const success = await mockUpdateSubscription(user.id, planId);
            if(success) {
                await refreshUserDataInternal();
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
  }

  const updateClientProfileInternal = async (clientId: string, profileData: Partial<Pick<User, 'name' | 'phone'>>) => {
    if (user && user.id === clientId && user.type === UserType.CLIENT) {
        setLoading(true);
        try {
            const success = await mockUpdateClientProfile(clientId, profileData);
            if (success) {
                await refreshUserDataInternal();
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
  
  // Placeholder for chat unread count logic
  const refreshUnreadCount = useCallback(async () => {
    // In a real app, this would fetch unread counts from an API
    console.log("Refreshing unread count (mock)...");
    return Promise.resolve();
  }, []);

  return (
    <AuthContext.Provider value={{ 
        user, 
        barbershopProfile, 
        barbershopSubscription,
        loading, 
        login, 
        signupClient, 
        signupBarbershop,
        logout: handleLogout, 
        updateBarbershopProfile: updateBarbershopProfileInternal, 
        updateClientProfile: updateClientProfileInternal,
        updateSubscription: updateSubscriptionInternal,
        refreshUserData: refreshUserDataInternal,
        refreshUnreadCount,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
