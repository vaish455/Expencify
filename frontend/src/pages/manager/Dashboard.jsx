import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currencyUtils';
import { Clock, CheckCircle, Wallet, ArrowRight } from 'lucide-react';

const ManagerDashboard = () => {
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
    { label: 'Action Required', value: pendingApprovals.length, icon: Clock, color: 'amber' },
    { label: 'My Submissions', value: myExpenses.length, icon: Wallet, color: 'indigo' },
    { label: 'My Approved', value: myExpenses.filter(e => e.status === 'APPROVED').length, icon: CheckCircle, color: 'emerald' },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Manager Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Review team expenses and track your own.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat, index) => (
          <div key={index} className="card-premium p-5 flex items-center justify-between group">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors
              ${stat.color === 'amber' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' : ''}
              ${stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100' : ''}
              ${stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : ''}
            `}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals Section */}
        <div className="card-premium flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50 rounded-t-xl">
            <h2 className="text-base font-semibold text-slate-900">Needs Attention</h2>
            {pendingApprovals.length > 0 && (
              <Link to="/pending-approvals" className="text-sm font-medium text-amber-600 hover:text-amber-700">View all</Link>
            )}
          </div>
          <div className="flex-1">
            <ul className="divide-y divide-slate-100">
              {pendingApprovals.length === 0 ? (
                <li className="p-8 text-center text-sm text-slate-500">You're all caught up!</li>
              ) : (
                pendingApprovals.map((expense) => (
                  <li key={expense.id} className="hover:bg-slate-50 transition-colors">
                    <Link to={`/expense/${expense.id}`} className="flex items-center justify-between p-4 sm:p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-600 text-xs shrink-0">
                          {expense.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{expense.description}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{expense.user.name} • {expense.category.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="text-sm font-bold text-slate-900">
                          {formatCurrency(expense.amountInCompanyCurrency, user?.company?.currency)}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* My Recent Expenses Section */}
        <div className="card-premium flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Your Recent Activity</h2>
            {myExpenses.length > 0 && (
              <Link to="/my-expenses" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">View all</Link>
            )}
          </div>
          <div className="flex-1">
            <ul className="divide-y divide-slate-100">
              {myExpenses.length === 0 ? (
                <li className="p-8 text-center text-sm text-slate-500">No expenses submitted yet.</li>
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
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
