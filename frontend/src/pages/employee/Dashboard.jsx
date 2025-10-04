import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, XCircle, Clock, PlusCircle } from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get(`/expenses/user/${user.id}`);
      setExpenses(data.expenses);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Total', value: expenses.length, icon: FileText, color: 'blue' },
    { label: 'Pending', value: expenses.filter(e => e.status === 'PENDING' || e.status === 'IN_PROGRESS').length, icon: Clock, color: 'yellow' },
    { label: 'Approved', value: expenses.filter(e => e.status === 'APPROVED').length, icon: CheckCircle, color: 'green' },
    { label: 'Rejected', value: expenses.filter(e => e.status === 'REJECTED').length, icon: XCircle, color: 'red' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 loading-spinner"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>
        <Link
          to="/submit-expense"
          className="btn-primary flex items-center space-x-2"
        >
          <PlusCircle className="w-5 h-5" />
          <span>New Expense</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
            <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
            <div className="mt-4 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: stat.value > 0 ? '75%' : '0%',
                background: stat.color === 'blue' ? 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)' :
                            stat.color === 'yellow' ? 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)' :
                            stat.color === 'green' ? 'linear-gradient(90deg, #10B981 0%, #34D399 100%)' :
                            'linear-gradient(90deg, #EF4444 0%, #F87171 100%)'
              }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Expenses */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Recent Expenses</h2>
        </div>
        <div className="p-6">
          {expenses.length === 0 ? (
            <div className="empty-state">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-4">No expenses yet</p>
              <Link to="/submit-expense" className="btn-primary">
                <PlusCircle className="w-5 h-5 inline mr-2" />
                Submit Your First Expense
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 10).map((expense) => (
                <Link
                  key={expense.id}
                  to={`/expense/${expense.id}`}
                  className="block p-4 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{expense.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-600">{expense.category.name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500">{new Date(expense.expenseDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">${expense.amount?.toFixed(2)}</p>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        expense.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        expense.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {expense.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default EmployeeDashboard;
