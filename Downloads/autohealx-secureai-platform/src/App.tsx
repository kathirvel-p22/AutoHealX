/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, LogIn, Activity, AlertCircle, History, Terminal as IconTerminal, PlusCircle, RefreshCw, Clock } from 'lucide-react';
import { signIn, db, handleFirestoreError, OperationType, logout } from './lib/firebase';
import { localAuth, UserProfile } from './lib/localAuth';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, limit, setDoc } from 'firebase/firestore';
import { Sidebar } from './components/Sidebar';
import { IncidentList, Incident } from './components/IncidentList';
import { IncidentDetails } from './components/IncidentDetails';
import { IncidentDetailsEnhanced } from './components/IncidentDetailsEnhanced';
import { DashboardHome } from './components/DashboardHome';
import { ActionsQueue } from './components/ActionsQueue';
import { LogStream } from './components/LogStream';
import { AuditChain } from './components/AuditChain';
import { UserList } from './components/UserList';
import { ProvisioningList } from './components/ProvisioningList';
import { ChatBot } from './components/ChatBot';
import { TopologyGraph } from './components/topology/TopologyGraph';
import { MissionControl } from './components/mission-control/MissionControl';
import { useSocket } from './hooks/useSocket';
import { analyzeIncident } from './services/geminiService';
import { agentOrchestrator } from './services/agentOrchestrator';
import { AgentOrchestrationResult } from './types/agents';
import { cn } from './lib/utils';

// --- Sub-components ---

