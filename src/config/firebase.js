// Import the functions you need from the SDKs
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('Firebase Config Loaded:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
});

// Initialize Firebase
let app;
let auth;
let googleProvider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Google sign-in with redirect only (no popup)
export const signInWithGoogleRedirect = async () => {
  console.log('signInWithGoogleRedirect called');
  
  if (!auth || !googleProvider) {
    console.error('Firebase not initialized properly');
    return {
      success: false,
      error: 'Firebase configuration error. Please check your environment variables.'
    };
  }
  
  try {
    await signInWithRedirect(auth, googleProvider);
    console.log('Redirect initiated');
    return {
      success: false,
      redirect: true,
      message: 'Redirecting to Google sign-in...'
    };
  } catch (error) {
    console.error('Redirect sign-in error:', error);
    return {
      success: false,
      error: error.message || 'Unable to sign in with Google. Please try email sign-in instead.'
    };
  }
};

// Handle redirect result (call this on app load)
export const handleRedirectResult = async () => {
  console.log('Checking for redirect result...');
  
  if (!auth) {
    console.error('Firebase auth not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }
  
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log('Redirect result found:', result.user.email);
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
    console.log('No redirect result found');
    return { success: false, noResult: true };
  } catch (error) {
    console.error('Redirect result error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Sign out from Firebase
export const signOutGoogle = async () => {
  try {
    if (auth) {
      await signOut(auth);
    }
    return { success: true };
  } catch (error) {
    console.error('Google sign-out error:', error);
    return { success: false, error: error.message };
  }
};

// Export auth instance
export { auth };

export default auth;