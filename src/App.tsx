import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNav from './components/BottomNav';
import NombreModal from './components/NombreModal';
import UpdateBanner from './components/UpdateBanner';

const Login      = lazy(() => import('./pages/Login'));
const Home       = lazy(() => import('./pages/Home'));
const Ordenes    = lazy(() => import('./pages/Ordenes'));
const DetalleOrden = lazy(() => import('./pages/DetalleOrden'));
const NuevaOrden = lazy(() => import('./pages/NuevaOrden'));
const Clientes   = lazy(() => import('./pages/Clientes'));
const Actividad  = lazy(() => import('./pages/Actividad'));

function shouldHideNav(pathname: string): boolean {
  const detailPattern = /^\/ordenes\/[^/]+(\/editar)?$/;
  return detailPattern.test(pathname);
}

function AppRoutes() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const hideNav = shouldHideNav(location.pathname);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user]);

  const needsName = !loading && !!user && !displayName && location.pathname !== '/login';

  return (
    <>
      <UpdateBanner />
      {needsName && <NombreModal onDone={(n) => setDisplayName(n)} />}
      <Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/ordenes" element={<Ordenes />} />
                <Route path="/ordenes/:id" element={<DetalleOrden />} />
                <Route path="/ordenes/:id/editar" element={<NuevaOrden />} />
                <Route path="/nueva" element={<NuevaOrden />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/actividad" element={<Actividad />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>

      </Suspense>
      {user && !hideNav && location.pathname !== '/login' && <BottomNav />}
    </>
  );
}

function App() {
  return <AppRoutes />;
}

export default App;
