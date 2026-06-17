import React, { useState } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Auth onLogin={() => setIsAuthenticated(true)} />;
  }

  return <Dashboard onLogout={() => setIsAuthenticated(false)} />;
}
