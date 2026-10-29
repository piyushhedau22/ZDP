// ======================================================
// Login.jsx
// ------------------------------------------------------
// This is the Login page.
// User must enter email and password.
// After successful login, a token is saved in localStorage
// and the user is redirected to the Workflow Builder.
// ======================================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Basic validation
    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }

    // ====================================================
    // For now we are using mock authentication.
    // Later this will be connected to the real backend API.
    // We generate a simple token and save it in localStorage.
    // ====================================================
    const token = 'mock-jwt-token-' + Date.now();

    // Save token and user info
    localStorage.setItem('authToken', token);
    localStorage.setItem('userEmail', email);

    // Redirect to Workflow Builder
    navigate('/workflow');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login to FlowForge</h2>
        <p style={styles.subtitle}>Enter your credentials to continue</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

// Simple styles
const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    background: '#0f172a',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    background: '#1e293b',
    padding: '40px',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
  },
  title: {
    color: 'white',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: '24px',
    fontSize: '14px',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    color: '#e2e8f0',
    marginBottom: '6px',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #334155',
    background: '#0f172a',
    color: 'white',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
  },
  error: {
    background: '#ef4444',
    color: 'white',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '16px',
    textAlign: 'center',
    fontSize: '14px',
  },
  footerText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px',
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
  },
};

export default Login;