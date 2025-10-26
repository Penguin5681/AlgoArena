import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5000';

export interface User {
    id: number;
    username: string;
    email: string;
    profile_picture?: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export interface SignupRequest {
    username: string;
    email: string;
    password: string;
    profilePicture: string;
}

export interface LoginRequest {
    identifier: string;
    password: string;
}

export const signup = async (data: SignupRequest): Promise<void> => {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Sign Up Failed");
        }

        return await response.json();
    } catch (error) {
        console.error("Signup Error: " + error);
        throw error;
    }
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Login Failed");
        }

        return await response.json();
    } catch (error) {
        console.error("Login Error: " + error);
        throw error;
    }
};

export const saveAuthToken = (token: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
    }
};

export const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        return token === 'undefined' || token === null ? null : token;
    }
    return null;
};

export const removeAuthToken = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_profile_data');
    }
};

export const saveUserData = (user: User): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('user_data', JSON.stringify(user));
    }
};

export const getUserData = (): User | null => {
    if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('user_data');
        if (!userData || userData === 'undefined' || userData === 'null') {
            return null;
        }
        try {
            return JSON.parse(userData);
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('user_data');
            return null;
        }
    }
    return null;
};

export const isAuthenticated = (): boolean => {
    return getAuthToken() !== null; 
};

export const logout = (): void => {
    removeAuthToken();
};