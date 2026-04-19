import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNav from './components/BottomNav';
import NombreModal from './components/NombreModal';
import UpdateBanner from './components/UpdateBanner';
import OfflineBanner from './components/OfflineBanner';
import { initNotificationScheduler } from './services/notificationScheduler';

const Login      = lazy(() => import('./pages/Login'));
const Home       = lazy(() => import('./pages/Home'));
const Ordenes    = lazy(() => import('./pages/Ordenes'));
const DetalleOrden = lazy(() => import('./pages/DetalleOrden'));
const NuevaOrden = lazy(() => import('./pages/NuevaOrden'));
const Clientes   = lazy(() => import('./pages/Clientes'));
const Actividad  = lazy(() => import('./pages/Actividad'));
const Usuarios   = lazy(() => import('./pages/Usuarios'));
const Productos  = lazy(() => import('./pages/Productos'));
const CargaDelDia = lazy(() => import('./pages/CargaDelDia'));

function shouldHideNav(pathname: string): boolean {
  const detailPattern = /^\/ordenes\/[^/]+(\/editar)?$/;
  return detailPattern.test(pathname);
}

function AppRoutes() {
  const location = useLocation();
  const { user, appUser, loading, refreshAppUser } = useAuth();
  const hideNav = shouldHideNav(location.pathname);

  const needsName =
    !loading &&
    !!user &&
    !!appUser &&
    appUser.activo &&
    !appUser.nombre?.trim() &&
    location.pathname !== '/login';

  return (
    <>
      <UpdateBanner />
      <OfflineBanner />
      {needsName && <NombreModal onDone={() => refreshAppUser()} />}
      <Suspense fallback={null}>
      <div key={location.pathname} className="page-transition">
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
                <Route
                  path="/ordenes/:id/editar"
                  element={
                    <ProtectedRoute roles={['admin', 'staff']}>
                      <NuevaOrden />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/nueva"
                  element={
                    <ProtectedRoute roles={['admin', 'staff']}>
                      <NuevaOrden />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clientes"
                  element={
                    <ProtectedRoute roles={['admin', 'staff']}>
                      <Clientes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/actividad"
                  element={
                    <ProtectedRoute roles={['admin', 'staff']}>
                      <Actividad />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/usuarios"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <Usuarios />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/productos"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <Productos />
                    </ProtectedRoute>
                  }
                />
                <Route path="/carga" element={<CargaDelDia />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>

      </div>
      </Suspense>
      {user && !hideNav && location.pathname !== '/login' && <BottomNav />}
    </>
  );
}

function App() {
  useEffect(() => {
    initNotificationScheduler();
  }, []);

  return <AppRoutes />;
}

export default App;
