// ============================================================
// AutoHealX — Firebase Configuration for Multi-Device System
// Secure authentication and device management (STABLE VERSION)
// ============================================================

// For demo purposes, we'll use a mock Firebase setup
// In production, replace with actual Firebase configuration

// Mock Firebase Auth with stable state management
const mockFirebaseAuth = {
  currentUser: null,
  _listeners: [],
  _isProcessing: false, // Prevent concurrent operations
  
  onAuthStateChanged: (callback) => {
    mockFirebaseAuth._listeners.push(callback);
    // For demo, simulate no user initially (only once)
    setTimeout(() => {
      if (mockFirebaseAuth._listeners.includes(callback)) {
        callback(mockFirebaseAuth.currentUser);
      }
    }, 100);
    
    return () => {
      const index = mockFirebaseAuth._listeners.indexOf(callback);
      if (index > -1) mockFirebaseAuth._listeners.splice(index, 1);
    };
  },
  
  _notifyListeners: (user) => {
    // Prevent rapid-fire notifications
    if (mockFirebaseAuth._isProcessing) return;
    
    mockFirebaseAuth._isProcessing = true;
    mockFirebaseAuth.currentUser = user;
    
    // Batch notifications to prevent form refreshes
    setTimeout(() => {
      mockFirebaseAuth._listeners.forEach(callback => {
        try {
          callback(user);
        } catch (error) {
          console.error('Auth listener error:', error);
        }
      });
      mockFirebaseAuth._isProcessing = false;
    }, 50);
  },
  
  signInWithEmailAndPassword: async (email, password) => {
    console.log('🔐 Mock login attempt:', email);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Demo login - accept any email/password
    const mockUser = {
      uid: 'demo-user-' + btoa(email).slice(0, 8),
      email: email,
      displayName: email.split('@')[0],
      photoURL: null
    };
    
    // Notify listeners after a brief delay
    setTimeout(() => mockFirebaseAuth._notifyListeners(mockUser), 100);
    
    return { user: mockUser };
  },
  
  createUserWithEmailAndPassword: async (email, password) => {
    console.log('🔐 Mock signup attempt:', email);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Demo signup
    const mockUser = {
      uid: 'demo-user-' + Date.now(),
      email: email,
      displayName: email.split('@')[0],
      photoURL: null
    };
    
    // Notify listeners after a brief delay
    setTimeout(() => mockFirebaseAuth._notifyListeners(mockUser), 100);
    
    return { user: mockUser };
  },
  
  signOut: async () => {
    console.log('🔐 Mock logout');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setTimeout(() => mockFirebaseAuth._notifyListeners(null), 100);
    return Promise.resolve();
  }
};

// Mock Firestore
const mockFirestore = {
  collection: (name) => ({
    doc: (id) => ({
      set: async (data) => {
        console.log(`[Mock Firestore] Set ${name}/${id}:`, data);
        return Promise.resolve();
      },
      get: async () => ({
        exists: () => false,
        data: () => null
      })
    }),
    where: () => ({
      getDocs: async () => ({
        empty: true,
        docs: []
      })
    })
  })
};

// Mock Google Auth Provider
const mockGoogleAuthProvider = function() {};

// Mock signInWithPopup with stable behavior
const mockSignInWithPopup = async (auth, provider) => {
  console.log('🔐 Mock Google login attempt');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const mockUser = {
    uid: 'demo-google-user-' + Date.now(),
    email: 'demo@gmail.com',
    displayName: 'Demo User',
    photoURL: 'https://via.placeholder.com/40'
  };
  
  // Notify listeners after a brief delay
  setTimeout(() => mockFirebaseAuth._notifyListeners(mockUser), 100);
  
  return { user: mockUser };
};

// Export mock Firebase functions
export const auth = mockFirebaseAuth;
export const db = mockFirestore;

// Mock Firebase functions
export const signInWithEmailAndPassword = mockFirebaseAuth.signInWithEmailAndPassword;
export const createUserWithEmailAndPassword = mockFirebaseAuth.createUserWithEmailAndPassword;
export const signOut = mockFirebaseAuth.signOut;
export const onAuthStateChanged = mockFirebaseAuth.onAuthStateChanged;
export const GoogleAuthProvider = mockGoogleAuthProvider;
export const signInWithPopup = mockSignInWithPopup;

// Mock Firestore functions
export const doc = (db, collection, id) => mockFirestore.collection(collection).doc(id);
export const setDoc = async (docRef, data) => docRef.set(data);
export const getDoc = async (docRef) => docRef.get();
export const collection = (db, name) => mockFirestore.collection(name);
export const query = (collection, ...conditions) => collection;
export const where = (field, operator, value) => ({ field, operator, value });
export const getDocs = async (query) => query.getDocs();

console.log('🔥 AutoHealX Demo Mode - Firebase Mock Initialized (STABLE)');
console.log('📝 Use any email/password to login for demonstration');
console.log('🚀 For signup: Click "Sign Up" tab and enter any email/password');
console.log('⚡ Form auto-refresh issue has been fixed!');

export default { auth, db };