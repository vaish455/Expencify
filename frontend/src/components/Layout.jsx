import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getRoleName } from '../utils/role';
import { Home, Users, FileText, Settings, LogOut, PlusCircle, CheckSquare, DollarSign, User, Bell, ChevronRight, Menu, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Close remote menus when clicking outside could be added, for now auto-close on navigate
  useEffect(() => {
    setShowUserMenu(false);
  }, [location.pathname]);

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
      { to: '/my-expenses', icon: Wallet, label: 'My Expenses' },
      { to: '/pending-approvals', icon: CheckSquare, label: 'Pending Approvals' },
    ],
    CEO: [
      { to: '/', icon: Home, label: 'Dashboard' },
      { to: '/submit-expense', icon: PlusCircle, label: 'Submit Expense' },
      { to: '/my-expenses', icon: Wallet, label: 'My Expenses' },
      { to: '/pending-approvals', icon: CheckSquare, label: 'Pending Approvals' },
    ],
    CFO: [
      { to: '/', icon: Home, label: 'Dashboard' },
      { to: '/submit-expense', icon: PlusCircle, label: 'Submit Expense' },
      { to: '/my-expenses', icon: Wallet, label: 'My Expenses' },
      { to: '/pending-approvals', icon: CheckSquare, label: 'Pending Approvals' },
    ],
    CTO: [
      { to: '/', icon: Home, label: 'Dashboard' },
      { to: '/submit-expense', icon: PlusCircle, label: 'Submit Expense' },
      { to: '/my-expenses', icon: Wallet, label: 'My Expenses' },
      { to: '/pending-approvals', icon: CheckSquare, label: 'Pending Approvals' },
    ],
    DIRECTOR: [
      { to: '/', icon: Home, label: 'Dashboard' },
      { to: '/submit-expense', icon: PlusCircle, label: 'Submit Expense' },
      { to: '/my-expenses', icon: Wallet, label: 'My Expenses' },
      { to: '/pending-approvals', icon: CheckSquare, label: 'Pending Approvals' },
    ],
    EMPLOYEE: [
      { to: '/', icon: Home, label: 'Dashboard' },
      { to: '/submit-expense', icon: PlusCircle, label: 'Submit Expense' },
      { to: '/my-expenses', icon: Wallet, label: 'My Expenses' },
    ],
  };

  const roleName = getRoleName(user?.role);
  const currentNavItems = navItems[roleName?.toUpperCase()] || [];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* Mobile Header (visible only on small screens) */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 p-4 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900">Expencify</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out flex flex-col h-screen`}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 shadow-sm shadow-indigo-200 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <span className="font-bold tracking-tight text-xl text-slate-900">Expencify</span>
          </div>
        </div>

        {/* Navigation Wrapper */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>
          <nav className="space-y-1">
            {currentNavItems.map((item) => {
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm
                    ${isActive 
                      ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {item.label}
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card at Bottom */}
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left relative"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center border border-indigo-50 text-indigo-700 font-bold tracking-tight text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{roleName}</p>
            </div>
            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? '-rotate-90' : ''}`} />
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute bottom-20 left-4 right-4 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200 py-1.5 z-50 animate-slide-up">
              <Link
                to="/profile"
                className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <User className="w-4 h-4 mr-3 text-slate-400" />
                Profile & Settings
              </Link>
              <div className="h-px bg-slate-100 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3 text-red-400" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#f8fafc]">
        {/* Top Header */}
        <header className="h-16 bg-white/60 glass-panel border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 z-20 shrink-0">
          <div className="flex items-center">
            {/* Dynamic Breadcrumbs could go here, for now a subtle welcome message */}
            <h1 className="text-sm font-medium text-slate-500">
              Welcome back, <span className="text-slate-900 font-semibold">{user?.name?.split(' ')[0]}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              {/* Notification Dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto pb-12">
            <Outlet />
          </div>
        </div>
      </main>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;