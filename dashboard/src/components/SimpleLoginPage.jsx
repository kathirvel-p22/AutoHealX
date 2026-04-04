// ============================================================
// AutoHealX — PERSISTENT Login Page 
// Maintains login state to prevent redirect back to login
// ============================================================

import { useState, useEffect } from 'react';

const SimpleLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('autohealx_authenticated');
    if (isAuthenticated === 'true') {
      // User is already logged in, redirect to dashboard
      window.location.href = '/?authenticated=true';
    }
  }, []);

  const handleLogin = async () => {
    if (loading) return;
    
    console.log('Login attempt:', { email, password });
    setLoading(true);
    
    // Simple delay to simulate authentication
    setTimeout(() => {
      console.log('Login successful!');
      // Store authentication state persistently
      localStorage.setItem('autohealx_authenticated', 'true');
      localStorage.setItem('autohealx_user', JSON.stringify({
        email: email,
        name: email.split('@')[0],
        loginTime: new Date().toISOString()
      }));
      // Redirect to dashboard
      window.location.href = '/?authenticated=true';
    }, 1000);
  };

  const handleSignup = async () => {
    if (loading) return;
    
    console.log('Signup attempt:', { name, email, password });
    setLoading(true);
    
    // Simple delay to simulate authentication
    setTimeout(() => {
      console.log('Signup successful!');
      // Store authentication state persistently
      localStorage.setItem('autohealx_authenticated', 'true');
      localStorage.setItem('autohealx_user', JSON.stringify({
        email: email,
        name: name || email.split('@')[0],
        loginTime: new Date().toISOString()
      }));
      // Redirect to dashboard
      window.location.href = '/?authenticated=true';
    }, 1000);
  };

  const fillDemo = () => {
    setEmail('demo@autohealx.com');
    setPassword('password123');
    if (isSignup) {
      setName('Demo User');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div className="login-header" style={{ marginBottom: '30px' }}>
          <h1 style={{ color: '#333', margin: '0 0 10px 0' }}>🛡️ AutoHealX</h1>
          <p style={{ color: '#666', margin: 0 }}>System Management Platform</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setIsSignup(false)}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              border: 'none',
              borderRadius: '5px',
              background: !isSignup ? '#667eea' : '#f0f0f0',
              color: !isSignup ? 'white' : '#333',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsSignup(true)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              background: isSignup ? '#667eea' : '#f0f0f0',
              color: isSignup ? 'white' : '#333',
              cursor: 'pointer'
            }}
          >
            Sign Up
          </button>
        </div>

        {isSignup && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          type="button"
          onClick={isSignup ? handleSignup : handleLogin}
          disabled={loading || !email || !password || (isSignup && !name)}
          style={{
            width: '100%',
            padding: '12px',
            border: 'none',
            borderRadius: '5px',
            background: loading ? '#ccc' : '#667eea',
            color: 'white',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '15px'
          }}
        >
          {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
        </button>

        <button
          type="button"
          onClick={fillDemo}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #667eea',
            borderRadius: '5px',
            background: 'white',
            color: '#667eea',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          🚀 Fill Demo Credentials
        </button>

        <div className="login-footer" style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          This is a demo. Use any email/password to login.
        </div>
      </div>
    </div>
  );
};

export default SimpleLoginPage;