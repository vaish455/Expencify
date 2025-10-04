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
      { to: '/', icon: Home, label: 'Dashboard', badge: null },
      { to: '/users', icon: Users, label: 'Users', badge: null },
      { to: '/categories', icon: Settings, label: 'Categories', badge: null },
      { to: '/approval-rules', icon: CheckSquare, label: 'Approval Rules', badge: null },
      { to: '/pending-approvals', icon: FileText, label: 'All Expenses', badge: null },
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
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b-2" style={{ borderColor: '#5a3a52' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #5a3a52 0%, #017E84 100%)' }}>
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold" style={{ color: '#5a3a52' }}>Expencify</span>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs" style={{ color: '#5a3a52' }}>{user?.role}</p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5a3a52 0%, #875A7B 100%)' }}>
                  <User className="w-5 h-5 text-white" />
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2">
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-5 h-5 mr-3" style={{ color: '#5a3a52' }} />
                    <span className="text-sm font-medium text-gray-900">Profile & Settings</span>
                  </Link>
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 hover:bg-red-50 transition-colors text-red-600"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-24">
            <nav className="space-y-1">
              {currentNavItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-700 transition-colors group"
                  style={{
                    background: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #5a3a52 0%, #875A7B 100%)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#374151';
                  }}
                >
                  <item.icon className="h-5 w-5 mr-3 transition-colors" style={{ color: '#5a3a52' }} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;