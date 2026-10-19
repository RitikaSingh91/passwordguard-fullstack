import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/Guards';
import Landing from './pages/Landing';
import { Login, Register, Forgot, Reset } from './pages/AuthPages';
// Heavy pages (zxcvbn dictionaries, Recharts) are loaded on demand to keep the landing page fast.
const Analyzer = lazy(() => import('./pages/Analyzer'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Admin = lazy(() => import('./pages/Admin'));

export default function App() {
  return (
    <Suspense fallback={<p className="muted p-6">Loading…</p>}>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="analyze" element={<Analyzer />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<Forgot />} />
        <Route path="reset-password" element={<Reset />} />
        <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="admin" element={<RequireAuth admin><Admin /></RequireAuth>} />
        <Route path="*" element={<p>Page not found.</p>} />
      </Route>
    </Routes>
    </Suspense>
  );
}
