import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Users, FileText, CheckCircle, XCircle, DollarSign, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const { data } = await api.get('/company/statistics');
      setStatistics(data.statistics);
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 loading-spinner"></div>
    </div>;
  }

  const stats = [
    { label: 'Total Users', value: statistics?.totalUsers || 0, icon: Users, color: 'blue' },
    { label: 'Total Expenses', value: statistics?.totalExpenses || 0, icon: FileText, color: 'purple' },
    { label: 'Pending', value: statistics?.pendingExpenses || 0, icon: TrendingUp, color: 'yellow' },
    { label: 'Approved', value: statistics?.approvedExpenses || 0, icon: CheckCircle, color: 'green' },
    { label: 'Rejected', value: statistics?.rejectedExpenses || 0, icon: XCircle, color: 'red' },
    { label: 'Total Amount', value: `${statistics?.totalAmount?.toFixed(2) || 0}`, icon: DollarSign, color: 'indigo' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: stat.color === 'blue' ? '#ebe7e9' :
                                stat.color === 'purple' ? '#f3e8ff' :
                                stat.color === 'yellow' ? '#fef3c7' :
                                stat.color === 'green' ? '#d1fae5' :
                                stat.color === 'red' ? '#fee2e2' : '#e0e7ff'
              }}>
                <stat.icon className="w-6 h-6" style={{
                  color: stat.color === 'blue' ? '#714B67' :
                         stat.color === 'purple' ? '#8b5cf6' :
                         stat.color === 'yellow' ? '#d97706' :
                         stat.color === 'green' ? '#059669' :
                         stat.color === 'red' ? '#dc2626' : '#4f46e5'
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h2>
          <div className="space-y-3">
            {statistics?.expensesByCategory?.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-700">{item.category}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{item.count} expenses</span>
                  <span className="font-semibold text-gray-900">${item.total?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Expenses</h2>
          <div className="space-y-3">
            {statistics?.recentExpenses?.slice(0, 5).map((expense) => (
              <Link
                key={expense.id}
                to={`/expense/${expense.id}`}
                className="block p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{expense.description}</p>
                    <p className="text-sm text-gray-600">{expense.user.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${expense.amountInCompanyCurrency?.toFixed(2)}</p>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
