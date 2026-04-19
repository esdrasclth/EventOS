import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { OrdenesProvider } from './contexts/OrdenesContext';
import { UsersProvider } from './contexts/UsersContext';
import './styles/global.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UsersProvider>
          <OrdenesProvider>
            <App />
          </OrdenesProvider>
        </UsersProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
