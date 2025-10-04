import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';

const PendingApprovals = () => {
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
    } catch (error) {
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
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>

      {expenses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No pending approvals</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{expense.user.name}</div>
                    <div className="text-sm text-gray-500">{expense.user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{expense.description}</div>
                    <div className="text-sm text-gray-500">{expense.category.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ${expense.amountInCompanyCurrency?.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {expense.currency !== expense.company?.currency && 
                        `(${expense.amount} ${expense.currency})`
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(expense.expenseDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      expense.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      to={`/expense/${expense.id}`}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </Link>
                    <button
                      onClick={() => openApprovalModal(expense, 'APPROVED')}
                      disabled={processingId === expense.id}
                      className="text-green-600 hover:text-green-900 inline-flex items-center space-x-1 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => openApprovalModal(expense, 'REJECTED')}
                      disabled={processingId === expense.id}
                      className="text-red-600 hover:text-red-900 inline-flex items-center space-x-1 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {selectedExpense.approvalStatus === 'APPROVED' ? 'Approve' : 'Reject'} Expense
            </h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Employee:</span> {selectedExpense.user.name}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Description:</span> {selectedExpense.description}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Amount:</span> ${selectedExpense.amountInCompanyCurrency?.toFixed(2)}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (Optional)
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add comments..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setShowModal(false); setComments(''); setSelectedExpense(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproval(selectedExpense.id, selectedExpense.approvalStatus)}
                disabled={processingId === selectedExpense.id}
                className={`px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
                  selectedExpense.approvalStatus === 'APPROVED'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processingId === selectedExpense.id ? 'Processing...' : 
                  selectedExpense.approvalStatus === 'APPROVED' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
