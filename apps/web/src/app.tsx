import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
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

function App() {
  return (
    <RaceProvider>
      <BudgetProvider>
        <AtrProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
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
            </Router>
            <Toaster />
          </QueryClientProvider>
        </AtrProvider>
      </BudgetProvider>
    </RaceProvider>
  )
}

export default App
