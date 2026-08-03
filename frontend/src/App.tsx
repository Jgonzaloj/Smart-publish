import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

// Lazy Loading para optimizar el bundle inicial (FASE 10)
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Composer = lazy(() => import('./pages/Composer').then(module => ({ default: module.Composer })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const FacebookCallback = lazy(() => import('./pages/FacebookCallback').then(module => ({ default: module.FacebookCallback })));
const Calendar = lazy(() => import('./pages/Calendar').then(module => ({ default: module.Calendar })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full">
    <Loader2 className="animate-spin text-brand-500" size={40} />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
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
          <Route path="settings" element={
            <Suspense fallback={<LoadingFallback />}>
              <Settings />
            </Suspense>
          } />
          <Route path="callback/facebook" element={
            <Suspense fallback={<LoadingFallback />}>
              <FacebookCallback />
            </Suspense>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