const Login = ({ onLogin, onShowRequest }: { onLogin: (email: string, pass: string) => Promise<void>, onShowRequest: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Left Panel: Brand & Visuals */}
      <div className="hidden md:flex md:w-[55%] relative bg-background flex-col justify-center px-12 lg:px-24 border-r border-border">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,#00FFC215_0%,transparent_50%)]" />
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,#3b82f610_0%,transparent_50%)]" />
          
          {/* Decorative Grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded border border-primary/20">
              <ShieldCheck className="text-primary w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">AutoHealX</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl lg:text-8xl font-black text-white mb-8 leading-[0.9] tracking-tighter">
              THE TRUSTED<br />
              <span className="text-primary">REPAIR LAYER</span>
            </h1>
            <p className="text-gray-400 text-xl max-w-lg leading-relaxed mb-12 font-light">
              Automating incident remediation with cryptographic signatures and AI-driven root cause analysis.
            </p>

            <div className="flex gap-12">
               <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-[0.2em]">Validated Actions</p>
                  <p className="text-3xl font-bold text-white">4.2M+</p>
               </div>
               <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-[0.2em]">Avg Health Score</p>
                  <p className="text-3xl font-bold text-primary">99.2</p>
               </div>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-12 left-12 lg:left-24 flex items-center gap-8 text-[10px] font-mono text-gray-600">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              NODE_W2_ACTIVE
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              ENCRYPTION_AES256
           </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-24 bg-background">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-3 tracking-tighter uppercase">Terminal Login</h3>
            <p className="text-muted-foreground text-sm font-light">Authenticate with your corporate credentials to access the bridge.</p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] font-mono">Operator Identity</label>
              <div className="relative group">
                 <input 
                   type="email" 
                   required
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   placeholder="operator@autohealx.io"
                   className="w-full h-14 bg-card border border-border rounded-sm px-5 text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all group-hover:border-border/80"
                 />
                 <div className="absolute right-5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/20 group-focus-within:bg-primary transition-colors animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] font-mono">Encryption Key</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 bg-card border border-border rounded-sm px-5 text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all hover:border-border/80"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono">
               <label className="flex items-center gap-2 text-gray-500 cursor-pointer hover:text-gray-400 transition-colors">
                  <input type="checkbox" className="rounded-sm border-[#2D3139] bg-[#15171A] text-primary focus:ring-0 focus:ring-offset-0" />
                  PERSIST_SESSION
               </label>
               <button type="button" className="text-primary/70 hover:text-primary transition-colors tracking-widest uppercase text-[10px]">RECOVERY_KEY?</button>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-16 bg-[#00FFC2] text-[#0B0C0E] font-black text-sm tracking-[0.2em] uppercase flex items-center justify-center gap-4 hover:translate-y-[-4px] hover:shadow-[0_12px_48px_rgba(0,255,194,0.4)] active:translate-y-[-2px] transition-all rounded-sm group border border-white/20 disabled:opacity-50 disabled:translate-y-0"
              >
                {isLoggingIn ? 'AUTHENTICATING...' : (
                  <>
                    <span>Log In to Terminal</span>
                    <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-16 pt-10 border-t border-[#1C1F23] flex items-center justify-between">
             <span className="text-[11px] text-gray-600 font-mono tracking-widest uppercase">Unregistered Terminal?</span>
             <button onClick={onShowRequest} className="text-primary font-black text-[11px] uppercase tracking-[0.2em] hover:underline decoration-2 underline-offset-8">
                Request Access
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RequestAccess = ({ onBack, onSubmit }: { onBack: () => void, onSubmit: (data: any) => Promise<void> }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'L3 Site Reliability Engineer',
    publicKey: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#060709] flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full bg-[#0B0C0E] border border-[#2D3139] p-12 text-center rounded-sm">
           <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
              <PlusCircle className="text-primary w-8 h-8" />
           </div>
           <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-tighter">Request Received</h3>
           <p className="text-gray-500 mb-8 leading-relaxed font-mono text-[10px] tracking-widest uppercase">
              Your enrollment request has been logged to the immutable audit chain. 
              An administrator will verify your credentials and PGP key.
           </p>
           <button 
             onClick={onBack}
             className="w-full h-14 bg-primary text-[#0B0C0E] font-black text-xs uppercase tracking-[0.2em] rounded-sm hover:bg-white transition-all shadow-[0_0_32px_rgba(0,255,194,0.1)]"
           >
             Return to login
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060709] flex flex-col md:flex-row overflow-hidden font-sans">
      <div className="hidden md:flex md:w-[40%] bg-[#0B0C0E] border-r border-[#1C1F23] flex-col justify-center p-12 lg:p-24 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,#00FFC210_0%,transparent_50%)]" />
         
         <div className="relative z-10">
           <div className="flex items-center gap-3 mb-16">
              <ShieldCheck className="text-primary w-8 h-8" />
              <span className="text-xl font-bold tracking-tighter text-white">AutoHealX</span>
           </div>
           <h2 className="text-5xl font-black text-white mb-8 uppercase tracking-tighter leading-[0.9]">Terminal<br /><span className="text-primary">Enrollment</span></h2>
           <p className="text-gray-500 leading-relaxed font-mono text-[11px] uppercase tracking-[0.2em] max-w-xs">
              Operator enrollment requires multi-factor validation and cryptographic key submission for audit non-repudiation.
           </p>
         </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 lg:px-24 bg-[#060709] overflow-y-auto">
        <div className="max-w-md w-full mx-auto py-12">
          <div className="mb-10">
             <button onClick={onBack} className="text-[10px] text-primary font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all mb-8 border border-primary/20 px-4 py-2 rounded-sm bg-primary/5">
                ← Return to bridge
             </button>
             <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Request Access</h3>
          </div>

          <form className="space-y-6" onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] font-mono">First Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full h-12 bg-[#0B0C0E] border border-[#2D3139] rounded-sm px-4 text-white focus:border-primary outline-none transition-all placeholder:text-gray-700 font-mono text-sm"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] font-mono">Last Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full h-12 bg-[#0B0C0E] border border-[#2D3139] rounded-sm px-4 text-white focus:border-primary outline-none transition-all placeholder:text-gray-700 font-mono text-sm"
                  />
               </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] font-mono">Corporate Email</label>
              <input 
                type="email" 
                required
                placeholder="operator@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-12 bg-[#0B0C0E] border border-[#2D3139] rounded-sm px-4 text-white focus:border-primary outline-none transition-all placeholder:text-gray-700 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] font-mono">Terminal Password</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full h-12 bg-[#0B0C0E] border border-[#2D3139] rounded-sm px-4 text-white focus:border-primary outline-none transition-all placeholder:text-gray-700 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] font-mono">Designated Role</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full h-12 bg-[#0B0C0E] border border-[#2D3139] rounded-sm px-4 text-white focus:border-primary outline-none appearance-none transition-all font-mono text-sm"
              >
                 <option>L3 Site Reliability Engineer</option>
                 <option>Security Operations Center</option>
                 <option>Security Engineer</option>
                 <option>Core Infrastructure Team</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] font-mono">Master PGP Public Key</label>
              <textarea 
                placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----"
                rows={3}
                required
                value={formData.publicKey}
                onChange={(e) => setFormData({ ...formData, publicKey: e.target.value })}
                className="w-full bg-[#0B0C0E] border border-[#2D3139] rounded-sm p-4 text-white text-[10px] font-mono focus:border-primary outline-none resize-none transition-all placeholder:text-gray-700 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-16 bg-[#00FFC2] text-[#0B0C0E] font-black text-sm tracking-[0.2em] uppercase flex items-center justify-center gap-3 hover:translate-y-[-4px] hover:shadow-[0_12px_48px_rgba(0,255,194,0.2)] active:translate-y-[-2px] transition-all rounded-sm disabled:opacity-50 border border-white/10"
            >
              {isSubmitting ? 'PROCESSING...' : (
                <>
                  Submit Enrollment
                  <PlusCircle className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [orchestrationResults, setOrchestrationResults] = useState<Map<string, AgentOrchestrationResult>>(new Map());
  
  const { socket, isConnected: socketConnected } = useSocket();

  // Auth Initial Load & Real-time Profile Listener
  useEffect(() => {
    const currentUser = localAuth.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
        if (doc.exists()) {
          const updatedUser = doc.data() as UserProfile;
          setUser(updatedUser);
          // Sync local storage
          localStorage.setItem('autohealx_session', JSON.stringify(updatedUser));
        } else {
          // User deleted from DB
          setUser(null);
          localStorage.removeItem('autohealx_session');
        }
      });
      setAuthChecking(false);
      return unsub;
    } else {
      setUser(null);
      setAuthChecking(false);
    }
  }, []);

  // Socket Listener for Raw Logs
  useEffect(() => {
    if (!socket || !user) return;

    socket.on('raw_logs_ingested', async (data: any) => {
      console.log('Backend relayed raw logs:', data);
      try {
        // Perform AI Analysis in the frontend as per skill guidelines
        const analysis = await analyzeIncident(data.logs);
        
        // Run full agent orchestration
        const orchestrationResult = await agentOrchestrator.analyzeIncident(
          data.id,
          data.logs,
          data.serviceName
        );
        
        // Store orchestration results
        setOrchestrationResults(prev => new Map(prev).set(data.id, orchestrationResult));
        
        // Save to Firestore with a specific ID mapping
        await setDoc(doc(db, 'incidents', data.id), {
          serviceName: data.serviceName,
          message: data.logs.split('\n')[1].trim(), // Extract a snippet as message
          createdAt: new Date().toISOString(),
          ...analysis,
          status: 'open'
        });

        // Audit Log for Incident Detection
        await addDoc(collection(db, 'audit_logs'), {
          type: 'INCIDENT.DETECTED',
          user: 'SYSTEM',
          role: 'KERNEL',
          content: `Incident [${data.id}] detected in ${data.serviceName}: ${analysis.severity} vulnerability. AI orchestration completed with ${orchestrationResult.overallConfidence}% confidence.`,
          createdAt: new Date().toISOString(),
          metadata: {
            service: data.serviceName,
            severity: analysis.severity,
            incidentId: data.id,
            agentCount: orchestrationResult.analyses.length,
            confidence: orchestrationResult.overallConfidence
          }
        });
      } catch (err) {
        console.error('Frontend analysis failed:', err);
      }
    });

    return () => {
      socket.off('raw_logs_ingested');
    };
  }, [socket, user]);

  // Firestore Incidents Listener
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'incidents'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
      setIncidents(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'incidents');
    });

    return unsubscribe;
  }, [user]);

  const handleLogin = async (email: string, pass: string) => {
    try {
      const u = await localAuth.login(email, pass);
      setUser(u);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleLogout = async () => {
    localAuth.logout();
    setUser(null);
  };

  const handleApproveFix = async (incident: Incident, actionType: string) => {
    if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
      alert('ACCESS_DENIED: Incident mitigation requires higher-level authorization.');
      return;
    }
    
    try {
      // 1. Get Crypto Signature from Backend
      const signRes = await fetch('/api/sign-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId: incident.id,
          data: { incidentId: incident.id, actionType, timestamp: Date.now(), approvedBy: user.email }
        })
      });
      const { signature } = await signRes.json();

      // 2. Update Firestore Incident
      const incidentRef = doc(db, 'incidents', incident.id);
      await updateDoc(incidentRef, {
        status: 'resolved',
        signature,
        updatedAt: new Date().toISOString()
      });

      // Audit Log for Mitigation Approval
      await addDoc(collection(db, 'audit_logs'), {
        type: 'INCIDENT.RESOLVED',
        user: user.email,
        role: user.role.toUpperCase(),
        content: `Mitigation action executed for incident [${incident.id}]. Cluster stabilized.`,
        createdAt: new Date().toISOString(),
        metadata: {
          incidentId: incident.id,
          action: actionType,
          signature: signature
        }
      });

      // 3. Create Action Record
      await addDoc(collection(db, `incidents/${incident.id}/actions`), {
        id: crypto.randomUUID(),
        incidentId: incident.id,
        type: actionType,
        riskLevel: incident.severity === 'critical' ? 'high' : 'medium',
        status: 'executed',
        approvedBy: user.email,
        createdAt: new Date().toISOString(),
        signature
      });

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'incidents/actions');
    }
  };

  const simulateIncident = async () => {
    setIsSimulating(true);
    try {
      await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: 'checkout-service',
          logs: `
            [2026-04-25 18:00:22] ERROR checkout-service: Failed to connect to payment-gate:3000
            [2026-04-25 18:00:23] ERROR checkout-service: Connection timeout after 5000ms
            [2026-04-25 18:00:25] WARNING checkout-service: Dropping 43 customer orders from queue
            [2026-04-25 18:00:26] CRITICAL checkout-service: Memory usage spiking to 94%
          `
        })
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRequestAccess = async (data: any) => {
    try {
      const newUser = await localAuth.register(data);
      // Auto-set user local session so they see the pending screen
      localStorage.setItem('autohealx_session', JSON.stringify(newUser));
      setUser(newUser);
    } catch (err) {
      console.error(err);
      alert('Registration failed: ' + (err as Error).message);
      throw err;
    }
  };

  if (authChecking) {
    return (
      <div className="h-screen bg-[#0c0d0e] flex items-center justify-center flex-col gap-4">
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
           className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]"
        />
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Initialising Secure Context...</p>
      </div>
    );
  }

  if (!user) {
    if (showRequestAccess) {
      return <RequestAccess onBack={() => setShowRequestAccess(false)} onSubmit={handleRequestAccess} />;
    }
    return <Login onLogin={handleLogin} onShowRequest={() => setShowRequestAccess(true)} />;
  }

  if (user && user.status !== 'approved') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md w-full bg-card border border-border p-12 rounded-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 animate-pulse" />
           <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-yellow-500/20">
              <Clock className="text-yellow-500 w-10 h-10" />
           </div>
           <h3 className="text-3xl font-black text-foreground mb-6 uppercase tracking-tighter">Access Pending</h3>
           <p className="text-muted-foreground mb-10 leading-relaxed font-mono text-[11px] uppercase tracking-[0.2em]">
              Your identity has been captured. The bridge remains locked until a senior administrator validates your enrollment request.
           </p>
           <button 
             onClick={handleLogout}
             className="w-full h-14 border border-border text-muted-foreground font-black text-xs uppercase tracking-[0.2em] rounded-sm hover:text-foreground hover:border-foreground transition-all"
           >
             Disconnect Terminal
           </button>
           
           <div className="mt-8 pt-8 border-t border-secondary flex items-center justify-between text-[9px] font-mono text-gray-500">
              <span>NODE_ID: {user.uid.substring(0, 12)}...</span>
              <span>STATUS: {user.status.toUpperCase()}</span>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[64px] border-b border-border flex items-center justify-between px-8 bg-card">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">System Link Active</span>
             </div>
             <div className="h-4 w-px bg-border" />
             <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                <span>COORD: 37.7749° N, 122.4194° W</span>
                <span className="opacity-30">|</span>
                <span>ZONE: US-WEST-1</span>
             </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex gap-8">
               <div className="text-right">
                 <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Fleet MTTR</span>
                 <div className="font-mono text-sm text-foreground">00:14:22 <span className="text-primary text-[10px] ml-1">↓ 12%</span></div>
               </div>
               <div className="text-right">
                 <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Threat Level</span>
                 <div className="font-mono text-sm text-[#F27D26]">ELEVATED</div>
               </div>
            </div>

            {(user.role === 'admin' || user.role === 'developer') && (
              <button
                onClick={simulateIncident}
                disabled={isSimulating}
                className="group relative px-6 py-2 bg-secondary border border-border text-foreground flex items-center gap-3 overflow-hidden transition-all hover:border-primary/50"
              >
                <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform" />
                <RefreshCw className={cn("w-3.5 h-3.5 text-primary", isSimulating && "animate-spin")} />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] relative z-10">
                  {isSimulating ? 'Processing...' : 'Deep Scan'}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 p-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
           {activeTab === 'dashboard' && <DashboardHome incidents={incidents} />}
           {activeTab === 'mission-control' && (user.role === 'admin' || user.role === 'developer' || user.role === 'security' || user.role === 'viewer') && (
             <div className="h-full">
               <MissionControl incidents={incidents} orchestrationResults={orchestrationResults} />
             </div>
           )}
           {activeTab === 'topology' && (user.role === 'admin' || user.role === 'developer' || user.role === 'security' || user.role === 'viewer') && (
             <div className="h-full">
               <TopologyGraph onNodeSelect={(node) => console.log('Selected node:', node)} />
             </div>
           )}
           {activeTab === 'incidents' && (user.role === 'admin' || user.role === 'developer' || user.role === 'security' || user.role === 'viewer') && (
             <div className="h-full flex gap-px bg-border border border-border overflow-hidden">
               <div className="w-[450px] bg-background">
                 <div className="p-4 border-b border-border">
                   <span className="terminal-label">Operational Feed</span>
                 </div>
                 <div className="flex-1 overflow-y-auto">
                    <IncidentList 
                      incidents={incidents} 
                      onSelect={setSelectedIncident} 
                      selectedId={selectedIncident?.id}
                    />
                 </div>
               </div>
               <div className="flex-1 bg-[#15171A]">
                  <AnimatePresence mode="wait">
                    {selectedIncident ? (
                      <motion.div
                        key={selectedIncident.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full"
                      >
                        <IncidentDetailsEnhanced 
                          incident={selectedIncident} 
                          orchestrationResult={orchestrationResults.get(selectedIncident.id)}
                          onApproveFix={handleApproveFix} 
                        />
                      </motion.div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center">
                        <span className="terminal-label opacity-40">Select source for AI mapping</span>
                      </div>
                    )}
                  </AnimatePresence>
               </div>
             </div>
           )}
           {activeTab === 'actions' && (user.role === 'admin' || user.role === 'developer' || user.role === 'viewer') && (
             <ActionsQueue 
               incidents={incidents}
               onViewIncident={(incidentId) => {
                 // Find the incident
                 const incident = incidents.find(i => i.id === incidentId);
                 if (incident) {
                   // Switch to incidents tab
                   setActiveTab('incidents');
                   // Select the incident
                   setSelectedIncident(incident);
                 }
               }}
             />
           )}
           {activeTab === 'logs' && (user.role === 'admin' || user.role === 'developer' || user.role === 'viewer') && <LogStream />}
           {activeTab === 'audit' && (user.role === 'admin' || user.role === 'security' || user.role === 'developer' || user.role === 'viewer') && <AuditChain />}
           {activeTab === 'rbac' && user.role === 'admin' && <UserList />}
           {activeTab === 'provisioning' && user.role === 'admin' && <ProvisioningList />}
        </div>
        <ChatBot />
      </main>
    </div>
  );
}
