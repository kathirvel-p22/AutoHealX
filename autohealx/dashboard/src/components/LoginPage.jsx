// ============================================================
// AutoHealX — Login Page (COMPLETELY STABLE VERSION)
// NO AUTO-REFRESH - Form stays stable during input
// ============================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const LoginPage = () => {
  // Form state - completely isolated
  const [formData, setFormData] = useState({
    isLogin: true,
    email: '',
    password: '',
    displayName: '',
    loading: false
  });
  
  const formRef = useRef(null);
  const submitTimeoutRef = useRef(null);
  const { login, signup, loginWithGoogle } = useAuth();

  // Prevent any external re-renders from affecting form
  useEffect(() => {
    console.log('🔐 LoginPage mounted - Form is stable');
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  // Update form data without causing re-renders
  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Completely isolated form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔐 Form submission started:', {
      isLogin: formData.isLogin,
      email: formData.email.trim(),
      hasPassword: !!formData.password.trim(),
      hasDisplayName: !!formData.displayName.trim()
    });
    
    // Prevent multiple submissions
    if (formData.loading) {
      console.log('🔐 Already processing, ignoring duplicate submission');
      return false;
    }
    
    // Validate inputs
    const email = formData.email.trim();
    const password = formData.password.trim();
    const displayName = formData.displayName.trim();
    
    if (!email) {
      toast.error('Please enter your email address');
      return false;
    }
    
    if (!password) {
      toast.error('Please enter your password');
      return false;
    }
    
    if (!formData.isLogin && !displayName) {
      toast.error('Please enter your display name');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }
    
    // Set loading state
    updateFormData({ loading: true });
    console.log('🔐 Starting authentication process...');

    try {
      if (formData.isLogin) {
        console.log('🔐 Attempting login for:', email);
        const result = await login(email, password);
        console.log('🔐 Login successful!', result);
        toast.success('Welcome back to AutoHealX!');
      } else {
        console.log('🔐 Attempting signup for:', email);
        const result = await signup(email, password, displayName);
        console.log('🔐 Signup successful!', result);
        toast.success('Account created successfully! Welcome to AutoHealX!');
      }
      
      // Success - don't reset loading, let auth state handle navigation
      console.log('🔐 Authentication completed successfully');
      
    } catch (error) {
      console.error('🔐 Authentication error:', error);
      
      // Reset loading state only on error
      updateFormData({ loading: false });
      
      // Handle specific error messages
      let errorMessage = 'Authentication failed. Please try again.';
      if (error.message) {
        if (error.message.includes('user-not-found')) {
          errorMessage = 'No account found with this email address.';
        } else if (error.message.includes('wrong-password')) {
          errorMessage = 'Incorrect password. Please try again.';
        } else if (error.message.includes('email-already-in-use')) {
          errorMessage = 'An account with this email already exists.';
        } else if (error.message.includes('weak-password')) {
          errorMessage = 'Password is too weak. Please choose a stronger password.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    }
    
    return false; // Prevent any default form behavior
  }, [formData, login, signup, updateFormData]);

  // Google login handler
  const handleGoogleLogin = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (formData.loading) {
      console.log('🔐 Google login already in progress');
      return false;
    }
    
    updateFormData({ loading: true });
    console.log('🔐 Starting Google authentication...');
    
    try {
      const result = await loginWithGoogle();
      console.log('🔐 Google login successful!', result);
      toast.success('Welcome to AutoHealX!');
    } catch (error) {
      console.error('🔐 Google login error:', error);
      updateFormData({ loading: false });
      toast.error('Google login failed. Please try again.');
    }
    
    return false;
  }, [formData.loading, loginWithGoogle, updateFormData]);

  // Quick demo login
  const handleDemoLogin = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (formData.loading) return false;
    
    updateFormData({
      email: 'demo@autohealx.com',
      password: 'password123',
      displayName: formData.isLogin ? formData.displayName : 'Demo User'
    });
    
    toast.success('Demo credentials filled! Click the sign in/up button to continue.');
    return false;
  }, [formData.isLogin, formData.loading, formData.displayName, updateFormData]);

  // Tab switching
  const switchToLogin = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!formData.loading) {
      updateFormData({ isLogin: true });
    }
    return false;
  }, [formData.loading, updateFormData]);

  const switchToSignup = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!formData.loading) {
      updateFormData({ isLogin: false });
    }
    return false;
  }, [formData.loading, updateFormData]);

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-particles"></div>
      </div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">🛡️</div>
            <h1>AutoHealX</h1>
          </div>
          <p className="login-subtitle">
            Secure Multi-Device System Management
          </p>
        </div>

        <div className="login-tabs">
          <button 
            type="button"
            className={`tab ${formData.isLogin ? 'active' : ''}`}
            onClick={switchToLogin}
            disabled={formData.loading}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={`tab ${!formData.isLogin ? 'active' : ''}`}
            onClick={switchToSignup}
            disabled={formData.loading}
          >
            Sign Up
          </button>
        </div>

        <form 
          ref={formRef} 
          onSubmit={handleSubmit} 
          className="login-form" 
          noValidate 
          autoComplete="off"
          style={{ isolation: 'isolate' }}
        >
          {!formData.isLogin && (
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => updateFormData({ displayName: e.target.value })}
                placeholder="Enter your name"
                required={!formData.isLogin}
                disabled={formData.loading}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData({ email: e.target.value })}
              placeholder="Enter your email"
              required
              disabled={formData.loading}
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateFormData({ password: e.target.value })}
              placeholder="Enter your password"
              required
              minLength={6}
              disabled={formData.loading}
              autoComplete="off"
            />
          </div>

          <button 
            type="submit" 
            className="login-button primary"
            disabled={formData.loading || !formData.email.trim() || !formData.password.trim() || (!formData.isLogin && !formData.displayName.trim())}
          >
            {formData.loading ? (
              <div className="loading-spinner"></div>
            ) : (
              formData.isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="login-divider">
          <span>or</span>
        </div>

        <button 
          type="button"
          onClick={handleGoogleLogin}
          className="login-button google"
          disabled={formData.loading}
        >
          <svg className="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Quick Demo Button */}
        <div className="demo-section">
          <p className="demo-text">For quick demo:</p>
          <button 
            type="button"
            onClick={handleDemoLogin}
            className="demo-button"
            disabled={formData.loading}
          >
            🚀 Fill Demo Credentials
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;