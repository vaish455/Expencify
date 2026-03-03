import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { getRoleName } from './utils/role';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Dashboard Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManagerDashboard from './pages/manager/Dashboard';
import EmployeeDashboard from './pages/employee/Dashboard';
import ExecutiveDashboard from './pages/executive/Dashboard';

// Admin Pages
import UserManagement from './pages/admin/UserManagement';
import ApprovalRules from './pages/admin/ApprovalRules';
import Categories from './pages/admin/Categories';
import CompanySettings from './pages/admin/CompanySettings';

// Employee Pages
import SubmitExpense from './pages/employee/SubmitExpense';
import MyExpenses from './pages/employee/MyExpenses';

// Manager Pages
import PendingApprovals from './pages/manager/PendingApprovals';

// Shared Pages
import ExpenseDetails from './pages/shared/ExpenseDetails';
import Profile from './pages/shared/Profile';

// Layout
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { user } = useAuthStore();
  const roleName = getRoleName(user?.role);

  return (
    <Router future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />

        <Route path="/" element={<ProtectedRoute><ErrorBoundary><Layout /></ErrorBoundary></ProtectedRoute>}>
          <Route index element={
            roleName === 'ADMIN' ? <AdminDashboard /> :
            roleName === 'MANAGER' ? <ManagerDashboard /> :
            ['CEO', 'CFO', 'CTO', 'DIRECTOR'].includes(roleName) ? <ExecutiveDashboard /> :
            <EmployeeDashboard />
          } />

          {/* Admin Routes */}
          <Route path="users" element={<ProtectedRoute role="ADMIN"><UserManagement /></ProtectedRoute>} />
          <Route path="approval-rules" element={<ProtectedRoute role="ADMIN"><ApprovalRules /></ProtectedRoute>} />
          <Route path="categories" element={<ProtectedRoute role="ADMIN"><Categories /></ProtectedRoute>} />
          <Route path="company-settings" element={<ProtectedRoute role="ADMIN"><CompanySettings /></ProtectedRoute>} />

          {/* Employee Routes */}
          <Route path="submit-expense" element={<SubmitExpense />} />
          <Route path="my-expenses" element={<MyExpenses />} />

          {/* Manager & Executive Routes */}
          <Route path="pending-approvals" element={<ProtectedRoute role={['ADMIN', 'MANAGER', 'CEO', 'CFO', 'CTO', 'DIRECTOR']}><PendingApprovals /></ProtectedRoute>} />

          {/* Shared Routes */}
          <Route path="expense/:id" element={<ExpenseDetails />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

