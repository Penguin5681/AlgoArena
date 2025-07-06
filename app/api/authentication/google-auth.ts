import { auth } from "@/app/firebase/config";
import { GoogleAuthProvider, signInWithPopup, signOut, UserCredential } from "firebase/auth";

const googleProvider = new GoogleAuthProvider;
googleProvider.setCustomParameters({prompt: "select_account"});

interface GoogleAuthResponse {
    token: string;
    user: {
        id: number;
        username: string;
        email: string;
        profilePicture: string;
    }
}

export async function signInWithGoogle(): Promise<GoogleAuthResponse> {
    try {
        const result = await signInWithPopup(auth, googleProvider);

        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;

        if (!token) {
            throw new Error('Failed to get access token from google');
        }

        const user = result.user;

        const backendResponse = await authenticateUserWithBackend(result);

        return backendResponse;
    } catch (error: any) {
        console.error('Google sign-in error: ' + error);

        await auth.signOut();

        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error('Sign in cancelled');
        } else {
            throw new Error(error.message || 'Google authentication failed');
        }
    }
}

async function authenticateUserWithBackend(credential: UserCredential): Promise<GoogleAuthResponse> {
  try {
    const idToken = await credential.user.getIdToken();

    const BASE_URL = 'http://localhost:5001';
    
    const response = await fetch(`${BASE_URL}/api/auth/firebase-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        email: credential.user.email,
        name: credential.user.displayName,
        photoURL: credential.user.photoURL,
        uid: credential.user.uid
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Authentication with backend failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Backend authentication error:', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}