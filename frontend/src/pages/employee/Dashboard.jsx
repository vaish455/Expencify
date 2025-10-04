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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Expenses</h1>
        <Link
          to="/submit-expense"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Submit Expense</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
        </div>
        <div className="p-6">
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No expenses submitted yet</p>
              <Link
                to="/submit-expense"
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Submit Your First Expense</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 10).map((expense) => (
                <Link
                  key={expense.id}
                  to={`/expense/${expense.id}`}
                  className="block p-4 hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-sm text-gray-600">{expense.category.name}</p>
                        <p className="text-sm text-gray-600">{new Date(expense.expenseDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${expense.amount?.toFixed(2)} {expense.currency}</p>
                      <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                        expense.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        expense.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {expense.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              {expenses.length > 10 && (
                <Link to="/my-expenses" className="block text-center text-blue-600 hover:text-blue-700 font-medium py-2">
                  View All Expenses
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
