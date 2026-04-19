import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { OrdenesProvider } from './contexts/OrdenesContext';
import { UsersProvider } from './contexts/UsersContext';
import { ProductosProvider } from './contexts/ProductosContext';
import './styles/global.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UsersProvider>
          <ProductosProvider>
            <OrdenesProvider>
              <App />
            </OrdenesProvider>
          </ProductosProvider>
        </UsersProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
