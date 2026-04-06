/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import SimpleAuth from './components/SimpleAuth';
import { Loader2 } from 'lucide-react';
import './utils/demoData'; // Initialize demo data

interface LocalUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export default function App() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = localStorage.getItem('autohealx_current_user');
    if (currentUser) {
      try {
        setUser(JSON.parse(currentUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('autohealx_current_user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: LocalUser) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('autohealx_current_user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.2)]" />
          <span className="text-sm font-bold tracking-widest text-slate-500 uppercase animate-pulse">Initializing AutoHealX</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 text-slate-50 font-sans selection:bg-brand-blue/30">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <SimpleAuth onLogin={handleLogin} />
      )}
    </div>
  );
}

