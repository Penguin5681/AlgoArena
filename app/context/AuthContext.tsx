'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, getUserData, getAuthToken, logout } from '@/app/api/authentication/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = getAuthToken();
        const userData = getUserData();

        if (token && userData) {
            setUser(userData);
        }
        
        setIsLoading(false);
    }, []);

    const handleLogout = () => {
        logout();
        setUser(null);
        router.push('/auth_module/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            logout: handleLogout
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