import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from AsyncStorage (Slide 20)
  useEffect(() => {
    let isMounted = true;

    // Safety timeout: memastikan splash / spinner tidak stuck selamanya di HP Android
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 400);

    const restoreSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('auth_token');
        const storedUser = await AsyncStorage.getItem('auth_user');

        if (storedToken && storedToken !== 'null' && storedToken !== 'undefined') {
          setToken(storedToken);
        }
        if (storedUser && storedUser !== 'null' && storedUser !== 'undefined') {
          try {
            setUser(JSON.parse(storedUser));
          } catch (err) {
            console.warn('[AUTH] Error parsing storedUser from AsyncStorage:', err);
          }
        }
      } catch (e) {
        console.error('Failed to restore auth session', e);
      } finally {
        if (isMounted) {
          clearTimeout(fallbackTimer);
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Save JWT Token & Login (Slide 19)
  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });

    const resData = response.data;
    // Support both { token, user } and { data: { token, user } } formats
    const receivedToken = resData?.token || resData?.data?.token;
    const receivedUser = resData?.user || resData?.data?.user;

    if (!receivedToken) {
      console.warn('⚠️ [AUTH] Response login tidak memuat token:', resData);
      throw new Error('Token login tidak diterima dari server.');
    }

    await AsyncStorage.setItem('auth_token', String(receivedToken));
    setToken(receivedToken);

    if (receivedUser) {
      await AsyncStorage.setItem('auth_user', JSON.stringify(receivedUser));
      setUser(receivedUser);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    await api.post('/auth/register', {
      name,
      email,
      password,
    });
    // Auto login after register
    await login(email, password);
  };

  // Logout (Slide 21)
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error('Failed to logout', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
