// ============================================================
// AutoHealX — Authentication Context
// Manages user authentication and device access control
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userDevices, setUserDevices] = useState([]);
  const [userRole, setUserRole] = useState('user');

  // Sign up with email and password
  async function signup(email, password, displayName) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore (mock)
      await setDoc(doc(db, 'users', result.user.uid), {
        email: email,
        displayName: displayName || email.split('@')[0],
        role: 'user',
        createdAt: new Date().toISOString(),
        devices: []
      });
      
      return result;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  // Sign in with email and password
  async function login(email, password) {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Sign in with Google
  async function loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      
      // Check if user profile exists, create if not (mock)
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          displayName: result.user.displayName || result.user.email.split('@')[0],
          role: 'user',
          createdAt: new Date().toISOString(),
          devices: []
        });
      }
      
      return result;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  // Sign out
  function logout() {
    return signOut(auth);
  }

  // Add device to user account
  async function addDevice(deviceCode, deviceName) {
    if (!currentUser) return { success: false, message: 'Not authenticated' };

    try {
      // Check if device code exists and is available
      const deviceQuery = query(
        collection(db, 'devices'), 
        where('pairingCode', '==', deviceCode),
        where('status', '==', 'waiting')
      );
      
      const deviceSnapshot = await getDocs(deviceQuery);
      
      if (deviceSnapshot.empty) {
        return { success: false, message: 'Invalid or expired device code' };
      }

      const deviceDoc = deviceSnapshot.docs[0];
      const deviceData = deviceDoc.data();

      // Update device with user ownership
      await setDoc(doc(db, 'devices', deviceDoc.id), {
        ...deviceData,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        deviceName: deviceName || `Device ${Date.now()}`,
        status: 'connected',
        connectedAt: new Date().toISOString(),
        pairingCode: null // Remove pairing code after successful connection
      });

      // Refresh user devices
      await loadUserDevices();

      return { success: true, message: 'Device connected successfully' };
    } catch (error) {
      console.error('Error adding device:', error);
      return { success: false, message: 'Failed to connect device' };
    }
  }

  // Load user devices
  const loadUserDevices = useCallback(async () => {
    if (!currentUser) return;

    try {
      // For demo, create some mock devices
      const mockDevices = [
        {
          id: 'demo-device-123',
          deviceName: 'My Laptop',
          hostname: 'KATHIRVEL',
          platform: 'win32',
          userId: currentUser.uid,
          userEmail: currentUser.email,
          status: 'connected',
          connectedAt: new Date().toISOString(),
          lastHeartbeat: new Date().toISOString(),
          lastMetrics: {
            cpu: 45,
            memory: 76,
            processCount: 312,
            topProcess: 'System'
          }
        },
        {
          id: 'demo-device-456',
          deviceName: 'Lab PC',
          hostname: 'LAB-PC-01',
          platform: 'win32',
          userId: currentUser.uid,
          userEmail: currentUser.email,
          status: 'connected',
          connectedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          lastHeartbeat: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          lastMetrics: {
            cpu: 23,
            memory: 45,
            processCount: 287,
            topProcess: 'chrome.exe'
          }
        },
        {
          id: 'demo-device-789',
          deviceName: 'Server',
          hostname: 'SERVER-01',
          platform: 'linux',
          userId: currentUser.uid,
          userEmail: currentUser.email,
          status: 'connected',
          connectedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          lastHeartbeat: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
          lastMetrics: {
            cpu: 12,
            memory: 34,
            processCount: 156,
            topProcess: 'nginx'
          }
        }
      ];
      
      setUserDevices(mockDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  }, [currentUser]);

  // Load user profile and role
  const loadUserProfile = useCallback(async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role || 'user');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, [currentUser]);

  // Monitor authentication state with MAXIMUM STABILITY
  useEffect(() => {
    console.log('🔐 Setting up auth state listener (STABLE MODE)...');
    
    let isUnmounted = false;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (isUnmounted) {
        console.log('🔐 Component unmounted, ignoring auth state change');
        return;
      }
      
      console.log('🔐 Auth state changed:', user ? `${user.email} (${user.uid})` : 'No user');
      
      // CRITICAL: Prevent any state changes during loading to avoid form refresh
      if (loading) {
        console.log('🔐 Auth context loading - DEFERRING state change to prevent form refresh...');
        setTimeout(() => {
          if (!isUnmounted) {
            setCurrentUser(user);
            if (user) {
              loadUserProfile();
              loadUserDevices();
            } else {
              setUserDevices([]);
              setUserRole('user');
            }
            setLoading(false);
          }
        }, 500); // Longer delay to ensure form stability
        return;
      }
      
      setCurrentUser(user);
      
      if (user) {
        await loadUserProfile();
        await loadUserDevices();
      } else {
        setUserDevices([]);
        setUserRole('user');
      }
      
      setLoading(false);
    });

    return () => {
      isUnmounted = true;
      unsubscribe();
    };
  }, [loadUserProfile, loadUserDevices, loading]); // Add dependencies

  // Refresh devices periodically
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(loadUserDevices, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [currentUser, loadUserDevices]); // Add loadUserDevices dependency

  const value = {
    currentUser,
    userRole,
    userDevices,
    signup,
    login,
    loginWithGoogle,
    logout,
    addDevice,
    loadUserDevices
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}