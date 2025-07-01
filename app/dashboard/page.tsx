'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardScreen() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth_module/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Dashboard</h1>
                <button onClick={logout} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                    Logout
                </button>
            </div>
            
            <div>
                <h2>Welcome, {user?.username}!</h2>
                <p>Email: {user?.email}</p>
                <p>User ID: {user?.id}</p>
            </div>
            
            <div>
                <h3>Your Algo Arena Journey Starts Here</h3>
                <p>This is where you'll practice algorithms, compete with others, and grow with your squad.</p>
            </div>
        </div>
    )
}