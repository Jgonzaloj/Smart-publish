import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Lazy Loading para optimizar el bundle inicial
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Composer = lazy(() => import('./pages/Composer').then(module => ({ default: module.Composer })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const FacebookCallback = lazy(() => import('./pages/FacebookCallback').then(module => ({ default: module.FacebookCallback })));
const LinkedInCallback = lazy(() => import('./pages/LinkedInCallback').then(module => ({ default: module.LinkedInCallback })));
const TikTokCallback = lazy(() => import('./pages/TikTokCallback').then(module => ({ default: module.TikTokCallback })));
const Campaigns = lazy(() => import('./pages/Campaigns').then(module => ({ default: module.Campaigns })));
const Calendar = lazy(() => import('./pages/Calendar').then(module => ({ default: module.Calendar })));
const Billing = lazy(() => import('./pages/Billing').then(module => ({ default: module.Billing })));
const SuperAdmin = lazy(() => import('./pages/SuperAdmin').then(module => ({ default: module.SuperAdmin })));

// Páginas de Auth
const Login = lazy(() => import('./pages/auth/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('./pages/auth/Register').then(module => ({ default: module.Register })));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword').then(module => ({ default: module.ResetPassword })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full min-h-screen">
    <Loader2 className="animate-spin text-brand-500" size={40} />
  </div>
);

// Wrapper para Rutas Privadas (Requiere Login)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

// Wrapper para Rutas Públicas (Si ya estás logueado, te manda al Dashboard)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingFallback />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* RUTAS PÚBLICAS (Auth) */}
          <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
            <Route path="/login" element={
              <Suspense fallback={<LoadingFallback />}>
                <Login />
              </Suspense>
            } />
            <Route path="/register" element={
              <Suspense fallback={<LoadingFallback />}>
                <Register />
              </Suspense>
            } />
            <Route path="/forgot-password" element={
              <Suspense fallback={<LoadingFallback />}>
                <ForgotPassword />
              </Suspense>
            } />
            <Route path="/reset-password" element={
              <Suspense fallback={<LoadingFallback />}>
                <ResetPassword />
              </Suspense>
            } />
          </Route>

          {/* RUTAS PRIVADAS (Dashboard) */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={
              <Suspense fallback={<LoadingFallback />}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="calendar" element={
              <Suspense fallback={<LoadingFallback />}>
                <Calendar />
              </Suspense>
            } />
            <Route path="compose" element={
              <Suspense fallback={<LoadingFallback />}>
                <Composer />
              </Suspense>
            } />
            <Route path="campaigns" element={
              <Suspense fallback={<LoadingFallback />}>
                <Campaigns />
              </Suspense>
            } />
            <Route path="settings" element={
              <Suspense fallback={<LoadingFallback />}>
                <Settings />
              </Suspense>
            } />
            <Route path="billing" element={
              <Suspense fallback={<LoadingFallback />}>
                <Billing />
              </Suspense>
            } />
            <Route path="callback/facebook" element={
              <Suspense fallback={<LoadingFallback />}>
                <FacebookCallback />
              </Suspense>
            } />
            <Route path="callback/linkedin" element={
              <Suspense fallback={<LoadingFallback />}>
                <LinkedInCallback />
              </Suspense>
            } />
            <Route path="callback/tiktok" element={
              <Suspense fallback={<LoadingFallback />}>
                <TikTokCallback />
              </Suspense>
            } />
            <Route path="superadmin" element={
              <Suspense fallback={<LoadingFallback />}>
                <SuperAdmin />
              </Suspense>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
