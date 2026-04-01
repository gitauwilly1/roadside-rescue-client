// Import the functions you need from the SDKs
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';

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

const missingKeys = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value && key !== 'storageBucket' && key !== 'messagingSenderId')
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.error('Missing Firebase config keys:', missingKeys);
}

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

const isPopupSupported = () => {
  // Check if we're not in a mobile webview and not in an iframe
  const isMobileWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent);
  const isInIframe = window !== window.top;
  return !isMobileWebView && !isInIframe && window.innerWidth > 600;
};

export const signInWithGoogle = async () => {
  console.log('signInWithGoogle called');
  
  if (!auth || !googleProvider) {
    console.error('Firebase not initialized properly');
    return {
      success: false,
      error: 'Firebase configuration error. Please check your environment variables.'
    };
  }
  
  if (isPopupSupported()) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Popup sign-in success:', result.user.email);
      return {
        success: true,
        user: {
          uid: result.user.uid,
          email: result.user.email,
          fullName: result.user.displayName,
          photoURL: result.user.photoURL,
        }
      };
    } catch (error) {
      console.error('Popup sign-in error:', error);
      
      // If popup failed (blocked), fall back to redirect
      if (error.code === 'auth/popup-blocked') {
        console.log('Popup blocked, falling back to redirect');
        return signInWithGoogleRedirect();
      }
      
      return {
        success: false,
        error: error.message || 'Unable to sign in with Google'
      };
    }
  } else {
    return signInWithGoogleRedirect();
  }
};

export const signInWithGoogleRedirect = async () => {
  console.log('signInWithGoogleRedirect called');
  
  if (!auth || !googleProvider) {
    console.error('Firebase not initialized properly');
    return {
      success: false,
      error: 'Firebase configuration error.'
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
      error: error.message || 'Unable to sign in with Google.'
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

export const getFirebaseIdToken = async () => {
  if (!auth || !auth.currentUser) {
    console.log('No authenticated Firebase user');
    return null;
  }
  
  try {
    const token = await auth.currentUser.getIdToken();
    console.log('Firebase ID token retrieved');
    return token;
  } catch (error) {
    console.error('Error getting Firebase ID token:', error);
    return null;
  }
};

export const onFirebaseAuthStateChanged = (callback) => {
  if (!auth) {
    console.error('Firebase auth not initialized');
    return () => {};
  }
  
  return onAuthStateChanged(auth, (user) => {
    console.log('Firebase auth state changed:', user?.email || 'No user');
    callback(user);
  });
};

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

export { auth };

export default auth;