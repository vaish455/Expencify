import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, XCircle, Clock, Plus, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

const EmployeeDashboard = () => {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get(`/expenses/user/${user.id}`);
      setExpenses(data.expenses);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const stats = [
    { label: 'Total Submitted', value: expenses.length, icon: FileText, color: 'blue' },
    { label: 'In Review', value: expenses.filter(e => e.status === 'PENDING' || e.status === 'IN_PROGRESS').length, icon: Clock, color: 'yellow' },
    { label: 'Approved', value: expenses.filter(e => e.status === 'APPROVED').length, icon: CheckCircle, color: 'green' },
    { label: 'Rejected', value: expenses.filter(e => e.status === 'REJECTED').length, icon: XCircle, color: 'red' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Your Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track your out-of-pocket expenses.</p>
        </div>
        <Link to="/submit-expense" className="btn-primary space-x-2">
          <Plus className="w-4 h-4" />
          <span>New Expense</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, index) => (
          <div key={index} className="card-premium p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600' : ''}
                ${stat.color === 'yellow' ? 'bg-amber-50 text-amber-600' : ''}
                ${stat.color === 'green' ? 'bg-emerald-50 text-emerald-600' : ''}
                ${stat.color === 'red' ? 'bg-rose-50 text-rose-600' : ''}
              `}>
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Expenses List */}
      <div className="card-premium overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-base font-semibold text-slate-900">Recent Applications</h2>
          {expenses.length > 0 && (
            <Link to="/my-expenses" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">View all</Link>
          )}
        </div>
        
        <div className="overflow-x-auto">
          {expenses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">No expenses found</h3>
              <p className="text-sm text-slate-500 mb-6">You haven't submitted any expenses yet.</p>
              <Link to="/submit-expense" className="btn-primary inline-flex">
                Create your first expense
              </Link>
            </div>
          ) : (
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {expenses.slice(0, 10).map((expense) => (
                  <tr key={expense.id} className="group">
                    <td className="font-medium text-slate-900">{expense.description}</td>
                    <td>{new Date(expense.expenseDate).toLocaleDateString()}</td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        {expense.category.name}
                      </span>
                    </td>
                    <td className="text-right font-semibold text-slate-900">
                      {formatCurrency(expense.amount, expense.currency)}
                    </td>
                    <td className="text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        expense.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        expense.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="text-right w-10 pr-4">
                      <Link to={`/expense/${expense.id}`} className="text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
