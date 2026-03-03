import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currencyUtils';
import { Clock, CheckCircle, Wallet, ArrowRight, BarChart2 } from 'lucide-react';

const ExecutiveDashboard = () => {
  const { user } = useAuthStore();
  const [myExpenses, setMyExpenses] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expensesRes, approvalsRes] = await Promise.all([
        api.get(`/expenses/user/${user.id}`),
        api.get('/approvals/pending')
      ]);
      setMyExpenses(expensesRes.data.expenses.slice(0, 5));
      setPendingApprovals(approvalsRes.data.expenses.slice(0, 5));
    } catch (error) {
      toast.error('Failed to load dashboard data');
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
    { label: 'Pending Approvals', value: pendingApprovals.length, icon: Clock, spark: 'bg-amber-500' },
    { label: 'My Submissions', value: myExpenses.length, icon: Wallet, spark: 'bg-indigo-500' },
    { label: 'Approved Claims', value: myExpenses.filter(e => e.status === 'APPROVED').length, icon: CheckCircle, spark: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">High-level financial overview and pending actions.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat, index) => (
          <div key={index} className="card-premium p-5 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">{stat.label}</p>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            {/* Subtle aesthetic accent line */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100">
              <div className={`h-full ${stat.spark} transition-all duration-1000 ease-out`} style={{ width: stat.value > 0 ? '60%' : '0%' }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approvals Pane */}
        <div className="card-premium flex flex-col border-l-4 border-l-amber-500">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-semibold text-slate-900">Requires Your Approval</h2>
            </div>
            {pendingApprovals.length > 0 && (
              <Link to="/pending-approvals" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">View all</Link>
            )}
          </div>
          <div className="flex-1">
            <ul className="divide-y divide-slate-100">
              {pendingApprovals.length === 0 ? (
                <li className="p-8 text-center text-sm text-slate-500">All caught up!</li>
              ) : (
                pendingApprovals.map((expense) => (
                  <li key={expense.id} className="hover:bg-slate-50 transition-colors">
                    <Link to={`/expense/${expense.id}`} className="flex items-center justify-between p-4 sm:p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-600 text-sm shrink-0">
                          {expense.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{expense.description}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{expense.user.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="text-sm font-black text-slate-900 font-mono tracking-tight">
                            {formatCurrency(expense.amountInCompanyCurrency, user?.company?.currency)}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{expense.category.name}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 ml-2" />
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* My Expenses Pane */}
        <div className="card-premium flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-slate-400" />
              <h2 className="text-base font-semibold text-slate-900">My Submissions</h2>
            </div>
            {myExpenses.length > 0 && (
              <Link to="/my-expenses" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">View all</Link>
            )}
          </div>
          <div className="flex-1">
            <ul className="divide-y divide-slate-100">
              {myExpenses.length === 0 ? (
                <li className="p-8 text-center text-sm text-slate-500">No submissions found.</li>
              ) : (
                myExpenses.map((expense) => (
                  <li key={expense.id} className="hover:bg-slate-50 transition-colors">
                    <Link to={`/expense/${expense.id}`} className="flex items-center justify-between p-4 sm:p-5">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{expense.description}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{expense.category.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">
                          {formatCurrency(expense.amount, expense.currency)}
                        </p>
                        <span className={`inline-flex items-center px-1.5 py-0 rounded-[4px] text-[10px] font-bold uppercase tracking-wider mt-1 border ${
                          expense.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          expense.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {expense.status}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
