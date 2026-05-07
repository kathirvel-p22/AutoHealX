/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'developer' | 'viewer' | 'security';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const SESSION_KEY = 'autohealx_session';

export const localAuth = {
  register: async (data: any): Promise<UserProfile> => {
    // Check if email exists in Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', data.email));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      throw new Error('Identity already exists in registry.');
    }

    const uid = Math.random().toString(36).substring(2, 15);
    const newUser: UserProfile = {
      uid,
      email: data.email,
      displayName: `${data.firstName} ${data.lastName}`,
      role: 'viewer',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Special case: admin@gmail.com is approved admin
    if (data.email === 'admin@gmail.com') {
      newUser.role = 'admin';
      newUser.status = 'approved';
    }

    // 1. Create User Profile in Firestore
    await setDoc(doc(db, 'users', uid), newUser);

    // 2. Create Access Request in Firestore
    await setDoc(doc(db, 'access-requests', uid), {
      ...data,
      id: uid,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return newUser;
  },

  login: async (email: string, pass: string): Promise<UserProfile> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      if (email === 'admin@gmail.com') {
        const adminData = {
          firstName: 'System',
          lastName: 'Administrator',
          email: 'admin@gmail.com'
        };
        const newUser = await localAuth.register(adminData);
        localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
        return newUser;
      }
      throw new Error('Invalid credentials or node not registered.');
    }

    const userData = snapshot.docs[0].data() as UserProfile;

    if (userData.status === 'rejected') {
      throw new Error('Access to this terminal has been permanently revoked.');
    }

    // For a real app, verify pass. Here we just simulate success.
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    return userData;
  },

  getCurrentUser: (): UserProfile | null => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  }
};
