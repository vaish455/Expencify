import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, DollarSign, User, Tag, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const ExpenseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenseDetails();
  }, [id]);

  const fetchExpenseDetails = async () => {
    try {
      const { data } = await api.get(`/expenses/${id}`);
      setExpense(data.expense);
    } catch (error) {
      toast.error('Failed to load expense details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!expense) return null;

  const statusConfig = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
    IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
    APPROVED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
  };

  const StatusIcon = statusConfig[expense.status]?.icon || Clock;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{expense.description}</h1>
              <p className="text-gray-600">
                Submitted by {expense.user.name} on {format(new Date(expense.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full font-semibold flex items-center space-x-2 ${statusConfig[expense.status]?.bg} ${statusConfig[expense.status]?.text}`}>
              <StatusIcon className="w-5 h-5" />
              <span>{expense.status}</span>
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <DollarSign className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${expense.amount.toFixed(2)} {expense.currency}
                </p>
                {expense.amountInCompanyCurrency && expense.currency !== expense.company?.currency && (
                  <p className="text-sm text-gray-500">
                    (${expense.amountInCompanyCurrency.toFixed(2)} in company currency)
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Expense Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {format(new Date(expense.expenseDate), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Tag className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="text-lg font-semibold text-gray-900">{expense.category.name}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Paid By</p>
                <p className="text-lg font-semibold text-gray-900">{expense.paidBy}</p>
              </div>
            </div>
          </div>

          {expense.remarks && (
            <div>
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Remarks</p>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{expense.remarks}</p>
                </div>
              </div>
            </div>
          )}

          {expense.receiptUrl && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Receipt</p>
              <img
                src={expense.receiptUrl}
                alt="Receipt"
                className="max-w-full h-auto rounded-lg border border-gray-200"
              />
            </div>
          )}

          {expense.ocrData && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">OCR Extracted Data</p>
              <div className="space-y-1 text-sm text-blue-800">
                {expense.ocrData.merchantName && (
                  <p><span className="font-medium">Merchant:</span> {expense.ocrData.merchantName}</p>
                )}
                {expense.ocrData.extractedAmount && (
                  <p><span className="font-medium">Amount:</span> ${expense.ocrData.extractedAmount}</p>
                )}
                {expense.ocrData.confidence && (
                  <p><span className="font-medium">Confidence:</span> {expense.ocrData.confidence.toFixed(2)}%</p>
                )}
              </div>
            </div>
          )}
        </div>

        {expense.approvalActions && expense.approvalActions.length > 0 && (
          <div className="border-t border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Workflow</h3>
            
            {/* Manager Approval Section */}
            {expense.user.isManagerApprover && (
              <div className="mb-6 bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Manager Approval
                </h4>
                {expense.approvalActions
                  .filter(action => action.stepIndex === -1)
                  .map(action => (
                    <div key={action.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                      <div className={`p-2 rounded-full ${
                        action.status === 'APPROVED' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {action.status === 'APPROVED' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{action.approver.name}</p>
                            <p className="text-sm text-gray-600">{action.status}</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {format(new Date(action.createdAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        {action.comments && (
                          <p className="text-sm text-gray-600 mt-2 italic">"{action.comments}"</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Regular Approval Workflow */}
            <div className="space-y-3">
              {expense.approvalActions
                .filter(action => action.stepIndex >= 0)
                .map((action, index) => (
                  <div key={action.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${
                      action.status === 'APPROVED' ? 'bg-green-100' :
                      action.status === 'REJECTED' ? 'bg-red-100' :
                      'bg-yellow-100'
                    }`}>
                      {action.status === 'APPROVED' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : action.status === 'REJECTED' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{action.approver.name}</p>
                          <p className="text-sm text-gray-600">
                            {action.approver.role} • {action.status === 'APPROVED' ? 'Approved' : 
                             action.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {action.status !== 'PENDING' && format(new Date(action.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      {action.comments && (
                        <p className="text-sm text-gray-600 mt-2 italic">"{action.comments}"</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseDetails;
