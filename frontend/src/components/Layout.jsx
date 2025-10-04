import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Home, Users, FileText, Settings, LogOut, PlusCircle, CheckSquare, DollarSign, User } from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

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
              <DollarSign className="w-8 h-8" style={{ color: '#714B67' }} />
              <span className="ml-2 text-xl font-bold text-gray-900">Expencify</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f5f3f4' }}>
                    <User className="w-5 h-5" style={{ color: '#714B67' }} />
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile & Settings
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
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
                className="group flex items-center px-4 py-3 text-sm font-medium rounded-md text-gray-700 hover:bg-primary-50 hover:text-primary mb-1"
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
