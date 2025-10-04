import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react';

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
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{pendingApprovals.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">My Expenses</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{myExpenses.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Approved</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {myExpenses.filter(e => e.status === 'APPROVED').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
          </div>
          <div className="p-6 space-y-3">
            {pendingApprovals.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending approvals</p>
            ) : (
              pendingApprovals.map((expense) => (
                <Link
                  key={expense.id}
                  to={`/expense/${expense.id}`}
                  className="block p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-600">{expense.user.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${expense.amountInCompanyCurrency?.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{expense.category.name}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
            {pendingApprovals.length > 0 && (
              <Link to="/pending-approvals" className="block text-center text-blue-600 hover:text-blue-700 font-medium">
                View All
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">My Recent Expenses</h2>
          </div>
          <div className="p-6 space-y-3">
            {myExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No expenses yet</p>
            ) : (
              myExpenses.map((expense) => (
                <Link
                  key={expense.id}
                  to={`/expense/${expense.id}`}
                  className="block p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-600">{expense.category.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${expense.amount?.toFixed(2)} {expense.currency}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        expense.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        expense.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {expense.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
            {myExpenses.length > 0 && (
              <Link to="/my-expenses" className="block text-center text-blue-600 hover:text-blue-700 font-medium">
                View All
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
