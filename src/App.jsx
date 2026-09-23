import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ClubDataProvider } from './context/ClubDataContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <ClubDataProvider>
            <AppRoutes />
          </ClubDataProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;

