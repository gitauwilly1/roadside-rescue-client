import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Add scopes if needed
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Google sign-in with popup (with fallback to redirect)
export const signInWithGoogle = async () => {
  try {
    // Try popup first
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName,
        photoURL: user.photoURL,
      }
    };
  } catch (error) {
    console.error('Google sign-in error:', error);
    
    // If popup is blocked, try redirect method
    if (error.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, googleProvider);
        // After redirect, user will come back to the app
        return {
          success: false,
          redirect: true,
          message: 'Redirecting to Google sign-in...'
        };
      } catch (redirectError) {
        console.error('Redirect sign-in error:', redirectError);
        return {
          success: false,
          error: 'Please allow popups for this site to sign in with Google, or try using email sign-in instead.'
        };
      }
    }
    
    return {
      success: false,
      error: error.message || 'Google sign-in failed. Please try email sign-in instead.'
    };
  }
};

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const user = result.user;
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName,
          photoURL: user.photoURL,
        }
      };
    }
    return { success: false, noResult: true };
  } catch (error) {
    console.error('Redirect result error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const signOutGoogle = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Google sign-out error:', error);
    return { success: false, error: error.message };
  }
};

// Export auth instance
export { auth };

export default auth;