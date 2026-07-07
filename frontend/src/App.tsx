import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ContactUs = lazy(() => import('./pages/ContactUs'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-500 transition-colors">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
      <span className="text-sm font-medium">Loading RankPilot...</span>
    </div>
  </div>
);

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[16px] shadow-sm border border-slate-100 dark:border-slate-700 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
            🚫
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">403 Forbidden</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">You do not have permission to access the RankPilot Admin Console.</p>
          <a href="/dashboard" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-sm">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

// Redirect to dashboard if already logged in
const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return user ? <Navigate to="/dashboard" /> : <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
            <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/ai-mentor" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/career-mapping" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/branch-finder" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/contact" element={<ContactUs />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
