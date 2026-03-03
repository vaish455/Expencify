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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#5a3a52] to-[#017E84] bg-clip-text text-transparent mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 font-medium">Complete overview of your organization</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 font-medium">Last updated</p>
          <p className="text-lg font-bold text-gray-900">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card p-6 hover:shadow-2xl stat-card group cursor-pointer" style={{ transition: 'all 0.3s ease' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#8F8F8F' }}>{stat.label}</p>
                <p className="text-4xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <div className="flex items-center space-x-1 text-xs font-semibold text-green-600">
                  <span>↗</span>
                  <span>+12% from last month</span>
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000" style={{
                width: '75%',
                background: stat.color === 'blue' ? 'linear-gradient(90deg, #017E84 0%, #00A09D 100%)' :
                            stat.color === 'purple' ? 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)' :
                            stat.color === 'yellow' ? 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)' :
                            stat.color === 'green' ? 'linear-gradient(90deg, #059669 0%, #10B981 100%)' :
                            stat.color === 'red' ? 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)' : 
                            'linear-gradient(90deg, #6366F1 0%, #818CF8 100%)'
              }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="p-6 border-b-2" style={{ 
            background: 'linear-gradient(135deg, #F5F3F4 0%, #EBE7E9 100%)',
            borderColor: '#5a3a52'
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #5a3a52 0%, #875A7B 100%)' }}>
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Expenses by Category</h2>
                  <p className="text-sm text-gray-600">Breakdown of spending</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {statistics?.expensesByCategory?.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-4 rounded-xl hover:shadow-md transition-all" style={{ backgroundColor: '#FAFAFA' }}>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #E6F7F8 0%, #B3E5E8 100%)' }}>
                    <svg className="w-6 h-6" style={{ color: '#017E84' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">{item.category}</span>
                    <p className="text-sm text-gray-500 font-medium">{item.count} expenses</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-2xl" style={{ color: '#017E84' }}>${item.total?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="p-6 border-b-2" style={{ 
            background: 'linear-gradient(135deg, #E6F7F8 0%, #B3E5E8 100%)',
            borderColor: '#017E84'
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #017E84 0%, #00A09D 100%)' }}>
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Expenses</h2>
                  <p className="text-sm text-gray-600">Latest submissions</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {statistics?.recentExpenses?.slice(0, 5).map((expense) => (
              <Link
                key={expense.id}
                to={`/expense/${expense.id}`}
                className="block p-4 hover:shadow-lg rounded-xl border-2 transition-all"
                style={{ borderColor: '#E5E5E5', backgroundColor: '#FAFAFA' }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-1">{expense.description}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 font-medium">{expense.user.name}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{new Date(expense.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-xl" style={{ color: '#5a3a52' }}>${expense.amountInCompanyCurrency?.toFixed(2)}</p>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${
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
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
