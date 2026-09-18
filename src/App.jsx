import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import NetworkBackground from './components/common/NetworkBackground';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NetworkBackground />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
