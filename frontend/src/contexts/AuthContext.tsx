import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { api } from '../services/api';
import { useRouter, useSegments } from 'expo-router';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken(true);
          api.setToken(token);
          await api.verifyAuth();
        } catch (e) {
          console.log('Auth verify error:', e);
        }
        setUser(firebaseUser);
      } else {
        api.setToken(null);
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Redirect based on auth state
  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(tabs)';

    if (!user && inAuthGroup) {
      // User logged out but on a protected page -> go to login
      router.replace('/');
    } else if (user && !inAuthGroup && segments[0] !== 'add-recipe' && segments[0] !== 'recipe-detail') {
      // User logged in but on login page -> go to app
      router.replace('/(tabs)/recipes');
    }
  }, [user, loading, segments]);

  // Refresh token every 45 minutes
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const token = await user.getIdToken(true);
        api.setToken(token);
      } catch (e) {
        console.log('Token refresh error:', e);
      }
    }, 45 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const logout = async () => {
    try {
      await signOut(auth);
      api.setToken(null);
      setUser(null);
    } catch (e) {
      console.log('Logout error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
