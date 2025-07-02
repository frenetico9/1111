import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, UserType, BarbershopProfile, BarbershopSubscription, SubscriptionPlanTier } from '../types';
import { 
  mockLogin, 
  mockSignupClient, 
  mockSignupBarbershop, 
  mockLogout, 
  mockGetBarbershopProfile, 
  mockUpdateBarbershopProfile, 
  mockGetBarbershopSubscription, 
  mockUpdateBarbershopSubscription,
  mockUpdateClientProfile
} from '../services/mockApiService';
import { useNotification } from './NotificationContext'; // Re-import if moved or for direct use

interface AuthContextType {
  user: User | null;
  barbershopProfile: BarbershopProfile | null;
  barbershopSubscription: BarbershopSubscription | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User | null>; // Return user on success
  signupClient: (name: string, email: string, phone: string, pass: string) => Promise<User | null>;
  signupBarbershop: (barbershopName: string, responsible: string, email: string, phone: string, address: string, pass: string) => Promise<User | null>;
  logout: () => void;
  updateBarbershopProfile: (profileData: Partial<BarbershopProfile>) => Promise<boolean>;
  updateClientProfile: (clientId: string, profileData: Partial<Pick<User, 'name' | 'phone' | 'email'>>) => Promise<boolean>;
  updateSubscription: (planId: SubscriptionPlanTier) => Promise<boolean>;
  refreshUserData: () => Promise<void>; // To reload user-specific data
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
      }
      setLoading(false);
    };
    initializeAuth();
  }, [loadUserDataForAdmin]);

  const handleAuthSuccess = async (loggedInUser: User): Promise<User | null> => {
    localStorage.setItem('nav_user_NavalhaDigital', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    if (loggedInUser.type === UserType.ADMIN) {
      await loadUserDataForAdmin(loggedInUser);
    }
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

  const logout = () => {
    mockLogout(); // Simulate server logout
    localStorage.removeItem('nav_user_NavalhaDigital');
    setUser(null);
    setBarbershopProfile(null);
    setBarbershopSubscription(null);
    addNotification({ message: 'Logout realizado com sucesso.', type: 'info' });
  };

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

  const updateClientProfileInternal = async (clientId: string, profileData: Partial<Pick<User, 'name' | 'phone' | 'email'>>) => {
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

  const refreshUserDataInternal = useCallback(async () => {
    if (user) {
      setLoading(true);
      const storedUser = localStorage.getItem('nav_user_NavalhaDigital'); // Re-fetch from storage to ensure consistency
      if (storedUser) {
          const refreshedUser: User = JSON.parse(storedUser);
           // If user details were updated (e.g. name from profile), update user state
           const updatedCoreUser = await mockLogin(refreshedUser.email, "mockPassword"); // Simulate re-fetching user core data
           if(updatedCoreUser) {
             setUser(updatedCoreUser);
             localStorage.setItem('nav_user_NavalhaDigital', JSON.stringify(updatedCoreUser)); // Update storage
             if (updatedCoreUser.type === UserType.ADMIN) {
               await loadUserDataForAdmin(updatedCoreUser);
             }
           } else { // Fallback if mockLogin fails for some reason
             setUser(refreshedUser);
             if (refreshedUser.type === UserType.ADMIN) {
               await loadUserDataForAdmin(refreshedUser);
             }
           }
      } else {
        // User was removed from storage, effectively logged out
        setUser(null);
        setBarbershopProfile(null);
        setBarbershopSubscription(null);
      }
      setLoading(false);
    }
  }, [user, loadUserDataForAdmin]);


  return (
    <AuthContext.Provider value={{ 
        user, 
        barbershopProfile, 
        barbershopSubscription, 
        loading, 
        login, 
        signupClient, 
        signupBarbershop, 
        logout, 
        updateBarbershopProfile: updateBarbershopProfileInternal, 
        updateClientProfile: updateClientProfileInternal,
        updateSubscription: updateSubscriptionInternal, 
        refreshUserData: refreshUserDataInternal 
    }}>
      {children}
    </AuthContext.Provider>
  );
};