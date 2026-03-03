import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Check, X, FileText, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, getCurrencySymbol } from '../../utils/currencyUtils';

const PendingApprovals = () => {
  const { user } = useAuthStore();
  const companyCurrency = user?.company?.currency || 'USD';
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [comments, setComments] = useState('');

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const { data } = await api.get('/approvals/pending');
      setExpenses(data.expenses);
    } catch {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (expenseId, status) => {
    setProcessingId(expenseId);
    try {
      await api.post(`/approvals/process/${expenseId}`, {
        status,
        comments: comments || undefined
      });
      toast.success(status === 'APPROVED' ? 'Expense approved!' : 'Expense rejected');
      setShowModal(false);
      setComments('');
      setSelectedExpense(null);
      fetchPendingApprovals();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to process approval');
    } finally {
      setProcessingId(null);
    }
  };

  const openApprovalModal = (expense, status) => {
    setSelectedExpense({ ...expense, approvalStatus: status });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-slide-up">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Pending Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">Review team submissions pending your action.</p>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        {expenses.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-lg font-semibold text-slate-900 mb-1">Inbox zero!</p>
            <p className="text-slate-500">You have no pending approvals at the moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-premium">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="w-1/4">Employee</th>
                  <th className="w-1/3">Description</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Date</th>
                  <th className="text-right pr-6">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs shrink-0">
                          {expense.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{expense.user.name}</div>
                          <div className="text-xs text-slate-500 truncate">{expense.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="text-sm font-medium text-slate-900 truncate max-w-[250px]">{expense.description}</div>
                      <div className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mt-0.5">{expense.category.name}</div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="text-sm font-bold text-slate-900 font-mono">
                        {formatCurrency(expense.amountInCompanyCurrency, companyCurrency)}
                      </div>
                      {expense.currency !== expense.company?.currency && (
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {getCurrencySymbol(expense.currency)}{expense.amount} {expense.currency}
                        </div>
                      )}
                    </td>
                    <td className="py-4 text-center text-sm text-slate-500 font-medium">
                      {format(new Date(expense.expenseDate), 'MMM dd')}
                    </td>
                    <td className="py-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/expense/${expense.id}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        <div className="w-px h-5 bg-slate-200 mx-1"></div>
                        <button
                          onClick={() => openApprovalModal(expense, 'APPROVED')}
                          disabled={processingId === expense.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => openApprovalModal(expense, 'REJECTED')}
                          disabled={processingId === expense.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      {/* Modern Modal */}
      {showModal && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !processingId && setShowModal(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full animate-slide-up border border-slate-200 overflow-hidden">
            <div className={`px-6 py-4 border-b ${selectedExpense.approvalStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${selectedExpense.approvalStatus === 'APPROVED' ? 'text-emerald-800' : 'text-rose-800'}`}>
                {selectedExpense.approvalStatus === 'APPROVED' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                Confirm {selectedExpense.approvalStatus === 'APPROVED' ? 'Approval' : 'Rejection'}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Employee</span>
                  <span className="text-sm font-semibold text-slate-900">{selectedExpense.user.name}</span>
                </div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</span>
                  <span className="text-sm font-semibold text-slate-900 text-right max-w-[200px] truncate">{selectedExpense.description}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">{formatCurrency(selectedExpense.amountInCompanyCurrency, companyCurrency)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="label-text">
                  Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  className="input-field placeholder:text-slate-400"
                  placeholder={selectedExpense.approvalStatus === 'APPROVED' ? "Great job, approved." : "Please attach the missing receipt..."}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => { setShowModal(false); setComments(''); setSelectedExpense(null); }}
                className="btn-secondary"
                disabled={processingId}
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproval(selectedExpense.id, selectedExpense.approvalStatus)}
                disabled={processingId === selectedExpense.id}
                className={`inline-flex items-center justify-center rounded-lg font-bold text-sm px-5 py-2 transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedExpense.approvalStatus === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-sm'
                }`}
              >
                {processingId === selectedExpense.id ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing
                  </span>
                ) : (
                  selectedExpense.approvalStatus === 'APPROVED' ? 'Approve' : 'Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PendingApprovals;
