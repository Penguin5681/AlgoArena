'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, getUserData, getAuthToken, logout } from '@/app/api/authentication/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
    refreshAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const refreshAuthState = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = getAuthToken();
            const userData = getUserData();

            if (token && userData) {
                setUser(userData);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error("Auth refresh error:", error);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshAuthState();
    }, [refreshAuthState]);

    const handleLogout = () => {
        logout();
        setUser(null);
        router.push('/auth_module/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoading,
            logout: handleLogout,
            refreshAuthState
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}