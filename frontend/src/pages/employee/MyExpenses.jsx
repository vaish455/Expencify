import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, Filter, Calendar, FileText, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

const MyExpenses = () => {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, expenses]);

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get(`/expenses/user/${user.id}`);
      setExpenses(data.expenses);
      setFilteredExpenses(data.expenses);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    if (filters.search) {
      filtered = filtered.filter(e => 
        e.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        e.category.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status !== 'ALL') {
      filtered = filtered.filter(e => e.status === filters.status);
    }

    if (filters.startDate) {
      filtered = filtered.filter(e => 
        new Date(e.expenseDate) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(e => 
        new Date(e.expenseDate) <= new Date(filters.endDate)
      );
    }

    setFilteredExpenses(filtered);
  };

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
          <h1 className="text-3xl font-bold text-gray-900">My Expenses</h1>
          <p className="text-gray-600 mt-1">Manage and track your expenses</p>
        </div>
        <Link to="/submit-expense" className="btn-primary">
          <PlusCircle className="w-5 h-5 inline mr-2" />
          New Expense
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <select
            className="px-4 py-3 border border-gray-300 rounded-xl"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <input
            type="date"
            className="px-4 py-3 border border-gray-300 rounded-xl"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />

          <input
            type="date"
            className="px-4 py-3 border border-gray-300 rounded-xl"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left">Description</th>
                <th className="text-left">Category</th>
                <th className="text-left">Amount</th>
                <th className="text-left">Date</th>
                <th className="text-left">Status</th>
                <th className="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No expenses found</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="font-medium text-gray-900">{expense.description}</td>
                    <td className="text-gray-600">{expense.category.name}</td>
                    <td className="font-semibold text-gray-900">
                      ${expense.amount.toFixed(2)} {expense.currency}
                    </td>
                    <td className="text-gray-600">
                      {format(new Date(expense.expenseDate), 'MMM dd, yyyy')}
                    </td>
                    <td>
                      <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                        expense.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        expense.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        expense.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {expense.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/expense/${expense.id}`}
                        className="font-medium transition-colors"
                        style={{ color: '#5a3a52' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#4a2f44'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#5a3a52'}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyExpenses;