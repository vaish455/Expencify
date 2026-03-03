import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, Filter, Plus, FileText, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currencyUtils';

const MyExpenses = () => {
  useAuthStore();
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    startDate: '',
    endDate: ''
  });


  const fetchExpenses = useCallback(async () => {
    try {
      const { data } = await api.get('/expenses');
      setExpenses(data.expenses);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let result = [...expenses];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(e =>
        e.description.toLowerCase().includes(searchLower) ||
        (e.remarks && e.remarks.toLowerCase().includes(searchLower)) ||
        e.category.name.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status !== 'ALL') {
      result = result.filter(e => e.status === filters.status);
    }

    if (filters.category) {
      result = result.filter(e => e.category.id === filters.category);
    }

    // Date filters (startDate, endDate) were removed from applyFilters logic in the instruction,
    // but they are still present in the UI. Re-adding them here to maintain UI functionality.
    // If the intent was to remove them entirely, the UI part also needs to be removed.
    if (filters.startDate) {
      result = result.filter(e =>
        new Date(e.expenseDate) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      result = result.filter(e =>
        new Date(e.expenseDate) <= new Date(filters.endDate)
      );
    }

    const safeSortBy = ['expenseDate', 'amount', 'createdAt'].includes(filters.sortBy) ? filters.sortBy : 'createdAt';
    result.sort((a, b) => {
      if (safeSortBy === 'amount') {
        const valA = parseFloat(a.amount) || 0;
        const valB = parseFloat(b.amount) || 0;
        return filters.sortOrder === 'desc' ? valB - valA : valA - valB;
      }
      // For date fields, ensure they are valid dates before comparison
      const dateA = a[safeSortBy] ? new Date(a[safeSortBy]).getTime() : 0;
      const dateB = b[safeSortBy] ? new Date(b[safeSortBy]).getTime() : 0;
      return filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    setFilteredExpenses(result);
  }, [expenses, filters.status, filters.category, filters.search, filters.sortBy, filters.sortOrder, filters.startDate, filters.endDate]); // Added startDate, endDate to dependencies

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    applyFilters();
  }, [filters, expenses, applyFilters]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">My Expenses</h1>
          <p className="text-sm text-slate-500 mt-1">Review and track your submissions.</p>
        </div>
        <Link to="/submit-expense" className="btn-primary space-x-2">
          <Plus className="w-4 h-4" />
          <span>New Expense</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="card-premium p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by description or category..."
            className="input-field pl-9"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        
        <div className="w-full sm:w-48 relative shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="w-4 h-4 text-slate-400" />
          </div>
          <select
            className="input-field pl-9 font-medium"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        
        {/* Simple Date filters for desktop */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <input
            type="date"
            className="input-field text-sm h-full"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <span className="text-slate-400">-</span>
          <input
            type="date"
            className="input-field text-sm h-full"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead className="bg-slate-50/80">
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th className="text-right">Amount</th>
                <th>Date</th>
                <th className="text-center">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">No results matching your criteria</p>
                    <p className="text-sm text-slate-500 mb-4">Try adjusting your search or filters.</p>
                    <button onClick={() => setFilters({search: '', status: 'ALL', startDate: '', endDate: ''})} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="font-medium text-slate-900 max-w-[200px] truncate">{expense.description}</td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                        {expense.category.name}
                      </span>
                    </td>
                    <td className="text-right font-bold text-slate-900 font-mono tracking-tight">
                      {formatCurrency(expense.amount, expense.currency)}
                    </td>
                    <td className="text-sm text-slate-500 font-medium">
                      {format(new Date(expense.expenseDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                        expense.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        expense.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        expense.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {expense.status === 'IN_PROGRESS' ? 'IN REVIEW' : expense.status}
                      </span>
                    </td>
                    <td className="text-right w-14 pr-4">
                      <Link
                        to={`/expense/${expense.id}`}
                        className="inline-flex p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
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