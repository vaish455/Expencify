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
  const [teamInsights, setTeamInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [expensesRes, approvalsRes, insightsRes] = await Promise.all([
        api.get(`/expenses/user/${user.id}`),
        api.get('/approvals/pending'),
        api.get('/approvals/team-insights').catch(() => ({ data: { insights: null } }))
      ]);
      setMyExpenses(expensesRes.data.expenses.slice(0, 5));
      setPendingApprovals(approvalsRes.data.expenses.slice(0, 5));
      setTeamInsights(insightsRes.data.insights);
    } catch {
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

      {/* Team Analytics Header (Only if they manage people) */}
      {teamInsights && teamInsights.teamSize > 0 && (
        <div className="card-premium p-6 mt-8 bg-gradient-to-br from-indigo-900 to-slate-900 border-none text-white relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-1">Team Overview</h2>
              <p className="text-indigo-200 text-sm">You manage {teamInsights.teamSize} direct reports</p>
            </div>
            
            <div className="flex flex-wrap gap-4 md:gap-8">
              <div>
                <p className="text-xs text-indigo-300 uppercase tracking-widest font-semibold mb-1">Total Team Spends</p>
                <p className="text-2xl font-bold font-mono tracking-tight">{formatCurrency(teamInsights.totalApprovedAmount, user?.company?.currency)}</p>
              </div>
              <div className="w-px bg-white/10 hidden md:block"></div>
              <div>
                <p className="text-xs text-indigo-300 uppercase tracking-widest font-semibold mb-1">Total Expenses</p>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <span className="flex items-center gap-1.5" title="Pending">
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div> {teamInsights.pendingExpenses}
                  </span>
                  <span className="flex items-center gap-1.5" title="Approved">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div> {teamInsights.approvedExpenses}
                  </span>
                  <span className="flex items-center gap-1.5" title="Rejected">
                    <div className="w-2 h-2 rounded-full bg-rose-400"></div> {teamInsights.rejectedExpenses}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
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
