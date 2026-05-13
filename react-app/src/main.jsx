import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider }  from './context/AuthContext';
import App               from './App';

import './styles/globals.css';

/**
 * Provider order (outer → inner):
 *   BrowserRouter  → enables client-side routing via React Router
 *   ThemeProvider  → applies data-theme on <html> before first paint
 *   AuthProvider   → initialises Firebase and watches auth state
 *   App            → defines the route tree
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
