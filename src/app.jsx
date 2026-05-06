import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import StockPage from './pages/StockPage';
import PerformancePage from './pages/PerformancePage';
import StaffPage from './pages/StaffPage';
import BudgetPage from './pages/BudgetPage';
import { BudgetProvider } from './lib/BudgetContext';
import { AtrProvider } from './lib/AtrContext';
import { RaceProvider } from './lib/RaceContext';
import RDPage from './pages/RDPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/rd" element={<RDPage />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <RaceProvider>
        <BudgetProvider>
          <AtrProvider>
            <QueryClientProvider client={queryClientInstance}>
              <Router>
                <AuthenticatedApp />
              </Router>
              <Toaster />
            </QueryClientProvider>
          </AtrProvider>
        </BudgetProvider>
      </RaceProvider>
    </AuthProvider>
  )
}

export default App