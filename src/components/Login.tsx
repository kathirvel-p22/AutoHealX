import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'motion/react';
import { Shield, Mail, Lock, LogIn, UserPlus, Github } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-950 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none" />
      
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-blue/10 blur-[120px] rounded-full animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-purple/10 blur-[120px] rounded-full animate-pulse pointer-events-none" delay-1000="" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mx-auto h-20 w-20 bg-gradient-to-br from-brand-blue to-brand-indigo rounded-[2rem] flex items-center justify-center shadow-2xl shadow-brand-blue/20 mb-8 relative group"
          >
            <Shield className="h-10 w-10 text-white relative z-10" />
            <div className="absolute inset-0 bg-white/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
          <h2 className="text-5xl font-extrabold tracking-tighter text-white mb-3 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
            AutoHealX
          </h2>
          <p className="text-slate-400 font-medium tracking-wide">Autonomous System Monitoring & Healing</p>
        </div>

        <div className="glass-card p-8 shadow-brand-blue/5 relative overflow-hidden group">
          <div className="absolute inset-0 shimmer-effect opacity-10 pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-brand-red/10 border border-brand-red/20 rounded-2xl text-brand-red text-sm text-center font-medium"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within/input:text-brand-blue transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all placeholder:text-slate-600"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within/input:text-brand-blue transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue/50 transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-blue to-brand-indigo hover:from-brand-indigo hover:to-brand-blue text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-brand-blue/20 active:scale-[0.98]"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLogin ? (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign In to Dashboard
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Create Your Account
                </>
              )}
            </button>
          </form>

          <div className="mt-10 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
              <span className="px-4 bg-surface-900/40 backdrop-blur-xl text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-surface-950/50 border border-white/5 hover:bg-surface-900/80 text-white py-4 rounded-2xl transition-all font-semibold group/google"
            >
              <svg className="h-5 w-5 group-hover/google:scale-110 transition-transform" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm font-medium">
          {isLogin ? "New to AutoHealX?" : "Already have an account?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-brand-blue hover:text-brand-indigo font-bold transition-colors underline underline-offset-4 decoration-brand-blue/30"
          >
            {isLogin ? 'Create an account' : 'Sign in here'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
