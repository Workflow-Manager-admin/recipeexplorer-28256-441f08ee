import React, { useState } from 'react';
import './AuthForm.css';

// PUBLIC_INTERFACE
/**
 * Login/signup authentication form.
 */
export function AuthForm({ mode, onSubmit, toggleMode, loading, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <div className="authform-container">
      <form className="authform" onSubmit={handleSubmit}>
        <h2>{mode === 'signup' ? 'Sign Up' : 'Log In'}</h2>
        <label>Email</label>
        <input
          type="email"
          value={email}
          autoComplete="username"
          onChange={e => setEmail(e.target.value)}
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          autoComplete={mode === 'signup' ? "new-password" : "current-password"}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="authform-error">{error}</div>}
        <button className="btn btn-large" type="submit" disabled={loading}>
          {loading ? "..." : mode === 'signup' ? 'Create Account' : 'Login'}
        </button>
        <div className="authform-switch">
          {mode === 'signup'
            ? (<>Already have an account?{' '}
              <button className="linkbtn" onClick={toggleMode} type="button">Log in</button></>)
            : (<>Don&apos;t have an account?{' '}
              <button className="linkbtn" onClick={toggleMode} type="button">Sign up</button></>)
          }
        </div>
      </form>
    </div>
  );
}
