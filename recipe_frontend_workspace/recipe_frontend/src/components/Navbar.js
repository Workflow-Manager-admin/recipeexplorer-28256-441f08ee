import React from 'react';
import './Navbar.css';

// PUBLIC_INTERFACE
/**
 * Top navigation bar component with logo, navigation, and authentication actions.
 */
export default function Navbar({ isAuthenticated, onLogin, onLogout }) {
  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <span className="logo">
          <span className="logo-symbol">*</span> Recipe Explorer
        </span>
        <div className="navbar-actions">
          {/* Example for extensible nav: Home/About links, etc */}
          <a href="/" className="navbar-link">Home</a>
          {/* Auth Buttons */}
          {isAuthenticated ? (
            <button className="btn" onClick={onLogout}>Logout</button>
          ) : (
            <button className="btn" onClick={onLogin}>Login</button>
          )}
        </div>
      </div>
    </nav>
  );
}
