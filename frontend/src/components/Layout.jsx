import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Home, Users, FileText, Settings, LogOut, PlusCircle, CheckSquare, DollarSign } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = {
    ADMIN: [
      { to: '/', icon: Home, label: 'Dashboard' },
      { to: '/users', icon: Users, label: 'Users' },
      { to: '/categories', icon: Settings, label: 'Categories' },
      { to: '/approval-rules', icon: CheckSquare, label: 'Approval Rules' },
      { to: '/pending-approvals', icon: FileText, label: 'All Expenses' },
    ],
    MANAGER: [
      { to: '/', icon: Home, label: 'Dashboard' },
      { to: '/submit-expense', icon: PlusCircle, label: 'Submit Expense' },
      { to: '/my-expenses', icon: FileText, label: 'My Expenses' },
      { to: '/pending-approvals', icon: CheckSquare, label: 'Pending Approvals' },
    ],
    CEO: [
      { to: '/', icon: Home, label: 'Dashboard' },
      { to: '/submit-expense', icon: PlusCircle, label: 'Submit Expense' },
      { to: '/my-expenses', icon: FileText, label: 'My Expenses' },
      { to: '/pending-approvals', icon: CheckSquare, label: 'Pending Approvals' },
    ],
    CFO: [
      { to: '/', icon: Home, label: 'Dashboard' },
      { to: '/submit-expense', icon: PlusCircle, label: 'Submit Expense' },
      { to: '/my-expenses', icon: FileText, label: 'My Expenses' },
      { to: '/pending-approvals', icon: CheckSquare, label: 'Pending Approvals' },
    ],
    CTO: [
      { to: '/', icon: Home, label: 'Dashboard' },
      { to: '/submit-expense', icon: PlusCircle, label: 'Submit Expense' },
      { to: '/my-expenses', icon: FileText, label: 'My Expenses' },
      { to: '/pending-approvals', icon: CheckSquare, label: 'Pending Approvals' },
    ],
    DIRECTOR: [
      { to: '/', icon: Home, label: 'Dashboard' },
      { to: '/submit-expense', icon: PlusCircle, label: 'Submit Expense' },
      { to: '/my-expenses', icon: FileText, label: 'My Expenses' },
      { to: '/pending-approvals', icon: CheckSquare, label: 'Pending Approvals' },
    ],
    EMPLOYEE: [
      { to: '/', icon: Home, label: 'Dashboard' },
      { to: '/submit-expense', icon: PlusCircle, label: 'Submit Expense' },
      { to: '/my-expenses', icon: FileText, label: 'My Expenses' },
    ],
  };

  const currentNavItems = navItems[user?.role] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Expencify</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)]">
          <nav className="mt-5 px-2">
            {currentNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center px-4 py-3 text-sm font-medium rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600 mb-1"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
