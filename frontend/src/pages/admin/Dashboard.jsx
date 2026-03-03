import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Users, FileText, CheckCircle, XCircle, DollarSign, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';

import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/currencyUtils';

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const companyCurrency = user?.company?.currency || 'USD';
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const { data } = await api.get('/company/statistics');
      setStatistics(data.statistics);
    } catch {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Volume', value: formatCurrency(statistics?.totalAmount || 0, companyCurrency), icon: DollarSign, trend: '+14.2%', trendUp: true },
    { label: 'Active Users', value: statistics?.totalUsers || 0, icon: Users, trend: '+5.4%', trendUp: true },
    { label: 'Pending Reviews', value: statistics?.pendingExpenses || 0, icon: Clock, trend: '-2.1%', trendUp: false },
    { label: 'Approved Expenses', value: statistics?.approvedExpenses || 0, icon: CheckCircle, trend: '+8.1%', trendUp: true },
    { label: 'Rejected Expenses', value: statistics?.rejectedExpenses || 0, icon: XCircle, trend: '-0.5%', trendUp: false },
    { label: 'Total Submissions', value: statistics?.totalExpenses || 0, icon: FileText, trend: '+12.5%', trendUp: true },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Company Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time metrics and financial operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Statement Date</p>
            <p className="text-sm font-semibold text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((stat, index) => (
          <div key={index} className="card-premium p-5 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-medium ${stat.trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {stat.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180 transform" />}
                {stat.trend}
              </span>
              <span className="text-xs text-slate-400">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <div className="card-premium flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Spend by Category</h2>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">View report</button>
          </div>
          <div className="p-5 flex-1 flex flex-col gap-4">
            {statistics?.expensesByCategory?.length > 0 ? (
              statistics.expensesByCategory.map((item, index) => {
                const maxTotal = Math.max(...statistics.expensesByCategory.map(i => i.total));
                const percentage = (item.total / maxTotal) * 100;
                
                return (
                  <div key={index} className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <span className="text-sm font-medium text-slate-700">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(item.total, companyCurrency)}</span>
                        <span className="text-xs text-slate-400 ml-2">({item.count})</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">No category data available</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card-premium flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Transactions</h2>
            <Link to="/pending-approvals" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">View all</Link>
          </div>
          <div className="flex-1 overflow-auto">
            <ul className="divide-y divide-slate-100">
              {statistics?.recentExpenses?.slice(0, 5).map((expense) => (
                <li key={expense.id} className="hover:bg-slate-50 transition-colors">
                  <Link to={`/expense/${expense.id}`} className="flex items-center justify-between p-4 sm:p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-600 text-sm shrink-0">
                        {expense.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate pr-4">{expense.description}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate pr-4">
                          {expense.user.name} • {new Date(expense.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900">
                        {formatCurrency(expense.amountInCompanyCurrency, companyCurrency)}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1 ${
                        expense.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                        expense.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {expense.status}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
              {(!statistics?.recentExpenses || statistics.recentExpenses.length === 0) && (
                <li className="p-8 text-center text-sm text-slate-500">No recent transactions found</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
